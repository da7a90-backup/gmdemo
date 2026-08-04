# Generous Motors — Data Model & Architecture (deep dive)

> The exhaustive, **authoritative** schema doc. Companion to `implementation-guide.md`
> (narrative architecture) and `tracks.md` (plan of work). Where this doc and the guide
> disagree on the ticket schema, **this doc wins** — the guide's §2–§4 predate the
> order-based ticket-number decision and are superseded here.
>
> Design principle: **simple but robust, correct under concurrency.** A raffle drawn on
> camera makes "no duplicate / no missing entry" a hard correctness property.

**Storage split (decided):**
- **Supabase Postgres** = raffle system of record (this document).
- **Shopify** = checkout, payments, subscriptions **and** content (Metaobjects).
- Providers = Postscript (SMS), Klaviyo (email marketing), SendGrid (transactional), GA4 + Meta.

---

## 0. Ticket numbers — the format and what it lets us delete

### 0.1 The format (three parts, cycle-scoped)
```
   GM12  -  0001  -  0001
   │ │       │        │
   │ │       │        └── part 3: per-ORDER ticket sequence, 0001–9999
   │ │       └─────────── part 2: per-CYCLE order number, 0001–9999 (unique within the cycle)
   │ └─────────────────── current cycle number, 2 digits
   └───────────────────── fixed prefix we set ("GM"; configurable)
```
- **Part 1 — prefix + cycle.** `GM` + 2-digit cycle number (`GM12`). Putting the cycle *in* the
  number means a ticket names its own cycle and numbers are **globally unique across cycles** —
  which reinforces the "valid only within its cycle" rule (§0.3).
- **Part 2 — order number.** A **per-cycle order counter**: the first order of a cycle is
  `0001`, the next `0002`, … Every ticket in the same order shares it — that's what ties a
  multi-ticket order together. **Guaranteed unique within the cycle** (see §0.5 for exactly how,
  and how production systems get this wrong). 4 digits.
- **Part 3 — sequence.** The ticket's index within its own order, `0001`…`9999` (so one order
  holds up to 9,999 entries). Starts at `0001`. 4 digits.

**Total: `GM12-0001-0001` = 14 chars.** Adding the cycle costs 2 chars over the earlier ≤12
target. Options: **accept 14** (recommended — still short and readable), or drop dashes for
`GM1200010001` (12 chars, harder to read). **Flag:** cycle > 99 needs 3 digits (`GM100-…`, 15
chars) — fine to switch when we approach it.

### 0.2 Why a per-cycle counter, not a hash of the Shopify order id
The hard requirement (Kevin, point 1): **no two orders in the same cycle may share the middle
part.** A value *derived* from the Shopify order id (mod / truncation) can't guarantee that
inside a 4-digit budget — two order ids far enough apart collide. The robust way to guarantee
uniqueness in 4 digits is a **per-cycle order counter**: hand each new order the next integer.
We still store the Shopify order id 1:1 on the order row for traceability, so the linkage the
brief wanted is preserved — only the *displayed* token is our own compact counter. Gaps in the
order-number space are harmless (uniqueness is all that matters, not contiguity), and a
`unique (cycle_id, order_token)` constraint is the belt-and-suspenders backstop.

> **Caps:** 4 digits ⇒ ≤ 9,999 orders per cycle and ≤ 9,999 tickets per order. Kevin set the
> 9,999 max; flag in `open-questions.md` if a single cycle could exceed 9,999 **orders** (that
> part is the binding one — the fix is a 5-digit order part or base36).

### 0.3 Validity is cycle-scoped (the big consequence)
Ticket numbers are **valid only within their cycle**. Once the cycle is drawn/closed, every
number is **rendered invalid** — retained for historical record-keeping and for subscribers to
see in their account area, but no longer active for winning or validation. Because validity is
always evaluated *with the cycle in context*, we never depend on cross-cycle uniqueness: a
number from cycle 12 and a (practically impossible) identical number in cycle 40 are different
rows keyed by `cycle_id`. This is what makes the short format safe.

### 0.4 What this format shrinks
The earlier design used a **per-ticket gapless counter** — one hot row locked once **per
ticket**, so a 400-entry order took 400 locks — to make entries a contiguous `1..N` range for
a digital "pick integer K" draw. The order-based number shrinks that dramatically:

| Earlier (per-**ticket** gapless counter) | Now (per-**order** counter + per-order sequence) |
|---|---|
| counter locked once **per ticket** → 400-entry order = 400 locks | counter locked once **per order** → 400-entry order = **1 lock**; the ticket sequence needs no shared row |
| "no missing" read as contiguous integers | "no missing" = **completeness** (every paid line mints) — what Kevin actually needs |
| digital draw = pick integer 1..N | draw = physical drum, or weighted pick over blocks (§3.4) |

**Key correctness clarification:** Kevin's "no missing ticket numbers" means *no paid entry is
ever left without a ticket* (completeness + idempotency), **not** that the integers are
contiguous. A physical drum draws paper; gaps are irrelevant to it. The one small serialized
step that remains is a **per-order** counter (the middle part), which even at draw-night peak
is trivial — it's bumped at orders/second, not tickets/second.

### 0.5 How order-number collisions actually happen in production — and how we prevent each
Atomic-counter designs *do* collide in the wild. Every documented case traces to one of these
anti-patterns ([Cybertec: sequences vs invoice numbers](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/),
[Postgres transaction-isolation docs](https://www.postgresql.org/docs/current/transaction-iso.html),
[Vlad Mihalcea: lost updates](https://vladmihalcea.com/a-beginners-guide-to-database-locking-and-the-lost-update-phenomena/)).
**None of them is a correctly-written single-statement increment** — but they're easy to write
by accident, so they are BANNED here:

| ✗ Banned pattern (causes real collisions) | Why it collides |
|---|---|
| ORM read-modify-write: `order.n += 1; save()` | `SELECT` then a separate `UPDATE`; a bare SELECT takes **no lock** at Read Committed, so two requests both read `4`, both write `5` — the classic lost update. **The #1 real-world cause.** |
| `SELECT MAX(order_no)+1` then INSERT | both transactions read before either writes |
| `SELECT last_order_no` then separate `UPDATE` (no `FOR UPDATE`) | same lost-update trap |
| read the counter from a **read replica**, write to primary | replica is stale → two orders read the same value |
| bump the counter in a **different transaction** than the insert | reserved number leaks / gets reused |

**How we allocate the order number (safe by construction):**
1. **A per-cycle Postgres `SEQUENCE` — `nextval` (recommended, and stress-tested).** `nextval`
   is collision-proof *by design* and **lock-free**, so concurrent orders don't serialize. The
   stress test (`ticket-stress-test.md`) measured this at **~4× the throughput** of the counter
   row (23s vs 92s for 200 concurrent orders) with identical, perfect correctness. Gaps in the
   sequence are fine (we don't need contiguity). Create the sequence when the cycle opens.
   *Alternative* (simpler, no per-cycle DDL, but it serializes): **one fused statement** —
   `UPDATE cycle_counters SET last_order_no = last_order_no + 1 WHERE cycle_id = :c RETURNING
   last_order_no`; read and write are the *same* statement, so Postgres re-reads under the
   write's row lock — correct even at Read Committed. **Never** an ORM increment.
2. **Primary only** — the allocation never runs against a read replica.
3. **Counter row pre-created when the cycle opens** (or `INSERT … ON CONFLICT DO UPDATE …
   RETURNING`), so two orders never race to *create* the counter row.
4. **Increment + order insert in the same transaction.**
5. **The actual guarantee, independent of 1–4:** `UNIQUE (cycle_id, order_token)` **+ retry on
   unique-violation.** Even if a replica were misread or an ORM slipped in, the duplicate insert
   *cannot persist* — it raises a unique-violation and the handler retries with the next number.
   This is what turns "should be safe" into "a duplicate is physically unstorable." The retry
   loop (bounded, e.g. 5 attempts) is mandatory around the mint transaction.

---

## 1. Entity map

```
users ──< orders ──< entry_blocks   (order_token lives on the order; blocks hold seq ranges)
  │         │   │
  │         │   └── cycle_id ──> cycles  ──(content)──>  Shopify `cycle` metaobject
  │         └── promo snapshot + attribution snapshot (denormalized, immutable)
  │
  ├──< subscriptions (Shopify contract mirror)
  ├──< email_subscribers / sms_subscribers   (contact may precede a user row)
  └──< attribution_touches (multi-touch, anonymous via visitor_id → stitched on identify)

promotions (rules engine, config-as-data) ──> resolved & SNAPSHOTTED onto orders/entry_blocks
processed_webhooks (idempotency ledger)        analytics_events (GA4/Meta outbox + dedup)
```
The only shared/serialized row is `cycle_counters`, bumped **once per order** to hand out the
middle-part order number (§0.4) — not per ticket.

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
  code               text unique not null,          -- '012'
  shopify_cycle_gid  text unique,                    -- content metaobject
  status             text not null default 'draft'
                       check (status in ('draft','open','closed','drawn','archived')),
  opens_at           timestamptz,
  closes_at          timestamptz,                    -- ticket sales cutoff
  draw_at            timestamptz,
  winner_block_id    bigint,                         -- set at draw
  winner_ticket_no   text,                           -- the drawn GM-xxxx-nn
  created_at         timestamptz not null default now()
);
-- A ticket is VALID (active) only while its cycle is pre-draw:
--   valid  ⇔  cycles.status in ('open','closed')
--   historical/invalid  ⇔  cycles.status in ('drawn','archived')

-- ─────────────────────────────── orders ─────────────────────────────────
-- Per-cycle order counter: hands out the 4-digit middle part. One row per cycle,
-- bumped once PER ORDER (not per ticket). This is the only serialized row.
create table cycle_counters (
  cycle_id     bigint primary key references cycles(id),
  last_order_no integer not null default 0
);

create table orders (
  id                 bigint generated always as identity primary key,
  shopify_order_id   bigint unique not null,         -- idempotency anchor + traceability
  order_token        text not null,                  -- '0001'.. — the middle part (per-cycle order no.)
  user_id            bigint not null references users(id),
  cycle_id           bigint not null references cycles(id),
  subtotal_cents     integer not null,
  currency           text not null default 'USD',
  -- PROMO SNAPSHOT (immutable — never recompute a past order from live config)
  promo_id           text, promo_tier text, promo_multiplier integer not null default 1,
  -- ATTRIBUTION SNAPSHOT (first + last touch that produced this order)
  attr_first_source text, attr_first_medium text, attr_first_campaign text,
  attr_last_source  text, attr_last_medium  text, attr_last_campaign  text,
  attr_fbp text, attr_fbc text, attr_gclid text, attr_visitor_id text,
  created_at         timestamptz not null default now(),
  unique (cycle_id, order_token)                     -- collision backstop (see §0.2)
);

-- ────────────────────────── entry blocks (tickets) ──────────────────────
-- One row per order LINE. Holds a per-order sequence range; expand to individual
-- ticket numbers as GM-{order_token}-{seq} for seq in [seq_start, seq_end].
create table entry_blocks (
  id                 bigint generated always as identity primary key,
  cycle_id           bigint not null references cycles(id),
  order_id           bigint not null references orders(id),
  shopify_line_id    bigint not null,
  user_id            bigint not null references users(id),
  purchased_tickets  integer not null,               -- bundle size × line quantity paid for
  multiplier         integer not null default 1,      -- promo multiplier snapshot
  seq_start          integer not null,                -- 1-based, continuous across the order's lines
  seq_end            integer not null,                -- seq_start + purchased*multiplier - 1
  ticket_count       integer generated always as (seq_end - seq_start + 1) stored,
  voided             boolean not null default false,   -- refund/cancel → excluded from draw
  voided_at          timestamptz,
  created_at         timestamptz not null default now(),
  unique (shopify_line_id),                            -- idempotency: a line mints once
  unique (order_id, seq_start)                         -- no seq overlap within an order
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
  status                 text not null
                           check (status in ('active','paused','cancelled','failed','expired')),
  tier                   text not null default 'member',
  entries_per_cycle      integer not null default 0,       -- base allotment before multiplier
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─────────────────────── promotions (rules engine) ──────────────────────
create table promotions (
  id            bigint generated always as identity primary key,
  tier          text not null check (tier in ('organic','ads','email','sms','member')),
  label         text not null, audience text,
  multiplier    integer not null default 1,
  message       text,
  active        boolean not null default true,
  code          text, utm_value text,
  starts_at     timestamptz, ends_at timestamptz,
  show_countdown boolean not null default false,
  countdown_label text default 'Promo closes in',
  priority      integer not null default 0,
  created_at    timestamptz not null default now()
);
create unique index on promotions (lower(code)) where code is not null;

-- ─────────────────────────── subscribers ────────────────────────────────
create table email_subscribers (
  id bigint generated always as identity primary key,
  email citext unique not null,
  status text not null default 'pending'
    check (status in ('pending','subscribed','unsubscribed','bounced')),
  source text, klaviyo_id text, user_id bigint references users(id),
  consent_at timestamptz, joined_at timestamptz not null default now()
);
create table sms_subscribers (
  id bigint generated always as identity primary key,
  phone text unique not null,                            -- E.164
  status text not null default 'pending'
    check (status in ('pending','subscribed','unsubscribed')),
  source text, postscript_id text, user_id bigint references users(id),
  consent_at timestamptz,                                -- TCPA proof of opt-in
  joined_at timestamptz not null default now()
);

-- ───────────────────── attribution (multi-touch) ────────────────────────
create table attribution_touches (
  id bigint generated always as identity primary key,
  visitor_id text not null,                              -- first-party cookie
  user_id bigint references users(id),                   -- backfilled on identify
  position text not null default 'mid' check (position in ('first','mid','last')),
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  gclid text, fbclid text, referrer text, landing_path text,
  occurred_at timestamptz not null default now()
);
create index on attribution_touches (visitor_id, occurred_at);

create table analytics_events (
  id bigint generated always as identity primary key,
  event_id text not null,                                -- shared with browser pixel for DEDUP
  event_name text not null,                              -- page_view|view_item|add_to_cart|purchase
  visitor_id text, user_id bigint references users(id), order_id bigint references orders(id),
  value_cents integer, currency text,
  sent_ga4 boolean not null default false, sent_meta boolean not null default false,
  payload jsonb, occurred_at timestamptz not null default now(),
  unique (event_id, event_name)
);
```

---

## 3. Ticketing — mint, refund, draw

### 3.1 When
Mint **only on `orders/paid`** (money captured). Nothing mints on cart/checkout-start, so
abandoned carts leave no dangling tickets. No reservation/hold system needed.

### 3.2 Three idempotency guards (defense in depth)
1. **HMAC** on the webhook (raw body + `X-Shopify-Hmac-Sha256`, timing-safe) → 401 if bad.
2. **Delivery dedupe**: `processed_webhooks(webhook_id)` PK — duplicate deliveries ack + stop.
3. **Row-level**: `unique(shopify_line_id)` on `entry_blocks` + `on conflict do nothing`.

### 3.3 The mint transaction (per-order counter + unique-violation retry)
```
RETRY up to 5× on unique_violation:                               -- guard 5 (see §0.5)
BEGIN
  insert processed_webhooks(webhook_id) on conflict do nothing;   -- guard 2
  if no row inserted: COMMIT, return 200                          -- already handled
  cycle := the open cycle
  upsert user
  -- Assign the middle part idempotently: reuse if this order already minted, else take next.
  order := select from orders where shopify_order_id = :sid
  if not order:
      n := UPDATE cycle_counters SET last_order_no = last_order_no + 1
             WHERE cycle_id = :cycle RETURNING last_order_no      -- one lock, per ORDER
      order_token := lpad(n, 4, '0')                              -- '0001'
      insert order (shopify_order_id, order_token, promo & attribution SNAPSHOT)
        on conflict (shopify_order_id) do nothing                 -- concurrent-safe
      order := select from orders where shopify_order_id = :sid   -- re-read the winner
  seq := 0                                                        -- per-order running sequence
  for line in sort(order.line_items, by id):                     -- deterministic order → replay-stable
      entries := bundle_size(line) * line.quantity * order.promo_multiplier
      INSERT entry_blocks(cycle_id, order_id, shopify_line_id, user_id,
                          purchased_tickets, multiplier, seq_start, seq_end)
        VALUES (:cycle, :order, line.id, :user,
                bundle_size(line)*line.quantity, :mult, seq+1, seq+entries)
        ON CONFLICT (shopify_line_id) DO NOTHING;                 -- guard 3
      seq := seq + entries
COMMIT
return 200                                                        -- always 2xx once stored
```
Ticket numbers are composed at read/print time: for a block,
`GM{cycle:2}-{order_token}-{lpad(seq,4)}` (e.g. `GM12-0001-0007`) for each
`seq in [seq_start, seq_end]`. The `order_token` is assigned once (idempotently
reused on replay), and `seq` is computed from the order's own (sorted) line list, so the whole
thing is **deterministic and replay-stable** — a retried webhook reproduces identical numbers
and the unique constraints make a double-insert a no-op.

**Can two simultaneous orders both get `0001`? No — see §0.5** for the full treatment
(the single fused `UPDATE … RETURNING`, primary-only allocation, and the
`unique(cycle_id, order_token)` + retry backstop that makes a duplicate physically unstorable
even if something upstream misbehaves). The whole mint transaction runs inside a **bounded
retry loop** (≈5 attempts): on a unique-violation it re-reads the counter and tries the next
number, so an unforeseen race degrades to a retry, never a persisted collision.

### 3.4 The draw
- **Physical drum (primary):** the A3 PDF expands every non-void block into individual paper
  tickets (`GM-…-01`, `-02`, …). Drop in drum, pull on camera. Winner's number → block whose
  range contains that seq → order → user.
- **Digital fallback (if ever):** each valid entry is equally likely = pick a block with
  probability ∝ `ticket_count`, then a uniform seq within it. Uniform over all entries without
  materializing one row per entry, and reproducible if seeded. Record the seed for audit.

### 3.5 Refunds / cancellations (**no partial refunds** — Kevin's policy)
Partial refunds are not offered, which keeps this simple: a refund/cancel always voids the
**whole order**.
- `refunds/create` or `orders/cancelled` → set `voided = true` on **every** `entry_blocks` row
  for that `shopify_order_id`.
- Voided ranges are **never renumbered or reused** — they remain as auditable, excluded rows
  (`where not voided`). Any already-printed paper for a voided order is pulled before the draw.
- Because the policy forbids partial refunds, we never split a block or re-mint a remainder.

### 3.6 Retention & "rendered invalid"
`entry_blocks` and `orders` are **retained indefinitely**. After the cycle is `drawn`/`archived`
every ticket is historical: excluded from any draw, not accepted by ticket validation, but
shown (labeled with its cycle + "past cycle") in the subscriber's account area and available
for record-keeping. Nothing is deleted on cycle close.

---

## 4. Subscriptions (membership)

Membership is a **Shopify subscription selling plan** on a Membership product; Shopify bills
and emits `orders/paid` on each renewal, which flows through the **same mint path** → the
member's allotment mints automatically every cycle. No custom billing.

Contract lifecycle mirrored into `subscriptions` via webhooks
(`subscription_contracts/create|update`, `subscription_billing_attempts/*`):

| Shopify event | `subscriptions.status` | Side effect |
|---|---|---|
| contract created / first paid | `active` | `users.is_member = true` |
| billing attempt success (renewal) | `active` | renewal order → mints member entries |
| billing attempt failure (dunning) | `failed` | keep `is_member` through grace window, notify |
| paused | `paused` | no minting; `is_member = false` |
| cancelled / expired | `cancelled`/`expired` | `is_member = false` |

`is_member` is the single flag the promo engine reads. Renewal orders dedupe on
`shopify_order_id` exactly like one-time orders (at-least-once webhooks → same three guards).

---

## 5. Dynamic promotions — engine **and** end-user UX

### 5.1 The engine (config-as-data / rules engine)
Promotions are **rows, not code** — the rules-engine pattern: logic lives in the DB, marketing
changes fire instantly with no deploy
([Nected](https://www.nected.ai/us/blog-us/rules-engine-design-pattern),
[codesoltech](https://www.codesoltech.com/blog/coupon-discount-engine-development/)). The
`promotions` table already models it (tier, multiplier, code, utm_value, active, ends_at,
message, countdown). Admin edits at `/admin/promotions`.

Tiers & default multipliers (brief): organic 1×, advertising 2×, email 2×, SMS 3×, member 4×.

**Resolution — priority, highest-multiplier-wins, NO stacking** (matches `resolvePromo`):
```
candidates = active promos that are live (active ∧ multiplier>1 ∧ now ≤ ends_at)
  1. is_member       → member tier
  2. ?promo=CODE     → promo whose code matches (case-insensitive)
  3. utm_* present   → promo whose utm_value matches a utm_* value
  4. else            → organic (1×)
resolved = candidate with the HIGHEST multiplier (priority as tie-break)
```
No stacking is deliberate: one clear, defensible boost, no combinatorial abuse.

**Snapshot at purchase (critical):** the resolved `promo_id/tier/multiplier` is written onto
the order + entry_blocks at mint. Never recompute a past order from live config — an admin
editing a promo next week must not change entries a buyer already earned ("atomic redemption
recording", [codesoltech](https://www.codesoltech.com/blog/coupon-discount-engine-development/)).

### 5.2 How it reaches the end user (the UX pipeline)
```
1. LAND   ?promo=VIP3X  or  utm_source=sms  →  resolvePromo() runs (client for UX, server for truth)
2. PERSIST write resolved promo to a first-party cookie (gm_promo) + visitor cookie,
           so it survives internal navigation + refresh (not just the landing URL)
3. BANNER  <PromoBanner>: "VIP text-club deal — 3× entries on every ticket."
           + independent promo countdown ("Promo closes in 04:12:55") when show_countdown
4. TICKETS /tickets buy box, per bundle:  ~~10 entries~~ → 30 entries  ·  "3× applied"
           member view = the 4× variant of the same treatment
5. CART    on add-to-cart, write promo id + multiplier into Shopify CART ATTRIBUTES
           (this is what carries the promo through Shopify's checkout, which we don't control)
6. MINT    orders/paid reads the attributes → SNAPSHOT → entries = base × multiplier.
           What they saw == what they got.
```
**Edge rules the UX handles:** promo expires mid-session → `isPromoLive` re-checks `ends_at`,
banner + counts revert to organic (webhook re-validates too); member + SMS link → member 4×
wins, shown as the member deal; no promo → no banner, base counts, no fake urgency; **server
is authority** — the client multiplier is display only, the webhook re-resolves and snapshots.

### 5.3 Admin
`/admin/promotions` writes `promotions` rows (multiplier, code, utm_value, active, `ends_at`,
`message`, `show_countdown`, `countdown_label`). Live on next resolve; historical snapshots
never rewritten.

---

## 6. Tracking — UTM · GA4 · Meta Pixel/CAPI (first-party, dedup-correct)

**Stance (2026): CAPI-first, pixel as backup**, unified by a shared `event_id`
([codeloom](https://codeloomtechnologies.com/blogs/ga4-meta-pixel-utm-server-side-tracking-2026/),
[EasyInsights](https://easyinsights-11.medium.com/why-conversions-dont-match-across-meta-google-and-ga4-and-how-to-fix-cross-platform-5c5a3fe2a737)).
Own a **first-party attribution table** (`attribution_touches`) rather than trust any single platform.

### 6.1 Capture
- On each landing read `utm_*`, `gclid`, `fbclid`, referrer, Meta `fbp`/`fbc`.
- Persist a first-party `visitor_id` cookie + campaign data (Simo-Ahava persist-campaign-data).
  **First touch written once, never overwritten; last touch updates each campaigned visit** —
  first-touch needs a cookie + tagged inbound + a lookback window long enough to survive to
  conversion ([accs-net](https://accs-net.com/glossary/first-touch/)).
- Append a `attribution_touches` row per campaigned visit (anonymous `visitor_id`); backfill
  `user_id` on identify (OTP login / order) — identity stitching.

### 6.2 Handoff through Shopify (the gotcha)
- Write `visitor_id`, first/last UTM, `fbp`, `fbc`, `gclid` into **Storefront Cart
  `attributes`** at **cart creation** → Shopify copies them to order `note_attributes`.
  **They silently drop if set after checkout starts — set at cart creation.** The webhook reads
  them into the order attribution snapshot (§2).

### 6.3 Emit & deduplicate
- Browser: GA4 + Meta Pixel fire with a generated `event_id`.
- Server: the `orders/paid` webhook writes `analytics_events` and sends the **same `event_id`**
  to Meta **CAPI** (hashed `em`/`ph` + `fbp`/`fbc`) and GA4 Measurement Protocol. Meta merges
  browser+server on `event_name`+`event_id` within 48h → no double count.
- GA4 cross-domain linker (`_gl`) between the Next.js domain and Shopify checkout (avoid
  self-referral).
- `analytics_events` is also an **outbox** — retry `sent_ga4/sent_meta = false` rows so a
  transient CAPI failure never loses a conversion.

### 6.4 Admin
`/admin/attribution` reads `attribution_touches` + order snapshots: visits & purchases by
channel, first- vs last-touch credit, conversion rate per source — the productionization of the
demo's `analytics.ts` (`visit`/`purchase`, `source`, `channel`, `trigger`).

---

## 7. Scale & operational notes
- **Order-number allocation is lock-free with a per-cycle `SEQUENCE`** (`nextval`), so
  concurrent orders don't serialize at all — measured ~4× faster than the counter-row lock and
  perfectly correct under 200 concurrent orders + 50 duplicate deliveries (see
  `ticket-stress-test.md`). The per-order ticket sequence needs no shared row either. Even the
  simpler counter-row variant, which does serialize on one lock per order, is trivial at
  raffle volumes; the sequence is the recommended default.
- **entry_blocks stays small** — one row per order line, not per entry. "My entries", counts,
  and the draw are cheap even at millions of entries (`SUM(ticket_count) WHERE NOT voided`).
- **Indexes**: `entry_blocks(cycle_id) where not voided`, `entry_blocks(user_id)`,
  `attribution_touches(visitor_id, occurred_at)`.
- **Idempotency everywhere money touches**: `processed_webhooks` + unique constraints + `on
  conflict do nothing`. Every webhook handler is replay-safe.
- **Snapshots over live lookups** for anything historical (promo multiplier, attribution).
- **RLS on**; service-role key server-only; a buyer reads only their own rows. Ticket lookup
  requires ownership/contact match, never a bare number (numbers are semi-guessable — §review).
- **Preview isolation**: a Supabase branch DB per Vercel preview.

---

## Sources
- Postgres sequences vs. gapless numbering — [Cybertec](https://www.cybertec-postgresql.com/en/postgresql-sequences-vs-invoice-numbers/), [sql-workbench](https://blog.sql-workbench.eu/post/gapless-sequence/); row-lock counters — [kimmobrunfeldt](https://github.com/kimmobrunfeldt/howto-everything/blob/master/postgres-gapless-counter-for-invoice-purposes.md), [AppMaster](https://appmaster.io/blog/concurrency-safe-invoice-numbering)
- Rules/discount engine — [Nected](https://www.nected.ai/us/blog-us/rules-engine-design-pattern), [codesoltech](https://www.codesoltech.com/blog/coupon-discount-engine-development/), [fabric](https://fabric.inc/blog/product/enterprise-guide-promotions-engines)
- UTM/GA4/Meta CAPI dedup & first-party attribution — [codeloom](https://codeloomtechnologies.com/blogs/ga4-meta-pixel-utm-server-side-tracking-2026/), [EasyInsights](https://easyinsights-11.medium.com/why-conversions-dont-match-across-meta-google-and-ga4-and-how-to-fix-cross-platform-5c5a3fe2a737), [accs-net](https://accs-net.com/glossary/first-touch/), [Littledata](https://help.littledata.io/integrations/facebook-capi/why-is-meta-attribution-different-from-ga4)
