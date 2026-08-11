// GET /api/cron/reconcile — the safety net (Sprint 2 C.8). Pulls recent PAID Shopify
// orders and replays any our ledger is missing through the idempotent mint (a killed
// orders/paid webhook, a dropped delivery). Runs daily via vercel.json crons. Paginates
// the full window; on a fresh replay it also sends the "Tickets Minted" receipt (deduped
// by the same unique_id the webhook uses, so no double receipt).
import { NextResponse } from "next/server";
import { pool } from "@/lib/server/db";
import { shopifyAdmin, shopifyAdminConfigured } from "@/lib/server/shopify";
import { mintOne, type Body } from "@/lib/server/ticketing";
import { emitEmailEvent } from "@/lib/server/email-templates";
import { MEMBERSHIP_PLANS } from "@/lib/server/shopify-membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Attr = { key: string; value: string };
type ReconOrder = {
  legacyResourceId: string; email: string | null;
  customAttributes: Attr[];
  lineItems: { nodes: { id: string; quantity: number; variantTitle: string | null; customAttributes: Attr[] }[] };
};

const attr = (a: Attr[] | undefined, name: string) => a?.find((x) => x.key.toLowerCase() === name.toLowerCase())?.value;
const tierEntries = (label: string): number | null => {
  const l = (label || "").toLowerCase();
  const p = MEMBERSHIP_PLANS.find((x) => l.includes(x.tier.toLowerCase()));
  return p ? p.entries : null;
};

/** Map a Shopify Admin order (GraphQL) to the idempotent mint Body — same conventions
 * as the orders/paid webhook (`_entries` per line, `_multiplier`, membership tier fallback). */
function toBody(o: ReconOrder): Body | null {
  const legacy = Number(o.legacyResourceId);
  if (!legacy) return null;
  const multiplier = Math.max(1, Math.floor(Number(attr(o.customAttributes, "_multiplier") ?? attr(o.customAttributes, "entry_multiplier")) || 1));
  const line_items = (o.lineItems?.nodes ?? [])
    .map((li) => {
      const per = Number(attr(li.customAttributes, "_entries") ?? attr(li.customAttributes, "entries"));
      const memberEach = tierEntries(li.variantTitle || "");
      const each = Number.isFinite(per) && per > 0 ? per : memberEach ?? 1;
      return { id: Number(String(li.id).split("/").pop()), ticket_count: each * Math.max(1, li.quantity ?? 1) };
    })
    .filter((l) => l.id && l.ticket_count > 0);
  if (!line_items.length) return null;
  return { webhookId: `recon-${legacy}`, order: { id: legacy, email: o.email ?? "", multiplier, line_items } };
}

const ORDERS_QUERY = `query($q: String!, $after: String) {
  orders(first: 100, query: $q, sortKey: CREATED_AT, after: $after) {
    nodes {
      legacyResourceId email
      customAttributes { key value }
      lineItems(first: 50) { nodes { id quantity variantTitle customAttributes { key value } } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!shopifyAdminConfigured()) return NextResponse.json({ ok: false, error: "shopify not configured" }, { status: 503 });

  const sinceISO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  try {
    let after: string | null = null;
    let checked = 0;
    let replayed = 0;
    const replayedIds: number[] = [];

    do {
      const res: { orders: { nodes: ReconOrder[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } = await shopifyAdmin(
        ORDERS_QUERY,
        { q: `financial_status:paid created_at:>=${sinceISO}`, after },
      );
      const orders = res.orders?.nodes ?? [];
      checked += orders.length;

      for (const o of orders) {
        const legacy = Number(o.legacyResourceId);
        if ((await pool.query(`select 1 from orders where shopify_order_id = $1`, [legacy])).rowCount) continue;
        const body = toBody(o);
        if (!body) continue;
        const r = await mintOne(body, "seq");
        if (r.ok && r.status === "minted") {
          replayed++;
          replayedIds.push(legacy);
          if (body.order.email) {
            const prize = (await pool.query(`select vehicle_label from cycles where code = $1`, [r.cycle_code]).catch(() => null))?.rows?.[0]?.vehicle_label ?? "";
            await emitEmailEvent(
              "Tickets Minted", "tickets_minted", body.order.email,
              { entries: r.entries ?? 0, cycle: r.cycle_code ?? "", prize, ticket_prefix: r.ticket_prefix ?? "", order_token: r.order_token ?? "", shopify_order_id: body.order.id },
              `mint-${body.order.id}`,
            ).catch(() => {});
          }
        }
      }
      after = res.orders?.pageInfo?.hasNextPage ? (res.orders.pageInfo.endCursor ?? null) : null;
    } while (after);

    if (replayed > 0) console.warn(`[reconcile] replayed ${replayed} missing order(s): ${replayedIds.join(", ")}`);
    return NextResponse.json({ ok: true, checked, replayed, replayedIds, since: sinceISO }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
