# Generous Motors — Backend Implementation Guide

> How the demo becomes production. Every localStorage store in this repo maps to a
> real table, metaobject, or third-party API below. Written to be handed to the
> engineer who builds it. Stack chosen for **KISS**: Shopify does money + subscriptions,
> Next.js on Vercel is the storefront, one Postgres holds the raffle system of record.

---

## 1. Architecture at a glance

```
                       ┌─────────────────────────────────────────┐
   Buyer ──────────▶   │  Next.js storefront (Vercel, App Router) │
                       │  - marketing, tickets, account, admin    │
                       └───────────────┬──────────────────────────┘
                                       │ Storefront API (cart, checkout)
                                       ▼
                       ┌─────────────────────────────────────────┐
                       │  Shopify (Plus or Basic + headless)      │
                       │  - checkout, payments, orders            │
                       │  - Subscriptions (selling plans)         │
                       │  - Metaobjects = headless CMS            │
                       └───────────────┬──────────────────────────┘
                                       │ webhooks (orders/paid, refunds…)
                                       ▼
   Admin ──────────▶   ┌─────────────────────────────────────────┐
                       │  Next.js API routes / Route Handlers     │
                       │  + Vercel Cron (reconciliation)          │
                       └───────────────┬──────────────────────────┘
                                       ▼
                       ┌─────────────────────────────────────────┐
                       │  Serverless Postgres (Neon via Vercel)   │
                       │  system of record: tickets, users,       │
                       │  promos, attribution, subscribers        │
                       └─────────────────────────────────────────┘
        SMS: Postscript   ·   Email: Klaviyo (mktg) + SendGrid (transactional)
        Analytics: GA4 + Meta Pixel + server-side CAPI
```

**Division of responsibility**
- **Shopify owns money and identity of the purchase**: line items, prices, discounts, payment, subscription billing, refunds. Never re-implement checkout.
- **Postgres owns the raffle**: which ticket numbers exist, who holds them, per-cycle sequence, attribution, promo state. This is the source of truth Kevin cares about.
- **Shopify Metaobjects own editorial content**: winners, cycles, partners, blog posts — so Kevin edits in one admin without a deploy.

> **Note on Vercel storage (2026):** "Vercel Postgres" as a first-party product is retired.
> Provision **Neon Postgres through the Vercel Marketplace** — same DX (`POSTGRES_URL`
> auto-injected), serverless driver, autoscaling, branching for previews.

---

## 2. Data model — every demo store → production home

The demo keeps state in `localStorage` behind `src/lib/*`. Each key becomes a table or a
Shopify metaobject. This is the migration map.

| Demo (`localStorage` / `src/lib`) | Production home | Notes |
|---|---|---|
| `gm:session-v1` (`session.ts`) | Postgres `users` + OTP flow | email/phone login → server-issued session cookie |
| ticket generation (`ticket-gen.ts`) | Postgres `tickets` + `cycle_counters` | **the idempotent webhook, §4** |
| `gm:cycle-v1` (`cycle-store.ts`) | Shopify metaobject `cycle` + Postgres `cycles` | content in Shopify, sequence/state in PG |
| `gm:promos-v1` (`promotions.ts`) | Postgres `promotions` | tiers/multipliers, resolved server-side |
| `gm:events-v1` (`analytics.ts`) | Postgres `attribution_events` | first-party UTM table, §6 |
| `gm:winners-v1` (`winners-store.ts`) | Shopify metaobject `winner` | editorial; drawn result also stamped to PG |
| `gm:partners-v1` (`partners-store.ts`) | Shopify metaobject `partner` | logos via Shopify Files CDN |
| `gm:articles-v1` (`blog-store.ts`) | Shopify metaobject `article` | markdown/html + SEO fields |
| `gm:content-v1` (`content.ts`) | Shopify metaobject `copy_block` | keyed copy, mirrors `Copy k="…"` |
| `gm:email-subs-v1` (`subscribers.ts`) | Klaviyo profiles + PG mirror | §7 |
| `gm:sms-subs-v1` | Postscript subscribers + PG mirror | §7, enforced double opt-in |

### Core schema (Postgres)

```sql
-- Cycles: one raffle run. Sequence lives here, not in Shopify.
create table cycles (
  id             bigint generated always as identity primary key,
  shopify_gid    text unique,              -- link to metaobject for content
  code           text unique not null,     -- e.g. '012'
  car_name       text not null,
  status         text not null default 'open',   -- open | closed | drawn
  draw_at        timestamptz,
  created_at     timestamptz not null default now()
);

create table users (
  id           bigint generated always as identity primary key,
  email        citext unique,
  phone        text unique,
  shopify_customer_gid text unique,
  is_member    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- The money-critical table. One row per ticket number, globally.
create table tickets (
  id                 bigint generated always as identity primary key,
  cycle_id           bigint not null references cycles(id),
  ticket_no          integer not null,           -- gapless within cycle
  user_id            bigint not null references users(id),
  shopify_order_id   bigint not null,
  shopify_line_id    bigint not null,
  public_code        text not null,              -- GM-012-<hash>-0007 (display)
  created_at         timestamptz not null default now(),
  unique (cycle_id, ticket_no),                  -- no duplicate numbers
  unique (shopify_line_id, ticket_no)            -- idempotency guard
);

-- Per-cycle monotonic counter. Advanced only inside the ticket transaction.
create table cycle_counters (
  cycle_id     bigint primary key references cycles(id),
  last_ticket  integer not null default 0
);

-- Idempotency ledger for webhooks: dedupe by Shopify's delivery id.
create table processed_webhooks (
  webhook_id   text primary key,          -- X-Shopify-Webhook-Id header
  topic        text not null,
  processed_at timestamptz not null default now()
);

create table promotions (
  id           bigint generated always as identity primary key,
  code         text unique,               -- ?promo=CODE ; null for tier-only
  tier         text not null,             -- organic|ads|email|sms|member
  multiplier   integer not null default 1,
  active       boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz
);

create table attribution_events (
  id           bigint generated always as identity primary key,
  visitor_id   text not null,             -- first-party cookie
  user_id      bigint references users(id),
  utm_source   text, utm_medium text, utm_campaign text,
  utm_content  text, utm_term text,
  fbclid text, gclid text, fbp text, fbc text,
  landing_path text, referrer text,
  created_at   timestamptz not null default now()
);
```

---

## 3. Ticket numbering — collision-proof public code

The demo's `ticket-gen.ts` already produces the display format we keep:
`GM-{cycle:0>3}-{userHash}-{ticket:0>4}` (FNV-1a of the user id → Crockford base32).
In production the **authoritative** number is the integer `ticket_no` (gapless per cycle,
from `cycle_counters`); `public_code` is a derived, human-friendly label printed on the
A3 PDF. Keep both: the integer guarantees no gaps/dupes for the draw; the code is what a
buyer reads back over the phone.

---

## 4. The idempotent ticket webhook (Kevin's #1 requirement)

**Goal:** every paid order mints exactly the right ticket numbers — never duplicated,
never skipped — even when Shopify retries the webhook, sends it twice, or the function
crashes mid-write.

### Why this is hard
Shopify delivers `orders/paid` **at-least-once**. Retries happen on any non-2xx or
timeout, and duplicate deliveries happen even on success. A naive "insert N tickets"
handler double-mints on every retry. The fix is three independent guards.

### The three guards
1. **HMAC verification** — reject anything not signed by Shopify (raw body + `X-Shopify-Hmac-Sha256`, timing-safe compare). Return 401 on mismatch.
2. **Delivery-level dedupe** — `processed_webhooks(webhook_id)` keyed on `X-Shopify-Webhook-Id`. If already present, ack 200 and stop. Catches duplicate deliveries of the same event.
3. **Row-level idempotency** — the `unique (shopify_line_id, ticket_no)` constraint plus `on conflict do nothing`. Even if guards 1–2 are bypassed, the DB physically cannot store a duplicate.

### The transaction (the heart of it)

```ts
// app/api/webhooks/orders-paid/route.ts  (Node runtime, raw body)
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyHmac(raw, req.headers.get('x-shopify-hmac-sha256')))
    return new Response('bad hmac', { status: 401 });

  const webhookId = req.headers.get('x-shopify-webhook-id')!;
  const order = JSON.parse(raw);

  await sql.begin(async (tx) => {
    // Guard 2: delivery dedupe. PK conflict → already handled.
    const ins = await tx`insert into processed_webhooks (webhook_id, topic)
      values (${webhookId}, 'orders/paid') on conflict do nothing returning webhook_id`;
    if (ins.length === 0) return;                       // duplicate delivery, ack

    const cycle = await tx`select id from cycles where status='open' limit 1`;
    for (const line of order.line_items) {
      const qty = ticketQuantityFor(line);              // bundle × promo multiplier
      // Guard 3: advance counter and mint, all inside ONE transaction.
      for (let i = 0; i < qty; i++) {
        const c = await tx`update cycle_counters set last_ticket = last_ticket + 1
          where cycle_id=${cycle[0].id} returning last_ticket`;
        await tx`insert into tickets
          (cycle_id, ticket_no, user_id, shopify_order_id, shopify_line_id, public_code)
          values (${cycle[0].id}, ${c[0].last_ticket}, ${userId}, ${order.id},
                  ${line.id}, ${publicCode(cycle[0], userId, c[0].last_ticket)})
          on conflict (shopify_line_id, ticket_no) do nothing`;
      }
    }
  });

  return new Response('ok', { status: 200 });           // always 2xx once stored
}
```

**Why gapless holds:** `update … set last_ticket = last_ticket + 1 … returning` takes a
row lock on that cycle's counter, so concurrent orders serialize on it — no two tickets
get the same number and no number is skipped. It's a single hot row per open cycle;
throughput is plenty for a weekly raffle. (If volume ever demanded it, shard the counter —
but do not until measured.)

### Reconciliation cron (belt and suspenders)
A webhook can be lost entirely (endpoint down past Shopify's retry window). A daily
**Vercel Cron** job pulls orders from the Shopify Admin API for the open cycle and asserts
every paid order has its tickets; it replays any missing through the same transaction.
Because minting is idempotent, replay is safe. This is what lets Kevin sleep.

```ts
// vercel.ts
crons: [{ path: '/api/cron/reconcile-tickets', schedule: '0 6 * * *' }]
```

### Webhook hygiene
- **Register topics** for `orders/paid`, `refunds/create`, `orders/cancelled`.
- Respond **fast (<5s)**; do heavy work sync only if it fits, else enqueue to **Vercel Queues** and ack immediately.
- Store `shopify_order_id` so refunds/cancellations can void the matching tickets.
- Node runtime (not Edge) — you need the raw body for HMAC.

---

## 5. Subscriptions (membership) via Shopify selling plans

Membership = a Shopify **selling plan** (subscription) attached to a "Membership" product.
Shopify bills the recurring charge and emits `orders/paid` on each cycle's renewal, which
flows through the exact same webhook and mints the member's multiplied ticket allotment
automatically. Set `users.is_member = true` on first subscription order; clear it on
`subscription_contracts/cancel`. No custom billing code — the multiplier lives in
`promotions` (tier `member`) and is applied in `ticketQuantityFor`.

---

## 6. Attribution — first-party, survives ITP (research-grounded)

**Consensus from practitioners (HN, Simo Ahava, Analyzify):** don't buy an attribution
tool; own a first-party attribution table. That's the `attribution_events` table above.

**Capture path**
1. On first landing, read `utm_*`, `gclid`, `fbclid` from the URL and persist to a
   first-party cookie + `visitor_id` (Simo Ahava's *persist-campaign-data* pattern).
   First-touch wins; do not overwrite on later visits within the window.
2. Pass attribution into the purchase by writing it to **Storefront Cart `attributes`**,
   which Shopify copies to the order's `note_attributes` (the `azfy_*` precedent from
   Analyzify). The `orders/paid` webhook reads them back and writes the row with a real
   `user_id`. **Gotcha:** `note_attributes` silently drop if set after checkout starts —
   set them at cart creation.
3. Also stash `fbp`/`fbc` (Meta) and the GA4 client id in cart attributes so server-side
   CAPI/Measurement Protocol events can be **deduplicated** (`event_id` + `event_name`,
   48h window) against the browser pixel.

**Analytics wiring**
- **GA4**: cross-domain linker (`_gl`) between the Next.js domain and Shopify checkout to
  avoid self-referral; a Shopify **Web Pixel** captures `checkout_completed` (has
  `event.id`/`token` for dedupe).
- **Meta**: Pixel in the browser + **CAPI** server-side from the webhook, hashed `em`/`ph`,
  shared `event_id`.
- The demo's `analytics.ts` `gm:events-v1` is the local stand-in for `attribution_events`;
  `resolvePromo()` already models the tier priority (member → `?promo=` → `utm_*` → organic)
  that the server will enforce.

---

## 7. Messaging

| Channel | Provider | Key facts |
|---|---|---|
| SMS | **Postscript** | `Bearer sk_…`; **double opt-in is enforced** by Postscript — the popup collects consent, `subscribers/add` starts the confirm flow. Mirror status to PG. |
| Marketing email | **Klaviyo** | API v3 `profiles`/`subscriptions`/`events`; use `unique_id` for idempotent event posts; the 2X email tier's list lives here. |
| Transactional email | **SendGrid** | OTP codes, ticket receipts, "you won" — kept separate from marketing so deliverability and consent don't cross. |

Footer + popup signups (`subscribers.ts`, `addEmailSubscriber`) call Klaviyo/Postscript
server-side via a Route Handler; never expose provider keys to the client.

---

## 8. Auth — email/phone OTP

The demo's `session.ts` (`gm:session-v1`) becomes: request code → SendGrid (email) or
Postscript (SMS) sends a 6-digit code → verify server-side → issue an httpOnly, signed
session cookie. Store codes hashed with a short TTL and an attempt cap (rate-limit by
IP + identifier). On success, upsert `users` and link `shopify_customer_gid` so the
account's order/ticket history joins cleanly. Members get their 4× tickets page; the
multiplier is read from `promotions`, never trusted from the client.

---

## 9. Content as Shopify Metaobjects (headless CMS)

Define metaobject types: `cycle`, `winner`, `partner`, `article`, `copy_block`. Kevin edits
in Shopify admin; the storefront reads them through the Storefront API at build time
(ISR) with tag-based revalidation on the `metaobjects/update` webhook. This directly
replaces `cycle-store.ts`, `winners-store.ts`, `partners-store.ts`, `blog-store.ts`,
`content.ts` — same shapes, remote source. The `Copy k="…"` component keeps working; it
just resolves against `copy_block` metaobjects instead of `gm:content-v1`.

---

## 10. Environments, secrets, rollout

- **Env vars** (Vercel): `POSTGRES_URL` (Neon, auto), `SHOPIFY_STOREFRONT_TOKEN`,
  `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`, `POSTSCRIPT_API_KEY`,
  `KLAVIYO_API_KEY`, `SENDGRID_API_KEY`, `META_CAPI_TOKEN`, `SESSION_SECRET`.
- **Preview isolation**: Neon branch per Vercel preview so webhook tests don't touch prod tickets.
- **Migrations**: Drizzle or plain SQL files in `/db/migrations`, run in CI before deploy.
- **Observability**: log every webhook (`processed_webhooks` is already an audit trail);
  alert if the reconciliation cron ever replays >0 tickets (means a webhook was lost).

## 11. Build sequence (4 weeks, 5-day buffer — matches the proposal)
1. **Week 1** — Neon schema + Shopify products (tiers, bundles, membership selling plan) + Storefront cart wiring.
2. **Week 2** — the idempotent `orders/paid` webhook + reconciliation cron + ticket A3 PDF from real data. *This is the risk; do it early.*
3. **Week 3** — OTP auth, account/ticket pages, promotions engine, attribution table + analytics. Public beta.
4. **Week 4** — metaobject CMS migration, messaging providers, admin desks against live data, hardening. Production + 48h watch.

---

*Grounded in: Shopify at-least-once webhook + HMAC docs and the `X-Shopify-Webhook-Id`
dedupe pattern; the Postgres single-counter-row gapless-sequence approach; Simo Ahava's
persist-campaign-data and Analyzify's `note_attributes` attribution precedent; Meta CAPI
event dedup; Postscript enforced double opt-in; Klaviyo v3 idempotency. Mapped file-by-file
against this repo's `src/lib/*` stores.*
