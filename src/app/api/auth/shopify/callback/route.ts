// GET /api/auth/shopify/callback — Shopify redirects here with ?code&state after the
// customer enters their emailed OTP. Verify state (CSRF), exchange the code for tokens,
// link the Shopify customer to our users row, set our session cookie, and continue.
import { NextResponse } from "next/server";
import { pool } from "@/lib/server/db";
import {
  exchangeCode, verifyCookie, makeSessionToken,
  OAUTH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE,
} from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OAuthState = { verifier: string; state: string; redirectUri: string; returnTo: string };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const fail = (reason: string) => NextResponse.redirect(new URL(`/account/login?error=${encodeURIComponent(reason)}`, origin));

  if (err) return fail(err);
  if (!code || !state) return fail("missing_code");

  const stash = verifyCookie<OAuthState>(req.headers.get("cookie")?.match(new RegExp(`${OAUTH_COOKIE}=([^;]+)`))?.[1]);
  if (!stash || stash.state !== state) return fail("state_mismatch");

  let identity: { email: string | null; customerGid: string | null };
  try {
    identity = await exchangeCode(code, stash.verifier, stash.redirectUri);
  } catch {
    return fail("token_exchange_failed");
  }

  // Link the Shopify customer to our users row (by email; also record the gid).
  if (identity.email) {
    await pool
      .query(
        `insert into users (email, shopify_customer_gid) values ($1, $2)
         on conflict (email) do update set shopify_customer_gid = coalesce(excluded.shopify_customer_gid, users.shopify_customer_gid)`,
        [identity.email, identity.customerGid],
      )
      .catch(() => {});
  }

  const res = NextResponse.redirect(new URL(stash.returnTo || "/account", origin));
  res.cookies.set(SESSION_COOKIE, makeSessionToken({ email: identity.email, customerGid: identity.customerGid }), {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  res.cookies.set(OAUTH_COOKIE, "", { path: "/", maxAge: 0 }); // clear the handshake cookie
  return res;
}
