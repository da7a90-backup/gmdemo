// Free US street-address verification via the US Census Bureau geocoder — no API key,
// no account, US-only. Confirms a street address resolves to a real location.
// Fails OPEN (matched:true) on timeout/error/missing fields so our own infra never
// blocks a claim; callers only act on an explicit { checked:true, matched:false }.
const BASE = "https://geocoding.geo.census.gov/geocoder/locations/address";

export async function verifyStreetAddress(a: {
  address1?: string; city?: string; state?: string; zip?: string;
}): Promise<{ matched: boolean; checked: boolean }> {
  const street = (a.address1 || "").trim();
  const city = (a.city || "").trim();
  const state = (a.state || "").trim();
  const zip = (a.zip || "").trim();
  if (!street || !state) return { matched: true, checked: false };
  const url =
    `${BASE}?street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}` +
    `&state=${encodeURIComponent(state)}&zip=${encodeURIComponent(zip)}` +
    `&benchmark=Public_AR_Current&format=json`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return { matched: true, checked: false };
    const j = (await r.json()) as { result?: { addressMatches?: unknown[] } };
    const matches = j?.result?.addressMatches;
    return { matched: Array.isArray(matches) && matches.length > 0, checked: true };
  } catch {
    return { matched: true, checked: false }; // fail-open on timeout/network
  }
}
