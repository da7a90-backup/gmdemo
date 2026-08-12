// Canonical ticket-number format (per Kevin): GM-<cycle2><order4><ticket4>.
// The three numeric blocks are concatenated after "GM-"; e.g. cycle 5, order 53,
// ticket 1 → "GM-0500530001". Used by the /lookup + /account views and the admin
// A3 print sheets so every surface shows the same number.

/** One ticket's number. `index` is the ticket's position WITHIN its order (1-based). */
export function ticketNo(cycle: number | string, order: number | string, index: number): string {
  const cc = String(Number(cycle) || 0).padStart(2, "0");
  const oo = String(Number(order) || 0).padStart(4, "0");
  const tt = String(index).padStart(4, "0");
  return `GM-${cc}${oo}${tt}`;
}

/** A holder's ticket number(s) for one order: a single number, or a first–last range. */
export function ticketRange(cycle: number | string, order: number | string, count: number): string {
  if (count <= 1) return ticketNo(cycle, order, 1);
  return `${ticketNo(cycle, order, 1)} – ${ticketNo(cycle, order, count)}`;
}
