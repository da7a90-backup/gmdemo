# Generous Motors — Productionization Tracks

> Companion to `docs/implementation-guide.md`. That doc is the architecture; this doc is
> **the plan of work**: what the demo actually does today, and how the work splits into
> **tracks** that different people can build in parallel. Interlinked work is folded into a
> single track. Sprints are in `docs/build/sprints/`.

**DB decision:** we use **Supabase Postgres** (Vercel Marketplace or direct) — not Neon.
Everything in the implementation guide that said "Neon/Postgres" means Supabase here. We
get Postgres + Auth + Row Level Security + Storage + Realtime + auto-generated REST/JS
client in one, which collapses several custom pieces (see per-track notes).

**Content decision:** editorial + copy content lives in **Shopify Metaobjects** (Kevin
already has the Shopify account and admin access). Content is read via the Storefront API and
written via the Admin API — no Shopify store buildout is blocking, the account exists.
Supabase is the system of record for the **raffle** only (tickets, subscribers, promos,
attribution, users). Shopify owns content **and** checkout/payments/subscriptions.

---

## 1. What the demo actually is (audit)

Every page renders; **nothing persists to a server**. All state is `localStorage` seeded
from `src/lib/mock-data.ts`, mutated through `src/lib/*` stores, and re-rendered via
`window` events. **There are no API routes (`src/app/api` is empty).** Productionizing =
replacing each store with a real table + endpoint, with the UI mostly unchanged.

### Pages (27 routes)
| Area | Routes | Demoed behavior | Real backend needed |
|---|---|---|---|
| Marketing | `/`, `/about`, `/membership`, `/partners`, `/rules`, `/contact`, `/live` | static + countdowns, partner logos, charity band | content reads (Track A) |
| Tickets | `/tickets`, `/checkout`, `/thank-you` | bundle grid, membership toggle, promo pickup, **fake checkout**, client ticket-ID preview | Commerce + Ticketing (Track C) |
| Blog | `/blog`, `/blog/[slug]` | markdown posts from `blog-store` | content reads (Track A) |
| Winners | `/winners` | winner cards from `winners-store` | content reads (Track A) |
| Account | `/account`, `/account/login`, `/account/tickets` | **client-side fake OTP**, member 4× view | Auth (Track D) |
| Lookup | `/lookup` | email/phone → entries (from mock) | Ticketing + Auth (Track C/D) |
| Legal | `/legal/[slug]` | static | — |
| Admin | `/admin` + `promotions`, `attribution`, `content`, `blog`, `cycles`, `tickets`, `sms`, `newsletter`, `winners` | full CMS/desk UI writing to localStorage | every track's write side |

### Stores (`src/lib`) → owner track
| Store (localStorage key) | Demoed | Track |
|---|---|---|
| `subscribers.ts` (`gm:sms-subs-v1`, `gm:email-subs-v1`) | add/remove SMS + email subs; admin desks | **B** |
| `content.ts` (`gm:content-v1`) | keyed copy CMS, `<Copy k>` overrides | **A** |
| `blog-store.ts` / `winners-store.ts` / `partners-store.ts` / `cycle-store.ts` | editorial CRUD | **A** |
| `ticket-gen.ts` + `pdf.ts` (A3 sheets) | collision-proof IDs, A3 PDF | **C** |
| `session.ts` (`gm:session-v1`) | fake OTP sign-in | **D** |
| `promotions.ts` (`gm:promos-v1`) | tier/multiplier resolve | **E** |
| `analytics.ts` (`gm:events-v1`) | attribution events | **E** |
| `campaigns.ts` | campaign desk | **E** |

---

## 2. Tracks

Six tracks. **Track 0 blocks everyone; A/B/C run in parallel after it; D/E follow.**
Interlinked concerns (checkout↔ticket-mint; OTP↔messaging providers; promo↔attribution↔pixels)
are deliberately kept inside one track each so there's no cross-track handoff mid-feature.

### Track 0 — Platform Foundation · **P0** · blocks all
Supabase project + schema/migrations + typed server client + env management + Route Handler
conventions + session-cookie plumbing. No product feature ships without this.
- Supabase project (prod + a branch/preview DB), `DATABASE_URL` + `SUPABASE_*` in Vercel.
- Migrations tool (Supabase CLI migrations or Drizzle) + `/db/migrations` in repo, run in CI.
- Typed server client (`@supabase/supabase-js` service-role on the server only; RLS on).
- Shared `src/lib/server/` layer + first `route.ts` conventions (zod validation, error shape).
- **Depends on:** nothing. **Unblocks:** A, B, C, D, E.

### Track A — Content Management · **P0** · Sprint 1
Turn all editable content into **Shopify Metaobjects**, read via the Storefront API. Kevin
edits in Shopify admin; the existing `<Copy>` component and admin desks read/write through
our endpoints, which proxy the Shopify Admin API.
- Metaobject types: `copy_block` (mirrors `CONTENT_FIELDS` keys), `article`, `winner`, `partner`, `cycle` (content fields).
- `<Copy>` and public pages read metaobjects via Storefront API at build (ISR); revalidate on the `metaobjects/update` webhook.
- Admin desks (`content`, `blog`, `winners`, `partners`, `cycles`) write via `/api/admin/*` → Shopify Admin API (keys server-side only).
- Media (partner logos, winner photos, car gallery) → **Shopify Files** CDN.
- **Depends on:** Track 0 (envs + route conventions) + Shopify Admin/Storefront tokens. Uses Shopify, not Supabase. **Independent of** B and C.

### Track B — Messaging & Subscriptions · **P0** · Sprint 1
The SMS + email capture and send mechanisms, live end-to-end.
- `email_subscribers` + `sms_subscribers` tables (mirror `subscribers.ts`).
- **SMS = Postscript** (`sk_` bearer, enforced double opt-in) — footer/popup POST to `/api/subscribe/sms`.
- **Email = Klaviyo** (marketing lists / 2× tier) — footer POST to `/api/subscribe/email`.
- **Transactional = SendGrid** (receipts, OTP codes) — shared sender used by D and C.
- Admin `sms` + `newsletter` desks: manage lists, **send** campaigns (not just add rows).
- Provider webhooks (unsub/bounce) reconcile status back to Supabase.
- **Depends on:** Track 0. Provides the OTP/receipt sender that D and C consume.

### Track C — Ticketing & Commerce · **P0 → P1** · Sprint 1 (generate) then Sprint 2 (Shopify)
Interlinked: the ticket-mint endpoint and the Shopify checkout that triggers it are one
feature, so they're one track. Sprinted so the **generate endpoint ships and is testable
before** Shopify is wired.
- **Sprint 1:** `tickets`, `cycles`, `cycle_counters`, `processed_webhooks` tables +
  `POST /api/tickets/generate` — **idempotent, gapless** minting (single-counter-row txn,
  `on conflict do nothing`; see implementation guide §4). Admin `/admin/tickets` A3 PDF reads
  real DB rows. Driveable in Sprint 1 by an authenticated internal/admin call.
- **Sprint 2:** Shopify products (tiers, bundles, membership selling plan), Storefront cart,
  `orders/paid` webhook (HMAC + delivery dedupe) → calls the same generate logic +
  reconciliation cron. Refund/cancel voids tickets.
- **Depends on:** Track 0. Consumes Track B (receipt email), Track E (promo multiplier).

### Track D — Accounts & Auth · **P1** · Sprint 2
Real email/phone OTP, sessions, and account pages backed by real tickets.
- **Use Supabase Auth** (email/phone OTP built in) — replaces the fake `session.ts`; issues
  the session cookie, removes hand-rolled OTP storage/rate-limiting.
- `users` table linked to auth uid; `/account`, `/account/tickets`, `/lookup` read real tickets.
- **Depends on:** Track 0; delivery via Track B (or Supabase's own OTP); data from Track C.

### Track E — Promotions, Attribution & Analytics · **P1** · Sprint 3
Interlinked: promo tiers depend on attribution; attribution feeds the pixels — one track.
- `promotions` table + server-side `resolvePromo` (member → `?promo=` → `utm_*` → organic);
  multiplier consumed by Track C at mint time (never trusted from client).
- `attribution_events` first-party table; cart attributes → order `note_attributes` handoff.
- GA4 + Meta Pixel + **server-side CAPI** (event dedup) from the webhook.
- **Depends on:** Track 0; feeds C (multiplier) and Shopify cart (attribution).

---

## 3. Dependency graph & priority

```
            ┌──────────────── Track 0: Foundation (P0) ────────────────┐
            ▼                        ▼                        ▼
   Track A: Content (P0)   Track B: Messaging (P0)   Track C: Ticketing gen (P0)
        │  Sprint 1             │  Sprint 1                │  Sprint 1
        │                       └──────────┐               │
        │                                  ▼               ▼
        │                        Track D: Auth (P1) ── Track C: Shopify (P1)
        │                            Sprint 2              Sprint 2
        └───────────────────────────────────────────► Track E: Promo/Attr/Analytics (P1)
                                                            Sprint 3
```

| Priority | Meaning | Tracks |
|---|---|---|
| **P0** | Sprint 1 — must exist to demo real value | 0, A, B, C(generate) |
| **P1** | Sprint 2–3 — money + growth | C(Shopify), D, E |

## 4. Sprint map
- **Sprint 1** → Foundation + Content + Messaging + Ticket-generate endpoint. *(this sprint — `sprints/sprint-01.md`)*
- **Sprint 2** → Shopify checkout/subscriptions + `orders/paid` webhook + reconciliation; Supabase Auth + account pages. *(`sprints/sprint-02.md`)*
- **Sprint 3** → Promotions engine + first-party attribution + GA4/Meta CAPI; admin desks against live data; hardening. *(`sprints/sprint-03.md`)*
