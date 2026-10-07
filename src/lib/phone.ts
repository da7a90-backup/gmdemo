// Shared US phone helpers — pure, safe to import on client and server.
// The giveaway is US-only, so we validate against NANP structure.

/** Digits → E.164 US (`+1XXXXXXXXXX`), accepting a leading country-code 1. Null if not 10/11 digits. */
export function normalizeUSPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const digits = v.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return null;
}

/**
 * True only for a structurally real US number: valid area + exchange codes (each
 * starts 2–9) and not the fictional `555` block. Catches fake/placeholder numbers
 * (bad area codes, 867-5309, 555-xxxx) that Shopify would reject outright.
 */
export function isValidUSPhone(v: unknown): boolean {
  const p = normalizeUSPhone(v);
  if (!p) return false;
  const m = /^\+1([2-9]\d{2})([2-9]\d{2})\d{4}$/.exec(p);
  if (!m) return false;
  const [, area, exchange] = m;
  return area !== "555" && exchange !== "555";
}
