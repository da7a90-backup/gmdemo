// POST /api/webhooks/orders-paid — Shopify orders/paid → mint raffle tickets.
// HMAC-verified (app secret), deduped by X-Shopify-Webhook-Id, idempotent per
// order/line. Node runtime + raw body (required for HMAC). Returns 2xx once the
// order is stored (or a duplicate); 500 only if the mint genuinely fails so
// Shopify re-delivers and the reconciliation cron (C.8) is the final net.
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  verifyShopifyHmac, webhookSecretConfigured, mapOrderToMintBody,
  isMembershipOrder, applyOrderMeta, type OrderPayload,
} from "@/lib/server/webhooks";
import { mintOne } from "@/lib/server/ticketing";
import { klaviyoEvent } from "@/lib/server/providers/klaviyo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  // If a webhook secret is configured, a valid signature is mandatory.
  if (webhookSecretConfigured() && !verifyShopifyHmac(raw, hmac)) {
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  // Delivery id is the dedupe key (processed_webhooks). Order/line uniqueness is
  // the backstop if the header is ever absent.
  const webhookId = req.headers.get("x-shopify-webhook-id") || randomUUID();

  let payload: OrderPayload;
  try {
    payload = JSON.parse(raw) as OrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const body = mapOrderToMintBody(webhookId, payload);
  if (!body) {
    // No entry-bearing lines — acknowledge so Shopify stops retrying.
    return NextResponse.json({ ok: true, status: "ignored" }, { status: 200 });
  }

  const result = await mintOne(body, "seq");
  if (result.ok) {
    // Best-effort: holder name on the order + member link on the user.
    await applyOrderMeta(payload, isMembershipOrder(payload));
    // "You're in" receipt — only on a FRESH mint (not a duplicate delivery), after
    // the tickets exist, so the email can include them. Klaviyo flow sends it.
    if (result.status === "minted" && body.order.email) {
      await klaviyoEvent(
        "Tickets Minted",
        body.order.email,
        {
          cycle: result.cycle_code,
          entries: result.entries,
          ticket_prefix: result.ticket_prefix,
          order_token: result.order_token,
          shopify_order_id: body.order.id,
        },
        `mint-${body.order.id}`,
      ).catch(() => {});
    }
    return NextResponse.json(result, { status: 200 });
  }
  return NextResponse.json(result, { status: 500 });
}
