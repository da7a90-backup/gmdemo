// POST /api/webhooks/orders-void — Shopify orders/cancelled + refunds/create →
// void the matching entry blocks so refunded/cancelled tickets stop counting.
// HMAC-verified, idempotent, always 2xx. (A partial refund voids the whole order's
// tickets here; line-level proration can be added later if needed.)
import { NextResponse } from "next/server";
import { verifyShopifyHmac, webhookSecretConfigured, voidOrderTickets } from "@/lib/server/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (webhookSecretConfigured() && !verifyShopifyHmac(raw, hmac)) {
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  let payload: { id?: number; order_id?: number };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // refunds/create carries order_id; orders/cancelled carries the order's own id.
  const orderId = Number(payload.order_id ?? payload.id);
  if (!orderId) return NextResponse.json({ ok: true, voided: 0 }, { status: 200 });

  const voided = await voidOrderTickets(orderId);
  return NextResponse.json({ ok: true, voided }, { status: 200 });
}
