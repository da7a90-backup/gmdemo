// Klaviyo (marketing email — the 2× subscriber tier). Creates/identifies a
// profile; single opt-in so we can mark 'subscribed' on success.
// Stubs cleanly when KLAVIYO_API_KEY is absent.
import type { ProviderResult } from "./postscript";
const KEY = process.env.KLAVIYO_API_KEY;
const REVISION = "2024-10-15";
export const klaviyoConfigured = () => !!KEY;

export async function subscribeEmail(email: string, source = "website"): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  try {
    const res = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        authorization: `Klaviyo-API-Key ${KEY}`,
        revision: REVISION,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        data: { type: "profile", attributes: { email, properties: { source } } },
      }),
    });
    // 409 = profile already exists → treat as success (idempotent).
    if (!res.ok && res.status !== 409) {
      return { ok: false, error: `klaviyo ${res.status}: ${await res.text().catch(() => "")}` };
    }
    const j = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
    return { ok: true, id: j?.data?.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
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
