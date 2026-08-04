// Seed the demo's mock content into Supabase — but as CYCLE 1 (not 12), and just
// ONE winner. Idempotent (resets editorial tables). Media urls are the demo's
// local asset paths for now; swap for Shopify Files CDN urls later.
import { withClient } from "./db";
import { activeDraw, winners as mockWinners, blogPosts } from "@/lib/mock-data";
import { upsertArticle, ensureArticleDefinition } from "./blog-shopify";

// One real partner for the current cycle (the rest were placeholder/fake).
const SEED_PARTNERS: { name: string; kind: "charity" | "sponsor"; logoUrl?: string; url?: string; blurb?: string }[] = [
  { name: "Habitat for Humanity", kind: "charity", url: "https://www.habitat.org", blurb: "Current cycle partner — shelter for families across the US." },
];

export async function seedContent() {
  return withClient(async (c) => {
    // 1) partners
    await c.query(`delete from partners`);
    const partnerIdByName = new Map<string, number>();
    for (let i = 0; i < SEED_PARTNERS.length; i++) {
      const p = SEED_PARTNERS[i];
      const row = (
        await c.query(
          `insert into partners (name, kind, logo_url, url, blurb, sort) values ($1,$2,$3,$4,$5,$6) returning id`,
          [p.name, p.kind, p.logoUrl ?? null, p.url ?? null, p.blurb ?? null, i],
        )
      ).rows[0];
      partnerIdByName.set(p.name, row.id as number);
    }

    // 2) blog articles → Shopify metaobjects (type "article")
    await ensureArticleDefinition();
    for (const b of blogPosts) {
      await upsertArticle({
        slug: b.slug, title: b.title, author: b.author, tag: b.tag,
        excerpt: b.excerpt, body: b.body, format: "markdown", published: true,
        dateISO: new Date(b.date).toISOString(), seo: {},
      }).catch(() => {});
    }

    // 3) one winner
    await c.query(`delete from winners`);
    const w = mockWinners[0];
    await c.query(
      `insert into winners (first_name, last_initial, city, state, vehicle, draw_cycle, charity, quote, draw_date, photo_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [w.firstName, w.lastInitial, w.city, w.state, w.vehicle, w.drawCycle, w.charity, w.quote, w.drawDateISO, w.photo],
    );

    // 4) the open cycle → cycle 1, with the prize from the mock activeDraw
    const v = activeDraw.vehicle;
    const charityId = partnerIdByName.get(activeDraw.charity.name) ?? null;
    await c.query(
      `update cycles set code='1', vehicle_label=$1, draw_date=$2, charity_partner_id=$3, charity_blurb=$4,
         vehicle_year=$5, vehicle_make=$6, vehicle_model=$7, vehicle_trim=$8, value_usd=$9,
         price_per_ticket_usd=$10, tickets_sold=$11, images=$12, headline_specs=$13, spec_groups=$14
       where id = (select id from cycles where status='open' order by id limit 1)`,
      [`${v.year} ${v.make} ${v.model}`, activeDraw.drawDateISO, charityId, activeDraw.charity.blurb,
       v.year, v.make, v.model, v.trim, v.valueUSD, activeDraw.pricePerTicketUSD, activeDraw.ticketsSold,
       JSON.stringify(v.images), JSON.stringify(v.headlineSpecs), JSON.stringify(v.specGroups)],
    );

    // 5) lifetime stats — honest cycle-1 numbers (nothing drawn/donated yet)
    await c.query(
      `insert into site_settings (key, value) values ('lifetime_stats', $1)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify({ totalDonatedUSD: 0, charitiesFunded: 1, cyclesRun: 1, carsGivenAway: 0, ticketsCounted: 0 })],
    );

    return { partners: SEED_PARTNERS.length, articles: blogPosts.length, winners: 1, cycle: 1 };
  });
}
