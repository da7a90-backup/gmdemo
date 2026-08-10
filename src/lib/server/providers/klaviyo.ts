// Klaviyo (marketing email — the newsletter / 2× subscriber tier). Upserts a
// profile AND subscribes it to the marketing list with email consent, so it's a
// real opt-in (not just a bare profile). Stubs cleanly when KLAVIYO_API_KEY absent.
import type { ProviderResult } from "./postscript";
const KEY = process.env.KLAVIYO_API_KEY;
const REVISION = "2024-10-15";
// The Klaviyo list newsletter opt-ins are subscribed to (e.g. "Email List" = TDapB6).
const NEWSLETTER_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID;
const FROM_EMAIL = process.env.KLAVIYO_FROM_EMAIL || "hello@generousmotors.com";
const FROM_LABEL = process.env.KLAVIYO_FROM_LABEL || "Generous Motors";
export const klaviyoConfigured = () => !!KEY;
export const newsletterListId = () => NEWSLETTER_LIST_ID;

const kHeaders = () => ({
  authorization: `Klaviyo-API-Key ${KEY}`,
  revision: REVISION,
  "content-type": "application/json",
  accept: "application/json",
});

/** Subscribe a profile to a list with SUBSCRIBED email marketing consent (single
 * opt-in). Verified payload — POST /api/profile-subscription-bulk-create-jobs/ → 202. */
async function subscribeToList(email: string, listId: string): Promise<ProviderResult> {
  try {
    const res = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: kHeaders(),
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            profiles: {
              data: [{ type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }],
            },
          },
          relationships: { list: { data: { type: "list", id: listId } } },
        },
      }),
    });
    if (!res.ok) return { ok: false, error: `klaviyo subscribe ${res.status}: ${await res.text().catch(() => "")}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function subscribeEmail(email: string, source = "website"): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  // 1) Upsert the profile (records the `source` property, returns its id).
  let id: string | undefined;
  try {
    const res = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: kHeaders(),
      body: JSON.stringify({ data: { type: "profile", attributes: { email, properties: { source } } } }),
    });
    // 409 = profile already exists → treat as success (idempotent).
    if (!res.ok && res.status !== 409) {
      return { ok: false, error: `klaviyo ${res.status}: ${await res.text().catch(() => "")}` };
    }
    const j = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
    id = j?.data?.id;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
  // 2) Subscribe to the marketing list with consent (when a list is configured).
  if (NEWSLETTER_LIST_ID) {
    const sub = await subscribeToList(email, NEWSLETTER_LIST_ID);
    if (!sub.ok) return sub;
  }
  return { ok: true, id };
}

/**
 * Emit a server-side Klaviyo event (Events API). A metric-triggered Flow in Klaviyo
 * (marked "transactional") turns these into the actual emails — e.g. "Tickets Minted"
 * → the "you're in" receipt, "Won Drawing" → the winner notice. `uniqueId` dedupes
 * repeated events (pass e.g. `mint-<orderId>`). Stubs cleanly with no API key.
 * Docs: https://developers.klaviyo.com/en/reference/create_event (POST /api/events, 202).
 */
export async function klaviyoEvent(
  metric: string,
  email: string,
  properties: Record<string, unknown> = {},
  uniqueId?: string,
): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  if (!email) return { ok: false, error: "klaviyo event: no email" };
  try {
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        authorization: `Klaviyo-API-Key ${KEY}`,
        revision: REVISION,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: metric } } },
            profile: { data: { type: "profile", attributes: { email } } },
            properties,
            ...(uniqueId ? { unique_id: uniqueId } : {}),
          },
        },
      }),
    });
    if (!res.ok) return { ok: false, error: `klaviyo event ${res.status}: ${await res.text().catch(() => "")}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export type CampaignResult = ProviderResult & { campaignId?: string };

/**
 * Send a REAL Klaviyo email campaign to a list. Verified 4-step flow:
 *   1. POST /api/templates                         → template id (HTML)
 *   2. POST /api/campaigns                          → campaign + message id (list audience)
 *   3. POST /api/campaign-message-assign-template   → attach the template to the message
 *   4. POST /api/campaign-send-jobs (opts.send)     → send now
 * With opts.send=false it creates a DRAFT (steps 1–3) — used to verify without emailing.
 * Stubs cleanly when no API key. Docs: developers.klaviyo.com/en/reference/campaigns_api_overview
 */
export async function sendKlaviyoCampaign(opts: {
  name: string; subject: string; html: string; listId: string; send: boolean;
}): Promise<CampaignResult> {
  if (!KEY) return { ok: true, stubbed: true };
  try {
    // 1) template
    const tRes = await fetch("https://a.klaviyo.com/api/templates/", {
      method: "POST", headers: kHeaders(),
      body: JSON.stringify({ data: { type: "template", attributes: { name: `${opts.name} · ${new Date().toISOString()}`, editor_type: "CODE", html: opts.html } } }),
    });
    if (!tRes.ok) return { ok: false, error: `template ${tRes.status}: ${await tRes.text().catch(() => "")}` };
    const templateId = ((await tRes.json()) as { data?: { id?: string } })?.data?.id;
    if (!templateId) return { ok: false, error: "no template id" };

    // 2) campaign (draft)
    const cRes = await fetch("https://a.klaviyo.com/api/campaigns/", {
      method: "POST", headers: kHeaders(),
      body: JSON.stringify({
        data: {
          type: "campaign",
          attributes: {
            name: opts.name,
            audiences: { included: [opts.listId] },
            // Verified shape (rev 2024-10-15): channel + content live directly on the
            // message attributes (NOT nested in `definition`); no send_strategy — the
            // send-job below triggers the immediate send.
            "campaign-messages": {
              data: [{
                type: "campaign-message",
                attributes: {
                  channel: "email",
                  label: opts.subject,
                  content: { subject: opts.subject, from_email: FROM_EMAIL, from_label: FROM_LABEL },
                },
              }],
            },
          },
        },
      }),
    });
    if (!cRes.ok) return { ok: false, error: `campaign ${cRes.status}: ${await cRes.text().catch(() => "")}` };
    const cJson = (await cRes.json()) as { data?: { id?: string; relationships?: { "campaign-messages"?: { data?: { id?: string }[] } } } };
    const campaignId = cJson.data?.id;
    const messageId = cJson.data?.relationships?.["campaign-messages"]?.data?.[0]?.id;
    if (!campaignId || !messageId) return { ok: false, error: "no campaign/message id", campaignId };

    // 3) assign template to the message
    const aRes = await fetch("https://a.klaviyo.com/api/campaign-message-assign-template/", {
      method: "POST", headers: kHeaders(),
      body: JSON.stringify({ data: { type: "campaign-message", id: messageId, relationships: { template: { data: { type: "template", id: templateId } } } } }),
    });
    if (!aRes.ok) return { ok: false, error: `assign ${aRes.status}: ${await aRes.text().catch(() => "")}`, campaignId };

    // 4) send now (optional)
    if (opts.send) {
      const sRes = await fetch("https://a.klaviyo.com/api/campaign-send-jobs/", {
        method: "POST", headers: kHeaders(),
        body: JSON.stringify({ data: { type: "campaign-send-job", id: campaignId } }),
      });
      if (!sRes.ok) return { ok: false, error: `send ${sRes.status}: ${await sRes.text().catch(() => "")}`, campaignId };
    }
    return { ok: true, campaignId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Delete a campaign (cleanup for draft tests). */
export async function deleteKlaviyoCampaign(campaignId: string): Promise<void> {
  if (!KEY) return;
  await fetch(`https://a.klaviyo.com/api/campaigns/${campaignId}/`, { method: "DELETE", headers: kHeaders() }).catch(() => {});
}
