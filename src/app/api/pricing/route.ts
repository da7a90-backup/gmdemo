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
    const tickets: Record<string, number> = {};
    for (const v of tv) tickets[String(v.entries)] = v.price;
    const memberships: Record<string, { price: number; entries: number }> = {};
    for (const v of mv) memberships[v.tier.toLowerCase()] = { price: v.price, entries: v.entries };
    return ok({ tickets, memberships });
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
