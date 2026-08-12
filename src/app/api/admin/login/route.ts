// POST /api/admin/login { username, password } — verify against ADMIN_USER/ADMIN_PASSWORD
// and set the signed admin session cookie. Exempt from the admin gate (see middleware).
import { NextResponse } from "next/server";
import { makeAdminToken, ADMIN_COOKIE, ADMIN_TTL_DAYS } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return NextResponse.json({ ok: false, error: "admin auth not configured" }, { status: 500 });

  if (b?.username === user && b?.password === pass) {
    const origin = new URL(req.url).origin;
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, await makeAdminToken(), {
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_TTL_DAYS * 86_400,
    });
    return res;
  }
  return NextResponse.json({ ok: false, error: "Incorrect username or password." }, { status: 401 });
}
