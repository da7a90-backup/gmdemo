// POST /api/auth/otp/start — issue + send a login code. Body { channel, identifier }.
// channel: "email" (code via Klaviyo) | "sms" (code via Postscript). Self-hosted OTP —
// no Shopify redirect. See src/lib/server/otp-auth.ts.
import { ok, fail, readJson } from "@/lib/server/http";
import { startOtp, type Channel } from "@/lib/server/otp-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ channel?: string; identifier?: string }>(req);
  const channel: Channel = b?.channel === "sms" ? "sms" : "email";
  if (!b?.identifier?.trim()) return fail("identifier required");
  const r = await startOtp(channel, b.identifier);
  return r.ok ? ok({ sent: true, channel }) : fail(r.error ?? "could not send code", 400);
}
