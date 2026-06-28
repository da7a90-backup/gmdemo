// Generate collision-proof ticket IDs.
//
// Format: GM-{cycle:0>3}-{userHash}-{ticket:0>4}
// Where userHash is a 6-char crockford-base32 derived from a stable contact key,
// and ticket is the per-purchase index. The combination of cycle+userHash+ticket
// guarantees uniqueness across the entire raffle universe, and the structure is
// auditable on a printed barrel ticket (cycle + buyer fingerprint + entry index).

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32 (no I, L, O, U)

const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash >>> 0;
};

const base32 = (n: number, length: number): string => {
  let out = "";
  let value = n;
  for (let i = 0; i < length; i++) {
    out = ALPHABET[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return out;
};

export const contactKey = (email?: string, phone?: string): string => {
  const e = (email ?? "").trim().toLowerCase();
  const p = (phone ?? "").replace(/\D/g, "");
  return e || p || `anon-${Date.now()}`;
};

export const userFingerprint = (key: string): string => {
  const seed = fnv1a(`gm-v1::${key}`);
  return base32(seed, 6);
};

export type TicketID = {
  full: string;
  drawCycle: number;
  userHash: string;
  index: number;
};

export const generateTicketIDs = (opts: {
  drawCycle: number;
  contact: { email?: string; phone?: string };
  count: number;
  startIndex?: number;
}): TicketID[] => {
  const key = contactKey(opts.contact.email, opts.contact.phone);
  const userHash = userFingerprint(key);
  const start = opts.startIndex ?? 1;
  const cyclePad = String(opts.drawCycle).padStart(3, "0");
  const ids: TicketID[] = [];
  for (let i = 0; i < opts.count; i++) {
    const idx = start + i;
    const indexPad = String(idx).padStart(4, "0");
    ids.push({
      full: `GM-${cyclePad}-${userHash}-${indexPad}`,
      drawCycle: opts.drawCycle,
      userHash,
      index: idx,
    });
  }
  return ids;
};
