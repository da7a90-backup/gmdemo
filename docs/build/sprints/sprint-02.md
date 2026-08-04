# Sprint 2 — Commerce & Accounts

**Goal:** real money in (Shopify checkout + subscriptions) wired to the Sprint-1 generate
endpoint, and real sign-in (Supabase Auth OTP) with account pages backed by real tickets.

Tracks: **A (finish content → metaobjects — TOP)**, **C (Shopify half)**, **D (Auth)**.
Builds directly on Sprint 1's foundation, generate endpoint, and transactional mail.

---

## ⭐ Track A (TOP) — Move ALL remaining hardcoded copy into Shopify metaobjects

**Goal:** every user-facing copy string on every customer-facing page comes from a Shopify
metaobject (editable in Shopify admin), not a hardcoded literal. Kevin edits copy in Shopify;
the site reads it. The deployed demo must keep working via code defaults if Shopify is
unreachable.

**Concrete example of what still needs moving** (from `/live`, `src/app/live/page.tsx`):
```tsx
We'll go live at <strong…>{niceDateTime(drawDateISO)}</strong> on Facebook (primary) with a
YouTube mirror. Tickets close 30 minutes before the stream begins. The drum is loaded on camera.
```
…and ~375 similar strings across the pages below.

### Already done (the pattern to copy)
- **Static page copy** → per-page `copy_<page>` metaobjects (one typed field per string).
  Registry: `CONTENT_FIELDS` in `src/lib/content.ts`. Read client-side via `<Copy k="…">`
  (which calls `ensureRemoteContent()` → `/api/content`) and server-side via
  `getContentServer()` in `src/lib/server/copy.ts`. Seeded by `POST /api/admin/copy/seed`
  (`ensureCopy()`), which creates a `copy_<page>` metaobject definition + a `default` entry per
  page. **Covered so far:** homepage hero/how-it-works/pricing/live/charity/faq eyebrows+headings,
  tickets buy box, SMS popup, footer mission/newsletter/fineprint (~60 keys).
- **Repeatable lists** → one metaobject entry per item, e.g. `article` (`src/lib/server/blog-shopify.ts`)
  and `faq_item` (`src/lib/server/faq.ts` + `src/lib/faq-data.ts` defaults + `/api/faq` + the
  `faq-accordion` fetch-with-fallback). **Copy this pattern** for other repeated content.
- **Media** → uploaded to Shopify Files from admin (`src/lib/server/shopify-files.ts`,
  `/api/admin/upload`, `<ImageUpload>`/`<GalleryUpload>`). Done; not part of this task.

### A.0 — Infra prerequisite (do FIRST)
`ensureCopy()` currently only **creates** definitions; it can't add fields to an existing one,
and Shopify deletes definitions **asynchronously** (delete-then-recreate fails with
"key in use" — this already bit us). So before adding more `copy_<page>` fields, make
`ensureCopy()` **non-destructive & incremental**:
1. `metaobjectDefinitionByType(type)` → read existing field keys.
2. If missing → create with all fields (current behaviour).
3. If exists → `metaobjectDefinitionUpdate(id, { fieldDefinitions: [{ create: {…} }, …] })` to
   add only the **new** fields.
4. Then read the `default` entry's fields and `metaobjectUpdate` **only the missing** field
   values (defaults) — never overwrite Kevin's existing edits.
(There's a stale destructive `deleteCopyDefinition` in `copy.ts` — remove or repurpose it.)

### A.1 — Constraints & structure
- **40 fields max per metaobject definition.** Pages with lots of copy must be split. Use the
  `page` field in `CONTENT_FIELDS` as the definition key: give big pages sub-page groups
  (e.g. `page: "Rules"`, `page: "About"`, `page: "About — process"`) so each `copy_<page>`
  stays < 40 fields.
- **Field keys**: `content.key.with.dots` → metaobject field key `content_key_with_dots`
  (dots→underscores; the keys have no natural underscores). Handled by `fieldKey`/`contentKey`.
- **`long: true`** in `CONTENT_FIELDS` → `multi_line_text_field`; else `single_line_text_field`.

### A.2 — Repeatable lists → their own metaobject type (like `faq_item`)
Model these as one entry per item (question/answer-style), with a defaults file + `/api/<x>`
read endpoint + fetch-with-fallback in the component, and seeding in `src/lib/server/seed.ts`:
- **`rule_section`** — the 9 Official Rules sections (`/rules`): `title`, `body`, `sort`.
- **`legal_doc`** — the 4 legal pages (`/legal/[slug]`): `slug`, `title`, `body`.
- **`about_step`** — About process steps; **`membership_perk`** — membership loyalty/perk rows.

### A.3 — Singleton page copy → `copy_<page>` fields (extend `CONTENT_FIELDS` + wire)
Add every remaining literal below to `CONTENT_FIELDS` (new `page` groups, < 40 fields each),
re-seed (`/api/admin/copy/seed` after A.0), and replace the JSX literals with `<Copy k>` (client
components) or `copy["…"]` from `getContentServer()` (server components/pages — make them
`async`). Keep the current English as the `def` (also the fallback → deployed demo still works).

**Audit inventory (approx. string counts) — the full remaining surface:**
| Page / component | ~strings | Notes |
|---|---|---|
| `components/site-footer.tsx` | ~20 | nav column titles + links, subscribe, badges (global) |
| `components/site-header.tsx` | ~10 | nav labels, Account/Sign in, Buy tickets, aria |
| `components/countdown.tsx` | ~6 | "Live Drawing in:", days/hours/minutes/seconds |
| `components/charity-band.tsx` | ~12 | CTAs, stat labels, wrapper text |
| `components/pricing-tiers.tsx` | ~13 | One-time/Monthly, Buy now, tier chrome |
| `components/live-draw-block.tsx` | ~8 | the 3 step cards + labels |
| `components/winners-carousel.tsx` / `latest-winner-card` / `winners-gallery` | ~15 | headings, "Full archive", "Cycle №", reveal labels |
| `components/marquee.tsx` (TopAnnounce) | ~4 | incl. hardcoded "Drawn live Sat Jul 12…" date |
| `components/email-popup.tsx` | ~9 | incl. **TCPA legal disclosure** |
| `components/campaign-desk.tsx` | ~18 | admin — lower priority |
| `app/tickets/tickets-buy.tsx` | ~30 | trust badges, charity band copy, stat labels |
| `app/winners/page.tsx` | ~15 | + still imports `winners`/`lifetimeStats` directly (use hooks) |
| `app/blog/page.tsx` | ~9 | section labels, "Read the post" |
| `app/partners/page.tsx` | ~9 | headings, sponsor CTA |
| `app/about/page.tsx` | ~30 | mission, process, charity flow, stat labels |
| `app/membership/page.tsx` | ~20 | headings, "the math", loyalty steps (+ `membershipTiers`) |
| `app/contact/page.tsx` | ~14 | labels, placeholders, confirmation |
| `app/rules/page.tsx` | ~25 | **9 legal sections** → `rule_section` (A.2) |
| `app/live/page.tsx` | ~15 | the example above + counter/reminder copy |
| `app/lookup/lookup-client.tsx` | ~30 | labels, table headers, empty states |
| `app/thank-you/thank-you-client.tsx` | ~30 | confirmation, bonus offer, receipt labels |
| `app/legal/[slug]/page.tsx` | ~11 | **4 docs** → `legal_doc` (A.2) |
| `app/account/*` | ~45 | member views, login (may defer with Track D) |

### A.4 — Explicitly OUT of scope (leave hardcoded)
- Admin desks (`/admin/*`) — internal tooling, not marketing copy.
- The dev test bench (`/tptestaqz00`).
- The simulated checkout (`checkout-client.tsx`) — replaced by real Shopify checkout in **C.5**.
- Brand SVGs (`logo.tsx`), payment-card SVGs, aria-only labels (optional).

### A.5 — Data still on `@/lib/mock-data` to also finish wiring (not copy, but flagged in audit)
`ticketTiers`/`membershipTiers` → Shopify products (Track C). `lifetimeStats` used **directly**
on `/winners` + `/about` (should use `useLifetimeStats()`/server stat fetch). `winners` used
directly on `/winners/page.tsx` (use `listWinners()` server-side or `useWinners()`). `entryDB`
(lookup/account) → real tickets (Track D). `blogPosts` in `/blog/[slug]` `generateStaticParams`
→ generate from Shopify articles or make the route dynamic.

### Acceptance
- Grep the customer-facing pages: no user-facing copy **string literal** left in JSX (excluding
  A.4). Editing a value in Shopify admin → shows on the site (test one per new definition).
- `pnpm exec tsc --noEmit` clean; every touched page still renders; deployed demo (no DB/Shopify
  env) still shows the English defaults.

---

## Track C — Shopify commerce → ticket mint
- **C.4** Shopify store: products per **tier** and per **bundle**; **membership = selling plan**
  (subscription). Prices/discounts live in Shopify, not our code.
- **C.5** Storefront cart wiring from `/tickets` + `/checkout` (replace the simulated checkout);
  write attribution to **cart attributes** (feeds Track E next sprint).
- **C.6** `POST /api/webhooks/orders-paid` — **HMAC verify** + `X-Shopify-Webhook-Id`
  delivery-dedupe, then call the Sprint-1 generate logic. Node runtime, raw body, always 2xx once stored.
- **C.7** Refund/cancel webhooks void matching tickets; membership renewal `orders/paid`
  mints the member allotment automatically; `subscription_contracts/cancel` clears `is_member`.
- **C.8** **Reconciliation cron** (`vercel.ts` crons, daily): pull Shopify orders for the open
  cycle, replay any missing tickets through the idempotent endpoint. Alert if replay > 0.
- Acceptance: a real test checkout mints the correct tickets exactly once; a duplicate
  webhook delivery mints nothing extra; a killed function mid-write is repaired by the cron.

## Track D — Accounts & Auth
- **D.1** Adopt **Supabase Auth** (email/phone OTP) — retire the fake `session.ts`; sessions
  via Supabase cookies. OTP delivery via Supabase or Sprint-1 SendGrid/Postscript sender.
- **D.2** `users` table linked to auth uid + `shopify_customer_gid`; set `is_member` from subscription.
- **D.3** `/account`, `/account/tickets`, `/lookup` read **real** tickets for the signed-in
  user (member 4× view reflects real multiplier once Track E lands).
- **D.4** Promote the Sprint-1 stopgap admin guard to real Supabase **admin roles** (RLS policies).
- Acceptance: OTP sign-in issues a real session; account tickets page lists the user's minted tickets.

## Dependencies
**Track A is independent** — it only touches copy/metaobjects and can start immediately in a
clean context (start with A.0). C.6 depends on Sprint-1 C.2 (generate) + B (receipt mail).
D depends on Sprint-1 Track 0. Attribution on cart (C.5) is *captured* here but *consumed* in
Sprint 3 (Track E).
