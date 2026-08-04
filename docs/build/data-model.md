# Generous Motors — Data Model & Architecture (deep dive)

> The exhaustive companion to `implementation-guide.md` and `tracks.md`. This is the
> **system of record design**: every table, every number, every state transition for
> tickets, entry numbers, subscriptions, the dynamic promotions engine (and how it reaches
> the end-user's screen), and the UTM / GA4 / Meta tracking pipeline. Grounded in current
> best practice (sources at the end). Principle throughout: **simple but robust, and correct
> under concurrency** — a raffle draw has to be defensible on camera, so "no duplicate / no
> missing number" is a hard correctness property, not a nice-to-have.

**Storage split (decided):**
- **Supabase Postgres** = raffle system of record (this document).
- **Shopify** = checkout, payments, subscriptions **and** content (Metaobjects).
- Providers = Postscript (SMS), Klaviyo (email marketing), SendGrid (transactional), GA4 + Meta.

---

## 0. The one idea that makes ticketing correct

A raffle needs **two different numbers**, and conflating them is the classic mistake:

| Number | Purpose | Gapless? | Concurrency cost |
|---|---|---|---|
| **internal id** (`bigint identity`) | primary key, joins | no — gaps fine | free (Postgres sequence) |
| **entry number** (`entry_no`, per cycle) | the number that physically goes in the drum; the draw selects one of these | **yes, gapless 1..N within a cycle** | needs a serialized counter |
| **public code** (`GM-012-4F2K-0007`) | what a buyer reads back on the phone / prints | derived | free |

**Why entry_no must be gapless:** Postgres `SEQUENCE`s are explicitly *not* gapless — a
failed/rolled-back insert "burns" a number and leaves a hole, because sequences never roll
back ([Cybertec](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/)).
For a drum draw that must be auditable ("we drew entry 4,512 of 8,900"), the entry space has
to be contiguous. The only way to get gapless is a **single serialized counter, locked until
commit** ([sql-workbench](https://blog.sql-workbench.eu/post/gapless-sequence/),
[Cybertec](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/)).

**The scale trick:** the naive version locks the counter once *per ticket* and throttles hard.
Instead we **allocate a contiguous block per order line in one UPDATE** — lock held for a
single round-trip regardless of whether the buyer bought 1 entry or 400. One hot row per
*open cycle*; a weekly raffle has exactly one open cycle, and block-allocation keeps the lock
window to microseconds. This is the row-level-lock counter pattern
([kimmobrunfeldt/howto-everything](https://github.com/kimmobrunfeldt/howto-everything/blob/master/postgres-gapless-counter-for-invoice-purposes.md),
[AppMaster](https://appmaster.io/blog/concurrency-safe-invoice-numbering)), optimized by
batching the allocation.

**We never store one row per entry.** A purchase of 10 tickets at a 3× promo = 30 entries is
**one `entry_block` row** holding the range `[start, start+29]`. The drum PDF expands ranges
into printed tickets; the draw picks a random `entry_no` in `[1, last_entry_no]` and finds
the block whose range contains it. This is the difference between a table with thousands of
rows and one with millions.

---

## 1. Entity map

```
users ──< orders ──< entry_blocks >── cycles
  │           │                          │
  │           │                     cycle_counters (1:1, the hot row)
  │           └── attribution snapshot (denormalized on order)
  │
  ├──< subscriptions (Shopify contract mirror)
  ├──< email_subscribers / sms_subscribers   (contact may precede a user)
  └──< attribution_touches (multi-touch history, pre-identity via visitor_id)

promotions (rules engine, config-as-data) ──> resolved & SNAPSHOTTED onto orders/entry_blocks
processed_webhooks (idempotency ledger)        analytics_events (GA4/Meta outbox + dedup)
```

Content entities (`copy_block`, `article`, `winner`, `partner`, `cycle`-content) live in
**Shopify Metaobjects**, not here; the Supabase `cycles` row links to its content via
`shopify_cycle_gid`.

---

## 2. DDL — full schema

```sql
-- ─────────────────────────────── identity ───────────────────────────────
create table users (
  id                    bigint generated always as identity primary key,
  email                 citext unique,
  phone                 text unique,               -- E.164
  shopify_customer_gid  text unique,
  is_member             boolean not null default false,   -- derived from subscriptions
  created_at            timestamptz not null default now()
);

-- ─────────────────────────────── cycles ─────────────────────────────────
create table cycles (
  id                 bigint generated always as identity primary key,
  code               text unique not null,          -- '012' (also the entry_no namespace)
  shopify_cycle_gid  text unique,                    -- content metaobject
  status             text not null default 'draft'
                       check (status in ('draft','open','closed','drawn','archived')),
  opens_at           timestamptz,
  closes_at          timestamptz,                    -- ticket sales cutoff (30m before stream)
  draw_at            timestamptz,
  winner_entry_no    integer,                        -- set at draw time
  winner_order_id    bigint,
  created_at         timestamptz not null default now()
);

-- The serialized counter. Exactly one row per cycle. This is the ONLY hot row.
create table cycle_counters (
  cycle_id     bigint primary key references cycles(id),
  last_entry_no integer not null default 0
);

-- ─────────────────────────────── orders ─────────────────────────────────
-- Mirror of the Shopify order that mattered for the raffle. Money truth stays
-- in Shopify; this is what we need to mint + audit + attribute.
create table orders (
  id                 bigint generated always as identity primary key,
  shopify_order_id   bigint unique not null,         -- idempotency anchor
  user_id            bigint not null references users(id),
  cycle_id           bigint not null references cycles(id),
  subtotal_cents     integer not null,
  currency           text not null default 'USD',
  -- PROMO SNAPSHOT (immutable — do not read live promo config for a past order)
  promo_id           text,                           -- promotions.code or tier id at purchase
  promo_tier         text,                           -- organic|ads|email|sms|member
  promo_multiplier   integer not null default 1,
  -- ATTRIBUTION SNAPSHOT (first + last touch that produced this order)
  attr_first_source  text, attr_first_medium text, attr_first_campaign text,
  attr_last_source   text, attr_last_medium  text, attr_last_campaign  text,
  attr_fbp text, attr_fbc text, attr_gclid text, attr_visitor_id text,
  created_at         timestamptz not null default now()
);

-- ────────────────────────── entry blocks (tickets) ──────────────────────
-- One row per order line. Holds a CONTIGUOUS gapless range of entry numbers.
create table entry_blocks (
  id                 bigint generated always as identity primary key,
  cycle_id           bigint not null references cycles(id),
  order_id           bigint not null references orders(id),
  shopify_line_id    bigint not null,
  user_id            bigint not null references users(id),
  purchased_tickets  integer not null,               -- bundle size the buyer paid for
  multiplier         integer not null default 1,      -- promo multiplier at purchase
  entry_start        integer not null,                -- gapless, inclusive
  entry_end          integer not null,                -- entry_start + purchased*multiplier - 1
  public_code        text not null,                   -- GM-{cycle}-{userhash}-{start}
  voided             boolean not null default false,   -- refund/cancel → excluded from draw
  voided_at          timestamptz,
  created_at         timestamptz not null default now(),
  unique (shopify_line_id),                            -- idempotency: a line mints once
  unique (cycle_id, entry_start)                       -- physical no-overlap guarantee
);
create index on entry_blocks (cycle_id) where not voided;
create index on entry_blocks (user_id);

-- ───────────────────────── idempotency ledger ───────────────────────────
create table processed_webhooks (
  webhook_id   text primary key,                       -- X-Shopify-Webhook-Id
  topic        text not null,
  processed_at timestamptz not null default now()
);

-- ─────────────────────────── subscriptions ──────────────────────────────
create table subscriptions (
  id                     bigint generated always as identity primary key,
  user_id                bigint not null references users(id),
  shopify_contract_gid   text unique not null,
  status                 text not null                    -- Shopify contract status
                           check (status in ('active','paused','cancelled','failed','expired')),
  tier                   text not null default 'member',
  entries_per_cycle      integer not null default 0,       -- base allotment before multiplier
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─────────────────────── promotions (rules engine) ──────────────────────
-- Config-as-data: rows, not code. Admin edits; no deploy. Mirrors PromoTier.
create table promotions (
  id            bigint generated always as identity primary key,
  tier          text not null                             -- organic|ads|email|sms|member
                  check (tier in ('organic','ads','email','sms','member')),
  label         text not null,
  audience      text,
  multiplier    integer not null default 1,
  message       text,                                     -- banner copy
  active        boolean not null default true,
  code          text,                                     -- ?promo=CODE trigger (ci)
  utm_value     text,                                     -- utm_* value that triggers it
  starts_at     timestamptz,
  ends_at       timestamptz,                              -- independent promo countdown
  show_countdown boolean not null default false,
  countdown_label text default 'Promo closes in',
  priority      integer not null default 0,               -- tie-break beyond multiplier
  created_at    timestamptz not null default now()
);
create unique index on promotions (lower(code)) where code is not null;

-- ─────────────────────────── subscribers ────────────────────────────────
create table email_subscribers (
  id           bigint generated always as identity primary key,
  email        citext unique not null,
  status       text not null default 'pending'            -- pending|subscribed|unsubscribed|bounced
                 check (status in ('pending','subscribed','unsubscribed','bounced')),
  source       text,                                       -- Footer|Popup|Checkout
  klaviyo_id   text,
  user_id      bigint references users(id),
  consent_at   timestamptz,
  joined_at    timestamptz not null default now()
);
create table sms_subscribers (
  id            bigint generated always as identity primary key,
  phone         text unique not null,                      -- E.164
  status        text not null default 'pending'            -- pending|subscribed|unsubscribed
                  check (status in ('pending','subscribed','unsubscribed')),
  source        text,
  postscript_id text,
  user_id       bigint references users(id),
  consent_at    timestamptz,                               -- TCPA: proof of opt-in
  joined_at     timestamptz not null default now()
);

-- ───────────────────── attribution (multi-touch) ────────────────────────
-- Pre-identity touches keyed by first-party visitor_id; stitched to user on order.
create table attribution_touches (
  id           bigint generated always as identity primary key,
  visitor_id   text not null,                              -- first-party cookie
  user_id      bigint references users(id),                -- backfilled on identify
  position     text not null default 'mid'                 -- first|mid|last (computed)
                 check (position in ('first','mid','last')),
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  gclid text, fbclid text, referrer text, landing_path text,
  occurred_at  timestamptz not null default now()
);
create index on attribution_touches (visitor_id, occurred_at);

-- Server-side event outbox for GA4 MP + Meta CAPI (dedup with the browser).
create table analytics_events (
  id           bigint generated always as identity primary key,
  event_id     text not null,                              -- shared with browser pixel for DEDUP
  event_name   text not null,                              -- page_view|view_item|add_to_cart|purchase
  visitor_id   text, user_id bigint references users(id),
  order_id     bigint references orders(id),
  value_cents  integer, currency text,
  sent_ga4     boolean not null default false,
  sent_meta    boolean not null default false,
  payload      jsonb,
  occurred_at  timestamptz not null default now(),
  unique (event_id, event_name)                            -- our own idempotency
);
```

---

## 3. Ticketing — the mint transaction (the heart)

**When:** only on `orders/paid` (money captured). We never mint on cart/checkout-start, so
abandoned carts create **zero** gaps — the entry space is dense by construction. (Contrast
with reserve-then-confirm systems that must reclaim holds; a raffle doesn't need that.)

**Three idempotency guards** (defense in depth):
1. **HMAC** on the webhook (raw body + `X-Shopify-Hmac-Sha256`, timing-safe) → 401 if bad.
2. **Delivery dedupe**: `processed_webhooks(webhook_id)` PK — duplicate deliveries ack and stop.
3. **Row-level**: `unique(shopify_line_id)` on `entry_blocks` + `on conflict do nothing` — even if 1–2 are bypassed, a line physically cannot mint twice.

```
BEGIN
  insert processed_webhooks(webhook_id) on conflict do nothing;  -- guard 2
  if no row inserted: COMMIT and return 200                       -- already handled
  cycle := open cycle
  upsert user, upsert order (with promo + attribution SNAPSHOT)
  for each line in order.line_items:
      base    := bundle_size(line)                    -- tickets the buyer paid for
      mult    := order.promo_multiplier               -- snapshotted, not live
      entries := base * mult
      -- BLOCK ALLOCATION: one locked round-trip, gapless, regardless of `entries`
      UPDATE cycle_counters
         SET last_entry_no = last_entry_no + entries
       WHERE cycle_id = :cycle
      RETURNING last_entry_no;                         -- = new end
      start := last_entry_no - entries + 1
      INSERT entry_blocks(cycle_id, order_id, shopify_line_id, user_id,
                          purchased_tickets, multiplier, entry_start, entry_end, public_code)
        VALUES (..., start, last_entry_no, code(cycle,user,start))
        ON CONFLICT (shopify_line_id) DO NOTHING;      -- guard 3
COMMIT
return 200                                             -- always 2xx once durably stored
```

**Why gapless holds:** the `UPDATE … RETURNING` takes a row lock on the single counter row;
concurrent orders serialize on it, so blocks are contiguous and non-overlapping. Lock is held
for one statement only → high throughput.

**Refunds / cancellations** (`refunds/create`, `orders/cancelled`): set `voided = true` on the
matching `entry_blocks` (found by `shopify_line_id`/`shopify_order_id`). **We do not renumber
and do not reuse numbers** — the voided range stays as an auditable hole excluded from the
draw (`where not voided`). Renumbering would corrupt already-printed tickets.

**The draw:** pick a uniform random integer in `[1, last_entry_no]`; if it lands in a voided
block or an unsold tail, re-draw (or draw only from the set of valid entry_nos). Resolve
`winner_entry_no` → the `entry_blocks` row whose `[entry_start, entry_end]` contains it →
`user`. Stamp `cycles.winner_entry_no`/`winner_order_id`. Fully reproducible and auditable.

**Reconciliation cron** (daily, `vercel.ts` crons): pull Shopify paid orders for the open
cycle, assert each has an `entry_blocks` row, replay any missing through the same idempotent
path. Alert if it ever replays > 0 (means a webhook was lost). This is the safety net.

**Public code** (`ticket-gen.ts`, already built): `GM-{cycle:0>3}-{userHash}-{start:0>4}`,
`userHash` = FNV-1a → Crockford base32. Stable per buyer, human-readable, printed on the A3
sheet next to the entry number.

---

## 4. Subscriptions (membership)

Membership is a **Shopify subscription selling plan** attached to a Membership product;
Shopify bills and emits `orders/paid` on every renewal, which flows through the **same mint
path** → the member's allotment is minted automatically each cycle. No custom billing.

**Contract lifecycle** we mirror into `subscriptions` via webhooks
(`subscription_contracts/create|update`, `subscription_billing_attempts/*`):

| Shopify event | `subscriptions.status` | Side effect |
|---|---|---|
| contract created / first paid | `active` | `users.is_member = true` |
| billing attempt success (renewal) | `active` | renewal order → mints member entries |
| billing attempt failure (dunning) | `failed` | keep `is_member` through grace window, notify |
| paused | `paused` | no minting; `is_member = false` |
| cancelled / expired | `cancelled`/`expired` | `is_member = false` |

`is_member` is the single flag the promo engine reads to grant the member tier (highest
multiplier, applied with no code). Store `entries_per_cycle` as the base allotment; the member
multiplier is applied at mint like any other tier. Idempotency: renewal orders dedupe on
`shopify_order_id` exactly like one-time orders — Shopify webhooks are at-least-once, so the
same three guards apply.

---

## 5. Dynamic promotions — engine **and** end-user UX

### 5.1 The engine (config-as-data / rules engine)
Promotions are **rows, not code** — the rules-engine pattern: business logic lives in the DB,
marketing changes fire instantly with no deploy
([Nected](https://www.nected.ai/us/blog-us/rules-engine-design-pattern),
[codesoltech](https://www.codesoltech.com/blog/coupon-discount-engine-development/)). The
demo's `promotions` table already models this (tier, multiplier, code, utm_value, active,
ends_at, message, countdown). Admin edits at `/admin/promotions`.

**Tiers & default multipliers** (from the brief): organic 1×, advertising (promo-dependent)
2×, email 2×, SMS 3×, member 4×. All editable.

**Resolution — priority, highest-multiplier-wins, NO stacking** (matches `resolvePromo`):
```
inputs: URL search params, is_member (from session)
candidates = active promos where live (active ∧ multiplier>1 ∧ now ≤ ends_at)
  1. if is_member          → member tier
  2. if ?promo=CODE        → promo whose code matches (case-insensitive)
  3. if utm_* present      → promo whose utm_value matches a utm_* value
  4. else                  → organic (1×)
resolved = the candidate with the HIGHEST multiplier (priority as tie-break)
```
No stacking is a deliberate correctness/UX decision: one clear boost, defensible, no
combinatorial abuse. Atomic and snapshotted — see below.

**Snapshot at purchase (critical):** the resolved `promo_id / promo_tier / promo_multiplier`
is **written onto the order and entry_blocks at mint time**. Never recompute a past order's
multiplier from live config — an admin editing a promo next week must not change what an
existing buyer already earned. This is the "atomic redemption recording" best practice
([codesoltech](https://www.codesoltech.com/blog/coupon-discount-engine-development/)).

### 5.2 How it reaches the end user (the UX pipeline)
This is the part that matters on screen. The multiplier must feel present and honest at every
step, and — crucially — **survive into checkout** so the mint applies exactly what the buyer saw.

```
1. LAND  ?promo=VIP3X  or  utm_source=sms  →  resolvePromo() runs client+server
             │
2. PERSIST  write resolved promo to a first-party cookie (gm_promo) + visitor cookie,
            so it survives internal navigation and page refresh (not just the landing URL)
             │
3. BANNER   <PromoBanner>: "VIP text-club deal — 3× entries on every ticket."
            + independent promo countdown ("Promo closes in 04:12:55") when show_countdown
             │
4. TICKETS  /tickets buy box shows, per bundle:
              base entries STRUCK THROUGH  →  boosted entries in accent
              e.g.  ~~10 entries~~  30 entries   ·  "3× applied"
            member view = the 4× variant of the same treatment
             │
5. CART     on add-to-cart, write promo id + multiplier into Shopify CART ATTRIBUTES
            (this is what carries the promo through Shopify's checkout, which we don't control)
             │
6. MINT     orders/paid webhook reads the cart/note attributes → SNAPSHOT onto order →
            entries = base × multiplier. What they saw == what they got.
```

**Edge rules the UX must handle:**
- Promo expires while the buyer is mid-session → `isPromoLive` re-checks `ends_at`; banner and
  boosted counts revert to organic; never mint an expired multiplier (webhook re-validates).
- Member logged in **and** an SMS link → member 4× wins (highest), shown as the member deal.
- No promo → organic: no banner, base entries, no strikethrough (avoid fake urgency).
- Server is the authority: the tickets page can render optimistically, but the **webhook
  re-resolves and snapshots** — the client multiplier is a display, never trusted for mint.

### 5.3 Admin
`/admin/promotions` writes `promotions` rows: multiplier, code, utm_value, active toggle,
`ends_at`, banner `message`, `show_countdown`, `countdown_label`. Changes take effect on next
resolve (live), but never rewrite historical snapshots.

---

## 6. Tracking — UTM · GA4 · Meta Pixel/CAPI (first-party, dedup-correct)

**Stance (2026 best practice): CAPI-first, pixel as backup**, unified by shared `event_id`
([codeloom](https://codeloomtechnologies.com/blogs/ga4-meta-pixel-utm-server-side-tracking-2026/),
[EasyInsights](https://easyinsights-11.medium.com/why-conversions-dont-match-across-meta-google-and-ga4-and-how-to-fix-cross-platform-5c5a3fe2a737)).
Own a **first-party attribution table** (`attribution_touches`) rather than trusting any single
platform — the same math attribution SaaS runs, on your own data.

### 6.1 Capture (first-party)
- On every landing, read `utm_*`, `gclid`, `fbclid`, referrer, and Meta's `fbp`/`fbc` cookies.
- Persist a **first-party `visitor_id` cookie** + the campaign data (Simo-Ahava
  persist-campaign-data pattern). **First touch is written once and never overwritten**;
  **last touch** updates each campaigned visit. Both are needed: first-touch identifies the
  originating campaign, and requires a cookie + tagged inbound + a lookback window long enough
  to survive until conversion ([accs-net first-touch](https://accs-net.com/glossary/first-touch/)).
- Each campaigned visit appends a row to `attribution_touches` (keyed by `visitor_id`, still
  anonymous). On identify (OTP login / order), backfill `user_id` — identity stitching.

### 6.2 Handoff through Shopify (the gotcha)
We don't own Shopify's checkout, so attribution must ride along as data:
- Write `visitor_id`, first/last UTM, `fbp`, `fbc`, `gclid` into **Storefront Cart
  `attributes`** at cart creation → Shopify copies them to the order's `note_attributes`.
- **Gotcha:** `note_attributes` silently drop if set after checkout has started — set them at
  cart creation, not later. The webhook reads them back and writes the **order attribution
  snapshot** (§2) with a real `user_id`.

### 6.3 Emit & deduplicate
- **Browser**: GA4 + Meta Pixel fire client-side with a generated `event_id`.
- **Server**: the `orders/paid` webhook writes an `analytics_events` row and sends the
  **same `event_id`** to Meta **CAPI** (hashed `em`/`ph`, plus `fbp`/`fbc`) and to GA4
  Measurement Protocol. Meta merges browser+server events on `event_name` + `event_id` within
  a 48h window → **no double counting** ([codeloom](https://codeloomtechnologies.com/blogs/ga4-meta-pixel-utm-server-side-tracking-2026/)).
  Deterministic dedup = same user + same event + same id → one conversion.
- **GA4 cross-domain**: since checkout is on Shopify's domain, configure the GA4 cross-domain
  linker (`_gl`) between the Next.js domain and Shopify so a session isn't split into a
  self-referral.
- `analytics_events` doubles as an **outbox** — retry `sent_ga4`/`sent_meta = false` rows so a
  transient CAPI failure doesn't lose a conversion.

### 6.4 What the admin sees
`/admin/attribution` reads `attribution_touches` + the order snapshots: visits and purchases
by channel (organic / member / promo code / UTM campaign), first- vs last-touch credit,
conversion rate per source. This is the productionization of the demo's `analytics.ts`
`gm:events-v1` (`visit`/`purchase`, `source`, `channel`, `trigger`), which already models
exactly these fields.

---

## 7. Scale & operational notes
- **One hot row per open cycle** (`cycle_counters`). Block-allocation keeps the lock window to
  one statement per order line. A weekly raffle has one open cycle; this is comfortably enough.
  If a future flash-sale ever saturates the single counter, shard into N counter rows and
  interleave — **but only when measured**, since sharding trades away simple gapless-per-cycle.
- **entry_blocks stays small** (one row per order line, not per entry) → the draw and "my
  entries" queries are cheap even at millions of entries.
- **Indexes**: `entry_blocks(cycle_id) where not voided` (draw + counts), `entry_blocks(user_id)`
  (account page), `attribution_touches(visitor_id, occurred_at)` (stitching).
- **Idempotency everywhere money touches**: `processed_webhooks` + unique constraints + `on
  conflict do nothing`. Every webhook handler is safe to replay.
- **Snapshots over live lookups** for anything historical (promo multiplier, attribution) —
  the past must not change when config changes.
- **RLS on** in Supabase; service-role key server-only; buyers can read only their own rows.
- **Preview isolation**: a Supabase branch DB per Vercel preview so webhook tests never touch
  production entry numbers.

---

## Sources
- PostgreSQL sequences vs. gapless invoice numbers — [Cybertec](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/), [sql-workbench](https://blog.sql-workbench.eu/post/gapless-sequence/)
- Row-lock counter / concurrency-safe numbering — [kimmobrunfeldt/howto-everything](https://github.com/kimmobrunfeldt/howto-everything/blob/master/postgres-gapless-counter-for-invoice-purposes.md), [AppMaster](https://appmaster.io/blog/concurrency-safe-invoice-numbering), [DEV: no-gap sequence](https://dev.to/yugabyte/no-gap-sequence-in-postgresql-and-yugabytedb-3feo)
- Rules-engine / discount engine architecture — [Nected](https://www.nected.ai/us/blog-us/rules-engine-design-pattern), [codesoltech coupon engine](https://www.codesoltech.com/blog/coupon-discount-engine-development/), [fabric promotions engine](https://fabric.inc/blog/product/enterprise-guide-promotions-engines)
- UTM / GA4 / Meta CAPI dedup & first-party attribution — [codeloom 2026 stack](https://codeloomtechnologies.com/blogs/ga4-meta-pixel-utm-server-side-tracking-2026/), [EasyInsights cross-platform](https://easyinsights-11.medium.com/why-conversions-dont-match-across-meta-google-and-ga4-and-how-to-fix-cross-platform-5c5a3fe2a737), [accs-net first-touch](https://accs-net.com/glossary/first-touch/), [Littledata Meta vs GA4](https://help.littledata.io/integrations/facebook-capi/why-is-meta-attribution-different-from-ga4)
