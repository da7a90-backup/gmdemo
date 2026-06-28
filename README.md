# Generous Motors — Non-Functional Web Demo

A clickable, animated, ticket-printing Next.js demo for Kevin's US 501(c)(3) car-raffle. **Non-functional** = no real payments, no real database, no real charity wire, no real draw. Every flow is mocked end-to-end but feels like the real thing.

## Run it

```sh
pnpm install      # only if you haven't yet
pnpm dev          # http://localhost:3000
```

If you previously ran the demo on port 3737, that still works: `PORT=3737 pnpm dev`.

> Node ≥ 20.9 is preferred. The repo was pinned back to Next 15 to support Node 20.3.x. Upgrade Node to roll forward to Next 16 later.

## What's in the demo

| Route | Purpose |
|---|---|
| `/` | Home: hero, 4-step explainer, 3-tier pricing (toggle to monthly), charity band, winners gallery, live-draw block, FAQ |
| `/tickets` | Tickets: same pricing + a charity-coloured **membership upsell banner** that does the math vs one-off tickets, plus a card row for other open cycles |
| `/membership` | Standalone membership page with 3-tier ladder + loyalty multiplier visualization |
| `/checkout` | Shopify-clone 2-col checkout, mock express buttons, all form fields **prefilled** with mock data, Stripe-style card row |
| `/thank-you` | Confetti burst, animated entry counter, staggered ticket-card reveal, **"Download your tickets (A3 PDF)"** button |
| `/winners` | Full archive of mock winners (8) with KPI strip |
| `/about` | Story + draw mechanics + 4-step charity flow + transparency strip |
| `/blog` | Featured post + 4-tile grid; `/blog/[slug]` renders full posts |
| `/lookup` | Email **or** phone toggle → finds active draws + past history table. Try the demo account (`demo@generousmotors.org`) — click the link under the search box. |
| `/free-entry` | AMOE (mail-in) instructions |
| `/live` | Pre-stream countdown + "Facebook Live + YouTube mirror" CTA + live counter |

## Ticket PDF generator

Client-side, via `pdf-lib`. Triggered from `/thank-you` → "Download your tickets (A3 PDF)".

- **A3 portrait** (842×1191 pt).
- **3 × 5 grid = 15 tickets per sheet.** More tickets → multiple sheets.
- **Collision-proof IDs:** `GM-{cycle:0>3}-{userHash:6}-{ticketIndex:0>4}` where `userHash` is an FNV-1a hash of the buyer's email (or phone if email is absent) encoded in Crockford base32. Same buyer always gets a stable 6-char fingerprint; cycle prefix prevents cross-cycle collision.
- Each ticket shows: cycle, vehicle, ticket ID, buyer initial+city, draw date, charity strip, dashed cut line, stub.

## Stack

- **Next 15.5** App Router · React 19 · TypeScript
- **Tailwind v4** (CSS-only `@theme` tokens, no `tailwind.config`)
- **Framer Motion 12** for animations (subtle, one-shot, honors `prefers-reduced-motion`)
- **pdf-lib** for A3 ticket PDF
- **lucide-react** icons
- `src/lib/mock-data.ts` is the single source of truth for draws, tiers, members, winners, blog posts, and the lookup entry DB

## Design tokens

Defined in `src/app/globals.css`. Colors:

| Token | Hex | Use |
|---|---|---|
| `bg` | `#faf7f2` | warm off-white page bg |
| `bg-alt` | `#f2eee6` | secondary surface |
| `surface` | `#ffffff` | cards |
| `ink` | `#16161a` | body copy (AAA on bg) |
| `ink-muted` | `#3c3c42` | secondary text |
| `accent` | `#ff5a1f` | primary CTA, urgency |
| `accent-soft` | `#ffe9de` | CTA tint backgrounds |
| `charity` | `#0f6b49` | donations, trust, member tier |
| `charity-soft` | `#e6f2ec` | charity backgrounds |

Type scale starts at body 18 px / 1.55 line-height (passes WCAG SC 1.4.4 + senior-readability research). Hero uses a display face (Bricolage Grotesque) clamped 44–88 px.

## Animations

All one-shot, all subtle, all behind `prefers-reduced-motion`. No carousels.

- `/thank-you` confetti — 28 pieces, single 2.6 s fall, no loop.
- `/thank-you` tickets — staggered spring-in (delay 0.5 s + 0.07 s/index).
- Counters across the site — count-up on first viewport entry, easing cubic.
- Progress bar in hero — 700 ms width tween.

## Important caveats

- **No real payments, no real DB.** Sessions persist via `sessionStorage` only.
- **The lookup demo account** is hard-coded: email `demo@generousmotors.org` or phone `(555) 010-1234`. Any other email/phone returns empty state.
- **Legal copy** in the footer is placeholder boilerplate. Kevin's counsel must replace it before any functional launch.
- **No real images** — vehicles + winners are styled CSS placeholders. Drop real photos into `public/vehicles/` and `public/winners/` and update the paths in `src/lib/mock-data.ts`.
