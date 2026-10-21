// Free, offline US address sanity-check (no third-party address service). Validates
// the claim form's fields and that the ZIP actually belongs to the selected state,
// using the embedded ZIP3→state table. Catches the common wrong-address errors
// (malformed ZIP, ZIP/state mismatch, empty fields). It can't confirm a specific
// street exists — that needs a paid/registered verification API (USPS, Google, etc.).
import { ZIP3_STATES } from "./us-zip-states";

/** True if the 5-digit ZIP's prefix is assigned to `stateCode` (2-letter). */
export function zipMatchesState(zip: unknown, stateCode: unknown): boolean {
  const z = String(zip ?? "").replace(/\D/g, "");
  if (z.length !== 5) return false;
  const states = ZIP3_STATES[z.slice(0, 3)];
  return !!states && states.includes(String(stateCode ?? "").toUpperCase());
}

/** Returns an error message for the claim address, or null if it looks valid. */
export function validateClaimAddress(a: {
  address1?: string; city?: string; state?: string; zip?: string;
}): string | null {
  if (!(a.address1 || "").trim()) return "Enter your street address.";
  if (!(a.city || "").trim()) return "Enter your city.";
  if (!(a.state || "").trim()) return "Select your state.";
  const zip = String(a.zip ?? "").replace(/\D/g, "");
  if (zip.length !== 5) return "Enter a valid 5-digit ZIP code.";
  if (!zipMatchesState(zip, a.state)) return "That ZIP code doesn't match the selected state.";
  return null;
}
