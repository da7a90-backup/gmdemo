// One-click unsubscribe tokens for marketing email (HMAC of the email, so no state
// to store). Used by sendBroadcast's per-recipient link + /api/unsubscribe.
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SESSION_SECRET || "dev-unsubscribe-secret";

export function unsubToken(email: string): string {
  return crypto.createHmac("sha256", SECRET).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsub(email: string, token: string): boolean {
  const expected = unsubToken(email);
  if (!token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Absolute one-click unsubscribe URL for a recipient. */
export function unsubscribeUrl(origin: string, email: string): string {
  return `${origin}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}
