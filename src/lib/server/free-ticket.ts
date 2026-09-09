// Free-ticket-on-signup (confirm-to-claim). A teaser email signup creates a claim
// token and emails a confirm link; confirming captures the holder's name + phone,
// creates a $0 Shopify order, and mints one real entry through the normal pipeline.
import crypto from "node:crypto";
import { pool } from "./db";
import { mintOne } from "./ticketing";
import { createCompedTicketOrder } from "./shopify-orders";
import { emitEmailEvent } from "./email-templates";
import { normalizePhone } from "./http";
import { ticketRange } from "@/lib/ticket-format";

const CLAIM_TTL_HOURS = 72;
const hashToken = (t: string) => crypto.createHash("sha256").update(t.trim()).digest("hex");

/** Start a claim: ensure a fresh token + email the confirm-to-claim link. No-op
 *  (alreadyClaimed) if this email already redeemed a free ticket. */
export async function startFreeTicketClaim(email: string, origin: string): Promise<{ ok: boolean; alreadyClaimed?: boolean }> {
  const norm = email.trim().toLowerCase();
  const claimed = (await pool.query(`select 1 from free_ticket_claims where email = $1 and status = 'claimed' limit 1`, [norm])).rowCount;
  if (claimed) return { ok: true, alreadyClaimed: true };

  const token = crypto.randomBytes(24).toString("hex");
  const hash = hashToken(token);
  await pool.query(
    `insert into free_ticket_claims (email, token_hash, expires_at) values ($1, $2, now() + ($3 || ' hours')::interval)`,
    [norm, hash, String(CLAIM_TTL_HOURS)],
  );
  const claimUrl = `${origin}/claim?token=${token}`;
  await emitEmailEvent("Free Ticket Confirm", "free_ticket_confirm", norm, { claim_url: claimUrl }, `claim-${hash}`).catch(() => {});
  return { ok: true };
}

export type ClaimResult =
  | { ok: true; ticketNumbers: string; cycle: string }
  | { ok: false; error: string };

/** Confirm a claim: validate token, capture name + phone, create the $0 order, mint. */
export async function confirmFreeTicket(rawToken: string, name: string, phone: string, origin: string): Promise<ClaimResult> {
  const fullName = (name || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const normPhone = normalizePhone(phone) ?? (phone || "").trim();
  if (!fullName) return { ok: false, error: "Enter your name." };
  if (!normPhone) return { ok: false, error: "Enter a valid US phone number." };

  const hash = hashToken(rawToken || "");
  const claim = (await pool.query(
    `select id, email, status, expires_at from free_ticket_claims where token_hash = $1`,
    [hash],
  )).rows[0] as { id: number; email: string; status: string; expires_at: string } | undefined;
  if (!claim) return { ok: false, error: "This claim link isn't valid." };
  if (claim.status === "claimed") return { ok: false, error: "This link was already used." };
  if (new Date(claim.expires_at).getTime() < Date.now()) return { ok: false, error: "This claim link has expired." };

  const email = claim.email;
  if ((await pool.query(`select 1 from free_ticket_claims where email = $1 and status = 'claimed' limit 1`, [email])).rowCount) {
    return { ok: false, error: "You've already claimed your free ticket." };
  }

  const cyc = (await pool.query(`select id, code, vehicle_label from cycles where status = 'open' order by code desc limit 1`)).rows[0] as
    | { id: number; code: string; vehicle_label: string | null }
    | undefined;
  if (!cyc) return { ok: false, error: "No open draw right now — try again soon." };

  // Create the $0 Shopify order, then mint directly (idempotent vs the webhook).
  const order = await createCompedTicketOrder({ email });
  const mint = await mintOne(
    { webhookId: `free-${order.orderId}`, order: { id: order.orderId, email, line_items: [{ id: order.lineId, ticket_count: 1 }] } },
    "seq",
  );
  if (!mint.ok) return { ok: false, error: "Couldn't mint your ticket — please contact support." };

  const ticketNumbers =
    mint.cycle_code && mint.order_token && mint.entries ? ticketRange(mint.cycle_code, mint.order_token, mint.entries) : "";

  // Holder name + phone on the order → printed on the barrel ticket sheet.
  await pool
    .query(
      `update orders set full_name = $2, phone = $3,
         channel = coalesce(channel, 'Email signup (free ticket)'), revenue_usd = coalesce(revenue_usd, 0)
       where shopify_order_id = $1`,
      [order.orderId, fullName, normPhone],
    )
    .catch(() => {});

  await pool.query(
    `update free_ticket_claims set status = 'claimed', full_name = $2, phone = $3,
       cycle_id = $4, shopify_order_id = $5, ticket_numbers = $6, claimed_at = now() where id = $1`,
    [claim.id, fullName, normPhone, cyc.id, order.orderId, ticketNumbers],
  );

  // Receipt with the real ticket number (same template as a paid order).
  await emitEmailEvent(
    "Tickets Minted",
    "tickets_minted",
    email,
    {
      entries: mint.entries ?? 1,
      cycle: mint.cycle_code ?? cyc.code,
      prize: cyc.vehicle_label ?? "",
      ticket_prefix: mint.ticket_prefix ?? "",
      ticket_numbers: ticketNumbers,
      lookup_url: `${origin}/beta/lookup?email=${encodeURIComponent(email)}`,
      order_token: mint.order_token ?? "",
      shopify_order_id: order.orderId,
    },
    `mint-${order.orderId}`,
  ).catch(() => {});

  return { ok: true, ticketNumbers, cycle: mint.cycle_code ?? cyc.code };
}
