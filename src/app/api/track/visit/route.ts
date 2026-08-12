// POST /api/track/visit { source, channel, page } — record a real page visit for the
// Attribution desk (public; the client dedupes per session so refreshes don't stack).
import { ok, fail, readJson } from "@/lib/server/http";
import { pool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ source?: string; channel?: string; page?: string }>(req);
  try {
    await pool.query(
      `insert into visits (channel, source, page) values ($1, $2, $3)`,
      [(b?.channel || "Organic").slice(0, 80), (b?.source || "organic").slice(0, 80), (b?.page || "").slice(0, 200)],
    );
    return ok({ tracked: true });
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
