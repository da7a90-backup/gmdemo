// What happens when the per-cycle ORDER counter passes 9999?
import { newPool } from "./_env.mjs";
const pool = newPool(1);

async function main() {
  // 1) The formatter: padStart never truncates — it only pads.
  console.log("\n1) String(n).padStart(4,'0') behavior:");
  for (const n of [1, 9999, 10000, 10001, 100000]) {
    console.log(`   order #${n}  →  token "${String(n).padStart(4, "0")}"  →  GM12-${String(n).padStart(4, "0")}-0001`);
  }

  // 2) Live: does the DB accept 5-digit tokens, keep them unique, still reject dups?
  const c = await pool.connect();
  try {
    const cyc = (await c.query(`select id from cycles order by id limit 1`)).rows[0];
    if (!cyc) return console.log("\n(no cycle to test)");
    await c.query("BEGIN");
    const uid = (await c.query(`insert into users (email) values ('overflow@ex.com')
      on conflict (email) do update set email=excluded.email returning id`)).rows[0].id;

    console.log("\n2) Inserting orders with tokens around and past the 9999 boundary:");
    let n = 0;
    for (const [sid, tok] of [[888001, "9999"], [888002, "10000"], [888003, "10001"], [888004, "100000"]]) {
      await c.query(`insert into orders (shopify_order_id, order_token, user_id, cycle_id)
        values ($1,$2,$3,$4)`, [sid, tok, uid, cyc.id]);
      n++;
      console.log(`   ✅ accepted token "${tok}"  →  ticket GM12-${tok}-0001  (${`GM12-${tok}-0001`.length} chars)`);
    }

    // 3) Uniqueness still enforced at these values?
    const dup = await c.query(`select cycle_id, order_token, count(*) c from orders
      where cycle_id=$1 and order_token in ('9999','10000','10001','100000')
      group by cycle_id, order_token having count(*)>1`, [cyc.id]);
    console.log(`\n3) Any duplicates among them? ${dup.rowCount === 0 ? "✅ none — all distinct" : "❌"}`);

    console.log("\n4) Try to insert token \"10000\" a SECOND time (same cycle):");
    try {
      await c.query(`insert into orders (shopify_order_id, order_token, user_id, cycle_id)
        values (888999, '10000', $1, $2)`, [uid, cyc.id]);
      console.log("   ❌ UNEXPECTED: duplicate allowed");
    } catch (e) {
      console.log(`   ✅ still REJECTED by the DB: [${e.code}] unique constraint holds past 9999`);
    }

    await c.query("ROLLBACK"); // leave your data untouched
    console.log("\n(rolled back — nothing written to your DB)\n");
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
