# Architecture review — things to reconsider before building

A scrutiny pass over `implementation-guide.md`, `data-model.md`, `tracks.md`, and the sprint
plan. Ordered by how much they'd hurt if we got them wrong. Each has a **recommendation** and,
where it's genuinely Kevin's call, a **DECISION NEEDED** tag.

---

## A. Ticketing & numbers

**A1. "No missing" ≠ gapless — and that changes the design.** Kevin's "no duplicate / no
missing ticket numbers" means *every paid entry gets a ticket* (completeness) and *no two
tickets share a number* (uniqueness). It does **not** require contiguous integers — a physical
drum draws paper, so gaps are irrelevant. The order-based format lets us delete the global
gapless counter (`cycle_counters`) and its per-ticket row lock. **Recommendation:** adopt the
order-based number (done in `data-model.md`); this is simpler *and* removes the only
concurrency bottleneck. ✅ already applied.

**A2. Order token — RESOLVED: per-cycle order counter.** Kevin's requirement is simply that no
two orders in a cycle share the middle part. A derived/hashed value can't guarantee that in 4
digits, so the middle part is a **per-cycle order counter** (`0001`, `0002`, …) — guaranteed
unique, starts at `0001`. Format is now `GM-0001-0001` (data-model §0). We still store the
Shopify order id 1:1 for traceability.

**A3. Caps — RESOLVED: graceful overflow + alert.** The middle part caps at 9,999 *orders* per
cycle (not tickets — tickets/cycle is unbounded). Proven against the live DB
(`scripts/overflow-check.mjs`): past 9,999 the token is **not truncated** — order #10,000 →
`GM12-10000-0001` (15 chars), still unique, duplicates still DB-rejected. So it degrades
gracefully. **Kevin chose:** keep 4 digits (normal cycles stay 14 chars) and **alert when a
cycle nears ~9,000 orders** (data-model §7). No code change; no failure mode.

**A4. Line item quantity.** A Shopify line can have `quantity > 1` (buyer picks 3× the 10-pack).
Entries must be `bundle_size(variant) × line.quantity × multiplier`. The mint pseudocode now
includes `line.quantity` — make sure `bundle_size()` reads the variant, not the line, so this
multiplies correctly.

**A5. Partial refunds — RESOLVED: none.** Kevin's policy forbids partial refunds, so a
refund/cancel always voids the **whole order** (`voided = true` on every block for that
`shopify_order_id`). No block-splitting or remainder re-mint. (data-model §3.5.)

**A6. Ticket guessability.** Short, semi-derived numbers are guessable. That's fine *because
tickets aren't bearer instruments* — winning is tied to the account/contact, not to presenting
a number. **Requirement:** ticket lookup/validation must require ownership (logged-in) or a
contact match, **never a bare number**. Captured in `data-model.md` §7; make sure `/lookup`
enforces it.

**A7. Draw fairness & record-keeping.** For a charity raffle drawn on camera, the selection
method should be documented and auditable (physical drum procedure, or a seeded RNG with the
seed recorded). This is also a records-retention point Kevin raised ("historical record
keeping"). **Recommendation:** write down the draw procedure + retention policy; keep
`entry_blocks`/`orders` indefinitely (already specified). Not a code blocker, but a
process/compliance item — flag to Kevin, don't over-engineer.

---

## B. Content in Shopify Metaobjects

**B1. Copy grouping — RESOLVED with evidence: typed fields per page, NOT a JSON blob.** Kevin
asked (rightly) whether a JSON field is editable by a non-technical admin. Evidence: metaobjects
are editable by non-technical merchants through a **clean native admin UI** — *but only when
you use typed fields* (labeled text boxes). Shopify's **`json` field type renders as a raw code
editor**, which is exactly what a non-technical person should never touch. So:
- **Copy = one `copy_block` metaobject definition per page** (`homepage`, `tickets`, `popup`,
  `footer`, …), each with individual **single-/multi-line text fields**, one per editable
  string, each with a human label. Friendly to edit, no JSON.
- Cap check: **max 40 fields per definition** — our biggest page (homepage ≈ 24 keys) is well
  under it, so per-page grouping fits comfortably.
- This keeps everything in Shopify (no custom CMS) *and* stays non-technical-friendly.
- Sources: [mgroupweb metaobjects guide](https://mgroupweb.com/blogs/shopify-metaobjects-guide/),
  [Shopify metaobject limits](https://shopify.dev/docs/apps/build/metaobjects/metaobject-limits),
  [new admin metaobjects experience](https://changelog.shopify.com/posts/new-metaobjects-experience-in-admin).

**B1b. Media (images / video / PDF) — first-class, and it stays in Shopify.** Kevin flagged
that images, videos, and PDF docs are content too. Handled natively: metaobjects have a
**`file` field type** that references **Shopify Files** and accepts **images, videos, and
generic files including PDFs**. Non-technical admins upload/pick files right in the metaobject
editor; **Shopify's CDN serves them** (offloads our app, supports image transforms). In the
Storefront API a file field resolves to a `MediaImage`/`Video`/`GenericFile` — read the URL via
`.value.url` (a known gotcha: `.value` alone returns the reference object, not the URL). Video
can be a Shopify-hosted file **or** an embedded YouTube URL (the site already has a
`youtube-facade`); PDFs (official rules, proposal) are a `file` field the CDN serves for
download.
- Sources: [file metafields on metaobjects](https://marinapereda.dev/shopify-metaobject-file-metafields-fix/),
  [uploading & managing files](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads),
  [Storefront MetafieldReference](https://shopify.dev/docs/api/storefront/latest/unions/metafieldreference).

**B2. Read path & caching — RESOLVED with evidence: ISR, no slowdown.** Every public page
depends on Storefront metaobject reads. Evidence: each Storefront GraphQL call is a network
request, so the guidance is **cache with ISR/edge, keep reference nesting ≤ 2 levels,
paginate** — do that and headless is *faster*, not slower. **Recommendation:** one cached fetch
per page, revalidated on the `metaobjects/update` webhook; never fetch per-request or
per-component. Media bytes never touch our app — Shopify CDN serves them. Sources:
[wholesalehelper headless+metaobjects](https://wholesalehelper.io/blog/shopify-headless-and-metaobjects/),
[weaverse headless performance](https://weaverse.io/blogs/the-performance-roi-of-shopify-headless-why-faster-loading-times-matter-more-in-2026).
**Net answer to Kevin's point 4: keep content in Shopify — it will NOT slow the site if we
cache with ISR, and the JSON-blob idea is discarded in favor of typed fields.**

**B3. Metaobject limits — checked.** Plan allows **128 definitions** (Basic/Shopify/Advanced),
**40 fields per definition**, ~**1M entries per definition**. Our needs (≈5 copy defs + article/
winner/partner/cycle) are nowhere near any cap. ✅

---

## C. Attribution & tracking

**C1. ITP truncates first-touch.** Safari caps script-set first-party cookies at ~7 days, so a
long consideration window loses first-touch. **Recommendation:** set the `visitor_id`/campaign
cookie **server-side (HttpOnly)** where possible to get a longer TTL; accept that first-touch
is best-effort and last-touch is the reliable one. Document the limitation rather than pretend
it's perfect.

**C2. `note_attributes` size + the set-at-cart-creation gotcha.** Both already flagged in
`data-model.md` §6.2 — just don't lose them in implementation; they're the usual silent
attribution killer.

**C3. Subscriber source-of-truth (double write).** A subscriber is written to Supabase **and**
Klaviyo/Postscript. If the provider call fails after the DB insert, status must stay `pending`
and retry — never report "subscribed" on a half-write. **Recommendation:** provider is
source-of-truth for consent/deliverability; Supabase mirror is for app queries; reconcile via
provider webhooks (already in the plan). Make the capture endpoint transactional-ish: insert
`pending` → call provider → update status, with a retry for the gap.

---

## D. Consistency / plan

**D1. Doc drift (fixed).** `implementation-guide.md` §2–§4 still showed the `tickets` +
`cycle_counters` gapless design and a hand-rolled OTP. Reconciled: those sections now point to
`data-model.md` as authoritative and to Supabase Auth. Keep `data-model.md` as the single
source for schema going forward.

**D2. Sprint-1 generate endpoint without Shopify.** The order token derives from a Shopify
order number, which doesn't exist until Sprint 2. **Recommendation:** Sprint-1 tests feed a
**synthetic `order_number`** to the endpoint; Sprint 2 supplies the real one from the webhook.
The idempotency/concurrency test (§sprint-01 C.2) still stands and is the important gate.

**D3. `is_member` staleness.** It's a denormalized flag kept in sync by subscription webhooks.
Edge case: a member's card fails right as they buy. **Recommendation:** the mint webhook reads
`is_member` at mint time (not checkout time), and dunning keeps `is_member` true through a
grace window — so a mid-lapse purchase still honors the member tier. Good enough; documented in
§4. No stronger consistency needed.

**D4. Provider/legal items intentionally deferred.** TCPA consent proof (`sms_subscribers.
consent_at`) and no-purchase-necessary AMOE are in the model but not yet a track. Flag to Kevin
as compliance follow-ups; don't expand the build scope unprompted.

---

## Open decisions still to get from Kevin
Most are now resolved (A2 per-cycle counter, A3 graceful overflow + alert, A5 no partial
refunds, B1 typed fields, B1b media via Shopify Files, B2 ISR). Remaining:
1. **A7** — draw procedure + record-retention policy (process, not code).
2. Build the **order-number ceiling alert** (~9,000 orders/cycle) as part of monitoring.
