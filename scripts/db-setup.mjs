// Test-bench reset: drop everything, apply all migrations, seed one open cycle.
//   node scripts/db-setup.mjs
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { newPool } from "./_env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migDir = join(root, "db", "migrations");
const pool = newPool(1);

const DROP = `drop table if exists entry_blocks, processed_webhooks, orders, cycle_counters,
  cycles, sms_subscribers, email_subscribers, users cascade;
  drop table if exists schema_migrations cascade;`;

async function main() {
  const c = await pool.connect();
  try {
    console.log("Dropping old objects…");
    const seqs = (await c.query(`select relname from pg_class where relkind='S' and relname like 'order_seq_cyc_%'`)).rows;
    for (const r of seqs) await c.query(`drop sequence if exists ${r.relname}`);
    await c.query(DROP);
    await c.query(`create table schema_migrations (version text primary key, applied_at timestamptz not null default now())`);
    for (const f of readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()) {
      await c.query(readFileSync(join(migDir, f), "utf8"));
      await c.query(`insert into schema_migrations (version) values ($1)`, [f]);
      console.log(`  applied ${f}`);
    }
    await c.query(`insert into cycles (code, status) values ('12', 'open')`);
    const cid = (
      await c.query(`insert into cycle_counters (cycle_id, last_order_no) select id, 0 from cycles where code='12' returning cycle_id`)
    ).rows[0].cycle_id;
    await c.query(`create sequence order_seq_cyc_${cid} start 1`);
    console.log(`Ready. Seeded cycle 12 (open) + sequence order_seq_cyc_${cid}.`);
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => { console.error("SETUP FAILED:", e.message); process.exit(1); });
