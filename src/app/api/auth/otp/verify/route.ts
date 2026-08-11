// POST /api/auth/otp/verify — verify a login code and set the session cookie.
// Body { channel, identifier, code }. On success the same signed `gm_session` cookie the
// rest of the app reads is set (email OR phone identity). See otp-auth.ts / customer-auth.ts.
import { NextResponse } from "next/server";
import { readJson } from "@/lib/server/http";
import { verifyOtp, type Channel } from "@/lib/server/otp-auth";
import { makeSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ channel?: string; identifier?: string; code?: string }>(req);
  const channel: Channel = b?.channel === "sms" ? "sms" : "email";
  if (!b?.identifier?.trim() || !b?.code?.trim()) {
    return NextResponse.json({ ok: false, error: "identifier and code required" }, { status: 400 });
  }

  const r = await verifyOtp(channel, b.identifier, b.code);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });

  const email = channel === "email" ? r.identifier! : null;
  const phone = channel === "sms" ? r.identifier! : null;
  const origin = new URL(req.url).origin;

  const res = NextResponse.json({ ok: true, data: { signedIn: true, email, phone } });
  res.cookies.set(SESSION_COOKIE, makeSessionToken({ email, phone, customerGid: null }), {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
