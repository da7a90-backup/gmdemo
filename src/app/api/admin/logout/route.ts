// GET/POST /api/admin/logout — clear the admin session cookie and return to the login page.
// Exempt from the admin gate (see middleware).
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clear(req: Request) {
  const origin = new URL(req.url).origin;
  const res = NextResponse.redirect(new URL("/admin/login", origin));
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
export const GET = clear;
export const POST = clear;
