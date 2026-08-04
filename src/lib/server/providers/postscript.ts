// Postscript (SMS). Enforced double opt-in: adding a subscriber starts the
// confirm flow; status stays 'pending' until Postscript confirms (via webhook).
// Stubs cleanly when POSTSCRIPT_API_KEY is absent so capture works in dev.
const KEY = process.env.POSTSCRIPT_API_KEY;
export const postscriptConfigured = () => !!KEY;

export type ProviderResult = { ok: boolean; id?: string; stubbed?: boolean; error?: string };

export async function addSmsSubscriber(phone: string, source = "website"): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  try {
    // NOTE: verify endpoint/payload against current Postscript API docs on key setup.
    const res = await fetch("https://api.postscript.io/api/v2/subscribers", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ phone_number: phone, source_type: "api", keyword: source }),
    });
    if (!res.ok) return { ok: false, error: `postscript ${res.status}: ${await res.text().catch(() => "")}` };
    const j = (await res.json().catch(() => ({}))) as { id?: string | number; subscriber?: { id?: string | number } };
    const id = j?.id ?? j?.subscriber?.id;
    return { ok: true, id: id != null ? String(id) : undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
