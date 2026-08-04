// Raw-data integrity check + a live proof that the DB rejects duplicates.
import { newPool } from "./_env.mjs";
const pool = newPool(2);

async function main() {
  const c = await pool.connect();
  try {
    const [{ count: orders }] = (await c.query(`select count(*)::int from orders`)).rows;
    const [{ count: cycles }] = (await c.query(`select count(*)::int from cycles`)).rows;
    console.log(`\nDB has ${orders} orders across ${cycles} cycle(s).`);

    // 1) Any two orders sharing the same middle number within a cycle?
    const dup = await c.query(`
      select cycle_id, order_token, count(*) c, array_agg(shopify_order_id) ids
      from orders group by cycle_id, order_token having count(*) > 1 order by c desc`);
    console.log(`\n1) Shared middle numbers (cycle_id, order_token) with >1 order:`);
    console.log(dup.rowCount === 0 ? "   ✅ NONE — every order in a cycle has a unique middle number." : dup.rows);

    // token range sanity per cycle
    const range = await c.query(`
      select cycle_id, count(*) orders, count(distinct order_token) distinct_tokens,
             min(order_token::int) lo, max(order_token::int) hi
      from orders group by cycle_id order by cycle_id`);
    console.log(`\n   per-cycle: orders vs DISTINCT tokens (must be equal):`);
    for (const r of range.rows)
      console.log(`   cycle ${r.cycle_id}: ${r.orders} orders, ${r.distinct_tokens} distinct tokens, range ${r.lo}..${r.hi}`);

    // 2) Any duplicate actual TICKET numbers?
    const tk = (await c.query(`
      select count(*)::int total,
             count(distinct (o.cycle_id||'-'||o.order_token||'-'||g.seq))::int distinct_tickets
      from entry_blocks eb join orders o on o.id=eb.order_id
      cross join lateral generate_series(eb.seq_start, eb.seq_end) g(seq)
      where not eb.voided`)).rows[0];
    console.log(`\n2) Ticket numbers: ${tk.total} total, ${tk.distinct_tickets} distinct → ${tk.total === tk.distinct_tickets ? "✅ NO duplicates" : "❌ DUPLICATES!"}`);

    // 3) The DB-level constraints that enforce this regardless of app code.
    const cons = await c.query(`
      select conrelid::regclass::text tbl, conname, pg_get_constraintdef(oid) def
      from pg_constraint
      where conrelid in ('orders'::regclass, 'entry_blocks'::regclass, 'processed_webhooks'::regclass)
        and contype in ('u','p')
      order by tbl, conname`);
    console.log(`\n3) UNIQUE / PK constraints enforcing uniqueness at the DB level:`);
    for (const r of cons.rows) console.log(`   ${r.tbl}: ${r.def}`);

    // 4) LIVE PROOF: try to insert a duplicate (cycle_id, order_token) → DB must refuse.
    console.log(`\n4) Live proof — attempting to insert two orders with the SAME (cycle_id, order_token):`);
    const cyc = (await c.query(`select id from cycles order by id limit 1`)).rows[0];
    if (!cyc) { console.log("   (no cycle to test against)"); }
    else {
      await c.query("BEGIN");
      try {
        const u = (await c.query(`insert into users (email) values ('dup-proof@ex.com')
          on conflict (email) do update set email=excluded.email returning id`)).rows[0].id;
        await c.query(`insert into orders (shopify_order_id, order_token, user_id, cycle_id)
          values (999000001, '9999', $1, $2)`, [u, cyc.id]);
        // second insert, same token, different order id → should throw 23505
        await c.query(`insert into orders (shopify_order_id, order_token, user_id, cycle_id)
          values (999000002, '9999', $1, $2)`, [u, cyc.id]);
        console.log("   ❌ UNEXPECTED: the database allowed a duplicate!");
      } catch (e) {
        console.log(`   ✅ REJECTED by the database: [${e.code}] ${e.message}`);
      } finally {
        await c.query("ROLLBACK"); // undo the proof, leave data untouched
      }
    }
    console.log();
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
