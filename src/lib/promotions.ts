// Tiered promotions engine (demo).
//
// Mirrors the "Tiered Promotions Framework": every channel gets a configurable
// entry multiplier, managed from /admin without code changes. Config is stored
// in localStorage on top of the defaults below; the tickets pages resolve the
// active promotion from (in priority order):
//   1. logged-in membership              — applied automatically, no code
//   2. ?promo=CODE URL parameter         — special promotions / email / SMS links
//   3. utm_* parameters                  — external ad campaigns
//   4. organic                           — baseline, no boost
// Each promotion supports an end date/time and an independent countdown that
// runs alongside the giveaway countdown.

export type PromoTier = {
  id: "organic" | "ads" | "email" | "sms" | "member";
  label: string;
  audience: string;
  multiplier: number; // 1 = no boost
  message: string; // marketing banner copy
  active: boolean;
  /** ?promo=CODE trigger (case-insensitive). */
  code?: string;
  /** utm_source / utm_medium / utm_campaign value that triggers this tier. */
  utm?: string;
  /** Optional promo end — independent of the giveaway countdown. */
  endISO?: string;
  /** Show the independent countdown in the promo banner. */
  showCountdown?: boolean;
};

export const DEFAULT_PROMOS: PromoTier[] = [
  {
    id: "organic",
    label: "Organic",
    audience: "General public browsing the site",
    multiplier: 1,
    message: "Every ticket earns entries at the standard rate.",
    active: true,
  },
  {
    id: "ads",
    label: "Advertising",
    audience: "Paid traffic from ads",
    multiplier: 2,
    message: "Ad exclusive — 2X entries on every ticket in this order.",
    active: true,
    utm: "ads",
    endISO: "2026-07-12T19:00:00-04:00",
    showCountdown: true,
  },
  {
    id: "email",
    label: "Email subscribers",
    audience: "People on the GM mailing list",
    multiplier: 2,
    message: "Subscriber thank-you — 2X entries on every ticket.",
    active: true,
    code: "EMAIL2X",
    utm: "email",
  },
  {
    id: "sms",
    label: "SMS subscribers",
    audience: "People opted into SMS alerts",
    multiplier: 3,
    message: "VIP text-club deal — 3X entries on every ticket.",
    active: true,
    code: "VIP3X",
    utm: "sms",
    endISO: "2026-07-12T19:00:00-04:00",
    showCountdown: true,
  },
  {
    id: "member",
    label: "Members",
    audience: "Active monthly subscribers",
    multiplier: 4,
    message: "Member exclusive — 4X entries on every ticket, applied automatically.",
    active: true,
  },
];

const STORAGE_KEY = "gm:promos-v1";
export const PROMOS_EVENT = "gm:promos-updated";

/** Admin-configured promos merged over defaults. Safe on the server (returns defaults). */
export function getPromoConfig(): PromoTier[] {
  if (typeof window === "undefined") return DEFAULT_PROMOS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROMOS;
    const stored = JSON.parse(raw) as Partial<PromoTier>[];
    return DEFAULT_PROMOS.map((d) => {
      const o = stored.find((s) => s.id === d.id);
      return o ? { ...d, ...o } : d;
    });
  } catch {
    return DEFAULT_PROMOS;
  }
}

export function savePromoConfig(promos: PromoTier[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(promos));
  window.dispatchEvent(new Event(PROMOS_EVENT));
}

export function resetPromoConfig() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(PROMOS_EVENT));
}

/** A promo is live when active, boosting, and not past its end date. */
export function isPromoLive(t: PromoTier, now = new Date()): boolean {
  if (!t.active || t.multiplier <= 1) return false;
  if (t.endISO && now > new Date(t.endISO)) return false;
  return true;
}

/**
 * Resolve which promotion applies for this visit.
 * `params` are the page's URL search params; `isMember` = logged-in session.
 */
export function resolvePromo(
  params: URLSearchParams | null,
  isMember: boolean,
  promos: PromoTier[] = getPromoConfig(),
): PromoTier | null {
  const live = promos.filter((t) => isPromoLive(t));

  let best: PromoTier | null = null;
  const consider = (t: PromoTier | undefined) => {
    if (t && (!best || t.multiplier > best.multiplier)) best = t;
  };

  if (isMember) consider(live.find((t) => t.id === "member"));

  if (params) {
    const code = params.get("promo")?.trim().toLowerCase();
    if (code) {
      consider(live.find((t) => t.code && t.code.toLowerCase() === code));
    }
    const utmValues = ["utm_source", "utm_medium", "utm_campaign", "utm_content"]
      .map((k) => params.get(k)?.trim().toLowerCase())
      .filter(Boolean) as string[];
    if (utmValues.length) {
      for (const t of live) {
        if (t.utm && utmValues.includes(t.utm.toLowerCase())) consider(t);
      }
    }
  }

  return best;
}
