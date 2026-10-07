// SendGrid — transactional email delivery. This is the app's email provider of
// choice: every one-off lifecycle email (OTP login code, ticket receipt, winner
// notice, newsletter welcome, the membership emails) is delivered here via
// @sendgrid/mail. Stubs cleanly when SENDGRID_API_KEY is absent, mirroring the
// Klaviyo/Postscript providers so local dev without a key never errors.
import sgMail from "@sendgrid/mail";
import type { ProviderResult } from "./postscript";

const KEY = process.env.SENDGRID_API_KEY;
// The From must be a SendGrid-verified single sender or authenticated domain,
// otherwise SendGrid rejects the send with 403.
const FROM_EMAIL = process.env.EMAIL_FROM || "hello@generousmotors.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Generous Motors";

if (KEY) sgMail.setApiKey(KEY);

// Marketing-contacts list(s) to drop captured emails into (comma-separated list ids).
const LIST_IDS = (process.env.SENDGRID_LIST_ID || "").split(",").map((s) => s.trim()).filter(Boolean);

export const sendgridConfigured = () => !!KEY;
export const emailFrom = () => FROM_EMAIL;
export const sendgridMarketingConfigured = () => !!KEY && LIST_IDS.length > 0;

/**
 * Upsert a contact into our SendGrid marketing list(s) (SENDGRID_LIST_ID). Uses the
 * Marketing Contacts API, which needs an API key with the *Marketing* permission —
 * a send-only key gets 403. Import is async on SendGrid's side (202 = accepted).
 * Never throws; logs the real reason so a missing scope/list is obvious in the logs.
 */
export async function addEmailContact(
  email: string,
  name?: { firstName?: string; lastName?: string },
): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  if (!LIST_IDS.length) return { ok: false, error: "SENDGRID_LIST_ID not set" };
  const to = email.trim().toLowerCase();
  if (!to) return { ok: false, error: "no email" };
  try {
    const contact: Record<string, unknown> = { email: to };
    if (name?.firstName) contact.first_name = name.firstName;
    if (name?.lastName) contact.last_name = name.lastName;
    const res = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
      method: "PUT",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ list_ids: LIST_IDS, contacts: [contact] }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      console.error(`[sendgrid] addEmailContact ${to} failed: ${res.status} ${detail}`);
      return { ok: false, error: `sendgrid ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Send one transactional email. `category` tags the send in SendGrid analytics
 * (we pass the lifecycle metric, e.g. "Tickets Minted"); `customArgs` rides along
 * for search/idempotency (we pass the caller's unique id). Never throws.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  category?: string;
  replyTo?: string;
  customArgs?: Record<string, string>;
}): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  if (!opts.to) return { ok: false, error: "sendgrid: no recipient" };
  try {
    await sgMail.send({
      to: opts.to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts.category ? { categories: [opts.category] } : {}),
      ...(opts.customArgs ? { customArgs: opts.customArgs } : {}),
    });
    return { ok: true };
  } catch (e: unknown) {
    // SendGrid surfaces the real reason (unverified sender, bad key, etc.) in
    // response.body — log the detail so misconfig is obvious in the server logs.
    const err = e as { message?: string; response?: { body?: unknown } };
    const detail = err?.response?.body ? JSON.stringify(err.response.body) : err?.message ?? String(e);
    console.error(`[sendgrid] send to ${opts.to} failed: ${detail}`);
    return { ok: false, error: detail };
  }
}

/**
 * Bulk marketing send (newsletter / member broadcasts). One message per recipient
 * so each gets a personalized one-click unsubscribe link + List-Unsubscribe header
 * (CAN-SPAM). Sent in small concurrent batches. Never throws.
 */
export async function sendBroadcast(opts: {
  subject: string;
  html: string;
  recipients: string[];
  category?: string;
  unsubscribeUrl?: (email: string) => string;
}): Promise<{ recipients: number; sent: number; failed: number; error?: string }> {
  const list = [...new Set(opts.recipients.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (!KEY) return { recipients: list.length, sent: 0, failed: 0, error: "SENDGRID_API_KEY not set" };

  let sent = 0;
  let failed = 0;
  const CHUNK = 20;
  for (let i = 0; i < list.length; i += CHUNK) {
    const batch = list.slice(i, i + CHUNK);
    const results = await Promise.all(
      batch.map(async (email) => {
        const unsub = opts.unsubscribeUrl?.(email);
        const html = unsub
          ? `${opts.html}<hr style="margin-top:32px;border:none;border-top:1px solid #e7e2d9"/>` +
            `<p style="font-size:12px;color:#8a8a8a;font-family:Arial,sans-serif">` +
            `You're receiving this because you subscribed to Generous Motors. ` +
            `<a href="${unsub}" style="color:#8a8a8a">Unsubscribe</a>.</p>`
          : opts.html;
        try {
          await sgMail.send({
            to: email,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: opts.subject,
            html,
            ...(opts.category ? { categories: [opts.category] } : {}),
            ...(unsub
              ? { headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
              : {}),
          });
          return true;
        } catch (e) {
          console.error(`[sendgrid] broadcast to ${email} failed`, e);
          return false;
        }
      }),
    );
    sent += results.filter(Boolean).length;
    failed += results.length - results.filter(Boolean).length;
  }
  return { recipients: list.length, sent, failed };
}
