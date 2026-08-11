// Self-hosted passwordless login — email or phone one-time codes. No redirect to
// Shopify: we generate the code, deliver it (email → Klaviyo "Login Code" event/flow;
// SMS → Postscript transactional message), and verify it, then the route sets our
// signed session cookie. Codes are stored HMAC-hashed, single-use, TTL'd, rate-limited.
import crypto from "node:crypto";
import { pool } from "./db";
import { emitEmailEvent } from "./email-templates";
import { sendSms } from "./providers/postscript";
import { isEmail, normalizePhone } from "./http";

const SECRET = process.env.AUTH_SESSION_SECRET || process.env.SHOPIFY_API_SECRET || "dev-secret";
const TTL_MIN = 10;
const MAX_CODES_PER_HOUR = 5; // per identifier
const MAX_ATTEMPTS = 5; // per code

export type Channel = "email" | "sms";

const genCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
const hashCode = (code: string, identifier: string) =>
  crypto.createHmac("sha256", SECRET).update(`${identifier}:${code}`).digest("hex");

/** Normalize + validate an identifier for its channel. Returns null when invalid. */
export function normalizeIdentifier(channel: Channel, raw: string): string | null {
  if (channel === "email") {
    const e = (raw || "").trim().toLowerCase();
    return isEmail(e) ? e : null;
  }
  return normalizePhone(raw);
}

/** Issue + deliver a login code. Generic errors so we never reveal whether an
 * identifier exists, except for send failures which are actionable. */
export async function startOtp(channel: Channel, rawIdentifier: string): Promise<{ ok: boolean; error?: string }> {
  const identifier = normalizeIdentifier(channel, rawIdentifier);
  if (!identifier) return { ok: false, error: channel === "email" ? "Enter a valid email address." : "Enter a valid US phone number." };

  const recent = (
    await pool.query(`select count(*)::int n from login_codes where identifier = $1 and created_at > now() - interval '1 hour'`, [identifier])
  ).rows[0].n as number;
  if (recent >= MAX_CODES_PER_HOUR) return { ok: false, error: "Too many code requests — please wait a bit and try again." };

  const code = genCode();
  const row = (
    await pool.query(
      `insert into login_codes (identifier, channel, code_hash, expires_at)
       values ($1, $2, $3, now() + ($4 || ' minutes')::interval) returning id`,
      [identifier, channel, hashCode(code, identifier), String(TTL_MIN)],
    )
  ).rows[0] as { id: number };

  if (channel === "email") {
    const r = await emitEmailEvent("Login Code", "login_code", identifier, { code }, `login-${row.id}`);
    if (!r.ok) return { ok: false, error: "Couldn't send the email code — please try again." };
  } else {
    const r = await sendSms(
      { phone: identifier },
      `Your Generous Motors sign-in code is ${code}. It expires in ${TTL_MIN} minutes.`,
      "transactional",
    );
    if (!r.ok) return { ok: false, error: "Couldn't text that number — try email instead." };
  }
  return { ok: true };
}

/** Verify a submitted code against the newest outstanding code for the identifier. */
export async function verifyOtp(channel: Channel, rawIdentifier: string, code: string): Promise<{ ok: boolean; identifier?: string; error?: string }> {
  const identifier = normalizeIdentifier(channel, rawIdentifier);
  if (!identifier) return { ok: false, error: "Invalid sign-in request." };
  const clean = (code || "").replace(/\D/g, "");
  if (clean.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

  const row = (
    await pool.query(
      `select id, code_hash, attempts, expires_at, consumed from login_codes
       where identifier = $1 and channel = $2 order by created_at desc limit 1`,
      [identifier, channel],
    )
  ).rows[0] as { id: number; code_hash: string; attempts: number; expires_at: string; consumed: boolean } | undefined;

  if (!row) return { ok: false, error: "Request a code first." };
  if (row.consumed) return { ok: false, error: "That code was already used — request a new one." };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, error: "That code expired — request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many attempts — request a new code." };

  await pool.query(`update login_codes set attempts = attempts + 1 where id = $1`, [row.id]);

  const expected = Buffer.from(row.code_hash);
  const got = Buffer.from(hashCode(clean, identifier));
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
    return { ok: false, error: "Incorrect code." };
  }

  await pool.query(`update login_codes set consumed = true where id = $1`, [row.id]);
  return { ok: true, identifier };
}
