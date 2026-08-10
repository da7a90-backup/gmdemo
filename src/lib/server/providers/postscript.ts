// Postscript (SMS). Enforced double opt-in: creating a subscriber starts Postscript's
// confirm flow; the record stays 'pending' until Postscript confirms (opt-in webhook).
// Stubs cleanly when POSTSCRIPT_API_KEY is absent so capture still works in dev.
// Verified live (Aug 2026): POST /api/v2/subscribers requires `phone_number`, a REAL
// account `keyword` (or `keyword_id`), and `origin` ∈ {website,social,other}. The account's
// keywords are listable at GET /api/v2/keywords. docs:
//   https://developers.postscript.io/reference/create-subscriber
const KEY = process.env.POSTSCRIPT_API_KEY;
const KEYWORD = process.env.POSTSCRIPT_KEYWORD;         // a keyword configured in Postscript
const KEYWORD_ID = process.env.POSTSCRIPT_KEYWORD_ID;   // …or its id (either satisfies the API)
export const postscriptConfigured = () => !!KEY;

export type ProviderResult = { ok: boolean; id?: string; stubbed?: boolean; error?: string };

const ORIGINS = new Set(["website", "social", "other"]);

/** Start a Postscript double opt-in. `source` maps to the API `origin` (falls back to
 * "website" for our website-captured sources like "Popup"). */
export async function addSmsSubscriber(phone: string, source = "website"): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  if (!KEYWORD && !KEYWORD_ID) return { ok: false, error: "postscript keyword not set (POSTSCRIPT_KEYWORD or POSTSCRIPT_KEYWORD_ID)" };
  try {
    const body: Record<string, unknown> = {
      phone_number: phone,
      origin: ORIGINS.has(source.toLowerCase()) ? source.toLowerCase() : "website",
    };
    if (KEYWORD_ID) body.keyword_id = KEYWORD_ID;
    else body.keyword = KEYWORD;
    const res = await fetch("https://api.postscript.io/api/v2/subscribers", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `postscript ${res.status}: ${await res.text().catch(() => "")}` };
    const j = (await res.json().catch(() => ({}))) as { id?: string | number };
    return { ok: true, id: j?.id != null ? String(j.id) : undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
