# Sprint 1 — Foundation · Content · Messaging · Ticket-Generate

**Goal (definition of done):** by end of sprint, three things are *live and real*, not mocked:
1. **Email + SMS subscription mechanisms** capture real people into Supabase and the real
   providers (Klaviyo / Postscript), with the admin desks managing and sending.
2. **Content management** — Kevin edits copy and editorial in `/admin` and it persists to
   Supabase and shows on the live site (no more localStorage).
3. **The ticket-generate endpoint** — `POST /api/tickets/generate` mints gapless,
   idempotent ticket numbers into Supabase and the A3 PDF prints from real rows.

Tracks in this sprint: **0 (Foundation)**, **A (Content)**, **B (Messaging)**, **C (generate only)**.
0 must land first; A/B/C then run in parallel.

## Progress
- **Track 0 — Foundation:** ✅ done. Supabase wired; `db/migrations/*` + `pnpm migrate`
  (tracked, idempotent) + `pnpm db:setup` (reset); shared `src/lib/server/db.ts` (pool, tx,
  migrations) + `http.ts` (validation/response shape); `GET /api/health` green. *(Remaining:
  wire migrate into CI.)*
- **Track B — Messaging capture:** ✅ core done + verified. `email_subscribers`/`sms_subscribers`
  tables; `POST /api/subscribe/{email,sms}` (DB-first, normalize, idempotent); provider adapters
  (`postscript`/`klaviyo`/`sendgrid`) that **stub gracefully without keys**; footer + SMS popup
  wired. *(Remaining: add provider keys to flip stub→live; admin manage/**send** desks against
  Supabase; provider unsub/bounce webhooks.)*
- **Track C — Generate:** ✅ endpoint built + stress-proven (`/tptestaqz00`). *(Remaining: A3 PDF
  from real DB rows + `/admin/tickets` on Supabase.)*
- **Track A — Content (Shopify Metaobjects):** ⛔ blocked on Shopify custom-app tokens.

---

## Track 0 — Foundation *(do first; ~2–3 days, blocks the rest)*

**T0.1 Supabase project & envs**
- Create Supabase project (prod). Enable a **branch/preview DB** for Vercel previews.
- Add to Vercel env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooled) + `DIRECT_URL` (migrations).
- Acceptance: `vercel env pull` populates a working `.env.local`; a smoke query runs.

**T0.2 Migrations & schema baseline**
- Adopt Supabase CLI migrations (`supabase/migrations/*.sql`) run in CI before deploy.
- Land the core schema from implementation guide §2: `cycles`, `users`, `tickets`,
  `cycle_counters`, `processed_webhooks`, `promotions`, `attribution_events`,
  `email_subscribers`, `sms_subscribers`, `copy_blocks`, `articles`, `winners`, `partners`.
- Turn on **RLS**; service-role key used only in server code.
- Acceptance: `supabase db reset` rebuilds clean; tables visible in dashboard.

**T0.3 Server data layer & Route Handler conventions**
- `src/lib/server/db.ts` — service-role client, server-only import guard.
- `src/lib/server/http.ts` — zod body parsing, uniform `{ ok, data | error }` JSON shape, error logging.
- One reference `route.ts` merged as the pattern others copy.
- Acceptance: a `/api/health` route returns DB connectivity `ok`.

---

## Track A — Content Management *(Shopify Metaobjects — Kevin's account already exists)*

Content lives in Shopify. Reuse the existing admin desk UIs; their calls proxy the Shopify
Admin API through our server routes. The `<Copy k="…">` component and `CONTENT_FIELDS`
registry stay — only the data source changes to metaobjects.

**A.0 Shopify access**
- Custom app in Kevin's Shopify admin → Admin API token (read/write `metaobjects`, `files`) + Storefront API token.
- Envs: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_API_VERSION`.
- Define metaobject definitions: **per-page** `copy_block` (typed text fields, one per string — NOT a JSON blob), `article`, `winner`, `partner`, `cycle`. Media handled by `file` fields (§A.2).

**A.1 Copy blocks (the `content.ts` CMS)**
- One `copy_block` metaobject **per page** (`homepage`, `tickets`, `popup`, `footer`, …), each
  with individual labeled text fields mapped to `CONTENT_FIELDS` keys; seed via a one-time
  script. Typed fields keep it non-technical-friendly (≤ 40 fields/def — well under).
- `GET /api/content` (Storefront read) + `PUT /api/content` (admin-only → Admin API upsert).
- `getContent()` reads metaobjects server-side (ISR); revalidate on `metaobjects/update` webhook.
- Wire `/admin/content` desk to the endpoints; "reset to default" restores the seed value.
- Acceptance: edit a headline in `/admin/content` (or Shopify admin) → visible on `/` after revalidate.

**A.2 Editorial CRUD (blog, winners, partners, cycles)**
- Metaobjects `article` (markdown/html + SEO fields), `winner`, `partner`, `cycle` (content fields).
- CRUD endpoints under `/api/admin/{articles,winners,partners,cycles}` → Shopify Admin API (admin-guarded).
- Wire the four admin desks + public reads (`/blog`, `/blog/[slug]`, `/winners`, `/partners`).
- **Media (images, video, PDF)** → metaobject `file` fields backed by **Shopify Files**, served
  by Shopify CDN: partner logos, winner photos, car gallery + **video** (hosted file or YouTube
  URL) and **PDF docs** (rules, proposal). Uploaded/picked in the metaobject editor; read via
  `.value.url` in the Storefront API. Media bytes never touch our app.
- Acceptance: publish a blog post with an image, add a winner with a photo, and attach a PDF →
  all live on public pages, served from Shopify CDN.

> Note: the raffle **sequence/state** for a cycle still lives in Supabase (`cycles` row +
> `cycle_counters`); the cycle's *content* (car name, copy, images) is the Shopify `cycle`
> metaobject. Link them by storing `shopify_gid` on the Supabase `cycles` row.

> Admin guard for Sprint 1: a shared secret / allowlisted email via a lightweight check
> (full Supabase Auth admin roles arrive in Sprint 2, Track D).

---

## Track B — Messaging & Subscriptions

Make the SMS popup and footer newsletter real, and give the admin desks send/manage power.

**B.1 Subscriber tables & capture endpoints**
- `email_subscribers`, `sms_subscribers` (mirror `subscribers.ts`: id, contact, source, status, joined_at).
- `POST /api/subscribe/email` and `POST /api/subscribe/sms` — validate, dedupe by normalized contact, insert, then call provider (below). Server-side keys only.
- Repoint `addEmailSubscriber` / `addSmsSubscriber` (footer, `email-popup.tsx`, checkout) at the endpoints.
- Acceptance: submitting the footer form and the SMS popup creates rows + provider profiles.

**B.2 Providers**
- **Postscript (SMS):** `subscribers/add` with `Bearer sk_…`; rely on Postscript's **enforced
  double opt-in** (popup collects consent, confirm handled by Postscript). Mirror confirmed status back.
- **Klaviyo (email):** v3 `profiles` + `subscriptions`; put footer subs on the 2× marketing list; use `unique_id` for idempotency.
- **SendGrid (transactional):** shared sender module (`src/lib/server/mail.ts`) for OTP + receipts — consumed by Tracks C/D.
- Acceptance: a real test phone receives the Postscript confirm; a test email appears as a Klaviyo profile.

**B.3 Admin send/manage**
- `/admin/sms` + `/admin/newsletter`: list/remove subscribers from Supabase; **compose & send**
  a broadcast (Postscript campaign / Klaviyo campaign trigger) — "manage" means send, per Kevin.
- Provider webhooks (`/api/webhooks/{postscript,klaviyo}`) sync unsubscribe/bounce → status column.
- Acceptance: sending a test newsletter from `/admin/newsletter` dispatches via the provider.

---

## Track C — Ticket-Generate Endpoint *(Sprint-1 scope: generate only)*

Ship the money-critical minting logic now, standalone and testable, with the idempotency
contract in place so Sprint 2's Shopify webhook just calls it.

**C.1 Tables** — `cycles`, `tickets`, `cycle_counters`, `processed_webhooks` (from §2).
Seed the current open cycle + counter row.

**C.2 `POST /api/tickets/generate`** (implementation guide §4)
- Input: `{ requestId, cycleId, userId (or contact), lineItems:[{lineId, qty}] }`.
- Single transaction: dedupe on `requestId`/`lineId`; for each unit
  `update cycle_counters set last_ticket = last_ticket + 1 … returning` then insert ticket
  with `on conflict (shopify_line_id, ticket_no) do nothing`. **Gapless + no duplicates.**
- `public_code` from existing `ticket-gen.ts` format (`GM-{cycle}-{hash}-{index}`).
- Auth for Sprint 1: internal secret header (Shopify HMAC replaces it in Sprint 2).
- Acceptance (**must test**): fire the same `requestId` 100× concurrently → exactly N tickets,
  numbered 1..N, no gaps, no dupes. This is Kevin's #1 requirement — write the test.

**C.3 A3 PDF from real data**
- `/admin/tickets` desk + `pdf.ts` `buildCycleSheetsPdf` read **Supabase** rows (replace
  `mock-data` `purchases`), filter by cycle + date range as today. Layout unchanged.
- Acceptance: generate A3 PDF for the seeded cycle from DB-minted tickets.

---

## Cross-cutting acceptance for Sprint 1
- [ ] `/api/health` green; migrations run in CI.
- [ ] Footer email + SMS popup create Supabase rows **and** provider profiles.
- [ ] `/admin/newsletter` can send a real broadcast.
- [ ] `/admin/content` edit persists to Supabase and shows on the live site.
- [ ] A blog post + a winner published from admin appear publicly.
- [ ] `POST /api/tickets/generate` proven idempotent + gapless under concurrency (test in CI).
- [ ] A3 ticket PDF prints from real DB rows.

## Out of scope this sprint (later)
Shopify checkout/cart/subscriptions + `orders/paid` webhook + reconciliation (Sprint 2, Track C).
Supabase Auth OTP + account pages (Sprint 2, Track D). Promotions/attribution/pixels (Sprint 3, Track E).

## Sprint-1 env checklist
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`,
`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_API_VERSION`,
`POSTSCRIPT_API_KEY`, `KLAVIYO_API_KEY`, `SENDGRID_API_KEY`, `INTERNAL_API_SECRET`, `ADMIN_ALLOWED_EMAILS`.
