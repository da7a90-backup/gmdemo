// Legal pages — seeded into Shopify `legal_doc` metaobjects, and used as the
// fallback when Shopify is unreachable. Client-safe (pure data).
export type LegalDoc = { slug: string; title: string; body: string };

export const DEFAULT_LEGAL: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: "We collect only what running a charitable drawing requires: your contact details, entries, and payment confirmations (payments themselves are processed by Shopify — we never see card numbers). We do not sell personal data. SMS and email lists are opt-in with one-step removal.",
  },
  {
    slug: "terms",
    title: "Terms of Service",
    body: "Use of this site and participation in any drawing is governed by the cycle's Official Rules, Florida law (Fla. Stat. § 849.0935), and these terms. Entries are non-transferable. Chargebacks on completed entries void those entries.",
  },
  {
    slug: "play",
    title: "Responsible Play",
    body: "Our draws are entertainment that funds charity — not a way to make money. Set a budget and keep it. Free mail-in entry is always available with identical odds (see the Official Rules). If play stops being fun, take a break: help is available at 1-800-GAMBLER.",
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    body: "We aim for WCAG 2.1 AA across the site: semantic markup, keyboard operability, visible focus, and contrast-checked palettes. Found a barrier? Tell us via the contact page and we will fix it in the next release.",
  },
];

export const legalBySlug = (slug: string): LegalDoc | undefined =>
  DEFAULT_LEGAL.find((d) => d.slug === slug);
