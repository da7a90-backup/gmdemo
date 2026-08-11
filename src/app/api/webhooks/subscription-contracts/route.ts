// POST /api/webhooks/subscription-contracts — Shopify subscription_contracts/*
// (create|update, incl. cancellation via status change). Records the contract and
// flips users.is_member: active/paused → member; cancelled/expired/failed →
// member only if another active contract remains. HMAC-verified, always 2xx once
// handled (Shopify shouldn't retry a processed status change).
import { NextResponse } from "next/server";
import {
  verifyShopifyHmac, webhookSecretConfigured, upsertSubscriptionContract, currentCyclePrize, type ContractPayload,
} from "@/lib/server/webhooks";
import { emitEmailEvent } from "@/lib/server/email-templates";
import { addToMembersList, removeFromMembersList } from "@/lib/server/providers/klaviyo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Map the delivered topic (or payload status) to our contract status. */
function contractStatus(topic: string, payload: ContractPayload): string {
  const t = topic.split("/").pop();
  if (t === "cancel") return "cancelled";
  if (t === "expire") return "expired";
  if (t === "fail") return "failed";
  if (t === "pause") return "paused";
  if (t === "activate" || t === "create") return "active";
  // update (or unknown) → derive from the payload's own status field
  const s = String(payload?.status ?? "").toLowerCase();
  if (s === "canceled" || s === "cancelled") return "cancelled";
  if (s === "active" || s === "paused" || s === "expired" || s === "failed") return s;
  return "active";
}

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (webhookSecretConfigured() && !verifyShopifyHmac(raw, hmac)) {
    return NextResponse.json({ ok: false, error: "invalid hmac" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") || "";
  let payload: ContractPayload;
  try {
    payload = JSON.parse(raw) as ContractPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const status = contractStatus(topic, payload);
  const { transition, email } = await upsertSubscriptionContract(payload, status);

  // Lifecycle email + Members-list sync (best-effort; never blocks the 2xx ack).
  if (email && transition) {
    const gid = payload.admin_graphql_api_id || `contract-${payload.id}`;
    if (transition === "started") {
      const { code, prize } = await currentCyclePrize();
      await emitEmailEvent("Membership Started", "membership_started", email, { prize, cycle: code }, `memstart-${gid}`).catch(() => {});
      await addToMembersList(email).catch(() => {});
    } else if (transition === "cancelled") {
      const { prize } = await currentCyclePrize();
      await emitEmailEvent("Membership Cancelled", "membership_cancelled", email, { prize }, `memcancel-${gid}-${status}`).catch(() => {});
      await removeFromMembersList(email).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
