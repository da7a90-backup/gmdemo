// GET /api/pricing — PUBLIC live prices from the Shopify Storefront variants, so the
// displayed prices match what checkout charges (falls back to code values when Shopify
// is unreachable). Keyed by ticket entry-count and by membership tier.
import { ok, fail, errMsg } from "@/lib/server/http";
import { getTicketVariants, getMembershipVariants } from "@/lib/server/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [tv, mv] = await Promise.all([getTicketVariants().catch(() => []), getMembershipVariants().catch(() => [])]);
    // Full live variant ladder (entries from Shopify base_entries) + a price-by-entries
    // map for quick lookups. The ladder drives the buy UI so it's exhaustive.
    const ticketTiers = tv.map((v) => ({ entries: v.entries, price: v.price, available: v.available }));
    const tickets: Record<string, number> = {};
    for (const v of tv) tickets[String(v.entries)] = v.price;
    const memberships: Record<string, { price: number; entries: number }> = {};
    for (const v of mv) memberships[v.tier.toLowerCase()] = { price: v.price, entries: v.entries };
    return ok({ tickets, ticketTiers, memberships });
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
