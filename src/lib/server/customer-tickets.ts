// Real minted entries for a signed-in customer — replaces the mock `entryDB` on
// /account and /lookup once Shopify auth is live. Matched by our users row (email
// and/or shopify_customer_gid), which the orders/paid webhook + auth callback set.
import { pool } from "./db";

export type CustomerEntry = {
  cycle: string;
  cycleStatus: string;
  vehicle: string;
  drawDateISO: string;
  tickets: number;
  ticketPrefix: string; // e.g. GM01-0004
  orderToken: string;
};

export type CustomerEntries = { active: CustomerEntry[]; past: CustomerEntry[]; totalTickets: number };

export async function listCustomerEntries(opts: { email?: string | null; gid?: string | null }): Promise<CustomerEntries> {
  const { email = null, gid = null } = opts;
  if (!email && !gid) return { active: [], past: [], totalTickets: 0 };

  const rows = (
    await pool.query(
      `select o.order_token, cy.code as cycle_code, cy.status as cycle_status,
              coalesce(cy.vehicle_label, '') as vehicle, cy.draw_date,
              coalesce(sum(eb.ticket_count), 0)::int as tickets
       from entry_blocks eb
       join orders o  on o.id = eb.order_id
       join cycles cy on cy.id = eb.cycle_id
       join users u   on u.id = eb.user_id
       where not eb.voided
         and ( ($1::citext is not null and u.email = $1)
            or ($2::text  is not null and u.shopify_customer_gid = $2) )
       group by o.id, o.order_token, cy.code, cy.status, cy.vehicle_label, cy.draw_date
       order by cy.code::int desc, o.order_token::int`,
      [email, gid],
    )
  ).rows;

  const active: CustomerEntry[] = [];
  const past: CustomerEntry[] = [];
  let totalTickets = 0;
  for (const r of rows) {
    const code = r.cycle_code as string;
    const e: CustomerEntry = {
      cycle: code,
      cycleStatus: r.cycle_status as string,
      vehicle: (r.vehicle as string) || "",
      drawDateISO: r.draw_date ? new Date(r.draw_date as string).toISOString() : "",
      tickets: r.tickets as number,
      ticketPrefix: `GM${code.padStart(2, "0")}-${r.order_token}`,
      orderToken: r.order_token as string,
    };
    totalTickets += e.tickets;
    (e.cycleStatus === "open" ? active : past).push(e);
  }
  return { active, past, totalTickets };
}
