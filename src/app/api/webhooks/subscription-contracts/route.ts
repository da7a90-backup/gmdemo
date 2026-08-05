// POST /api/webhooks/subscription-contracts — Shopify subscription_contracts/*
// (create|update, incl. cancellation via status change). Records the contract and
// flips users.is_member: active/paused → member; cancelled/expired/failed →
// member only if another active contract remains. HMAC-verified, always 2xx once
// handled (Shopify shouldn't retry a processed status change).
import { NextResponse } from "next/server";
import {
  verifyShopifyHmac, webhookSecretConfigured, upsertSubscriptionContract, type ContractPayload,
} from "@/lib/server/webhooks";

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

  await upsertSubscriptionContract(payload, contractStatus(topic, payload));
  return NextResponse.json({ ok: true }, { status: 200 });
}
