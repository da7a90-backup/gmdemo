// POST /api/webhooks/subscription-billing-failure — Shopify
// subscription_billing_attempts/failure. A recurring charge failed → send the dunning
// email ("update your card"). The payload carries the contract id but no email, so we
// resolve it from our DB. HMAC-verified; always 2xx. See webhooks.ts / email-templates.ts.
import { NextResponse } from "next/server";
import { verifyShopifyHmac, webhookSecretConfigured, resolveContractEmail, currentCyclePrize } from "@/lib/server/webhooks";
import { emitEmailEvent } from "@/lib/server/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BillingFailure = { id?: number; admin_graphql_api_id?: string; subscription_contract_id?: number; error_code?: string; error_message?: string };

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (webhookSecretConfigured() && !verifyShopifyHmac(raw, hmac)) {
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }
  let p: BillingFailure;
  try {
    p = JSON.parse(raw) as BillingFailure;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const contractGid = p.subscription_contract_id ? `gid://shopify/SubscriptionContract/${p.subscription_contract_id}` : null;
  const email = await resolveContractEmail(contractGid);
  if (email) {
    const { prize } = await currentCyclePrize();
    // One dunning email per failed attempt (attempt id is unique).
    await emitEmailEvent("Membership Payment Failed", "membership_payment_failed", email, { prize }, `payfail-${p.id ?? contractGid ?? email}`).catch(() => {});
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
