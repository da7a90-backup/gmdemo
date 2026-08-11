// GET/POST /api/auth/logout — clear our self-hosted session cookie and return home.
// (Self-hosted OTP now; we no longer bounce to Shopify's hosted logout page.)
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clear(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const GET = clear;
export const POST = clear;
