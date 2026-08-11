// Shared server-side Postgres access (Supabase via DIRECT_URL).
// One pool for the process; helpers for queries, transactions, and the
// migration files used by the test-bench reset.
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Serverless-friendly pool: small per-instance cap + short idle timeout so many
// concurrent Vercel functions (webhook/cron bursts) don't exhaust Postgres connections.
const g = globalThis as unknown as { __gmPool?: Pool };
export const pool: Pool =
  g.__gmPool ??
  (g.__gmPool = new Pool({
    connectionString: process.env.DIRECT_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
  }));

export function query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params as never);
}

export async function withClient<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    return await fn(c);
  } finally {
    c.release();
  }
}

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (c) => {
    try {
      await c.query("BEGIN");
      const r = await fn(c);
      await c.query("COMMIT");
      return r;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    }
  });
}

// ---- migrations (files are the source of truth) ----------------------------
export const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

export function migrationFiles(): { version: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ version: f, sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8") }));
}

const APP_TABLES = [
  "entry_blocks", "processed_webhooks", "orders", "cycle_counters", "cycles",
  "subscription_contracts", "sms_subscribers", "email_subscribers", "users",
  "email_templates", "campaigns",
];

/** Destructive — used by the test-bench reset only. */
export async function dropAll(c: PoolClient) {
  const seqs = await c.query(`select relname from pg_class where relkind='S' and relname like 'order_seq_cyc_%'`);
  for (const r of seqs.rows) await c.query(`drop sequence if exists ${r.relname}`);
  await c.query(`drop table if exists ${APP_TABLES.join(", ")} cascade`);
  await c.query(`drop table if exists schema_migrations cascade`);
}

/** Apply every migration in order (from an empty schema — reset path), and
 * record them so a later `migrate.mjs` sees them as already applied. */
export async function applyAllMigrations(c: PoolClient) {
  await c.query(
    `create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`,
  );
  for (const m of migrationFiles()) {
    await c.query(m.sql);
    await c.query(`insert into schema_migrations (version) values ($1) on conflict do nothing`, [m.version]);
  }
}
