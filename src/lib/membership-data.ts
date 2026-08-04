// Membership loyalty-ladder rows — seeded into Shopify `membership_perk`
// metaobjects, and used as the fallback when Shopify is unreachable.
// Client-safe (pure data). `multiplier` is a string so Kevin can edit it as
// plain text in Shopify; the page parses it back to a number to derive entries.
export type MembershipPerk = { month: number; multiplier: string };

// Base monthly entries a Premium member earns before the loyalty multiplier.
export const MEMBERSHIP_BASE_ENTRIES = 60;

export const DEFAULT_MEMBERSHIP_PERKS: MembershipPerk[] = [
  { month: 1, multiplier: "1.05" },
  { month: 12, multiplier: "1.16" },
  { month: 24, multiplier: "1.28" },
  { month: 50, multiplier: "1.50" },
];
