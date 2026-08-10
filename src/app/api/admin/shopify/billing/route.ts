// POST /api/admin/shopify/billing — manually run recurring subscription billing (charges
// every due UNBILLED cycle now) and GET ?jobId=... to poll a queued job. Same logic the
// daily cron uses; here it's admin-triggerable for demos/ops. See subscription-billing.ts.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { shopifyAdminConfigured } from "@/lib/server/shopify";
import { chargeDueBillingCycles, billingJobStatus } from "@/lib/server/subscription-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  if (!shopifyAdminConfigured()) return fail("shopify not configured", 503);
  try {
    const r = await chargeDueBillingCycles();
    return r.ok ? ok(r) : fail(JSON.stringify(r.userErrors ?? r.error), 500);
  } catch (e) { return fail(errMsg(e), 500); }
}

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  if (!shopifyAdminConfigured()) return fail("shopify not configured", 503);
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return fail("jobId required", 400);
  try { return ok(await billingJobStatus(jobId)); } catch (e) { return fail(errMsg(e), 500); }
}
