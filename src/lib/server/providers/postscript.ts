// Postscript (SMS). Enforced double opt-in: creating a subscriber starts Postscript's
// confirm flow; the record stays 'pending' until Postscript confirms (opt-in webhook).
// Stubs cleanly when POSTSCRIPT_API_KEY is absent so capture still works in dev.
// Verified live (Aug 2026): create-subscriber needs `phone_number` + a REAL account
// `keyword` (or `keyword_id`) + `origin` ∈ {website,social,other}; send is POST
// /message_requests; webhooks are managed at /webhooks and signed with a shop token.
// docs: https://developers.postscript.io/reference/
import crypto from "node:crypto";

const KEY = process.env.POSTSCRIPT_API_KEY;
const KEYWORD = process.env.POSTSCRIPT_KEYWORD;         // a keyword configured in Postscript
const KEYWORD_ID = process.env.POSTSCRIPT_KEYWORD_ID;   // …or its id (either satisfies the API)
const BASE = "https://api.postscript.io/api/v2";
export const postscriptConfigured = () => !!KEY;
const h = () => ({ authorization: `Bearer ${KEY}`, "content-type": "application/json" });

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
    const res = await fetch(`${BASE}/subscribers`, { method: "POST", headers: h(), body: JSON.stringify(body) });
    if (!res.ok) return { ok: false, error: `postscript ${res.status}: ${await res.text().catch(() => "")}` };
    const j = (await res.json().catch(() => ({}))) as { id?: string | number };
    return { ok: true, id: j?.id != null ? String(j.id) : undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* ------------------------------ outbound SMS ------------------------------ */
/** Send an SMS to a subscriber (by phone or subscriber id) via POST /message_requests.
 * Returns 202 (queued); promotional sends obey the recipient's quiet hours. */
export async function sendSms(
  target: { phone?: string; subscriberId?: string },
  body: string,
  category: "promotional" | "transactional" | "conversational" = "promotional",
): Promise<ProviderResult> {
  if (!KEY) return { ok: true, stubbed: true };
  const payload: Record<string, unknown> = { body, category };
  if (target.subscriberId) payload.subscriber_id = target.subscriberId;
  else if (target.phone) payload.phone = target.phone;
  else return { ok: false, error: "no target (phone or subscriberId)" };
  try {
    const res = await fetch(`${BASE}/message_requests`, { method: "POST", headers: h(), body: JSON.stringify(payload) });
    if (!res.ok) return { ok: false, error: `postscript ${res.status}: ${await res.text().catch(() => "")}` };
    const j = (await res.json().catch(() => ({}))) as { id?: string | number };
    return { ok: true, id: j?.id != null ? String(j.id) : undefined };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* -------------------------------- webhooks -------------------------------- */
export type PostscriptWebhook = { id: string; event: string; callback_url: string };
const WEBHOOK_EVENTS = ["shop.subscriber.opt_in", "shop.subscriber.opt_out"] as const;
const eventHint = (event: string) => (event.endsWith("opt_in") ? "opt_in" : "opt_out");

export async function listPostscriptWebhooks(): Promise<PostscriptWebhook[]> {
  if (!KEY) return [];
  const res = await fetch(`${BASE}/webhooks`, { headers: h() });
  if (!res.ok) return [];
  const j = (await res.json().catch(() => ({}))) as { webhook_subscriptions?: PostscriptWebhook[] };
  return j.webhook_subscriptions ?? [];
}

/** Idempotently subscribe our receiver to the opt-in / opt-out events. Each callback carries
 * an `?event=` hint so the receiver can act without guessing the payload shape. */
export async function registerPostscriptWebhooks(baseUrl: string): Promise<{ event: string; status: string }[]> {
  if (!KEY) return WEBHOOK_EVENTS.map((e) => ({ event: e, status: "stubbed (no key)" }));
  const existing = await listPostscriptWebhooks();
  const out: { event: string; status: string }[] = [];
  for (const event of WEBHOOK_EVENTS) {
    const callback_url = `${baseUrl.replace(/\/+$/, "")}/api/webhooks/postscript?event=${eventHint(event)}`;
    if (existing.some((w) => w.event === event && w.callback_url === callback_url)) {
      out.push({ event, status: "exists" });
      continue;
    }
    const res = await fetch(`${BASE}/webhooks`, { method: "POST", headers: h(), body: JSON.stringify({ callback_url, event, headers: {} }) });
    out.push({ event, status: res.ok ? "registered" : `err ${res.status}: ${(await res.text().catch(() => "")).slice(0, 120)}` });
  }
  return out;
}

/** The shop's webhook signing token (GET /webhooks/token). Returns null if none exists yet
 * (it's created alongside the first webhook subscription). */
export async function getPostscriptWebhookToken(): Promise<string | null> {
  if (!KEY) return null;
  const res = await fetch(`${BASE}/webhooks/token`, { headers: h() });
  if (!res.ok) return null;
  const j = (await res.json().catch(() => ({}))) as { token?: string };
  return j.token || null;
}

/** Verify an incoming Postscript webhook: the `Postscript-Signature` header equals the shop's
 * signing token (shared secret). If POSTSCRIPT_WEBHOOK_TOKEN is unset we accept (the route
 * logs it) so the integration still works before the token is wired. */
export function verifyPostscriptSignature(sig: string | null): { ok: boolean; verified: boolean } {
  const token = process.env.POSTSCRIPT_WEBHOOK_TOKEN;
  if (!token) return { ok: true, verified: false };
  if (!sig) return { ok: false, verified: false };
  const a = Buffer.from(sig);
  const b = Buffer.from(token);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { ok, verified: true };
}
