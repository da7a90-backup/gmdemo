// Production-safe migration runner: applies unapplied db/migrations/*.sql once
// each, tracked in schema_migrations. Non-destructive.
//   node scripts/migrate.mjs
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { newPool } from "./_env.mjs";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const pool = newPool(1);

async function main() {
  const c = await pool.connect();
  try {
    await c.query(
      `create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`,
    );
    const done = new Set((await c.query(`select version from schema_migrations`)).rows.map((r) => r.version));
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    let applied = 0;
    for (const f of files) {
      if (done.has(f)) { console.log(`  = ${f} (already applied)`); continue; }
      const sql = readFileSync(join(dir, f), "utf8");
      await c.query("BEGIN");
      try {
        await c.query(sql);
        await c.query(`insert into schema_migrations (version) values ($1)`, [f]);
        await c.query("COMMIT");
        applied++;
        console.log(`  + ${f} applied`);
      } catch (e) {
        await c.query("ROLLBACK");
        throw new Error(`migration ${f} failed: ${e.message}`);
      }
    }
    console.log(applied ? `\n${applied} migration(s) applied.` : `\nUp to date.`);
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => { console.error("MIGRATE FAILED:", e.message); process.exit(1); });
