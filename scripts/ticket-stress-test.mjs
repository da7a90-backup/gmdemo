// Stress-test the /api/tickets/generate endpoint against the real Supabase DB.
//
//   1) start the app:   npm run dev        (or: npm run build && npm start)
//   2) run:             node scripts/ticket-stress-test.mjs
//
// It proves three things the raffle cannot get wrong:
//   A. CONCURRENCY  — many DISTINCT orders paid at the same instant → every order
//      gets tickets, NO duplicate ticket numbers, NO missing tickets.
//   B. IDEMPOTENCY  — the SAME order delivered many times at once → exactly one set
//      of tickets (never doubled), and never zero.
//   C. NAIVE vs SAFE — the same load against ?mode=naive (SELECT MAX()+1, no lock)
//      to show the failure you've seen in production, so the contrast is empirical.
import { newPool } from "./_env.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const pool = newPool(8);
let idSeq = Date.now() % 1_000_000; // unique-ish base for shopify ids across runs
const nextId = () => ++idSeq;

// ---- helpers ---------------------------------------------------------------
function makeOrder({ lines = 1, min = 1, max = 20, multiplier = 1 } = {}) {
  const line_items = Array.from({ length: lines }, () => ({
    id: nextId(),
    ticket_count: min + Math.floor(Math.random() * (max - min + 1)),
  }));
  const expected = line_items.reduce((n, l) => n + l.ticket_count * multiplier, 0);
  return {
    payload: { webhookId: `wh_${nextId()}`, order: { id: nextId(), email: `u${nextId()}@ex.com`, multiplier, line_items } },
    expected,
  };
}

async function post(payload, mode, { retries = 0 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/tickets/generate?mode=${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true, json };
      if (attempt < retries) continue; // simulate Shopify re-delivering the webhook
      return { ok: false, status: res.status, json };
    } catch (e) {
      if (attempt < retries) continue;
      return { ok: false, error: String(e) };
    }
  }
}

async function q(sql, params) {
  const c = await pool.connect();
  try {
    return (await c.query(sql, params)).rows;
  } finally {
    c.release();
  }
}

// Materialize EVERY actual ticket number and check global uniqueness + counts.
async function dbAudit() {
  const dupTok = await q(
    `select order_token, count(*) c from orders group by cycle_id, order_token having count(*) > 1`,
  );
  const tickets = (
    await q(`select count(*)::int total,
                    count(distinct (o.cycle_id || '-' || o.order_token || '-' || g.seq))::int distinct_tickets
             from entry_blocks eb
             join orders o on o.id = eb.order_id
             cross join lateral generate_series(eb.seq_start, eb.seq_end) g(seq)
             where not eb.voided`)
  )[0];
  return { duplicateTokens: dupTok.length, ...tickets };
}

async function entriesForOrders(orderIds) {
  const rows = await q(
    `select o.shopify_order_id sid, coalesce(sum(eb.ticket_count),0)::int entries
     from orders o left join entry_blocks eb on eb.order_id = o.id
     where o.shopify_order_id = any($1) group by o.shopify_order_id`,
    [orderIds],
  );
  return new Map(rows.map((r) => [String(r.sid), r.entries]));
}

const pass = (b) => (b ? "✅ PASS" : "❌ FAIL");
let allGreen = true;
const check = (label, ok, detail = "") => {
  if (!ok) allGreen = false;
  console.log(`   ${pass(ok)}  ${label}${detail ? " — " + detail : ""}`);
};

// ---- A. concurrency: distinct orders ---------------------------------------
async function scenarioA(N = 200, mode = "safe") {
  console.log(`\n── A. ${N} DISTINCT orders fired concurrently (${mode} mode) ──`);
  const orders = Array.from({ length: N }, () => makeOrder({ lines: 1 + (Math.random() < 0.4 ? 1 : 0) }));
  const expectedTotal = orders.reduce((n, o) => n + o.expected, 0);
  const t0 = Date.now();
  const results = await Promise.all(orders.map((o) => post(o.payload, mode, { retries: 4 })));
  const ms = Date.now() - t0;

  const failures = results.filter((r) => !r.ok);
  const ids = orders.map((o) => String(o.payload.order.id));
  const gotEntries = await entriesForOrders(ids);
  const missing = orders.filter((o) => (gotEntries.get(String(o.payload.order.id)) ?? 0) !== o.expected);
  const audit = await dbAudit();

  console.log(`   ${N} orders, ${expectedTotal} entries, ${ms}ms, ${results.length - failures.length} ok / ${failures.length} failed`);
  check("no request failed after retries (no paid-but-no-ticket)", failures.length === 0, `${failures.length} failed`);
  check("every order has exactly its tickets (no missing/short)", missing.length === 0, `${missing.length} wrong`);
  check("no duplicate order tokens in the cycle", audit.duplicateTokens === 0, `${audit.duplicateTokens} dup tokens`);
  check("no duplicate ticket numbers", audit.total === audit.distinct_tickets, `${audit.total} tickets, ${audit.distinct_tickets} distinct`);
  if (failures[0]) console.log("      e.g. failure:", failures[0].status, JSON.stringify(failures[0].json));
}

// ---- B. idempotency: same order, many concurrent deliveries ----------------
async function scenarioB(K = 50) {
  console.log(`\n── B. SAME order delivered ${K}× concurrently (distinct webhook ids) ──`);
  const base = makeOrder({ lines: 2, min: 3, max: 8 });
  const deliveries = Array.from({ length: K }, () => ({
    webhookId: `wh_${nextId()}`, // different delivery id each time (worst case)
    order: base.payload.order, // SAME order id + SAME line ids
  }));
  const results = await Promise.all(deliveries.map((p) => post(p, "safe", { retries: 2 })));
  const failed = results.filter((r) => !r.ok).length;

  const orderRows = await q(`select id from orders where shopify_order_id = $1`, [base.payload.order.id]);
  const got = (await entriesForOrders([String(base.payload.order.id)])).get(String(base.payload.order.id)) ?? 0;

  check("exactly ONE order row (not duplicated)", orderRows.length === 1, `${orderRows.length} rows`);
  check(`exactly ${base.expected} entries (not ${K}× that)`, got === base.expected, `${got} entries`);
  check("no delivery errored out", failed === 0, `${failed} failed`);
}

// ---- C. the naive way (what fails in production) ---------------------------
async function scenarioC(M = 150) {
  console.log(`\n── C. ${M} DISTINCT orders in ?mode=naive (SELECT MAX()+1, no lock, no retry) ──`);
  const orders = Array.from({ length: M }, () => makeOrder({ lines: 1 }));
  const results = await Promise.all(orders.map((o) => post(o.payload, "naive", { retries: 0 })));
  const failures = results.filter((r) => !r.ok);
  const ids = orders.map((o) => String(o.payload.order.id));
  const gotEntries = await entriesForOrders(ids);
  const missing = orders.filter((o) => (gotEntries.get(String(o.payload.order.id)) ?? 0) !== o.expected);

  console.log(`   ${failures.length}/${M} orders REJECTED after "payment" (paid-but-no-ticket), ${missing.length} missing tickets`);
  console.log(`   ${failures.length > 0 ? "⚠️  demonstrates the exact failure the safe mode prevents" : "no collisions this run (timing-dependent) — the risk is still real; safe mode removes it entirely"}`);
  if (failures[0]) console.log("      e.g.:", failures[0].status, JSON.stringify(failures[0].json));
}

async function main() {
  console.log(`Target: ${BASE}  (make sure the app is running)`);
  // sanity ping
  const ping = await post({ webhookId: `wh_ping_${nextId()}`, order: { id: nextId(), email: "ping@ex.com", line_items: [{ id: nextId(), ticket_count: 1 }] } }, "safe");
  if (!ping.ok && ping.error) {
    console.error(`\nCannot reach ${BASE}. Start the app first (npm run dev).`);
    process.exit(1);
  }
  if (process.env.ONLY === "A") {
    await scenarioA(Number(process.env.N) || 200, process.env.MODE || "safe");
    console.log(`\n${allGreen ? "✅ PASSED" : "❌ FAILED"}`);
    await pool.end();
    process.exit(allGreen ? 0 : 1);
  }
  await scenarioA(200);
  await scenarioB(50);
  await scenarioC(150);
  console.log(`\n${allGreen ? "✅ ALL SAFE-MODE CHECKS PASSED" : "❌ SOME CHECKS FAILED"} — see above.`);
  await pool.end();
  process.exit(allGreen ? 0 : 1);
}

main().catch((e) => {
  console.error("STRESS TEST ERROR:", e);
  process.exit(1);
});
