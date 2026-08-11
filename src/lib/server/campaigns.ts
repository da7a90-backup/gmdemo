// Marketing campaigns (newsletter / SMS blasts) — stored in Postgres, sent as REAL
// Klaviyo email campaigns / Postscript SMS. Promo variables ({{promo_link}}, {{promo_code}},
// …) are injected into the subject/body at send time.
import { pool } from "./db";
import { sendKlaviyoCampaign, deleteKlaviyoCampaign, newsletterListId, membersListId, klaviyoConfigured } from "./providers/klaviyo";
import { postscriptConfigured } from "./providers/postscript";
import { smsBroadcast } from "./subscribers";
import { fillVars } from "./email-templates";
import { DEFAULT_PROMOS } from "@/lib/promotions";

export type Audience = "newsletter" | "members";
export type Campaign = {
  id: number; channel: "email" | "sms"; audience: Audience; subject: string | null; body: string;
  promoCode: string | null; status: "draft" | "sent" | "failed";
  klaviyoCampaignId: string | null; recipients: number | null; error: string | null;
  createdISO: string; sentISO: string | null;
};

const row = (r: Record<string, unknown>): Campaign => ({
  id: r.id as number, channel: r.channel as "email" | "sms", audience: ((r.audience as string) ?? "newsletter") as Audience,
  subject: (r.subject as string) ?? null,
  body: r.body as string, promoCode: (r.promo_code as string) ?? null, status: r.status as Campaign["status"],
  klaviyoCampaignId: (r.klaviyo_campaign_id as string) ?? null, recipients: (r.recipients as number) ?? null,
  error: (r.error as string) ?? null,
  createdISO: r.created_at ? new Date(r.created_at as string).toISOString() : "",
  sentISO: r.sent_at ? new Date(r.sent_at as string).toISOString() : null,
});

export async function listCampaigns(channel: "email" | "sms"): Promise<Campaign[]> {
  return (await pool.query(`select * from campaigns where channel = $1 order by created_at desc`, [channel])).rows.map(row);
}

export async function saveCampaign(c: { channel: "email" | "sms"; audience?: Audience; subject?: string; body: string; promoCode?: string }): Promise<Campaign> {
  const r = await pool.query(
    `insert into campaigns (channel, audience, subject, body, promo_code) values ($1,$2,$3,$4,$5) returning *`,
    [c.channel, c.audience ?? "newsletter", c.subject ?? null, c.body, c.promoCode ?? null],
  );
  return row(r.rows[0]);
}

export async function deleteCampaign(id: number): Promise<void> {
  await pool.query(`delete from campaigns where id = $1`, [id]);
}

/** Promo variables for the attached promo code (empty if none / not found). */
function promoVars(code: string | null, origin: string): Record<string, string> {
  if (!code) return {};
  const p = DEFAULT_PROMOS.find((t) => t.code && t.code.toLowerCase() === code.toLowerCase());
  if (!p) return { promo_code: code, promo_link: `${origin}/tickets?promo=${encodeURIComponent(code)}` };
  return {
    promo_code: p.code!,
    promo_link: `${origin}/tickets?promo=${encodeURIComponent(p.code!)}`,
    promo_multiplier: String(p.multiplier),
    promo_message: p.message,
  };
}

/** Send an existing draft. Email → real Klaviyo campaign; SMS → blocked (Postscript). */
export async function sendCampaign(id: number, origin: string): Promise<Campaign> {
  const cur = (await pool.query(`select * from campaigns where id = $1`, [id])).rows[0];
  if (!cur) throw new Error("campaign not found");
  const c = row(cur);

  if (c.channel === "sms") {
    if (!postscriptConfigured()) {
      const error = "Postscript not configured (POSTSCRIPT_API_KEY).";
      await pool.query(`update campaigns set status='failed', error=$2 where id=$1`, [id, error]);
      return { ...c, status: "failed", error };
    }
    // SMS body is plain text; promo vars still interpolate.
    const text = fillVars(c.body, promoVars(c.promoCode, origin));
    const r = await smsBroadcast(text, "promotional");
    const status: Campaign["status"] = r.sent > 0 || r.recipients === 0 ? "sent" : "failed";
    const error = r.failed ? `${r.failed}/${r.recipients} failed to queue` : null;
    const updated = await pool.query(
      `update campaigns set status=$2, recipients=$3, error=$4, sent_at=now() where id=$1 returning *`,
      [id, status, r.sent, error],
    );
    return row(updated.rows[0]);
  }

  const list = c.audience === "members" ? membersListId() : newsletterListId();
  if (!klaviyoConfigured() || !list) {
    const error = c.audience === "members"
      ? "Members list not configured (KLAVIYO_MEMBERS_LIST_ID)."
      : "Klaviyo not configured (KLAVIYO_API_KEY / KLAVIYO_NEWSLETTER_LIST_ID).";
    await pool.query(`update campaigns set status='failed', error=$2 where id=$1`, [id, error]);
    return { ...c, status: "failed", error };
  }

  const vars = promoVars(c.promoCode, origin);
  const subject = fillVars(c.subject ?? "", vars);
  const html = fillVars(c.body, vars);
  const recipients = (await pool.query(
    c.audience === "members"
      ? `select count(*)::int n from users where is_member`
      : `select count(*)::int n from email_subscribers where status = 'subscribed'`,
  )).rows[0].n as number;

  const res = await sendKlaviyoCampaign({ name: subject || `Campaign ${id}`, subject, html, listId: list, send: true });
  if (!res.ok) {
    await pool.query(`update campaigns set status='failed', error=$2 where id=$1`, [id, res.error ?? "send failed"]);
    return { ...c, status: "failed", error: res.error ?? "send failed" };
  }
  const updated = await pool.query(
    `update campaigns set status='sent', klaviyo_campaign_id=$2, recipients=$3, error=null, sent_at=now() where id=$1 returning *`,
    [id, res.campaignId ?? null, recipients],
  );
  return row(updated.rows[0]);
}

/** Delete the campaign locally and (best-effort) its Klaviyo campaign. */
export async function deleteCampaignEverywhere(id: number): Promise<void> {
  const cur = (await pool.query(`select klaviyo_campaign_id from campaigns where id = $1`, [id])).rows[0];
  if (cur?.klaviyo_campaign_id) await deleteKlaviyoCampaign(cur.klaviyo_campaign_id);
  await deleteCampaign(id);
}
