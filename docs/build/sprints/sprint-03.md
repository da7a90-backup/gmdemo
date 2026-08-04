# Sprint 3 — Promotions, Attribution, Analytics & Hardening

**Goal:** the growth layer — server-resolved promo multipliers, a first-party attribution
table, and GA4 + Meta CAPI — plus production hardening.

Track: **E** (promotions + attribution + analytics are interlinked → one track), then hardening.

## Track E — Promotions, Attribution & Analytics
- **E.1** `promotions` table + server `resolvePromo` (priority: member → `?promo=CODE` →
  `utm_*` → organic). Multiplier consumed by the **generate endpoint** at mint time — never
  trusted from the client. Wire `/admin/promotions` desk to it.
- **E.2** First-party attribution: persist `utm_*`/`gclid`/`fbclid` to a first-party cookie on
  first touch (Simo Ahava pattern); write to Shopify **cart attributes** → order
  `note_attributes`; the `orders/paid` webhook reads them into `attribution_events` with a real user id.
- **E.3** GA4 (cross-domain `_gl` linker, Shopify Web Pixel `checkout_completed`) + Meta Pixel.
- **E.4** **Server-side Meta CAPI** from the webhook: hashed `em`/`ph`, shared `event_id` for
  browser↔server **dedup** (48h window). `/admin/attribution` desk reads the real table.
- Acceptance: a UTM-tagged visit that buys shows correct source + multiplier end-to-end;
  Meta Events Manager shows deduplicated purchase events.

## Hardening & handoff
- All admin desks run against live data; remove remaining `mock-data` seams.
- Observability: log every webhook (`processed_webhooks` = audit trail); alert on cron replay > 0
  and on generate-endpoint conflict spikes.
- Preview isolation: Supabase branch DB per Vercel preview so webhook tests never touch prod tickets.
- Load-check the single-counter-row throughput for peak draw-night volume; shard only if measured.
- Final content pass, legal/rules review, 48h production watch (matches the proposal timeline).

## Dependencies
E consumes Sprint-1 generate (multiplier at mint) and Sprint-2 Shopify webhook + cart
attributes. This is the last track because it decorates the money path rather than gating it.
