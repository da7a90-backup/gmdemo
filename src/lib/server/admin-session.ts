// Cookie-based admin session (replaces HTTP Basic Auth so there's a real log-out).
// A short HMAC-signed token with an expiry, verified with Web Crypto so it works in BOTH
// the Node route handlers and the Edge middleware. No node:crypto (Edge-safe).
const SECRET = () => process.env.AUTH_SESSION_SECRET || process.env.ADMIN_PASSWORD || "dev-admin-secret";
export const ADMIN_COOKIE = "gm_admin";
export const ADMIN_TTL_DAYS = 7;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}
async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(new Uint8Array(sig));
}

export async function makeAdminToken(ttlDays = ADMIN_TTL_DAYS): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + ttlDays * 86_400_000 })));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if ((await hmac(payload)) !== sig) return false;
  try {
    const { exp } = JSON.parse(fromB64url(payload)) as { exp?: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}
