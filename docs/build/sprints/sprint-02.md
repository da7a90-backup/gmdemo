# Sprint 2 — Commerce & Accounts

**Goal:** real money in (Shopify checkout + subscriptions) wired to the Sprint-1 generate
endpoint, and real sign-in (Supabase Auth OTP) with account pages backed by real tickets.

Tracks: **C (Shopify half)**, **D (Auth)**. Builds directly on Sprint 1's foundation,
generate endpoint, and transactional mail.

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
C.6 depends on Sprint-1 C.2 (generate) + B (receipt mail). D depends on Sprint-1 Track 0.
Attribution on cart (C.5) is *captured* here but *consumed* in Sprint 3 (Track E).
