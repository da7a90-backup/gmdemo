// SendGrid (transactional email — OTP codes, ticket receipts, "you won").
// Kept separate from marketing so consent/deliverability don't cross.
// Stubs cleanly when SENDGRID_API_KEY is absent.
import type { ProviderResult } from "./postscript";
const KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.SENDGRID_FROM ?? "noreply@generousmotors.org";
export const sendgridConfigured = () => !!KEY;

export async function sendEmail(to: string, subject: string, html: string): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM, name: "Generous Motors" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    if (!res.ok) return { ok: false, error: `sendgrid ${res.status}: ${await res.text().catch(() => "")}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
