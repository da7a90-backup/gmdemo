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
  { key: "home.how.step1.label", page: "Homepage", group: "How it works", label: "Step 1 — label", def: "Get Your Ticket" },
  { key: "home.how.step1.body", page: "Homepage", group: "How it works", label: "Step 1 — body", long: true, def: "Pick a tier. Every ticket is a real chance plus a real donation to this cycle's charity." },
  { key: "home.how.step2.label", page: "Homepage", group: "How it works", label: "Step 2 — label", def: "We Print Your Ticket" },
  { key: "home.how.step2.body", page: "Homepage", group: "How it works", label: "Step 2 — body", long: true, def: "Every entry is physically printed and dropped into the drum before the draw." },
  { key: "home.how.step3.label", page: "Homepage", group: "How it works", label: "Step 3 — label", def: "Watch Live" },
  { key: "home.how.step3.body", page: "Homepage", group: "How it works", label: "Step 3 — body", long: true, def: "Drum spins. A hand pulls one. The camera reads it. We call the winner on stream." },
  { key: "home.how.step4.label", page: "Homepage", group: "How it works", label: "Step 4 — label", def: "Drive It Away" },
  { key: "home.how.step4.body", page: "Homepage", group: "How it works", label: "Step 4 — body", long: true, def: "Winner picks delivery or cash equivalent. The charity check is presented on the next stream." },
  { key: "home.how.videoUrl", page: "Homepage", group: "How it works", label: "Explainer video — YouTube URL", def: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { key: "home.how.poster", page: "Homepage", group: "How it works", label: "Explainer video — poster image URL", def: "/vehicles/drum-poster.jpg" },

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
  { key: "popup.header.badge", page: "SMS popup", group: "Chrome", label: "Header badge", def: "★ Text club" },
  { key: "popup.header.free", page: "SMS popup", group: "Chrome", label: "Header note", def: "Free to join" },
  { key: "popup.field.label", page: "SMS popup", group: "Form", label: "Field label", def: "Mobile number" },
  { key: "popup.field.placeholder", page: "SMS popup", group: "Form", label: "Field placeholder", def: "(555) 123-4567" },
  {
    key: "popup.tcpa", page: "SMS popup", group: "Legal", label: "TCPA consent disclosure (ends before the TERMS/PRIVACY links)", long: true,
    def: "*By signing up via text, you agree to receive recurring automated promotional and personalized marketing text messages (e.g. draw reminders) from Generous Motors at the number provided. Consent is not a condition of any purchase. Reply HELP for help and STOP to cancel. Msg frequency varies. Msg & data rates may apply. View",
  },
  { key: "popup.terms", page: "SMS popup", group: "Legal", label: "TERMS link label", def: "TERMS" },
  { key: "popup.privacy", page: "SMS popup", group: "Legal", label: "PRIVACY link label", def: "PRIVACY" },
  {
    key: "popup.charityNote", page: "SMS popup", group: "Popup", label: "Charity note", long: true,
    def: "10% of every cycle goes to that cycle's nonprofit partner. Joining the text club helps us reach more drivers — and more charities.",
  },
  { key: "popup.skip", page: "SMS popup", group: "Popup", label: "Dismiss link", def: "No thanks, take me back" },
  {
    key: "popup.success.body", page: "SMS popup", group: "Popup", label: "Success body ({phone} = the number entered)", long: true,
    def: "We just texted {phone}. Reply Y to confirm your spot — that's it.",
  },

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

  { key: "footer.badge1", page: "Footer", group: "Masthead", label: "Badge 1", def: "501(c)(3) nonprofit" },
  { key: "footer.badge2", page: "Footer", group: "Masthead", label: "Badge 2", def: "10% to charity" },
  { key: "footer.badge3", page: "Footer", group: "Masthead", label: "Badge 3", def: "Drawn live" },
  { key: "footer.alertsCta", page: "Footer", group: "Masthead", label: "Drawing-alerts button", def: "Get drawing alerts" },
  { key: "newsletter.subscribe", page: "Footer", group: "Newsletter signup", label: "Subscribe button", def: "Subscribe" },
  { key: "newsletter.placeholder", page: "Footer", group: "Newsletter signup", label: "Email placeholder", def: "you@example.com" },
  { key: "newsletter.success", page: "Footer", group: "Newsletter signup", label: "Success message", long: true, def: "You're on the list — your 2X kicks in with the next cycle's email." },
  { key: "footer.col.draws.title", page: "Footer", group: "Nav — Draws", label: "Column title", def: "Draws" },
  { key: "footer.col.draws.l1", page: "Footer", group: "Nav — Draws", label: "Link 1", def: "Current draw" },
  { key: "footer.col.draws.l2", page: "Footer", group: "Nav — Draws", label: "Link 2", def: "Past winners" },
  { key: "footer.col.draws.l3", page: "Footer", group: "Nav — Draws", label: "Link 3", def: "My entries" },
  { key: "footer.col.trust.title", page: "Footer", group: "Nav — Trust", label: "Column title", def: "Trust" },
  { key: "footer.col.trust.l1", page: "Footer", group: "Nav — Trust", label: "Link 1", def: "How the draw works" },
  { key: "footer.col.trust.l2", page: "Footer", group: "Nav — Trust", label: "Link 2", def: "Our partners" },
  { key: "footer.col.trust.l3", page: "Footer", group: "Nav — Trust", label: "Link 3", def: "Field notes" },
  { key: "footer.col.trust.l4", page: "Footer", group: "Nav — Trust", label: "Link 4", def: "Official rules" },
  { key: "footer.col.help.title", page: "Footer", group: "Nav — Help", label: "Column title", def: "Help" },
  { key: "footer.col.help.l1", page: "Footer", group: "Nav — Help", label: "Link 1", def: "Contact us" },
  { key: "footer.col.help.l2", page: "Footer", group: "Nav — Help", label: "Link 2", def: "Privacy" },
  { key: "footer.col.help.l3", page: "Footer", group: "Nav — Help", label: "Link 3", def: "Terms" },
  { key: "footer.col.help.l4", page: "Footer", group: "Nav — Help", label: "Link 4", def: "Responsible play" },
  { key: "footer.col.help.l5", page: "Footer", group: "Nav — Help", label: "Link 5", def: "Accessibility" },

  /* ------------------------------- Header ------------------------------- */
  { key: "nav.tickets", page: "Header", group: "Nav", label: "Nav — Tickets", def: "Tickets" },
  { key: "nav.winners", page: "Header", group: "Nav", label: "Nav — Winners", def: "Winners" },
  { key: "nav.live", page: "Header", group: "Nav", label: "Nav — Live draw", def: "Live draw" },
  { key: "nav.partners", page: "Header", group: "Nav", label: "Nav — Partners", def: "Partners" },
  { key: "nav.about", page: "Header", group: "Nav", label: "Nav — About", def: "About" },
  { key: "nav.blog", page: "Header", group: "Nav", label: "Nav — Blog", def: "Field Notes" },
  { key: "nav.lookup", page: "Header", group: "Nav", label: "Nav — My Entries", def: "My Entries" },
  { key: "header.account", page: "Header", group: "Actions", label: "Account button (signed in)", def: "Account" },
  { key: "header.signin", page: "Header", group: "Actions", label: "Account button (signed out)", def: "Sign in" },
  { key: "header.buy", page: "Header", group: "Actions", label: "Buy-tickets button", def: "Buy tickets · $10" },

  /* ------------------------------ Countdown ----------------------------- */
  { key: "countdown.compactLabel", page: "Countdown", group: "Header pill", label: "Header countdown label", def: "Live Drawing in:" },
  { key: "countdown.days", page: "Countdown", group: "Unit labels", label: "Days", def: "days" },
  { key: "countdown.hours", page: "Countdown", group: "Unit labels", label: "Hours", def: "hours" },
  { key: "countdown.minutes", page: "Countdown", group: "Unit labels", label: "Minutes", def: "minutes" },
  { key: "countdown.seconds", page: "Countdown", group: "Unit labels", label: "Seconds", def: "seconds" },

  /* ------------------------------- Marquee ------------------------------ */
  { key: "marquee.selling", page: "Marquee", group: "Top strip", label: "“…now selling” (after cycle no.)", def: "now selling" },
  { key: "marquee.drawnLive", page: "Marquee", group: "Top strip", label: "“Drawn live” (before date)", def: "Drawn live" },
  { key: "marquee.stream", page: "Marquee", group: "Top strip", label: "Stream channels (after date)", def: "Facebook + YouTube" },
  { key: "marquee.charity", page: "Marquee", group: "Top strip", label: "“10% to” (before charity)", def: "10% to" },
  { key: "marquee.statsCars", page: "Marquee", group: "Top strip", label: "“cars given” label", def: "cars given" },
  { key: "marquee.statsDonated", page: "Marquee", group: "Top strip", label: "“donated” label", def: "donated" },

  /* ----------------------------- Charity band ---------------------------- */
  { key: "charity.band.intro", page: "Charity band", group: "Lead", label: "Intro ({cycle} = cycle no.)", def: "Cycle {cycle}’s 10% goes to" },
  { key: "charity.band.cta1", page: "Charity band", group: "CTAs", label: "Primary CTA", def: "How the funds flow" },
  { key: "charity.band.cta2", page: "Charity band", group: "CTAs", label: "Secondary CTA", def: "Why we picked them" },
  { key: "charity.band.badge1", page: "Charity band", group: "Badges", label: "Badge 1", def: "Registered 501(c)(3)" },
  { key: "charity.band.badge2", page: "Charity band", group: "Badges", label: "Badge 2", def: "10% to charity" },
  { key: "charity.band.stats.eyebrow", page: "Charity band", group: "Stats panel", label: "Panel eyebrow", def: "Lifetime · all cycles" },
  { key: "charity.band.stats.note", page: "Charity band", group: "Stats panel", label: "Panel note", def: "cumulative" },
  { key: "charity.band.stat.donated", page: "Charity band", group: "Stats panel", label: "Stat — donated", def: "Donated to partner charities" },
  { key: "charity.band.stat.charities", page: "Charity band", group: "Stats panel", label: "Stat — charities", def: "Partner charities" },
  { key: "charity.band.stat.cycles", page: "Charity band", group: "Stats panel", label: "Stat — cycles", def: "Cycles run" },
  { key: "charity.band.stat.cars", page: "Charity band", group: "Stats panel", label: "Stat — cars", def: "Cars given away" },
  { key: "charity.band.stat.entries", page: "Charity band", group: "Stats panel", label: "Stat — entries", def: "Entries verified" },

  /* ------------------------------ Live block ----------------------------- */
  { key: "live.block.badge1", page: "Live block", group: "Badges", label: "Badge 1", def: "Fully transparent" },
  { key: "live.block.badge2", page: "Live block", group: "Badges", label: "Badge 2", def: "Archived to YouTube" },
  { key: "live.block.step1.label", page: "Live block", group: "Steps", label: "Step 1 — label", def: "Drum loaded" },
  { key: "live.block.step1.body", page: "Live block", group: "Steps", label: "Step 1 — body", def: "Every printed entry is dropped into the drum on draw day." },
  { key: "live.block.step2.label", page: "Live block", group: "Steps", label: "Step 2 — label", def: "Simulcast" },
  { key: "live.block.step2.body", page: "Live block", group: "Steps", label: "Step 2 — body", def: "Facebook Live primary, YouTube mirror, captioned." },
  { key: "live.block.step3.label", page: "Live block", group: "Steps", label: "Step 3 — label", def: "Phone call on air" },
  { key: "live.block.step3.body", page: "Live block", group: "Steps", label: "Step 3 — body", def: "We dial the winner the moment the ticket is read." },

  /* -------------------------------- Pricing ------------------------------ */
  { key: "pricing.tab.once", page: "Pricing", group: "Toggle", label: "One-time tab", def: "One-time" },
  { key: "pricing.tab.monthly", page: "Pricing", group: "Toggle", label: "Monthly tab", def: "Monthly" },
  { key: "pricing.save", page: "Pricing", group: "Toggle", label: "Save badge", def: "save 67%" },
  { key: "pricing.buy", page: "Pricing", group: "Cards", label: "One-time buy button", def: "Buy now" },
  { key: "pricing.oneTime", page: "Pricing", group: "Cards", label: "Price suffix (one-time)", def: "one-time" },
  { key: "pricing.perMonth", page: "Pricing", group: "Cards", label: "Price suffix (monthly)", def: "/ month" },
  { key: "pricing.join", page: "Pricing", group: "Cards", label: "Join button (prefix before tier name)", def: "Join" },
  { key: "pricing.cancel", page: "Pricing", group: "Cards", label: "Cancel note", def: "Pause or cancel any time." },
  { key: "pricing.show", page: "Pricing", group: "Ladder toggle", label: "Show word", def: "Show" },
  { key: "pricing.hide", page: "Pricing", group: "Ladder toggle", label: "Hide word", def: "Hide" },
  { key: "pricing.ladder", page: "Pricing", group: "Ladder toggle", label: "Ladder label", def: "the full 6-tier ladder" },

  /* -------------------------------- Winners ------------------------------ */
  { key: "winners.fullArchive", page: "Winners", group: "Carousel", label: "Archive link", def: "Full archive" },
  { key: "winners.cardCycle", page: "Winners", group: "Carousel", label: "Card cycle prefix", def: "Cycle №" },
  { key: "winners.reveal", page: "Winners", group: "Carousel", label: "Reveal button", def: "Reveal" },
];

const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.def]));

/** All code defaults as a key→value map (used by the useCopy() string hook). */
export const CONTENT_DEFAULTS: Record<string, string> = DEFAULTS;

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
