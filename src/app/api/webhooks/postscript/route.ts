// POST /api/webhooks/postscript — Postscript subscriber lifecycle webhooks. Flips our
// sms_subscribers row: opt_in → 'subscribed', opt_out → 'unsubscribed'. The registered
// callback carries `?event=opt_in|opt_out`; we also fall back to the payload `type`.
// Verified with the shop signing token (Postscript-Signature header). See providers/postscript.ts.
import { NextResponse } from "next/server";
import { pool } from "@/lib/server/db";
import { verifyPostscriptSignature } from "@/lib/server/providers/postscript";
import { normalizePhone } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  type?: string; event?: string;
  phone_number?: string; phone?: string;
  subscriber?: { phone_number?: string; phone?: string };
  data?: { phone_number?: string; phone?: string; subscriber?: { phone_number?: string; phone?: string } };
};

function extractPhone(p: Payload): string | null {
  const c = [
    p?.phone_number, p?.phone,
    p?.subscriber?.phone_number, p?.subscriber?.phone,
    p?.data?.phone_number, p?.data?.phone,
    p?.data?.subscriber?.phone_number, p?.data?.subscriber?.phone,
  ];
  const hit = c.find((v) => typeof v === "string" && v);
  return hit ?? null;
}

export async function POST(req: Request) {
  const raw = await req.text();
  const check = verifyPostscriptSignature(req.headers.get("postscript-signature"));
  if (!check.ok) return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  if (!check.verified) console.warn("[postscript] webhook signature UNVERIFIED (set POSTSCRIPT_WEBHOOK_TOKEN)");

  let payload: Payload = {};
  try { payload = JSON.parse(raw) as Payload; } catch { /* tolerate empty/non-JSON pings */ }

  const evParam = new URL(req.url).searchParams.get("event") ?? "";
  const type = String(payload?.type ?? payload?.event ?? "");
  const isOptIn = evParam === "opt_in" || type.endsWith("opt_in");
  const isOptOut = evParam === "opt_out" || type.endsWith("opt_out");

  const rawPhone = extractPhone(payload);
  const phone = rawPhone ? (normalizePhone(rawPhone) ?? rawPhone) : null;

  if (phone && (isOptIn || isOptOut)) {
    const status = isOptIn ? "subscribed" : "unsubscribed";
    await pool
      .query(`update sms_subscribers set status = $2, updated_at = now() where phone = $1`, [phone, status])
      .catch((e) => console.error("[postscript] db update failed:", e));
  }
  return NextResponse.json({ ok: true }); // always 2xx so Postscript doesn't retry-storm
}
