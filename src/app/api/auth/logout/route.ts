// GET/POST /api/auth/logout — clear our self-hosted session cookie and return to
// the site home (/beta). (Self-hosted OTP now; no Shopify hosted logout bounce.)
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clear(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL("/beta", origin));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const GET = clear;
export const POST = clear;
