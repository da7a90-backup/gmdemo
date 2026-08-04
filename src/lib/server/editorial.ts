// Admin-managed editorial content in Supabase (partners, winners, articles, cycle).
// Functions return objects in the demo's shapes so the admin desks + public pages
// wire up with minimal change. Media URLs point at Shopify Files (CDN).
import { query } from "./db";

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

// ───────────────────────────── cycle content ─────────────────────────────
export type CycleContent = {
  id: string; cycle: string; vehicleLabel: string; drawDateISO: string;
  charityPartnerId?: string; charityBlurb?: string;
};
const toCycle = (r: Row): CycleContent => ({
  id: String(r.id), cycle: r.code as string, vehicleLabel: (r.vehicle_label as string) ?? "",
  drawDateISO: r.draw_date ? new Date(r.draw_date as string).toISOString() : "",
  charityPartnerId: r.charity_partner_id != null ? String(r.charity_partner_id) : undefined,
  charityBlurb: (r.charity_blurb as string) ?? undefined,
});
export async function getCurrentCycle(): Promise<CycleContent | null> {
  const r = await query(`select * from cycles where status = 'open' order by id limit 1`);
  return r.rows[0] ? toCycle(r.rows[0]) : null;
}
export async function updateCurrentCycle(c: Partial<CycleContent>): Promise<CycleContent | null> {
  const r = await query(
    `update cycles set vehicle_label = coalesce($1, vehicle_label), draw_date = coalesce($2, draw_date),
       charity_partner_id = $3, charity_blurb = coalesce($4, charity_blurb)
     where id = (select id from cycles where status='open' order by id limit 1) returning *`,
    [c.vehicleLabel ?? null, c.drawDateISO ?? null, c.charityPartnerId ? Number(c.charityPartnerId) : null, c.charityBlurb ?? null],
  );
  return r.rows[0] ? toCycle(r.rows[0]) : null;
}
