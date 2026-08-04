// Tiny .env.local loader (Node 20.3 lacks --env-file) + a pg client factory.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  let raw;
  try {
    raw = readFileSync(join(root, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

export function newPool(max = 10) {
  loadEnv();
  const cs = process.env.DIRECT_URL;
  if (!cs || cs.includes("[YOUR-PASSWORD]")) {
    throw new Error("DIRECT_URL not set (fill your Supabase password in .env.local)");
  }
  return new pg.Pool({ connectionString: cs, max });
}
