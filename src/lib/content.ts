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
  { key: "winners.latestBadge", page: "Winners", group: "Latest card", label: "Latest-winner badge", def: "★ Latest winner" },
  { key: "winners.watchReveal", page: "Winners", group: "Latest card", label: "Watch-reveal button", def: "Watch the reveal" },
  { key: "winners.drawnPrefix", page: "Winners", group: "Latest card", label: "“drawn” prefix (before date)", def: "drawn" },
  { key: "winners.wonThe", page: "Winners", group: "Latest card", label: "“Won the” (before vehicle)", def: "Won the" },
  { key: "winners.card.charityLabel", page: "Winners", group: "Gallery card", label: "Charity allocation label", def: "Charity allocation:" },
  { key: "winners.gallery.eyebrow", page: "Winners", group: "Gallery header", label: "Eyebrow", def: "Winners — every cycle, named" },
  { key: "winners.gallery.h.l1", page: "Winners", group: "Gallery header", label: "Heading — line 1", def: "Real winners." },
  { key: "winners.gallery.h.accent", page: "Winners", group: "Gallery header", label: "Heading — italic accent", def: "Real cars." },
  { key: "winners.gallery.h.l2", page: "Winners", group: "Gallery header", label: "Heading — line 2", def: "Real charity checks." },
  { key: "winners.gallery.side", page: "Winners", group: "Gallery header", label: "Side paragraph", def: "Every winner is named, photographed, called on stream, and posted here forever." },
  { key: "winners.page.eyebrow", page: "Winners", group: "Archive page", label: "Eyebrow", def: "Winners archive · since 2024" },
  { key: "winners.page.h.lead", page: "Winners", group: "Archive page", label: "Heading — lead", def: "Eleven cycles." },
  { key: "winners.page.h.accent", page: "Winners", group: "Archive page", label: "Heading — italic accent", def: "Eleven drivers." },
  { key: "winners.page.intro", page: "Winners", group: "Archive page", label: "Intro", def: "Every winner is real, photographed, called on stream, and named here forever." },
  { key: "winners.page.badge1", page: "Winners", group: "Archive page", label: "Badge 1", def: "Verified · physical drum" },
  { key: "winners.page.badge2", page: "Winners", group: "Archive page", label: "Badge 2", def: "On camera · every cycle" },
  { key: "winners.kpi.cars", page: "Winners", group: "Archive KPIs", label: "KPI — cars", def: "Cars given away" },
  { key: "winners.kpi.charities", page: "Winners", group: "Archive KPIs", label: "KPI — charities", def: "Charities funded" },
  { key: "winners.kpi.payout", page: "Winners", group: "Archive KPIs", label: "KPI — payout", def: "Lifetime payout (USD)" },
  { key: "winners.kpi.donated", page: "Winners", group: "Archive KPIs", label: "KPI — donated", def: "Donated to charity (USD)" },
  { key: "winners.recent.label", page: "Winners", group: "Recent strip", label: "Strip label", def: "Recent winners" },
  { key: "winners.recent.i1", page: "Winners", group: "Recent strip", label: "Item 1", def: "Maria T · Miami · '69 Mustang Fastback" },
  { key: "winners.recent.i2", page: "Winners", group: "Recent strip", label: "Item 2", def: "James R · Houston · '23 Corvette Stingray" },
  { key: "winners.recent.i3", page: "Winners", group: "Recent strip", label: "Item 3", def: "Angela P · Tampa · Bronco Heritage" },
  { key: "winners.recent.i4", page: "Winners", group: "Recent strip", label: "Item 4", def: "Derek M · Atlanta · Challenger SRT" },
  { key: "winners.cta.eyebrow", page: "Winners", group: "Archive CTA", label: "CTA eyebrow", def: "Cycle 12 is open" },
  { key: "winners.cta.h.lead", page: "Winners", group: "Archive CTA", label: "CTA heading — lead", def: "Your name could be on this wall" },
  { key: "winners.cta.h.accent", page: "Winners", group: "Archive CTA", label: "CTA heading — italic accent", def: "next." },
  { key: "winners.cta.button", page: "Winners", group: "Archive CTA", label: "CTA button", def: "Buy tickets" },

  /* --------------------------------- Blog -------------------------------- */
  { key: "blog.eyebrow", page: "Blog", group: "Header", label: "Eyebrow", def: "Field notes · since 2024" },
  { key: "blog.h.lead", page: "Blog", group: "Header", label: "Heading — lead", def: "How the drum gets loaded." },
  { key: "blog.h.accent", page: "Blog", group: "Header", label: "Heading — italic accent", def: "In our own words." },
  { key: "blog.badge1", page: "Blog", group: "Header", label: "Badge 1", def: "Issue №12" },
  { key: "blog.badge2", page: "Blog", group: "Header", label: "Badge 2", def: "Updated weekly" },
  { key: "blog.sections.label", page: "Blog", group: "Sections strip", label: "Strip label", def: "Sections" },
  { key: "blog.sections.i1", page: "Blog", group: "Sections strip", label: "Section 1", def: "Behind the draw" },
  { key: "blog.sections.i2", page: "Blog", group: "Sections strip", label: "Section 2", def: "Partner spotlight" },
  { key: "blog.sections.i3", page: "Blog", group: "Sections strip", label: "Section 3", def: "Cycle update" },
  { key: "blog.sections.i4", page: "Blog", group: "Sections strip", label: "Section 4", def: "Winner stories" },
  { key: "blog.by", page: "Blog", group: "Cards", label: "Byline word", def: "by" },
  { key: "blog.readPost", page: "Blog", group: "Cards", label: "Read link", def: "Read the post" },

  /* ------------------------------- Partners ------------------------------ */
  { key: "partners.badge1", page: "Partners", group: "Header", label: "Badge 1", def: "Every cycle, named" },
  { key: "partners.countSuffix", page: "Partners", group: "Header", label: "Count badge suffix (after the number)", def: "partners" },
  { key: "partners.h.lead", page: "Partners", group: "Header", label: "Heading — lead", def: "The people" },
  { key: "partners.h.accent", page: "Partners", group: "Header", label: "Heading — italic accent", def: "behind it." },
  {
    key: "partners.intro", page: "Partners", group: "Header", label: "Intro paragraph", long: true,
    def: "Each giveaway runs with a named charity partner and the businesses that build, prep, and back the prize. This page is the receipts.",
  },
  { key: "partners.charitiesEyebrow", page: "Partners", group: "Sections", label: "Charity section eyebrow", def: "Charity partners · 10%, every cycle" },
  { key: "partners.sponsorsEyebrow", page: "Partners", group: "Sections", label: "Sponsor section eyebrow", def: "Brand partners · behind every giveaway build" },
  { key: "partners.cta.h.lead", page: "Partners", group: "Sponsor CTA", label: "CTA heading — lead", def: "Sponsor a" },
  { key: "partners.cta.h.accent", page: "Partners", group: "Sponsor CTA", label: "CTA heading — italic accent", def: "giveaway." },
  { key: "partners.cta.body", page: "Partners", group: "Sponsor CTA", label: "CTA body", def: "Put your brand behind a cycle — logo on the page, the tickets, and the live stream." },
  { key: "partners.cta.button", page: "Partners", group: "Sponsor CTA", label: "CTA button", def: "Talk to us" },

  /* -------------------------------- Contact ------------------------------ */
  { key: "contact.badge", page: "Contact", group: "Header", label: "Badge", def: "We answer fast" },
  { key: "contact.h.lead", page: "Contact", group: "Header", label: "Heading — lead", def: "Say" },
  { key: "contact.h.accent", page: "Contact", group: "Header", label: "Heading — italic accent", def: "hello." },
  { key: "contact.intro", page: "Contact", group: "Header", label: "Intro paragraph", long: true, def: "Questions about a draw, your entries, sponsoring a giveaway, or press — one form, typical response under 12 hours." },
  { key: "contact.label.name", page: "Contact", group: "Form", label: "Name label", def: "Name" },
  { key: "contact.label.email", page: "Contact", group: "Form", label: "Email label", def: "Email" },
  { key: "contact.label.message", page: "Contact", group: "Form", label: "Message label", def: "Message" },
  { key: "contact.ph.name", page: "Contact", group: "Form", label: "Name placeholder", def: "Your name" },
  { key: "contact.ph.email", page: "Contact", group: "Form", label: "Email placeholder", def: "you@example.com" },
  { key: "contact.ph.message", page: "Contact", group: "Form", label: "Message placeholder", def: "How can we help?" },
  { key: "contact.send", page: "Contact", group: "Form", label: "Submit button", def: "Send it" },
  { key: "contact.direct", page: "Contact", group: "Form", label: "Direct-email line", def: "Or write directly: support@generousmotors.org" },
  { key: "contact.success.title", page: "Contact", group: "Success", label: "Success title", def: "Message sent." },
  { key: "contact.success.body", page: "Contact", group: "Success", label: "Success body ({email} = entered email)", long: true, def: "A confirmation is on its way to {email} — we'll reply within 12 hours." },

  /* --------------------------------- Live -------------------------------- */
  { key: "live.status", page: "Live", group: "Hero", label: "Status pill", def: "Pre-stream" },
  { key: "live.h.lead", page: "Live", group: "Hero", label: "Heading — lead", def: "Draw starts" },
  { key: "live.h.accent", page: "Live", group: "Hero", label: "Heading — italic accent", def: "in…" },
  { key: "live.body.pre", page: "Live", group: "Hero", label: "Body — before the date", def: "We'll go live at" },
  { key: "live.body.post", page: "Live", group: "Hero", label: "Body — after the date", long: true, def: "on Facebook (primary) with a YouTube mirror. Tickets close 30 minutes before the stream begins. The drum is loaded on camera." },
  { key: "live.fb", page: "Live", group: "Hero", label: "Facebook button", def: "Facebook Live" },
  { key: "live.yt", page: "Live", group: "Hero", label: "YouTube button", def: "YouTube mirror" },
  { key: "live.counter.eyebrow", page: "Live", group: "Counter", label: "Counter eyebrow", def: "Live counter" },
  { key: "live.counter.paid", page: "Live", group: "Counter", label: "Paid-entries label", def: "paid entries" },
  { key: "live.counter.bonus", page: "Live", group: "Counter", label: "Bonus-entries label", def: "bonus entries" },
  { key: "live.charity.label", page: "Live", group: "Counter", label: "Charity label", def: "This cycle's charity" },
  { key: "live.charity.note", page: "Live", group: "Counter", label: "Charity note", def: "10%. Wired within 7 business days of close." },
  { key: "live.reminder.title", page: "Live", group: "Reminder", label: "Reminder title", def: "Set a reminder" },
  { key: "live.reminder.body", page: "Live", group: "Reminder", label: "Reminder body", def: "We'll send a 30-minute heads-up to your email." },
  { key: "live.reminder.link", page: "Live", group: "Reminder", label: "Reminder link", def: "use my entries to subscribe" },

  /* --------------------------- Rules (page chrome) ----------------------- */
  { key: "rules.cyclePrefix", page: "Rules", group: "Header", label: "Cycle label prefix", def: "Cycle №" },
  { key: "rules.statLabel", page: "Rules", group: "Header", label: "Statute label", def: "Fla. Stat. § 849.0935" },
  { key: "rules.h.lead", page: "Rules", group: "Header", label: "Heading — lead", def: "Official" },
  { key: "rules.h.accent", page: "Rules", group: "Header", label: "Heading — italic accent", def: "Rules." },
  { key: "rules.intro", page: "Rules", group: "Header", label: "Intro ({cycle} = cycle no.)", long: true, def: "These rules govern the conduct and operation of the Generous Motors drawing by chance for cycle {cycle}. They are disclosed in accordance with Florida Statute § 849.0935 (charitable, nonprofit organizations; drawings by chance)." },
  { key: "rules.noPurchase", page: "Rules", group: "Header", label: "No-purchase notice", long: true, def: "No purchase or contribution is necessary to enter or to win. A purchase or contribution will not improve your chances of winning." },
  { key: "rules.questions", page: "Rules", group: "Footer", label: "Questions line (ends before the FAQ link)", long: true, def: "Questions about these rules? Write to support@generousmotors.org. For eligibility and entry questions, see the" },
  { key: "rules.faqLink", page: "Rules", group: "Footer", label: "FAQ link label", def: "FAQ" },
  { key: "rules.back", page: "Rules", group: "Footer", label: "Back button", def: "Back to tickets" },

  /* --------------------------- Legal (page chrome) ----------------------- */
  { key: "legal.badge", page: "Legal", group: "Page", label: "Badge", def: "Legal · demo placeholder" },
  { key: "legal.note", page: "Legal", group: "Page", label: "Production note", long: true, def: "Full counsel-reviewed language ships with production; this page reserves the route and structure." },
  { key: "legal.back", page: "Legal", group: "Page", label: "Back button", def: "Read the Official Rules" },

  /* ------------------------------- About --------------------------------- */
  { key: "about.eyebrow", page: "About", group: "Hero", label: "Eyebrow", def: "About · Generosity in Motion" },
  { key: "about.h.lead", page: "About", group: "Hero", label: "Heading — lead", def: "We give cars away" },
  { key: "about.h.accent", page: "About", group: "Hero", label: "Heading — italic accent", def: "on camera." },
  { key: "about.p1", page: "About", group: "Hero", label: "Paragraph 1", long: true, def: "Generous Motors was founded on a simple belief: good things happen when good people come together. We make giving exciting, transparent, and rewarding." },
  { key: "about.p2", page: "About", group: "Hero", label: "Paragraph 2", long: true, def: "Each 60-day cycle partners with a new nonprofit. Ten percent of every cycle goes directly to that cycle's nonprofit partner." },
  { key: "about.badge1", page: "About", group: "Hero", label: "Badge 1", def: "Registered 501(c)(3)" },
  { key: "about.badge2", page: "About", group: "Hero", label: "Badge 2", def: "Drawn live, every cycle" },
  { key: "about.badge3", page: "About", group: "Hero", label: "Badge 3", def: "10% to charity" },
  { key: "about.process.label", page: "About", group: "Process strip", label: "Strip label", def: "The whole process" },
  { key: "about.process.i1", page: "About", group: "Process strip", label: "Item 1", def: "Printed in a drum" },
  { key: "about.process.i2", page: "About", group: "Process strip", label: "Item 2", def: "On camera" },
  { key: "about.process.i3", page: "About", group: "Process strip", label: "Item 3", def: "Fully transparent" },
  { key: "about.process.i4", page: "About", group: "Process strip", label: "Item 4", def: "Streamed, archived" },
  { key: "about.process.i5", page: "About", group: "Process strip", label: "Item 5", def: "10% paid first" },
  { key: "about.draw.eyebrow", page: "About", group: "Draw section", label: "Eyebrow", def: "How the draw works" },
  { key: "about.draw.h.l1", page: "About", group: "Draw section", label: "Heading — line 1", def: "Software-fair." },
  { key: "about.draw.h.accent", page: "About", group: "Draw section", label: "Heading — italic accent", def: "Live-streamed." },
  { key: "about.draw.h.l2", page: "About", group: "Draw section", label: "Heading — line 2", def: "Fully transparent." },
  { key: "about.draw.side", page: "About", group: "Draw section", label: "Side paragraph", def: "Every drawing is conducted live via livestream — transparent, real-time, and verifiable." },
  { key: "about.flow.eyebrow", page: "About", group: "Charity flow", label: "Eyebrow", def: "Charity flow" },
  { key: "about.flow.h.lead", page: "About", group: "Charity flow", label: "Heading — lead", def: "Ten percent." },
  { key: "about.flow.h.accent", page: "About", group: "Charity flow", label: "Heading — italic accent", def: "Paid first." },
  { key: "about.flow.body", page: "About", group: "Charity flow", label: "Body", long: true, def: "We pay the charity first — before the car is bought, before payroll, before any expense. It is a number we can defend." },
  { key: "about.flow.cta", page: "About", group: "Charity flow", label: "CTA button", def: "How cycle 12's charity was picked" },
  { key: "about.flow.s1.head", page: "About", group: "Charity flow steps", label: "Step 1 — head", def: "Cycle ends" },
  { key: "about.flow.s1.body", page: "About", group: "Charity flow steps", label: "Step 1 — body", def: "Ticket sales close. Gross is locked. Numbers are published." },
  { key: "about.flow.s2.head", page: "About", group: "Charity flow steps", label: "Step 2 — head", def: "10% goes to the partner" },
  { key: "about.flow.s2.body", page: "About", group: "Charity flow steps", label: "Step 2 — body", def: "The partner charity receives the donation directly." },
  { key: "about.flow.s3.head", page: "About", group: "Charity flow steps", label: "Step 3 — head", def: "Receipt produced" },
  { key: "about.flow.s3.body", page: "About", group: "Charity flow steps", label: "Step 3 — body", def: "Each cycle produces a receipt for the charity's records." },
  { key: "about.flow.s4.head", page: "About", group: "Charity flow steps", label: "Step 4 — head", def: "Next cycle" },
  { key: "about.flow.s4.body", page: "About", group: "Charity flow steps", label: "Step 4 — body", def: "A new cycle starts immediately with a new vehicle and a new nonprofit partner." },
  { key: "about.stat.payout", page: "About", group: "Guarantees", label: "Stat — payout", def: "Lifetime payout (USD)" },
  { key: "about.stat.donated", page: "About", group: "Guarantees", label: "Stat — donated", def: "Donated to charity (USD)" },
  { key: "about.stat.cars", page: "About", group: "Guarantees", label: "Stat — cars", def: "Cars given away" },
  { key: "about.guarantee.title", page: "About", group: "Guarantees", label: "Guarantee title", def: "Transparent by design." },
  { key: "about.guarantee.body", page: "About", group: "Guarantees", label: "Guarantee body", long: true, def: "Every drawing is livestreamed in front of thousands. Every cycle has a receipt for the partner charity." },
  { key: "about.guarantee.cta", page: "About", group: "Guarantees", label: "Guarantee CTA", def: "Read the receipts" },

  /* ----------------------------- Membership ------------------------------ */
  { key: "mem.eyebrow", page: "Membership", group: "Hero", label: "Eyebrow", def: "Membership · the Club" },
  { key: "mem.h.lead", page: "Membership", group: "Hero", label: "Heading — lead", def: "Never miss a draw." },
  { key: "mem.h.accent", page: "Membership", group: "Hero", label: "Heading — italic accent", def: "Save 67%." },
  { key: "mem.intro", page: "Membership", group: "Hero", label: "Intro paragraph", long: true, def: "Members auto-enter every cycle. They also get early access to bonus ticket offers, flash-sale alerts, and drawing reminders straight to their inbox." },
  { key: "mem.badge1", page: "Membership", group: "Hero", label: "Badge 1", def: "1-click cancel" },
  { key: "mem.badge2", page: "Membership", group: "Hero", label: "Badge 2", def: "Early access · bonus offers" },
  { key: "mem.math.label", page: "Membership", group: "Math strip", label: "Strip label", def: "The math" },
  { key: "mem.math.i1", page: "Membership", group: "Math strip", label: "Item 1", def: "Premium saves 67% vs one-off" },
  { key: "mem.math.i2", page: "Membership", group: "Math strip", label: "Item 2", def: "Loyalty grows +1% per month" },
  { key: "mem.math.i3", page: "Membership", group: "Math strip", label: "Item 3", def: "Capped at 1.5×" },
  { key: "mem.math.i4", page: "Membership", group: "Math strip", label: "Item 4", def: "Drawing alerts to your inbox" },
  { key: "mem.tierPrefix", page: "Membership", group: "Tier cards", label: "Tier label prefix", def: "Tier №" },
  { key: "mem.bestValue", page: "Membership", group: "Tier cards", label: "Best-value badge", def: "Best value" },
  { key: "mem.perMonth", page: "Membership", group: "Tier cards", label: "Price suffix", def: "/ month" },
  { key: "mem.entriesMeta", page: "Membership", group: "Tier cards", label: "Entries meta (after the number + start ×)", def: "entries · every draw · start" },
  { key: "mem.join", page: "Membership", group: "Tier cards", label: "Join button (prefix before tier name)", def: "Join" },
  { key: "mem.cancel", page: "Membership", group: "Tier cards", label: "Cancel note", def: "Pause or cancel any time." },
  { key: "mem.loyalty.eyebrow", page: "Membership", group: "Loyalty", label: "Eyebrow", def: "Loyalty stacks" },
  { key: "mem.loyalty.h.lead", page: "Membership", group: "Loyalty", label: "Heading — lead", def: "Stay longer." },
  { key: "mem.loyalty.h.accent", page: "Membership", group: "Loyalty", label: "Heading — italic accent", def: "Get more entries." },
  { key: "mem.loyalty.body", page: "Membership", group: "Loyalty", label: "Body", long: true, def: "Every month you remain a Premium or VIP member, your loyalty multiplier grows by 1% — up to a 1.5× cap. Premium starts at 60 monthly entries and reaches 90 by month 30." },
  { key: "mem.loyalty.monthPrefix", page: "Membership", group: "Loyalty", label: "Ladder month prefix", def: "Month" },
  { key: "mem.loyalty.entriesSuffix", page: "Membership", group: "Loyalty", label: "Ladder entries suffix", def: "entries / cycle" },
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
