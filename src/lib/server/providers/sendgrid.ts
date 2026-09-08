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

export const sendgridConfigured = () => !!KEY;
export const emailFrom = () => FROM_EMAIL;

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
