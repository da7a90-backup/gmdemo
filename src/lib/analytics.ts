// Attribution tracking (demo).
// Every tickets-page landing and every buy click is logged with its channel
// (organic / member / promo code / UTM campaign) so the admin can see who
// came from where and who ended up purchasing.

export type TrackedEvent = {
  id: string;
  ts: string; // ISO
  type: "visit" | "purchase";
  /** Channel id — promo tier id or "organic". */
  source: string;
  /** Human label — "SMS subscribers", "Organic", … */
  channel: string;
  /** Raw trigger — "?promo=VIP3X", "utm_campaign=ads", "member login". */
  trigger?: string;
  page: string;
  /** Purchase only. */
  item?: string;
  amountUSD?: number;
};

const STORAGE_KEY = "gm:events-v1";
export const ANALYTICS_EVENT = "gm:events-updated";

export function getEvents(): TrackedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedEvent[]) : [];
  } catch {
    return [];
  }
}

export function track(e: Omit<TrackedEvent, "id" | "ts">) {
  if (typeof window === "undefined") return;
  const event: TrackedEvent = {
    ...e,
    id: Math.random().toString(36).slice(2, 10),
    ts: new Date().toISOString(),
  };
  const next = [event, ...getEvents()].slice(0, 500); // cap the demo log
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ANALYTICS_EVENT));
}

/** Record a REAL visit server-side (Attribution desk), deduped once per browser session
 * per page+source so refreshes don't stack. */
export function trackVisit(e: { source: string; channel: string; trigger?: string; page: string }) {
  if (typeof window === "undefined") return;
  const dedupeKey = `gm:visited:${e.page}:${e.source}`;
  if (window.sessionStorage.getItem(dedupeKey)) return;
  window.sessionStorage.setItem(dedupeKey, "1");
  fetch("/api/track/visit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: e.source, channel: e.channel, page: e.page }),
  }).catch(() => {});
}

export function clearEvents() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(ANALYTICS_EVENT));
}

/** Describe how the current URL triggered a promo — for the event log. */
export function describeTrigger(params: URLSearchParams | null, isMember: boolean): string | undefined {
  if (isMember) return "member login";
  if (!params) return undefined;
  const code = params.get("promo");
  if (code) return `?promo=${code}`;
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = params.get(k);
    if (v) return `${k}=${v}`;
  }
  return undefined;
}
