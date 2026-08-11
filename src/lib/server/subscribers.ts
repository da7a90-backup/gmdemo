// Server-side subscriber capture: DB-first, then provider. Never reports
// "subscribed" on a half-write — if the provider call fails, the row stays
// 'pending' for a later retry (docs/build/open-questions.md §C3).
import { withClient, query } from "./db";
import { subscribeEmail as klaviyoSubscribe } from "./providers/klaviyo";
import { addSmsSubscriber as postscriptAdd, sendSms } from "./providers/postscript";
import { klaviyoConfigured } from "./providers/klaviyo";
import { postscriptConfigured } from "./providers/postscript";

export type SubResult = {
  id: number;
  status: string;
  provider: { ok: boolean; stubbed?: boolean; error?: string };
};

export async function subscribeEmail(email: string, source = "Footer"): Promise<SubResult> {
  const norm = email.trim().toLowerCase();
  return withClient(async (c) => {
    const row = (
      await c.query(
        `insert into email_subscribers (email, source, status) values ($1, $2, 'pending')
         on conflict (email) do update set source = coalesce(email_subscribers.source, excluded.source), updated_at = now()
         returning id, status`,
        [norm, source],
      )
    ).rows[0] as { id: number; status: string };

    const prov = await klaviyoSubscribe(norm, source);
    let status = row.status;
    if (prov.ok) {
      // Klaviyo is single opt-in → mark subscribed on success (incl. dev stub).
      status = "subscribed";
      await c.query(
        `update email_subscribers set klaviyo_id = coalesce($2, klaviyo_id), status = 'subscribed',
           consent_at = coalesce(consent_at, now()), updated_at = now() where id = $1`,
        [row.id, prov.id ?? null],
      );
    }
    return { id: row.id, status, provider: prov };
  });
}

export async function subscribeSms(phone: string, source = "Popup"): Promise<SubResult> {
  return withClient(async (c) => {
    const row = (
      await c.query(
        `insert into sms_subscribers (phone, source, status) values ($1, $2, 'pending')
         on conflict (phone) do update set source = coalesce(sms_subscribers.source, excluded.source), updated_at = now()
         returning id, status`,
        [phone, source],
      )
    ).rows[0] as { id: number; status: string };

    const prov = await postscriptAdd(phone, source);
    if (prov.ok && prov.id) {
      // Postscript enforces double opt-in → stays 'pending' until confirm webhook.
      await c.query(`update sms_subscribers set postscript_id = $2, updated_at = now() where id = $1`, [
        row.id,
        prov.id,
      ]);
    }
    return { id: row.id, status: row.status, provider: prov };
  });
}

// ───────────────────────── admin: manage + broadcast ─────────────────────────
export async function listEmailSubscribers() {
  return (await query(`select id, email, status, source, created_at from email_subscribers order by created_at desc`)).rows;
}
export async function listSmsSubscribers() {
  return (await query(`select id, phone, status, source, created_at from sms_subscribers order by created_at desc`)).rows;
}
export async function removeEmailSubscriber(id: number) {
  await query(`delete from email_subscribers where id = $1`, [id]);
}
export async function removeSmsSubscriber(id: number) {
  await query(`delete from sms_subscribers where id = $1`, [id]);
}

/** Queue an SMS to every subscribed number via Postscript (message_requests are per-
 * subscriber; promotional sends obey the recipient's quiet hours). Returns per-send counts. */
export async function smsBroadcast(
  text: string,
  category: "promotional" | "transactional" | "conversational" = "promotional",
): Promise<{ recipients: number; sent: number; failed: number }> {
  const phones = (await query(`select phone from sms_subscribers where status = 'subscribed'`)).rows as { phone: string }[];
  let sent = 0;
  let failed = 0;
  for (const { phone } of phones) {
    const r = await sendSms({ phone }, text, category);
    if (r.ok) sent++;
    else failed++;
  }
  return { recipients: phones.length, sent, failed };
}

/** Compose + send a broadcast. SMS → real Postscript sends. Email → routed through the
 * Klaviyo campaign flow (CampaignDesk); this returns the subscribed-recipient count. */
export async function broadcast(channel: "email" | "sms", body: string, subject?: string) {
  const table = channel === "email" ? "email_subscribers" : "sms_subscribers";
  const recipients = (await query(`select count(*)::int n from ${table} where status = 'subscribed'`)).rows[0].n as number;

  if (channel === "sms") {
    if (!postscriptConfigured()) {
      return { channel, recipients, subject: null, length: body.length, sent: false, delivered: 0, failed: 0, note: "Postscript not configured (POSTSCRIPT_API_KEY)" };
    }
    const r = await smsBroadcast(body, "promotional");
    return {
      channel, recipients: r.recipients, subject: null, length: body.length,
      sent: r.sent > 0, delivered: r.sent, failed: r.failed,
      note: `queued ${r.sent}/${r.recipients} SMS via Postscript${r.failed ? `, ${r.failed} failed` : ""}`,
    };
  }

  return {
    channel, recipients, subject: subject ?? null, length: body.length, sent: false, delivered: 0, failed: 0,
    note: klaviyoConfigured()
      ? `email → use the CampaignDesk (real Klaviyo campaign) to send to ${recipients} recipients`
      : `provider not live — would send to ${recipients} recipients once Klaviyo is configured`,
  };
}
