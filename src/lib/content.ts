// Site copy CMS (demo). Every editable string lives in this registry,
// organized by page → section; the admin Content desk writes overrides to
// localStorage and the site picks them up through <Copy k="..."/>.

export type ContentField = {
  key: string;
  page: string;
  group: string;
  label: string;
  long?: boolean;
  def: string;
};

export const CONTENT_FIELDS: ContentField[] = [
  /* ------------------------------ Homepage ------------------------------ */
  { key: "hero.h1.lead", page: "Homepage", group: "Hero", label: "Headline — opening phrase", def: "Win the" },
  { key: "hero.h1.car", page: "Homepage", group: "Hero", label: "Headline — teal italic word", def: "car." },
  { key: "hero.h1.fund", page: "Homepage", group: "Hero", label: "Headline — second phrase", def: "Fund the" },
  { key: "hero.h1.cause", page: "Homepage", group: "Hero", label: "Headline — marker-swipe word", def: "cause." },
  { key: "hero.promoLabel", page: "Homepage", group: "Hero", label: "Countdown label", def: "Special promotion ends in" },
  { key: "hero.cta", page: "Homepage", group: "Hero", label: "CTA button", def: "Enter now" },

  { key: "home.winners.eyebrow", page: "Homepage", group: "Winners section", label: "Eyebrow", def: "Recent winners" },
  { key: "home.winners.h.lead", page: "Homepage", group: "Winners section", label: "Heading — lead", def: "Real people." },
  { key: "home.winners.h.accent", page: "Homepage", group: "Winners section", label: "Heading — italic accent", def: "Real cars." },

  { key: "home.how.eyebrow", page: "Homepage", group: "How it works", label: "Eyebrow", def: "How it works" },
  { key: "home.how.h.lead", page: "Homepage", group: "How it works", label: "Heading — lead", def: "Four" },
  { key: "home.how.h.accent", page: "Homepage", group: "How it works", label: "Heading — italic accent", def: "steps." },

  { key: "home.pricing.eyebrow", page: "Homepage", group: "Pricing section", label: "Eyebrow", def: "Pick a bundle" },
  { key: "home.pricing.h.lead", page: "Homepage", group: "Pricing section", label: "Heading — lead", def: "Pick a tier." },
  { key: "home.pricing.h.accent", page: "Homepage", group: "Pricing section", label: "Heading — italic accent", def: "Or join the monthly." },
  {
    key: "home.pricing.blurb", page: "Homepage", group: "Pricing section", label: "Side paragraph", long: true,
    def: "One-time enters you in this draw. Monthly enters you in every draw, automatically, plus early access to bonus offers and drawing alerts.",
  },

  { key: "home.live.eyebrow", page: "Homepage", group: "Live draw block", label: "Eyebrow", def: "The draw, on camera" },
  { key: "home.live.h.l1", page: "Homepage", group: "Live draw block", label: "Heading — line 1", def: "Every winner is pulled" },
  { key: "home.live.h.l2", page: "Homepage", group: "Live draw block", label: "Heading — line 2 lead", def: "from" },
  { key: "home.live.h.accent", page: "Homepage", group: "Live draw block", label: "Heading — italic accent", def: "a real drum." },
  {
    key: "home.live.body", page: "Homepage", group: "Live draw block", label: "Body", long: true,
    def: "Every entry is printed onto paper and dropped into a physical drum. Two cameras. One pull. The phone rings on stream.",
  },
  { key: "home.live.cta", page: "Homepage", group: "Live draw block", label: "CTA button", def: "Watch the next draw live" },

  { key: "charity.eyebrow", page: "Homepage", group: "Charity band", label: "Eyebrow", def: "This cycle's partner" },
  { key: "charity.h.lead", page: "Homepage", group: "Charity band", label: "Heading — lead", def: "Ten percent." },
  { key: "charity.h.accent", page: "Homepage", group: "Charity band", label: "Heading — italic accent", def: "Paid first." },
  {
    key: "charity.body", page: "Homepage", group: "Charity band", label: "Supporting paragraph", long: true,
    def: "We pay the charity first — before the car is bought, before payroll, before any expense. It is a number we can defend on camera.",
  },

  { key: "home.faq.eyebrow", page: "Homepage", group: "FAQ", label: "Eyebrow", def: "FAQ" },
  { key: "home.faq.h.lead", page: "Homepage", group: "FAQ", label: "Heading — lead", def: "Plain answers." },
  { key: "home.faq.h.accent", page: "Homepage", group: "FAQ", label: "Heading — italic accent", def: "Obvious questions." },

  /* ---------------------------- Tickets page ---------------------------- */
  { key: "tickets.toggle.once", page: "Tickets page", group: "Buy box", label: "Toggle — one-time tab", def: "One-time bundles" },
  { key: "tickets.toggle.monthly", page: "Tickets page", group: "Buy box", label: "Toggle — membership tab", def: "Membership · save more" },
  { key: "tickets.buy", page: "Tickets page", group: "Buy box", label: "Buy button", def: "Buy now" },
  { key: "tickets.drawLabel", page: "Tickets page", group: "Buy box", label: "Countdown label (no promo)", def: "Draw closes in" },

  { key: "tickets.spec.eyebrow", page: "Tickets page", group: "Spec sheet section", label: "Eyebrow", def: "Spec sheet · as configured" },
  { key: "tickets.spec.h.lead", page: "Tickets page", group: "Spec sheet section", label: "Heading — lead", def: "What you're" },
  { key: "tickets.spec.h.accent", page: "Tickets page", group: "Spec sheet section", label: "Heading — italic accent", def: "winning." },

  { key: "tickets.winners.eyebrow", page: "Tickets page", group: "Winners section", label: "Eyebrow", def: "Recent winners" },
  { key: "tickets.winners.h.lead", page: "Tickets page", group: "Winners section", label: "Heading — lead", def: "The wall" },
  { key: "tickets.winners.h.accent", page: "Tickets page", group: "Winners section", label: "Heading — italic accent", def: "is real." },

  /* ----------------------------- SMS popup ------------------------------ */
  { key: "popup.eyebrow", page: "SMS popup", group: "Popup", label: "Eyebrow", def: "Don't miss the next draw" },
  { key: "popup.h.lead", page: "SMS popup", group: "Popup", label: "Heading — line 1", def: "Get draw-night alerts" },
  { key: "popup.h.accent", page: "SMS popup", group: "Popup", label: "Heading — teal line 2", def: "by text." },
  {
    key: "popup.body", page: "SMS popup", group: "Popup", label: "Body", long: true,
    def: "Texts land first: bonus ticket offers, flash sales, and a heads-up before we go live. Beat the inbox crowd.",
  },
  { key: "popup.cta", page: "SMS popup", group: "Popup", label: "CTA button (keep the trailing *)", def: "Text me the alerts*" },
  { key: "popup.success.title", page: "SMS popup", group: "Popup", label: "Success title", def: "Check your phone." },

  /* ------------------------------- Footer ------------------------------- */
  {
    key: "footer.mission", page: "Footer", group: "Masthead", label: "Mission line", long: true,
    def: "Drive the car. Fund the cause. 10% of every cycle goes to a real, named US charity — paid first, every cycle.",
  },
  { key: "newsletter.eyebrow", page: "Footer", group: "Newsletter signup", label: "Eyebrow", def: "The newsletter · 2X entries" },
  { key: "newsletter.title", page: "Footer", group: "Newsletter signup", label: "Title", def: "Draw alerts, bonus offers, receipts." },
  {
    key: "newsletter.body", page: "Footer", group: "Newsletter signup", label: "Body", long: true,
    def: "Subscribers get double entries on every ticket. One email per cycle, one click to leave.",
  },
  {
    key: "footer.fineprint", page: "Footer", group: "Fine print", label: "Legal disclaimer", long: true,
    def: "Generous Motors is a registered 501(c)(3) nonprofit organization. No purchase necessary to enter or win. A purchase does not increase your chances of winning. Open to legal residents of the United States, 18 years of age or older. Void where prohibited. Charitable contribution: 10% per cycle donated to featured nonprofit partner.",
  },
  { key: "footer.address", page: "Footer", group: "Fine print", label: "Address line", def: "Generous Motors · 120 Cedar Ave · Brooklyn, NY 11215" },
];

const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.def]));

const STORAGE_KEY = "gm:content-v1";
export const CONTENT_EVENT = "gm:content-updated";

// Static copy pulled from Shopify (via /api/content), fetched once on the client.
let remote: Record<string, string> | null = null;
let remoteLoading = false;

/** Load Shopify copy once, then re-render every <Copy> via CONTENT_EVENT. */
export function ensureRemoteContent() {
  if (typeof window === "undefined" || remote !== null || remoteLoading) return;
  remoteLoading = true;
  fetch("/api/content")
    .then((r) => r.json())
    .then((j) => { remote = j?.ok ? (j.data as Record<string, string>) : {}; window.dispatchEvent(new Event(CONTENT_EVENT)); })
    .catch(() => { remote = {}; })
    .finally(() => { remoteLoading = false; });
}

export function getContent(): Record<string, string> {
  if (typeof window === "undefined") return DEFAULTS;
  let local: Record<string, string> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) local = JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  // precedence: code defaults < Shopify copy < local admin override
  return { ...DEFAULTS, ...(remote ?? {}), ...local };
}

/** Persist only the values that differ from defaults. */
export function saveContent(values: Record<string, string>) {
  const overrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (DEFAULTS[k] !== undefined && v !== DEFAULTS[k]) overrides[k] = v;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(CONTENT_EVENT));
}

export function resetContent() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CONTENT_EVENT));
}

export function contentDefault(key: string): string {
  return DEFAULTS[key] ?? "";
}
