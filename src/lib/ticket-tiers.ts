import { ticketTiers as FALLBACK, type Tier } from "@/lib/mock-data";
import type { LiveTicketTier } from "@/lib/pricing-store";

export type DisplayTier = Tier & { available?: boolean };

/**
 * The ticket tiers to render. Driven by the LIVE Shopify variant ladder (entry
 * counts from each variant's base_entries, + live price), enriched with the
 * hardcoded display metadata (name / badge / blurb / popular) matched by entry
 * count. Exhaustive — every purchasable variant shows up, including ones added in
 * Shopify that aren't in the code ladder. Falls back to the code ladder only when
 * Shopify is unreachable (live === null).
 */
export function effectiveTicketTiers(live: LiveTicketTier[] | null): DisplayTier[] {
  if (!live || live.length === 0) return FALLBACK;
  return live
    .filter((v) => v.available !== false)
    .map((v) => {
      const meta = FALLBACK.find((t) => t.entries === v.entries);
      return {
        id: meta?.id ?? `t-${v.entries}`,
        name: meta?.name ?? `${v.entries.toLocaleString()} ${v.entries === 1 ? "ticket" : "tickets"}`,
        priceUSD: v.price,
        entries: v.entries,
        badge: meta?.badge,
        popular: meta?.popular,
        blurb: meta?.blurb,
        available: v.available,
      };
    });
}
