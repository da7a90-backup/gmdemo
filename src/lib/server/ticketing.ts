// Shared server-side ticketing logic used by /api/tickets/generate and the
// /tptestaqz00 test bench. Talks to Supabase via node-postgres (DIRECT_URL).
// See docs/build/data-model.md §3.
import { type PoolClient } from "pg";
import { pool, withClient, dropAll, applyAllMigrations } from "./db";

export type Mode = "safe" | "naive" | "seq";
export type Line = { id: number; ticket_count: number };
export type OrderPayload = { id: number; email: string; multiplier?: number; line_items: Line[] };
export type Body = { webhookId: string; order: OrderPayload };

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";

export type MintResult =
  | { ok: true; attempt: number; status: "minted" | "duplicate_delivery"; ticket_prefix?: string; entries?: number; order_token?: string; cycle_code?: string }
  | { ok: false; error: string };

export async function mintOne(body: Body, mode: Mode): Promise<MintResult> {
  const MAX_RETRY = mode === "naive" ? 1 : 5;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const client = await pool.connect();
    try {
      const r = await mint(client, body, mode);
      client.release();
      return { ok: true, attempt, ...r };
    } catch (e) {
      lastErr = e;
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
      client.release();
      if (mode !== "naive" && isUniqueViolation(e) && attempt < MAX_RETRY) continue;
      break;
    }
  }
  return { ok: false, error: String((lastErr as Error)?.message ?? lastErr) };
}

async function mint(client: PoolClient, body: Body, mode: Mode) {
  const { webhookId, order } = body;
  await client.query("BEGIN");

  const dedupe = await client.query(
    `insert into processed_webhooks (webhook_id, topic) values ($1, 'orders/paid') on conflict do nothing`,
    [webhookId],
  );
  if (dedupe.rowCount === 0) {
    await client.query("COMMIT");
    return { status: "duplicate_delivery" as const };
  }

  const user = await client.query(
    `insert into users (email) values ($1) on conflict (email) do update set email = excluded.email returning id`,
    [order.email],
  );
  const userId = user.rows[0].id as number;

  const cyc = await client.query(`select id, code from cycles where status = 'open' order by id limit 1`);
  if (cyc.rowCount === 0) throw new Error("no open cycle");
  const cycle = cyc.rows[0] as { id: number; code: string };

  let orderRow = (
    await client.query(`select id, order_token from orders where shopify_order_id = $1`, [order.id])
  ).rows[0] as { id: number; order_token: string } | undefined;

  if (!orderRow) {
    let token: string;
    if (mode === "seq") {
      const n = await client.query(`select nextval($1::regclass)::int as v`, [`order_seq_cyc_${cycle.id}`]);
      token = String(n.rows[0].v).padStart(4, "0");
    } else if (mode === "safe") {
      const n = await client.query(
        `update cycle_counters set last_order_no = last_order_no + 1 where cycle_id = $1 returning last_order_no`,
        [cycle.id],
      );
      token = String(n.rows[0].last_order_no).padStart(4, "0");
    } else {
      const m = await client.query(
        `select coalesce(max(order_token::int), 0) + 1 as next from orders where cycle_id = $1`,
        [cycle.id],
      );
      token = String(m.rows[0].next).padStart(4, "0");
    }
    await client.query(
      `insert into orders (shopify_order_id, order_token, user_id, cycle_id, promo_multiplier)
       values ($1,$2,$3,$4,$5) on conflict (shopify_order_id) do nothing`,
      [order.id, token, userId, cycle.id, order.multiplier ?? 1],
    );
    orderRow = (
      await client.query(`select id, order_token from orders where shopify_order_id = $1`, [order.id])
    ).rows[0] as { id: number; order_token: string };
  }

  const lines = [...order.line_items].sort((a, b) => a.id - b.id);
  const mult = order.multiplier ?? 1;
  let seq = 0;
  for (const line of lines) {
    const entries = line.ticket_count * mult;
    await client.query(
      `insert into entry_blocks (cycle_id, order_id, shopify_line_id, user_id, purchased_tickets, multiplier, seq_start, seq_end)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (shopify_line_id) do nothing`,
      [cycle.id, orderRow.id, line.id, userId, line.ticket_count, mult, seq + 1, seq + entries],
    );
    seq += entries;
  }

  await client.query("COMMIT");
  return {
    status: "minted" as const,
    order_token: orderRow.order_token,
    cycle_code: cycle.code,
    ticket_prefix: `GM${cycle.code.padStart(2, "0")}-${orderRow.order_token}`,
    entries: seq,
  };
}

// ---- test-bench helpers ----------------------------------------------------

export async function resetDb() {
  return withClient(async (c) => {
    await dropAll(c);
    await applyAllMigrations(c);
    await c.query(`insert into cycles (code, status) values ('12', 'open')`);
    const cid = (
      await c.query(
        `insert into cycle_counters (cycle_id, last_order_no) select id, 0 from cycles where code='12' returning cycle_id`,
      )
    ).rows[0].cycle_id as number;
    await c.query(`create sequence order_seq_cyc_${cid} start 1`);
    return { ok: true as const, cycleId: cid };
  });
}

export type BatchOpts = { count: number; mode: Mode; min: number; max: number; multiplier?: number };

export async function runBatch(opts: BatchOpts) {
  const count = Math.max(1, Math.min(200, Math.floor(opts.count)));
  const min = Math.max(1, Math.floor(opts.min));
  const max = Math.max(min, Math.floor(opts.max));
  const multiplier = Math.max(1, Math.floor(opts.multiplier ?? 1));
  const mode = opts.mode;

  let s = (Date.now() % 1_000_000) + Math.floor(Math.random() * 1000) * 1_000_000;
  const nextId = () => ++s;
  const orders = Array.from({ length: count }, () => {
    const entries = min === max ? min : min + Math.floor(Math.random() * (max - min + 1));
    return {
      webhookId: `wh_${nextId()}`,
      order: { id: nextId(), email: `u${nextId()}@ex.com`, multiplier, line_items: [{ id: nextId(), ticket_count: entries }] },
    } as Body;
  });
  const expectedTotal = orders.reduce((n, o) => n + o.order.line_items[0].ticket_count * multiplier, 0);

  const t0 = Date.now();
  const raw = await Promise.all(orders.map((o) => mintOne(o, mode)));
  const ms = Date.now() - t0;

  // verify completeness against the DB
  const orderIds = orders.map((o) => o.order.id);
  const c = await pool.connect();
  let gotMap = new Map<string, number>();
  try {
    const rows = (
      await c.query(
        `select o.shopify_order_id sid, coalesce(sum(eb.ticket_count),0)::int entries
         from orders o left join entry_blocks eb on eb.order_id=o.id
         where o.shopify_order_id = any($1) group by o.shopify_order_id`,
        [orderIds],
      )
    ).rows;
    gotMap = new Map(rows.map((r) => [String(r.sid), r.entries as number]));
  } finally {
    c.release();
  }

  const results = orders.map((o, i) => {
    const requested = o.order.line_items[0].ticket_count * multiplier;
    const got = gotMap.get(String(o.order.id)) ?? 0;
    return { orderId: o.order.id, email: o.order.email, requested, gotEntries: got, ...raw[i] };
  });
  const failures = results.filter((r) => !r.ok).length;
  const missing = results.filter((r) => r.requested !== r.gotEntries).length;

  return { count, mode, min, max, multiplier, expectedTotal, ms, failures, missing, results };
}

export async function auditAll() {
  const c = await pool.connect();
  try {
    const dup = await c.query(
      `select order_token from orders group by cycle_id, order_token having count(*) > 1`,
    );
    const tk = (
      await c.query(`select count(*)::int total,
                            count(distinct (o.cycle_id || '-' || o.order_token || '-' || g.seq))::int distinct_tickets
                     from entry_blocks eb
                     join orders o on o.id = eb.order_id
                     cross join lateral generate_series(eb.seq_start, eb.seq_end) g(seq)
                     where not eb.voided`)
    ).rows[0];
    const orders = (
      await c.query(`
        select o.id, o.shopify_order_id, o.order_token, u.email, cy.code cycle_code, o.promo_multiplier,
               coalesce(sum(eb.ticket_count),0)::int entries,
               min(eb.seq_start) seq_start, max(eb.seq_end) seq_end,
               to_char(o.created_at, 'HH24:MI:SS') created_at
        from orders o
        join users u on u.id = o.user_id
        join cycles cy on cy.id = o.cycle_id
        left join entry_blocks eb on eb.order_id = o.id
        group by o.id, u.email, cy.code
        order by o.id desc`)
    ).rows;
    return {
      summary: {
        totalOrders: orders.length,
        totalTickets: tk.total as number,
        distinctTickets: tk.distinct_tickets as number,
        duplicateTokens: dup.rowCount ?? 0,
        noDuplicates: (tk.total as number) === (tk.distinct_tickets as number),
      },
      orders,
    };
  } finally {
    c.release();
  }
}
