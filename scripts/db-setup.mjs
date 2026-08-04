// Reset + create the ticketing schema and seed one open cycle.
//   node scripts/db-setup.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { newPool } from "./_env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pool = newPool(1);

const DROP = `
drop table if exists entry_blocks cascade;
drop table if exists processed_webhooks cascade;
drop table if exists orders cascade;
drop table if exists cycle_counters cascade;
drop table if exists cycles cascade;
drop table if exists users cascade;
`;

async function main() {
  const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");
  const c = await pool.connect();
  try {
    console.log("Dropping old tables…");
    await c.query(DROP);
    console.log("Creating schema…");
    await c.query(schema);
    console.log("Seeding cycle 12 (open) + counter…");
    await c.query(`insert into cycles (code, status) values ('12', 'open')`);
    await c.query(
      `insert into cycle_counters (cycle_id, last_order_no)
       select id, 0 from cycles where code = '12'`,
    );
    // Per-cycle SEQUENCE for the lock-free order-number allocator (?mode=seq).
    const cid = (await c.query(`select id from cycles where code = '12'`)).rows[0].id;
    await c.query(`drop sequence if exists order_seq_cyc_${cid}`);
    await c.query(`create sequence order_seq_cyc_${cid} start 1`);
    const cnt = await c.query(`select code, status from cycles`);
    console.log(`Ready. Cycles:`, cnt.rows, `| sequence order_seq_cyc_${cid} created`);
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("SETUP FAILED:", e.message);
  process.exit(1);
});
