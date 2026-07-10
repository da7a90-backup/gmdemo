// Generates public/docs/gm-demo-guide.pdf — the demo guide + build proposal,
// styled like the site: paper background, ink text, neon-yellow accents,
// General Sans, GM logo up top.
//
// Run: npx esbuild scripts/generate-demo-guide.ts --bundle --platform=node \
//        --outfile=/tmp/gen-guide.js && node /tmp/gen-guide.js

import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = process.env.GM_ROOT ?? join(__dirname, "..");
const DEMO_URL = "https://gmdemo-orcin.vercel.app";

/* Brand */
const PAPER = rgb(0.945, 0.914, 0.827); // #f1e9d3
const PAPER_LIGHT = rgb(0.969, 0.941, 0.859); // #f7f0db
const INK = rgb(0.086, 0.067, 0.059); // #16110f
const INK2 = rgb(0.239, 0.208, 0.173); // #3d352c
const INK3 = rgb(0.478, 0.435, 0.361); // #7a6f5c
const NEON = rgb(1, 0.949, 0); // #FFF200
const TEAL = rgb(0, 0.659, 0.604); // #00a89a

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52; // page margin
const BOTTOM = 64;

const MARK_G =
  "M292.39,407.73v72.14h109.07l-55.47,160.31h-55.49c-15.99-.51-34.66-3.61-45.52-7.58-32.76-11.97-58.76-36.58-73.21-69.3-14.65-33.19-15.7-70.7-2.95-105.6,20.18-55.25,71.14-92.06,127.29-92.25h148.45s383.51-.02,383.51-.02l61.51-72.14h-445.02s-145.27.02-145.27.02c-.92,0-1.83-.02-2.74-.02-86.52,0-164.85,55.83-195.47,139.65-19.19,52.51-17.52,109.15,4.72,159.5,22.44,50.83,63.08,89.15,114.43,107.91,21.79,7.96,49.68,11.4,68.51,11.95h1.07v.02h107.57l105.38-304.59h-210.36Z";
const MARK_M =
  "M896.8,293.29 L610.39,636.1 L509.92,407.61 L471.51,521.86 L555.26,712.32 L652.46,712.32 L869.72,452.28 L807.21,712.32 L890.68,712.32 L991.4,293.29 Z";
const MARK_MIN_X = 118;
const MARK_MIN_Y = 270;
const MARK_H = 449;
const MARK_W = 880;

function drawMark(page: PDFPage, left: number, top: number, height: number, color = INK) {
  const scale = height / MARK_H;
  const x = left - MARK_MIN_X * scale;
  const y = top + MARK_MIN_Y * scale;
  page.drawSvgPath(MARK_G, { x, y, scale, color });
  page.drawSvgPath(MARK_M, { x, y, scale, color });
}

type Fonts = { reg: PDFFont; semi: PDFFont; bold: PDFFont };

class Doc {
  pdf!: PDFDocument;
  fonts!: Fonts;
  page!: PDFPage;
  y = 0;
  pageNum = 0;

  async init() {
    this.pdf = await PDFDocument.create();
    this.pdf.registerFontkit(fontkit);
    const f = (n: string) => readFileSync(join(ROOT, "public/fonts", n));
    this.fonts = {
      reg: await this.pdf.embedFont(f("GeneralSans-Regular.ttf"), { subset: true }),
      semi: await this.pdf.embedFont(f("GeneralSans-Semibold.ttf"), { subset: true }),
      bold: await this.pdf.embedFont(f("GeneralSans-Bold.ttf"), { subset: true }),
    };
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage([A4_W, A4_H]);
    this.pageNum++;
    this.page.drawRectangle({ x: 0, y: 0, width: A4_W, height: A4_H, color: PAPER });
    // footer
    this.page.drawLine({
      start: { x: M, y: 40 }, end: { x: A4_W - M, y: 40 }, thickness: 0.6, color: INK3,
    });
    this.page.drawText("GENEROUS MOTORS — DEMO GUIDE & BUILD PROPOSAL", {
      x: M, y: 29, size: 6.5, font: this.fonts.semi, color: INK3,
    });
    const pn = String(this.pageNum).padStart(2, "0");
    this.page.drawText(pn, {
      x: A4_W - M - this.fonts.semi.widthOfTextAtSize(pn, 6.5), y: 29, size: 6.5, font: this.fonts.semi, color: INK3,
    });
    this.y = A4_H - M;
  }

  ensure(h: number) {
    if (this.y - h < BOTTOM) this.newPage();
  }

  space(h: number) {
    this.y -= h;
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(probe, size) > width && line) {
        lines.push(line);
        line = w;
      } else {
        line = probe;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  eyebrow(text: string) {
    this.ensure(30);
    // neon tick
    this.page.drawRectangle({ x: M, y: this.y - 3, width: 22, height: 3.5, color: NEON });
    this.page.drawText(text.toUpperCase(), {
      x: M + 30, y: this.y - 5, size: 8, font: this.fonts.semi, color: INK2,
    });
    this.y -= 20;
  }

  h1(text: string) {
    this.ensure(42);
    this.page.drawText(text, { x: M, y: this.y - 20, size: 21, font: this.fonts.bold, color: INK });
    this.y -= 34;
  }

  /** h2 with a neon marker swipe behind it. */
  h2(text: string) {
    this.ensure(36);
    const size = 12.5;
    const w = this.fonts.bold.widthOfTextAtSize(text, size);
    this.page.drawRectangle({
      x: M - 3, y: this.y - 15.5, width: w + 10, height: 16, color: NEON,
    });
    this.page.drawText(text, { x: M + 2, y: this.y - 11.5, size, font: this.fonts.bold, color: INK });
    this.y -= 28;
  }

  h3(text: string) {
    this.ensure(26);
    this.page.drawText(text, { x: M, y: this.y - 11, size: 10.5, font: this.fonts.bold, color: INK });
    this.y -= 20;
  }

  para(text: string, opts: { size?: number; color?: ReturnType<typeof rgb>; indent?: number; font?: PDFFont } = {}) {
    const size = opts.size ?? 9.5;
    const font = opts.font ?? this.fonts.reg;
    const indent = opts.indent ?? 0;
    const width = A4_W - M * 2 - indent;
    const lines = this.wrap(text, font, size, width);
    for (const line of lines) {
      this.ensure(size + 5);
      this.page.drawText(line, { x: M + indent, y: this.y - size, size, font, color: opts.color ?? INK2 });
      this.y -= size + 4.5;
    }
    this.y -= 3;
  }

  bullet(text: string, opts: { bold?: string } = {}) {
    const size = 9.5;
    const width = A4_W - M * 2 - 16;
    const full = opts.bold ? `${opts.bold}  ${text}` : text;
    const lines = this.wrap(full, this.fonts.reg, size, width);
    let first = true;
    for (const line of lines) {
      this.ensure(size + 5);
      if (first) {
        this.page.drawRectangle({ x: M + 2, y: this.y - size + 2.5, width: 4, height: 4, color: NEON });
        this.page.drawRectangle({ x: M + 2, y: this.y - size + 2.5, width: 4, height: 4, borderColor: INK, borderWidth: 0.5 });
      }
      // bold lead-in on the first line
      if (first && opts.bold) {
        const lead = opts.bold;
        const rest = line.slice(lead.length);
        this.page.drawText(lead, { x: M + 14, y: this.y - size, size, font: this.fonts.semi, color: INK });
        this.page.drawText(rest, {
          x: M + 14 + this.fonts.semi.widthOfTextAtSize(lead, size), y: this.y - size, size, font: this.fonts.reg, color: INK2,
        });
      } else {
        this.page.drawText(line, { x: M + 14, y: this.y - size, size, font: this.fonts.reg, color: INK2 });
      }
      this.y -= size + 4.5;
      first = false;
    }
    this.y -= 2;
  }

  /** Two-column row: label (teal, monospace-ish) + description. */
  linkRow(link: string, desc: string) {
    const size = 9;
    const col = 190;
    this.ensure(size + 8);
    this.page.drawText(link, { x: M, y: this.y - size, size, font: this.fonts.semi, color: TEAL });
    const lines = this.wrap(desc, this.fonts.reg, size, A4_W - M * 2 - col);
    let yy = this.y;
    for (const line of lines) {
      this.page.drawText(line, { x: M + col, y: yy - size, size, font: this.fonts.reg, color: INK2 });
      yy -= size + 4;
    }
    this.y = Math.min(this.y - size - 6, yy - 2);
  }

  /** Card panel with a title and body lines. */
  panel(title: string, lines: string[]) {
    const size = 9;
    const pad = 12;
    const width = A4_W - M * 2;
    const wrapped = lines.flatMap((l) => this.wrap(l, this.fonts.reg, size, width - pad * 2));
    const h = pad * 2 + 15 + wrapped.length * (size + 4);
    this.ensure(h + 6);
    this.page.drawRectangle({
      x: M, y: this.y - h, width, height: h, color: PAPER_LIGHT, borderColor: INK3, borderWidth: 0.6,
    });
    this.page.drawText(title.toUpperCase(), {
      x: M + pad, y: this.y - pad - 7, size: 7.5, font: this.fonts.semi, color: INK3,
    });
    let yy = this.y - pad - 22;
    for (const line of wrapped) {
      this.page.drawText(line, { x: M + pad, y: yy, size, font: this.fonts.reg, color: INK2 });
      yy -= size + 4;
    }
    this.y -= h + 8;
  }
}

async function main() {
  const d = new Doc();
  await d.init();

  /* ------------------------------- COVER ------------------------------- */
  drawMark(d.page, M, A4_H - 96, 44);
  d.page.drawText("GENEROUS MOTORS", { x: M + 96, y: A4_H - 118, size: 17, font: d.fonts.bold, color: INK });
  d.page.drawText("DRIVE THE CAR. FUND THE CAUSE.", { x: M + 96, y: A4_H - 132, size: 7, font: d.fonts.semi, color: INK3 });

  d.y = A4_H - 240;
  const titleSize = 34;
  d.page.drawRectangle({ x: M - 4, y: d.y - 10, width: d.fonts.bold.widthOfTextAtSize("Demo Guide", titleSize) + 14, height: 42, color: NEON });
  d.page.drawText("Demo Guide", { x: M + 2, y: d.y, size: titleSize, font: d.fonts.bold, color: INK });
  d.page.drawText("& Build Proposal", { x: M + 2, y: d.y - 44, size: titleSize, font: d.fonts.bold, color: INK });
  d.y -= 110;

  d.para("A working, clickable demonstration of the Generous Motors platform — public site, member accounts, tiered promotions, and a full admin operations dashboard — plus the production architecture, timeline, and investment to ship it for real.", { size: 11, color: INK2 });
  d.space(10);
  d.page.drawText("LIVE DEMO", { x: M, y: d.y - 8, size: 7.5, font: d.fonts.semi, color: INK3 });
  d.page.drawText(DEMO_URL, { x: M, y: d.y - 24, size: 13, font: d.fonts.bold, color: TEAL });
  d.page.drawText("Prepared July 2026 · Demo data only — nothing on the demo represents real entries, orders, or donations.", {
    x: M, y: d.y - 44, size: 8, font: d.fonts.reg, color: INK3,
  });

  /* --------------------------- 1. DEMO GUIDE --------------------------- */
  d.newPage();
  d.eyebrow("Part 01 · The demo");
  d.h1("Everything that's clickable today");
  d.para("The demo persists all admin changes and sign-ins to the browser's local storage — every desk works, nothing needs a server. Open it on desktop for the admin, and on a phone for the buyer experience.");

  d.h2("Public site");
  d.linkRow("/", "Homepage — full-bleed hero with promo countdown, winners wall with Latest Winner card, pricing, live-draw block, charity band, FAQ.");
  d.linkRow("/tickets", "The buy page — gallery with swipe, bundle grid with Buy Now per bundle, membership tab, promo pickup, spec sheet, FAQ + Official Rules.");
  d.linkRow("/tickets?promo=VIP3X", "Same page arriving from an SMS link — 3X promo banner, strikethrough ticket counts, 'Promo closes in' countdown.");
  d.linkRow("/tickets?utm_campaign=ads", "Same page arriving from a paid ad — the advertising tier multiplier picks up from the UTM parameter.");
  d.linkRow("/account/login", "Passwordless sign-in — enter any email; the one-time code appears in the on-page demo inbox.");
  d.linkRow("/account", "Member dashboard — entries with real ticket numbers, current giveaway, member 4X offer.");
  d.linkRow("/account/tickets", "Member buy page — every bundle shows 4-for-1 strikethrough counts, applied automatically.");
  d.linkRow("/winners  /partners", "Winner archive and the partner logo wall (charity partners + brand sponsors).");
  d.linkRow("/blog  /about  /live", "Field notes (admin-publishable), the trust story, and the live-draw page.");
  d.linkRow("/rules  /contact", "Official Rules per Fla. Stat. § 849.0935, and the contact form with auto-confirmation.");

  d.h2("Admin dashboard  —  /admin");
  d.linkRow("/admin/promotions", "The tier framework: per-channel multipliers, promo codes, UTM triggers, end dates with independent countdowns, marketing copy.");
  d.linkRow("/admin/attribution", "Who came from where and who bought — visits, purchases, conversion and revenue per channel, with the raw triggers.");
  d.linkRow("/admin/content", "Copy CMS — 41 fields organized by page (hero words, section headings, popup copy, footer legal), live on publish.");
  d.linkRow("/admin/blog", "Article editor — Markdown or raw HTML with preview, SEO title/description/OG image, SERP preview, publish to /blog.");
  d.linkRow("/admin/cycles", "Cycle desk — draw date (feeds every countdown), entry cap, charity partner selection, and the partner registry.");
  d.linkRow("/admin/tickets", "Barrel printing — filter any cycle + purchase date range, generate the A3 black & white ticket sheets PDF.");
  d.linkRow("/admin/sms", "SMS blasts — compose, attach a promo (adds the trigger link), send to the list, delivery stats per blast.");
  d.linkRow("/admin/newsletter", "The weekly newsletter — compose, attach a promo, send, open/click stats per issue.");

  d.panel("Five-minute walkthrough", [
    "1. Open /tickets?promo=VIP3X and buy a bundle — note the banner, strikethrough counts, and promo countdown.",
    "2. Open /admin/attribution — the visit and purchase are logged under SMS subscribers with the trigger.",
    "3. In /admin/promotions, change the SMS multiplier to 5X and save — reload the promo link and watch it update.",
    "4. In /admin/cycles, move the draw date — the header, hero, and buy-box countdowns all follow.",
    "5. In /admin/tickets, generate the Cycle 12 A3 sheet PDF — logo, holder name, phone, ticket number, 15 per sheet.",
  ]);

  /* ---------------------- 2. PRODUCTION ARCHITECTURE ---------------------- */
  d.space(10);
  d.eyebrow("Part 02 · Production build");
  d.h1("Architecture — simple, one place to manage");
  d.para("Shopify owns money and merchandising. A custom Next.js storefront on Vercel owns the brand experience. Vercel Postgres owns what Shopify can't: ticket numbers, promotions, members, and attribution. The admin dashboard from the demo becomes the single pane of glass; orders are worked in Shopify admin.");

  d.h2("The stack");
  d.bullet("checkout, orders, refunds, subscription billing, product catalog, and the headless CMS (metaobjects) for content, blog posts, winners, and cycles.", { bold: "Shopify —" });
  d.bullet("custom storefront on Vercel; the exact pages in this demo, reading Shopify via the Storefront API. Edge runtime for reads (promo resolution, content), Node serverless for webhooks and PDF generation.", { bold: "Next.js —" });
  d.bullet("tickets, promotions, users/OTP sessions, attribution events. The system of record for everything drawn from the drum.", { bold: "Vercel Postgres —" });
  d.bullet("SMS list + blasts (Postscript), email newsletter (Klaviyo or SendGrid). Campaigns are composed in our admin and sent through their APIs, so day-to-day stays in one place.", { bold: "Postscript + Klaviyo/SendGrid —" });

  d.h2("Catalog modeling on Shopify");
  d.bullet("one product per tier (Essential / Premium / VIP), each with a selling plan. Shopify Subscriptions works headless through the Storefront Cart API: the cart line carries a sellingPlanId, and checkout handles recurring billing. Requires the unauthenticated_read_selling_plans scope.", { bold: "Memberships —" });
  d.bullet("the raffle-platform standard is a unique SKU per bundle so the webhook can map SKU to entry count deterministically. Recommendation: one 'Cycle N Tickets' product with one variant per bundle (1/5/10/25/50/100) — single page, clean reporting, promo-friendly — rather than six separate products. Separate products only if a bundle ever needs its own imagery or ad landing page.", { bold: "Ticket bundles —" });
  d.bullet("entry multipliers live in Postgres (they change entries, not price) exactly as in the demo; price discounts, when used, are Shopify automatic discounts so checkout stays truthful.", { bold: "Promotions —" });

  d.h2("Ticket generation — the part that cannot fail");
  d.para("Tickets are generated by the orders/paid webhook. The design goal is exactly-once issuance: no duplicate numbers, no missing tickets, under retries, concurrency, and partial failures.", { color: INK });
  d.bullet("HMAC-verify every webhook; respond fast; process in a Node serverless function.");
  d.bullet("orders table with a UNIQUE constraint on shopify_order_id. The insert is ON CONFLICT DO NOTHING — a retried or duplicated webhook becomes a no-op. Shopify retries for 48h, and that's safe here.", { bold: "Idempotency:" });
  d.bullet("ticket numbers come from a per-cycle counter row updated atomically (UPDATE ... SET last = last + qty RETURNING last) inside the same transaction as the ticket rows. The row lock serializes concurrent orders — no collisions; the transaction guarantees no gaps if anything fails mid-way.", { bold: "Allocation:" });
  d.bullet("UNIQUE(cycle_id, ticket_number) as the schema-level backstop. If the impossible happens, the database refuses the duplicate rather than issuing it.", { bold: "Backstop:" });
  d.bullet("a reconciliation cron sweeps paid Shopify orders against the tickets table every 15 minutes; anything missed (dropped webhook, outage) is generated then, and drift alerts the team. This closes the 'webhook never arrived' hole.", { bold: "Reconciliation:" });
  d.bullet("the confirmation email with ticket numbers fires only after the transaction commits.", { bold: "Notification:" });

  /* ------------------------- 3. ANALYTICS + MGMT ------------------------- */
  d.newPage();
  d.eyebrow("Part 02 · Production build, continued");
  d.h1("Analytics, attribution & the management split");

  d.h2("GA4, Meta Pixel & UTM tracking");
  d.bullet("GA4 and Meta Pixel load in the Next.js root layout; standard ecommerce events (view_item, add_to_cart, begin_checkout) fire client-side on the storefront.");
  d.bullet("checkout runs on Shopify's domain, so a Shopify custom Web Pixel (Settings, then Customer events) fires checkout and purchase events to the same GA4 / Meta IDs — one property, no double counting.");
  d.bullet("GA4 cross-domain linking connects storefront and checkout sessions; UTM and promo parameters are captured on landing (exactly as the demo does), written to cart attributes, and flow onto the order.");
  d.bullet("the webhook writes the source-to-order mapping to Postgres, so the Attribution desk in the admin shows real conversion and revenue per channel — same screen you see in the demo.");
  d.bullet("Meta Conversions API fires server-side from the webhook for ad-blocker-proof purchase signals.");

  d.h2("Who manages what");
  d.panel("Admin dashboard (ours — everything site-related)", [
    "Promotions & multipliers · attribution · site copy · blog · winners · cycles & partners · ticket sheet printing · SMS blasts · newsletter issues.",
    "Content is stored in Shopify metaobjects, so it is also editable from Shopify admin — one source of truth, two doors.",
  ]);
  d.panel("Shopify admin (money)", [
    "Orders, refunds, chargebacks, customer service, product/price changes, subscription billing states, payouts.",
  ]);
  d.panel("Postscript / Klaviyo (delivery rails)", [
    "Compliance, deliverability, carrier relationships. Campaigns are composed in our admin and dispatched via their APIs.",
  ]);

  /* --------------------------- 4. TIMELINE + $ --------------------------- */
  d.h1("Timeline & investment");

  d.h2("Four weeks, plus a five-day buffer");
  d.bullet("Shopify store setup — products, variants, selling plans, webhooks. Next.js storefront scaffold with the demo's pages. Postgres schema. Email OTP auth.", { bold: "Week 1 —" });
  d.bullet("purchase flows through the Storefront Cart API (bundles + subscriptions), the ticket-generation webhook engine with reconciliation, promotions engine, checkout + post-purchase upsells.", { bold: "Week 2 —" });
  d.bullet("full admin suite on live data, campaign sending through Postscript and Klaviyo/SendGrid, analytics + attribution wiring. Public beta delivered.", { bold: "Week 3 —" });
  d.bullet("hardening, load and security pass, content load, DNS cutover, production deployment.", { bold: "Week 4 —" });
  d.bullet("review rounds, fixes, and the unexpected.", { bold: "Buffer (5 days) —" });

  d.h2("Investment — $7,875 fixed");
  d.para("Excludes Vercel, Shopify, SendGrid/Klaviyo, Postscript subscriptions and any other third-party costs.", { color: INK });
  d.bullet("$1,575 (20%) — advance by bank transfer, schedules the build.");
  d.bullet("$3,937.50 (50%) — at Week 3, on delivery of the public beta.");
  d.bullet("$2,362.50 (30%) — after successful production deployment plus 48 hours with no issue or incident.");

  d.space(8);
  d.panel("Sources — production research", [
    "Shopify: Manage subscription products on storefronts (shopify.dev, Storefront Cart API + sellingPlanId).",
    "ViralSweep: Shopify raffle ticket setup — unique SKU per bundle/variant.",
    "Shopify Help: custom Web Pixels for GA4/Meta on checkout; GA4 cross-domain measurement guides.",
  ]);

  const bytes = await d.pdf.save();
  mkdirSync(join(ROOT, "public/docs"), { recursive: true });
  writeFileSync(join(ROOT, "public/docs/gm-demo-guide.pdf"), bytes);
  console.log("Wrote public/docs/gm-demo-guide.pdf —", bytes.length, "bytes,", d.pageNum, "pages");
}

main();
