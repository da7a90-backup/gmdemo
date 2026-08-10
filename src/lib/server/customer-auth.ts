// Shopify Customer Account API — hosted passwordless (OTP) login for the headless
// storefront. OAuth 2.0 + PKCE. Shopify hosts the login page and sends the one-time
// code; this app only starts the flow, exchanges the code, and holds a session.
//
// The authorize/token/logout endpoints + client_id are NOT hardcoded — you record them
// from Shopify admin → Sales channels → Headless → Customer Account API, and set them as
// env. GM's client is a PUBLIC (web app) client: token exchange is PKCE-only — NO
// client_secret, NO Authorization header (the code_verifier proves identity). The optional
// CLIENT_SECRET below is only for a confidential client; leave it unset for public. Docs:
//   https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/authenticate-customers
import crypto from "node:crypto";

const AUTHORIZE_URL = process.env.SHOPIFY_CUSTOMER_AUTH_AUTHORIZE_URL;
const TOKEN_URL = process.env.SHOPIFY_CUSTOMER_AUTH_TOKEN_URL;
const LOGOUT_URL = process.env.SHOPIFY_CUSTOMER_AUTH_LOGOUT_URL;
const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_AUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CUSTOMER_AUTH_CLIENT_SECRET; // confidential client (optional)
// Scope: set per your Customer Account API config. `openid email` is the common
// baseline; some setups also need the customer-account-api scope — verify in Shopify.
const SCOPE = process.env.SHOPIFY_CUSTOMER_AUTH_SCOPE || "openid email";
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || process.env.SHOPIFY_API_SECRET || "";

export const CALLBACK_PATH = "/api/auth/shopify/callback";
export const OAUTH_COOKIE = "gm_oauth";
export const SESSION_COOKIE = "gm_session";
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days

/** True when the Customer Account API env is present (else the flow is a no-op and
 * the app falls back to the demo login). */
export const customerAuthConfigured = () => !!(AUTHORIZE_URL && TOKEN_URL && CLIENT_ID);

const b64url = (b: Buffer) => b.toString("base64url");
const rand = (n = 32) => b64url(crypto.randomBytes(n));

export function redirectUri(origin: string) {
  return process.env.SHOPIFY_CUSTOMER_AUTH_REDIRECT_URI || origin.replace(/\/+$/, "") + CALLBACK_PATH;
}

/* ------------------------------- PKCE / authorize ------------------------------- */
export type OAuthStart = { url: string; verifier: string; state: string; nonce: string; redirectUri: string };

export function buildAuthorize(origin: string): OAuthStart {
  const verifier = rand(32);
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = rand(16);
  const nonce = rand(16);
  const ruri = redirectUri(origin);
  const p = new URLSearchParams({
    client_id: CLIENT_ID!,
    response_type: "code",
    redirect_uri: ruri,
    scope: SCOPE,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return { url: `${AUTHORIZE_URL}?${p.toString()}`, verifier, state, nonce, redirectUri: ruri };
}

/* --------------------------------- token exchange -------------------------------- */
type TokenResponse = { access_token?: string; id_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };

export async function exchangeCode(code: string, verifier: string, ruri: string): Promise<{ email: string | null; customerGid: string | null; raw: TokenResponse }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID!,
    redirect_uri: ruri,
    code,
    code_verifier: verifier,
  });
  const headers: Record<string, string> = { "content-type": "application/x-www-form-urlencoded" };
  // Confidential clients send client_id:client_secret in the Authorization header.
  if (CLIENT_SECRET) headers.authorization = "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(TOKEN_URL!, { method: "POST", headers, body });
  const raw = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || raw.error) throw new Error(`token exchange ${res.status}: ${raw.error_description || raw.error || ""}`);

  // The OIDC id_token carries the customer identity (sub) + email (when in scope).
  const claims = raw.id_token ? decodeJwt(raw.id_token) : {};
  const email = (claims.email as string) || null;
  const customerGid = (claims.sub as string) || null;
  return { email, customerGid, raw };
}

/** Decode a JWT payload WITHOUT verifying the signature — safe here because the token
 * came directly from Shopify's token endpoint over TLS. (Add JWKS verification if the
 * token is ever accepted from an untrusted source.) */
function decodeJwt(jwt: string): Record<string, unknown> {
  try {
    const [, payload] = jwt.split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/* ------------------------------------ session ------------------------------------ */
export type Session = { email: string | null; customerGid: string | null; exp: number };

function sign(payload: string): string {
  return b64url(crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest());
}

/** Generic tamper-proof cookie value (used for the in-flight OAuth handshake state). */
export function signCookie(obj: unknown): string {
  const payload = b64url(Buffer.from(JSON.stringify(obj)));
  return `${payload}.${sign(payload)}`;
}
export function verifyCookie<T = unknown>(token: string | undefined): T | null {
  if (!token || !SESSION_SECRET) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function makeSessionToken(s: Omit<Session, "exp">): string {
  const body = { ...s, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S };
  const payload = b64url(Buffer.from(JSON.stringify(body)));
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): Session | null {
  if (!token || !SESSION_SECRET) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (!s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export const OAUTH_TTL_S = 600; // 10 min for the in-flight login
export const SESSION_MAX_AGE = SESSION_TTL_S;
export const logoutUrl = () => LOGOUT_URL || null;

/** Read the current signed-in customer from a request's Cookie header (or null). */
export function sessionFromRequest(req: Request): Session | null {
  const token = req.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  return readSessionToken(token);
}
