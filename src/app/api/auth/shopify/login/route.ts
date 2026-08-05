// GET /api/auth/shopify/login — start the Shopify Customer Account API login.
// Generates PKCE + state, stashes them in a signed httpOnly cookie, and redirects
// to Shopify's hosted (passwordless / OTP) login page. If the Customer Account API
// isn't configured yet, bounces to the demo login so the app still works.
import { NextResponse } from "next/server";
import {
  customerAuthConfigured, buildAuthorize, signCookie, OAUTH_COOKIE, OAUTH_TTL_S,
} from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const returnTo = new URL(req.url).searchParams.get("returnTo") || "/account";

  if (!customerAuthConfigured()) {
    return NextResponse.redirect(new URL("/account/login?demo=1", origin));
  }

  const start = buildAuthorize(origin);
  const res = NextResponse.redirect(start.url);
  res.cookies.set(OAUTH_COOKIE, signCookie({ verifier: start.verifier, state: start.state, redirectUri: start.redirectUri, returnTo }), {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_TTL_S,
  });
  return res;
}
