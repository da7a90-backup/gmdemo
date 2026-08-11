// Admin-managed editorial content in Supabase (partners, winners, articles, cycle).
// Functions return objects in the demo's shapes so the admin desks + public pages
// wire up with minimal change. Media URLs point at Shopify Files (CDN).
import crypto from "node:crypto";
import { query } from "./db";
import { DEFAULT_PROMOS, type PromoTier } from "@/lib/promotions";

type Row = Record<string, unknown>;

// ───────────────────────────── partners ─────────────────────────────
export type Partner = { id: string; name: string; kind: "charity" | "sponsor"; logoUrl?: string; url?: string; blurb?: string };
const toPartner = (r: Row): Partner => ({
  id: String(r.id), name: r.name as string, kind: r.kind as "charity" | "sponsor",
  logoUrl: (r.logo_url as string) ?? undefined, url: (r.url as string) ?? undefined, blurb: (r.blurb as string) ?? undefined,
});
export async function listPartners(): Promise<Partner[]> {
  return (await query(`select * from partners order by sort, id`)).rows.map(toPartner);
}
export async function createPartner(p: Omit<Partner, "id">): Promise<Partner> {
  const r = await query(
    `insert into partners (name, kind, logo_url, url, blurb) values ($1,$2,$3,$4,$5) returning *`,
    [p.name, p.kind, p.logoUrl ?? null, p.url ?? null, p.blurb ?? null],
  );
  return toPartner(r.rows[0]);
}
export async function deletePartner(id: number) {
  await query(`delete from partners where id = $1`, [id]);
}

// ───────────────────────────── winners ─────────────────────────────
export type Winner = {
  id: string; firstName: string; lastInitial: string; city: string; state: string;
  vehicle: string; drawCycle: number; charity: string; quote: string; drawDateISO: string;
  photo: string; videoClipUrl?: string;
};
const toWinner = (r: Row): Winner => ({
  id: String(r.id), firstName: r.first_name as string, lastInitial: (r.last_initial as string) ?? "",
  city: (r.city as string) ?? "", state: (r.state as string) ?? "", vehicle: r.vehicle as string,
  drawCycle: (r.draw_cycle as number) ?? 0, charity: (r.charity as string) ?? "", quote: (r.quote as string) ?? "",
  drawDateISO: r.draw_date ? new Date(r.draw_date as string).toISOString() : "",
  photo: (r.photo_url as string) ?? "", videoClipUrl: (r.video_url as string) ?? undefined,
});
export async function listWinners(): Promise<Winner[]> {
  return (await query(`select * from winners order by draw_cycle desc nulls last, id desc`)).rows.map(toWinner);
}
export async function createWinner(w: Omit<Winner, "id">): Promise<Winner> {
  const r = await query(
    `insert into winners (first_name, last_initial, city, state, vehicle, draw_cycle, charity, quote, draw_date, photo_url, video_url)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
    [w.firstName, w.lastInitial || null, w.city || null, w.state || null, w.vehicle, w.drawCycle || null,
     w.charity || null, w.quote || null, w.drawDateISO || null, w.photo || null, w.videoClipUrl || null],
  );
  return toWinner(r.rows[0]);
}
/**
 * Draw a winner from a cycle's real entries — crypto-random, weighted by entry count
 * (each entry = one chance). Defaults to the open cycle. Returns the winning buyer's
 * contact + ticket, or null if there are no entries. Does NOT record anything.
 */
export async function drawWinner(cycleCode?: string): Promise<{ email: string | null; fullName: string; ticket: string; cycleCode: string; prize: string } | null> {
  const cyc = (
    cycleCode
      ? await query(`select id, code, vehicle_label from cycles where code = $1`, [cycleCode])
      : await query(`select id, code, vehicle_label from cycles where status = 'open' order by id limit 1`)
  ).rows[0] as { id: number; code: string; vehicle_label: string | null } | undefined;
  if (!cyc) return null;

  const blocks = (
    await query(
      `select eb.seq_start, eb.seq_end, u.email, o.order_token, coalesce(o.full_name, '') as name
       from entry_blocks eb
       join users u on u.id = eb.user_id
       join orders o on o.id = eb.order_id
       where eb.cycle_id = $1 and not eb.voided`,
      [cyc.id],
    )
  ).rows as { seq_start: number; seq_end: number; email: string | null; order_token: string; name: string }[];

  const weighted = blocks.map((b) => ({ ...b, entries: Math.max(0, b.seq_end - b.seq_start + 1) }));
  const total = weighted.reduce((s, b) => s + b.entries, 0);
  if (total <= 0) return null;

  let k = crypto.randomInt(1, total + 1);
  let win = weighted[0];
  for (const b of weighted) {
    if (k <= b.entries) { win = b; break; }
    k -= b.entries;
  }
  return {
    email: win.email ?? null,
    fullName: win.name || (win.email ? win.email.split("@")[0] : "Winner"),
    ticket: `GM${String(cyc.code).padStart(2, "0")}-${win.order_token}`,
    cycleCode: String(cyc.code),
    prize: cyc.vehicle_label ?? "",
  };
}

export async function deleteWinner(id: number) {
  await query(`delete from winners where id = $1`, [id]);
}

// ───────────────────────────── articles ─────────────────────────────
export type Article = {
  id: string; slug: string; title: string; author: string; tag: string; excerpt: string;
  body: string; format: "markdown" | "html"; published: boolean; dateISO: string;
  seo: { title?: string; description?: string; ogImage?: string };
};
const toArticle = (r: Row): Article => ({
  id: String(r.id), slug: r.slug as string, title: r.title as string, author: (r.author as string) ?? "",
  tag: (r.tag as string) ?? "", excerpt: (r.excerpt as string) ?? "", body: (r.body as string) ?? "",
  format: (r.format as "markdown" | "html") ?? "markdown", published: !!r.published,
  dateISO: r.published_at ? new Date(r.published_at as string).toISOString() : new Date(r.created_at as string).toISOString(),
  seo: { title: (r.seo_title as string) ?? undefined, description: (r.seo_description as string) ?? undefined, ogImage: (r.og_image as string) ?? undefined },
});
export async function listArticles(opts?: { publishedOnly?: boolean }): Promise<Article[]> {
  const where = opts?.publishedOnly ? `where published` : ``;
  return (await query(`select * from articles ${where} order by coalesce(published_at, created_at) desc`)).rows.map(toArticle);
}
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const r = await query(`select * from articles where slug = $1`, [slug]);
  return r.rows[0] ? toArticle(r.rows[0]) : null;
}
export async function upsertArticle(a: Omit<Article, "id"> & { id?: string }): Promise<Article> {
  const publishedAt = a.published ? (a.dateISO || null) : null;
  const r = await query(
    `insert into articles (slug, title, author, tag, excerpt, body, format, published, published_at, seo_title, seo_description, og_image)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (slug) do update set
       title=excluded.title, author=excluded.author, tag=excluded.tag, excerpt=excluded.excerpt,
       body=excluded.body, format=excluded.format, published=excluded.published, published_at=excluded.published_at,
       seo_title=excluded.seo_title, seo_description=excluded.seo_description, og_image=excluded.og_image, updated_at=now()
     returning *`,
    [a.slug, a.title, a.author || null, a.tag || null, a.excerpt || null, a.body || null, a.format,
     a.published, publishedAt, a.seo?.title || null, a.seo?.description || null, a.seo?.ogImage || null],
  );
  return toArticle(r.rows[0]);
}
export async function deleteArticle(id: number) {
  await query(`delete from articles where id = $1`, [id]);
}

// ───────────────────────── cycle + prize content ─────────────────────────
export type Spec = { label: string; value: number; suffix: string; decimals?: number };
export type SpecGroup = { title: string; rows: { k: string; v: string }[] };
export type CycleFull = {
  id: string; cycle: number; code: string;
  vehicleLabel: string; drawDateISO: string;
  charityPartnerId?: string; charityBlurb?: string;
  charity: { name: string; blurb: string; url: string };
  vehicle: {
    year: number; make: string; model: string; trim: string; valueUSD: number;
    images: string[]; image: string; headlineSpecs: Spec[]; specGroups: SpecGroup[];
  };
  ticketsSold: number; pricePerTicketUSD: number;
  livestreamFacebook: string; livestreamYoutube: string;
};
const toCycle = (r: Row): CycleFull => {
  const images = (r.images as string[]) ?? [];
  return {
    id: String(r.id), cycle: Number(r.code) || 0, code: r.code as string,
    vehicleLabel: (r.vehicle_label as string) ?? "",
    drawDateISO: r.draw_date ? new Date(r.draw_date as string).toISOString() : "",
    charityPartnerId: r.charity_partner_id != null ? String(r.charity_partner_id) : undefined,
    charityBlurb: (r.charity_blurb as string) ?? undefined,
    charity: {
      name: (r.charity_name as string) ?? "", blurb: (r.charity_blurb as string) ?? "",
      url: (r.charity_url as string) ?? "",
    },
    vehicle: {
      year: (r.vehicle_year as number) ?? 0, make: (r.vehicle_make as string) ?? "",
      model: (r.vehicle_model as string) ?? "", trim: (r.vehicle_trim as string) ?? "",
      valueUSD: (r.value_usd as number) ?? 0, images, image: images[0] ?? "",
      headlineSpecs: (r.headline_specs as Spec[]) ?? [], specGroups: (r.spec_groups as SpecGroup[]) ?? [],
    },
    ticketsSold: (r.tickets_sold as number) ?? 0, pricePerTicketUSD: (r.price_per_ticket_usd as number) ?? 0,
    livestreamFacebook: (r.livestream_facebook as string) ?? "", livestreamYoutube: (r.livestream_youtube as string) ?? "",
  };
};
export type CycleUpdate = Partial<{
  vehicleLabel: string; drawDateISO: string; charityPartnerId: string | null; charityBlurb: string;
  vehicleYear: number; vehicleMake: string; vehicleModel: string; vehicleTrim: string;
  valueUSD: number; pricePerTicketUSD: number; ticketsSold: number;
  images: string[]; headlineSpecs: Spec[]; specGroups: SpecGroup[];
  livestreamFacebook: string; livestreamYoutube: string;
}>;
export async function getCurrentCycle(): Promise<CycleFull | null> {
  const r = await query(
    `select c.*, p.name as charity_name, p.url as charity_url
     from cycles c left join partners p on p.id = c.charity_partner_id
     where c.status = 'open' order by c.id limit 1`,
  );
  return r.rows[0] ? toCycle(r.rows[0]) : null;
}
export async function updateCurrentCycle(c: CycleUpdate): Promise<CycleFull | null> {
  const r = await query(
    `update cycles set
       vehicle_label = coalesce($1, vehicle_label), draw_date = coalesce($2, draw_date),
       charity_partner_id = coalesce($3, charity_partner_id), charity_blurb = coalesce($4, charity_blurb),
       vehicle_year = coalesce($5, vehicle_year), vehicle_make = coalesce($6, vehicle_make),
       vehicle_model = coalesce($7, vehicle_model), vehicle_trim = coalesce($8, vehicle_trim),
       value_usd = coalesce($9, value_usd), price_per_ticket_usd = coalesce($10, price_per_ticket_usd),
       tickets_sold = coalesce($11, tickets_sold), images = coalesce($12, images),
       headline_specs = coalesce($13, headline_specs), spec_groups = coalesce($14, spec_groups),
       livestream_facebook = coalesce($15, livestream_facebook), livestream_youtube = coalesce($16, livestream_youtube)
     where id = (select id from cycles where status='open' order by id limit 1) returning *`,
    [c.vehicleLabel ?? null, c.drawDateISO ?? null,
     c.charityPartnerId ? Number(c.charityPartnerId) : null, c.charityBlurb ?? null,
     c.vehicleYear ?? null, c.vehicleMake ?? null, c.vehicleModel ?? null, c.vehicleTrim ?? null,
     c.valueUSD ?? null, c.pricePerTicketUSD ?? null, c.ticketsSold ?? null,
     c.images ? JSON.stringify(c.images) : null,
     c.headlineSpecs ? JSON.stringify(c.headlineSpecs) : null,
     c.specGroups ? JSON.stringify(c.specGroups) : null,
     c.livestreamFacebook ?? null, c.livestreamYoutube ?? null],
  );
  return r.rows[0] ? getCurrentCycle() : null; // re-read with the partner join
}

// ───────────────────────────── site settings ─────────────────────────────
export type LifetimeStats = {
  totalDonatedUSD: number; charitiesFunded: number; cyclesRun: number;
  carsGivenAway: number; ticketsCounted: number;
};
export async function getLifetimeStats(): Promise<LifetimeStats | null> {
  const r = await query(`select value from site_settings where key = 'lifetime_stats'`);
  return r.rows[0] ? (r.rows[0].value as LifetimeStats) : null;
}
export async function updateLifetimeStats(s: Partial<LifetimeStats>): Promise<LifetimeStats> {
  const cur = (await getLifetimeStats()) ?? { totalDonatedUSD: 0, charitiesFunded: 0, cyclesRun: 0, carsGivenAway: 0, ticketsCounted: 0 };
  const next = { ...cur, ...s };
  await query(
    `insert into site_settings (key, value) values ('lifetime_stats', $1)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(next)],
  );
  return next;
}

// ───────────────────────────── promotions (server) ────────────────────────
// Admin-configured promo tiers, stored server-side so edits reach every visitor
// (not just the admin's browser). Merged over the code defaults.
export async function getPromosServer(): Promise<PromoTier[]> {
  const r = await query(`select value from site_settings where key = 'promotions'`);
  const stored = r.rows[0]?.value as Partial<PromoTier>[] | undefined;
  if (!Array.isArray(stored)) return DEFAULT_PROMOS;
  return DEFAULT_PROMOS.map((d) => {
    const o = stored.find((s) => s.id === d.id);
    return o ? { ...d, ...o } : d;
  });
}
export async function savePromosServer(promos: PromoTier[]): Promise<void> {
  await query(
    `insert into site_settings (key, value) values ('promotions', $1)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(promos)],
  );
}
