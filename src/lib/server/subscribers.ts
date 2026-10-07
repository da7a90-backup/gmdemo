// Server-side subscriber capture: DB-first, then provider. Never reports
// "subscribed" on a half-write — if the provider call fails, the row stays
// 'pending' for a later retry (docs/build/open-questions.md §C3).
import { withClient, query } from "./db";
import { addSmsSubscriber as postscriptAdd, sendSms } from "./providers/postscript";
import { postscriptConfigured } from "./providers/postscript";
import { sendBroadcast } from "./providers/sendgrid";
import { unsubscribeUrl } from "./unsubscribe";
import { emitEmailEvent } from "./email-templates";

export type SubResult = {
  id: number;
  status: string;
  provider: { ok: boolean; stubbed?: boolean; error?: string };
};

export async function subscribeEmail(email: string, source = "Footer", opts: { sendWelcome?: boolean } = {}): Promise<SubResult> {
  const norm = email.trim().toLowerCase();
  return withClient(async (c) => {
    // Our DB is the source of truth (single opt-in). A previously-unsubscribed
    // address is re-subscribed on an explicit re-signup. `inserted` is true only
    // on a brand-new row, so the welcome fires exactly once.
    const row = (
      await c.query(
        `insert into email_subscribers (email, source, status, consent_at) values ($1, $2, 'subscribed', now())
         on conflict (email) do update set
           source = coalesce(email_subscribers.source, excluded.source),
           status = 'subscribed',
           consent_at = coalesce(email_subscribers.consent_at, now()),
           updated_at = now()
         returning id, status, (xmax = 0) as inserted`,
        [norm, source],
      )
    ).rows[0] as { id: number; status: string; inserted: boolean };

    if (row.inserted && opts.sendWelcome !== false) {
      // Welcome email via SendGrid (once, on first subscribe). Skipped for the
      // free-ticket claim flow, which sends its own confirm-to-claim email instead.
      const cyc = (await c.query(`select vehicle_label from cycles where status = 'open' order by code desc limit 1`).catch(() => null))?.rows?.[0];
      await emitEmailEvent("Newsletter Welcome", "newsletter_welcome", norm, { prize: cyc?.vehicle_label ?? "" }, `welcome-${norm}`).catch(() => {});
    }
    return { id: row.id, status: row.status, provider: { ok: true } };
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

/** Compose + send a broadcast. SMS → real Postscript sends. Email → real SendGrid
 * sends (one per recipient with a one-click unsubscribe). */
export async function broadcast(channel: "email" | "sms", body: string, subject?: string, origin = process.env.PUBLIC_BASE_URL || "https://www.generousmotors.org") {
  if (channel === "sms") {
    const recipients = (await query(`select count(*)::int n from sms_subscribers where status = 'subscribed'`)).rows[0].n as number;
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

  const emails = (await query(`select email::text from email_subscribers where status = 'subscribed'`)).rows.map((x) => x.email as string);
  const r = await sendBroadcast({
    subject: subject ?? "Generous Motors",
    html: body,
    recipients: emails,
    category: "Broadcast",
    unsubscribeUrl: (e) => unsubscribeUrl(origin, e),
  });
  return {
    channel, recipients: r.recipients, subject: subject ?? null, length: body.length,
    sent: r.sent > 0, delivered: r.sent, failed: r.failed,
    note: r.error ?? `sent ${r.sent}/${r.recipients} via SendGrid${r.failed ? `, ${r.failed} failed` : ""}`,
  };
}
