// Klaviyo (marketing email — the newsletter / 2× subscriber tier). Upserts a
// profile AND subscribes it to the marketing list with email consent, so it's a
// real opt-in (not just a bare profile). Stubs cleanly when KLAVIYO_API_KEY absent.
import type { ProviderResult } from "./postscript";
const KEY = process.env.KLAVIYO_API_KEY;
const REVISION = "2024-10-15";
// The Klaviyo list newsletter opt-ins are subscribed to (e.g. "Email List" = TDapB6).
const NEWSLETTER_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID;
export const klaviyoConfigured = () => !!KEY;

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
