// Recurring subscription billing (Sprint 2 Track C).
// The app is the subscription MANAGER (write_own_subscription_contracts), so Shopify does
// NOT auto-charge renewals — the app must charge each due billing cycle itself. Run daily
// via vercel.json crons: `subscriptionBillingCycleBulkCharge` fires one async job that
// charges every UNBILLED, not-yet-attempted cycle whose billingAttemptExpectedDate falls in
// the window, across all ACTIVE contracts. Each successful charge creates an order →
// orders/paid webhook → mints that cycle's tickets (already wired in webhooks.ts).
// Idempotent: NO_ATTEMPT + Shopify's one-successful-charge-per-cycle rule mean a cycle is
// never double-charged. Shopify only permits charging cycles whose expected date is in the
// past or within the next 24h.
// docs: https://shopify.dev/docs/apps/build/purchase-options/subscriptions/billing-cycles/bulk-billing-cycles
import { shopifyAdmin } from "./shopify";

const iso = (d: Date) => d.toISOString();

export type BulkChargeOutcome = {
  ok: boolean;
  jobId?: string;
  window?: { startDate: string; endDate: string };
  userErrors?: { field?: string[] | null; message: string }[];
  error?: string;
};

/**
 * Queue a bulk charge for every due, unbilled cycle on ACTIVE contracts.
 * @param lookbackDays how far back to sweep, to catch cycles missed while the cron was down
 *   (harmless: already-attempted cycles are excluded by the NO_ATTEMPT filter).
 */
export async function chargeDueBillingCycles(lookbackDays = 3): Promise<BulkChargeOutcome> {
  const now = new Date();
  const startDate = iso(new Date(now.getTime() - lookbackDays * 86_400_000));
  const endDate = iso(new Date(now.getTime() + 86_400_000)); // Shopify caps the lookahead at +24h
  // Enum values + the filter shape are taken verbatim from Shopify's bulk-billing-cycles doc.
  // Dates are our own ISO strings (fixed format) so string-building carries no injection risk.
  const query = `mutation {
    subscriptionBillingCycleBulkCharge(
      billingAttemptExpectedDateRange: { startDate: "${startDate}", endDate: "${endDate}" }
      filters: { contractStatus: [ACTIVE], billingCycleStatus: [UNBILLED], billingAttemptStatus: NO_ATTEMPT }
    ) {
      job { id done }
      userErrors { field message }
    }
  }`;
  try {
    const res = await shopifyAdmin<{
      subscriptionBillingCycleBulkCharge: {
        job: { id: string; done: boolean } | null;
        userErrors: { field?: string[] | null; message: string }[];
      };
    }>(query);
    const payload = res.subscriptionBillingCycleBulkCharge;
    if (payload.userErrors?.length) return { ok: false, window: { startDate, endDate }, userErrors: payload.userErrors };
    return { ok: true, jobId: payload.job?.id, window: { startDate, endDate } };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) };
  }
}

/** Poll the async bulk-charge Job (observability). Returns null if the id doesn't resolve.
 * Job is fetched via the top-level `job(id:)` field — it does NOT implement Node. */
export async function billingJobStatus(jobId: string): Promise<{ id: string; done: boolean } | null> {
  const query = `query($id: ID!) { job(id: $id) { id done } }`;
  const res = await shopifyAdmin<{ job: { id: string; done: boolean } | null }>(query, { id: jobId });
  return res.job ?? null;
}
