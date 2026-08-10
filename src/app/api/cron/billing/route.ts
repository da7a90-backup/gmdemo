// GET /api/cron/billing — recurring subscription billing (Sprint 2 Track C).
// The app is the subscription manager, so it must charge renewals itself. Runs daily via
// vercel.json crons: queues a bulk charge of every due UNBILLED cycle; each successful
// charge → order → orders/paid webhook → mints that cycle's tickets. Idempotent (Shopify
// allows one successful charge per cycle). See src/lib/server/subscription-billing.ts.
import { NextResponse } from "next/server";
import { shopifyAdminConfigured } from "@/lib/server/shopify";
import { chargeDueBillingCycles } from "@/lib/server/subscription-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vercel injects Authorization: Bearer <CRON_SECRET> when the secret is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!shopifyAdminConfigured()) return NextResponse.json({ ok: false, error: "shopify not configured" }, { status: 503 });

  const r = await chargeDueBillingCycles();
  if (!r.ok) {
    console.warn(`[billing] bulk charge failed:`, r.userErrors ?? r.error);
    return NextResponse.json(r, { status: 500 });
  }
  console.warn(`[billing] queued bulk-charge job ${r.jobId} for ${r.window?.startDate}..${r.window?.endDate}`);
  return NextResponse.json(r, { status: 200 });
}
