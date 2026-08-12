const TZ = "America/New_York";

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const usdc = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

export const intl = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);

export const niceDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });

export const niceDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: TZ,
  });

export const niceWeekday = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });

// --- Viewer-local variants (no forced timeZone → the browser's own zone). Used
//     by <LocalTime> after mount; the ET versions above are the SSR placeholder. ---
export const niceDateLocal = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const niceDateTimeLocal = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

export const niceWeekdayLocal = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

// --- Admin: treat the datetime-local input as MIAMI (ET) wall-clock, DST-aware,
//     regardless of where the admin's own browser is. ---

/** Offset (ms) of America/New_York at a given UTC instant. EDT → -4h, EST → -5h. */
function nyOffsetMs(instant: number): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date(instant)).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - instant;
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" showing the MIAMI wall-clock (for <input type="datetime-local">). */
export function isoToMiamiInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d).reduce<Record<string, string>>((a, x) => { a[x.type] = x.value; return a; }, {});
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

/** "YYYY-MM-DDTHH:mm" entered as MIAMI wall-clock → UTC ISO instant (DST-aware). */
export function miamiInputToISO(local: string): string | undefined {
  if (!local) return undefined;
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const guess = Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0);
  return new Date(guess - nyOffsetMs(guess)).toISOString();
}

export const timeUntil = (iso: string, fromMs?: number) => {
  const now = fromMs ?? Date.now();
  const ms = new Date(iso).getTime() - now;
  const total = Math.max(0, ms);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { days, hours, minutes, seconds, ms: total };
};
