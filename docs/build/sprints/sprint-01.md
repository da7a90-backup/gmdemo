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

## Track A — Content Management

Reuse the existing admin desk UIs; swap their `localStorage` calls for endpoints. The
`<Copy k="…">` component and `CONTENT_FIELDS` registry stay — only the data source changes.

**A.1 Copy blocks (the `content.ts` CMS)**
- `copy_blocks(key text pk, value text, updated_at)`; seed from `CONTENT_FIELDS` defaults.
- `GET /api/content` (all overrides) + `PUT /api/content` (admin-only, upsert diffs vs default).
- `getContent()` reads server data server-side; page uses ISR with tag revalidate on save.
- Wire `/admin/content` desk to the endpoints; keep "reset to default" = delete overrides.
- Acceptance: edit a headline in `/admin/content` → visible on `/` after revalidate.

**A.2 Editorial CRUD (blog, winners, partners, cycles)**
- Tables `articles` (markdown/html + SEO fields), `winners`, `partners`, `cycles` (content cols).
- CRUD endpoints under `/api/admin/{articles,winners,partners,cycles}` (admin-guarded).
- Wire the four admin desks + public reads (`/blog`, `/blog/[slug]`, `/winners`, `/partners`).
- **Supabase Storage** buckets for partner logos, winner photos, car gallery; upload from desks.
- Acceptance: publish a blog post + add a winner in admin → live on public pages.

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
`POSTSCRIPT_API_KEY`, `KLAVIYO_API_KEY`, `SENDGRID_API_KEY`, `INTERNAL_API_SECRET`, `ADMIN_ALLOWED_EMAILS`.
