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
