// POST /api/tickets/generate  — mint raffle tickets from a (mocked) Shopify
// orders/paid webhook, idempotently and collision-free. See docs/build/data-model.md §3.
//
// ?mode=safe   (default) — the hardened design: atomic per-order counter via
//                          UPDATE ... RETURNING, unique(cycle_id, order_token)
//                          backstop, and a bounded retry on unique-violation.
// ?mode=naive            — the WRONG way people ship to prod: SELECT MAX()+1
//                          with no lock and no retry. Kept so the stress test can
//                          demonstrate it duplicating / rejecting-after-paid.
//
// Uses node-postgres directly for transparent transaction control. Reads DIRECT_URL
// (Supabase session pooler). Node runtime — we need real transactions + raw SQL.
import { NextResponse } from "next/server";
import { Pool, type PoolClient } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One pool for the process (reused across requests in dev).
const g = globalThis as unknown as { __gmPool?: Pool };
const pool =
  g.__gmPool ??
  (g.__gmPool = new Pool({ connectionString: process.env.DIRECT_URL, max: 10 }));

type Line = { id: number; ticket_count: number };
type OrderPayload = {
  id: number;
  email: string;
  multiplier?: number;
  line_items: Line[];
};
type Body = { webhookId: string; order: OrderPayload };
type Mode = "safe" | "naive" | "seq";

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";

export async function POST(req: Request) {
  const m = new URL(req.url).searchParams.get("mode");
  const mode: Mode = m === "naive" ? "naive" : m === "seq" ? "seq" : "safe";
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!body?.webhookId || !body?.order?.id) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const MAX_RETRY = mode === "naive" ? 1 : 5;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const client = await pool.connect();
    try {
      const result = await mint(client, body, mode);
      client.release();
      return NextResponse.json({ ok: true, attempt, ...result });
    } catch (e) {
      lastErr = e;
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      client.release();
      if (mode !== "naive" && isUniqueViolation(e) && attempt < MAX_RETRY) {
        continue; // guard 5: retry with the next number
      }
      break;
    }
  }

  // Non-2xx → in production Shopify re-delivers the webhook, so the order is not
  // lost; the reconciliation cron is the final safety net. The client of this
  // test simulates that re-delivery.
  return NextResponse.json(
    { ok: false, error: String((lastErr as Error)?.message ?? lastErr) },
    { status: 500 },
  );
}

async function mint(client: PoolClient, body: Body, mode: Mode) {
  const { webhookId, order } = body;
  await client.query("BEGIN");

  // Guard 2 — delivery-level dedupe (same webhook delivered twice).
  const dedupe = await client.query(
    `insert into processed_webhooks (webhook_id, topic) values ($1, 'orders/paid')
     on conflict do nothing`,
    [webhookId],
  );
  if (dedupe.rowCount === 0) {
    await client.query("COMMIT");
    return { status: "duplicate_delivery" as const };
  }

  const user = await client.query(
    `insert into users (email) values ($1)
     on conflict (email) do update set email = excluded.email returning id`,
    [order.email],
  );
  const userId = user.rows[0].id as number;

  const cyc = await client.query(
    `select id, code from cycles where status = 'open' order by id limit 1`,
  );
  if (cyc.rowCount === 0) throw new Error("no open cycle");
  const cycle = cyc.rows[0] as { id: number; code: string };

  // Allocate the order + its middle-part token (idempotent by shopify_order_id).
  let orderRow = (
    await client.query(`select id, order_token from orders where shopify_order_id = $1`, [
      order.id,
    ])
  ).rows[0] as { id: number; order_token: string } | undefined;

  if (!orderRow) {
    let token: string;
    if (mode === "seq") {
      // Lock-free: a per-cycle SEQUENCE. nextval never returns a duplicate and does
      // NOT hold a lock until commit, so orders don't serialize. Gaps are fine.
      const n = await client.query(`select nextval($1::regclass)::int as v`, [
        `order_seq_cyc_${cycle.id}`,
      ]);
      token = String(n.rows[0].v).padStart(4, "0");
    } else if (mode === "safe") {
      // Atomic: read+write fused, row-locked. Cannot hand two orders the same number.
      const n = await client.query(
        `update cycle_counters set last_order_no = last_order_no + 1
         where cycle_id = $1 returning last_order_no`,
        [cycle.id],
      );
      token = String(n.rows[0].last_order_no).padStart(4, "0");
    } else {
      // NAIVE: racy read-then-compute. Two concurrent orders read the same MAX.
      const m = await client.query(
        `select coalesce(max(order_token::int), 0) + 1 as next from orders where cycle_id = $1`,
        [cycle.id],
      );
      token = String(m.rows[0].next).padStart(4, "0");
    }

    await client.query(
      `insert into orders (shopify_order_id, order_token, user_id, cycle_id, promo_multiplier)
       values ($1, $2, $3, $4, $5) on conflict (shopify_order_id) do nothing`,
      [order.id, token, userId, cycle.id, order.multiplier ?? 1],
    );
    // Re-read the canonical row (in case a concurrent delivery won the insert).
    orderRow = (
      await client.query(`select id, order_token from orders where shopify_order_id = $1`, [
        order.id,
      ])
    ).rows[0] as { id: number; order_token: string };
  }

  // Mint one entry_block per line; sequence is continuous across the order's lines.
  const lines = [...order.line_items].sort((a, b) => a.id - b.id);
  const mult = order.multiplier ?? 1;
  let seq = 0;
  for (const line of lines) {
    const entries = line.ticket_count * mult;
    await client.query(
      `insert into entry_blocks
         (cycle_id, order_id, shopify_line_id, user_id, purchased_tickets, multiplier, seq_start, seq_end)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (shopify_line_id) do nothing`,
      [cycle.id, orderRow.id, line.id, userId, line.ticket_count, mult, seq + 1, seq + entries],
    );
    seq += entries;
  }

  await client.query("COMMIT");
  return {
    status: "minted" as const,
    ticket_prefix: `GM${cycle.code.padStart(2, "0")}-${orderRow.order_token}`,
    entries: seq,
  };
}
