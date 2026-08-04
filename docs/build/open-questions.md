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

**A2. Order token: derive vs. counter.** Default = `base36(shopify_order_number mod 36^4)` —
derived, compact, collision-free within any realistic cycle (§0.2). Alternative = a per-cycle
order ordinal (tidy 1,2,3… but reintroduces a small per-order counter). **DECISION NEEDED:**
derived (recommended, no counter) vs. ordinal (prettier numbers). I went with derived.

**A3. Sequence width / max entries per order.** Format holds ≤ 12 chars up to 9,999 entries in
one order (`GM-1A2B-9999`). A member buying the largest bundle × 4× must stay under that.
**Recommendation:** enforce a per-order entry cap (e.g. 5,000) at checkout, or widen the format
if a legitimate use case exceeds it. **DECISION NEEDED:** what's the largest single order we
allow?

**A4. Line item quantity.** A Shopify line can have `quantity > 1` (buyer picks 3× the 10-pack).
Entries must be `bundle_size(variant) × line.quantity × multiplier`. The mint pseudocode now
includes `line.quantity` — make sure `bundle_size()` reads the variant, not the line, so this
multiplies correctly.

**A5. Partial refunds.** Shopify refunds can be partial (some lines, or partial quantity of a
line). We void at **line** granularity cleanly; partial-*quantity* refunds are messier.
**Recommendation:** support full-line voids automatically; treat partial-quantity refunds as a
flagged admin action rather than auto-logic. **DECISION NEEDED:** is partial-quantity refund a
real scenario for Kevin, or can we forbid it in the refund policy?

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

**B1. Copy-blocks granularity.** ~40 keyed micro-copy strings (`CONTENT_FIELDS`) as one
metaobject **entry per key** is clunky to edit in Shopify admin and multiplies API reads.
**Recommendation:** model copy as **one `copy_block` metaobject per page** with a JSON/field
map (or a single "site copy" entry), not one entry per string. Editorial (`article`, `winner`,
`partner`, `cycle`) stays one entry each — that's what metaobjects are good at. **DECISION
NEEDED:** confirm the copy grouping so we set up definitions once.

**B2. Read path & caching.** Every public page now depends on Storefront API metaobject reads.
**Recommendation:** ISR + a single cached fetch per page, revalidated on the
`metaobjects/update` webhook — don't fetch metaobjects per-request or per-component.

**B3. Metaobject limits.** Confirm the store's plan supports the number of metaobject
definitions/entries we need (winners + partners + articles grow over time). Low risk, worth a
one-line check before committing.

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

## Open decisions to get from Kevin
1. **A2** order token: derived (recommended) vs per-cycle ordinal?
2. **A3** max entries allowed in a single order?
3. **A5** are partial-quantity refunds a real scenario, or forbid in policy?
4. **B1** copy grouping in metaobjects: per-page JSON (recommended) vs per-string entries?
5. **A7** draw procedure + record retention policy (process, not code).
