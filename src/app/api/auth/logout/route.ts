// GET/POST /api/auth/logout — clear our session cookie (and bounce to Shopify's
// logout endpoint if one is configured, else home).
import { NextResponse } from "next/server";
import { SESSION_COOKIE, logoutUrl } from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clear(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL(logoutUrl() || "/", origin));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const GET = clear;
export const POST = clear;
