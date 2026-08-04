import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { getLifetimeStats, updateLifetimeStats, type LifetimeStats } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await getLifetimeStats()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function PUT(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<Partial<LifetimeStats>>(req);
  if (!b) return fail("body required");
  try { return ok(await updateLifetimeStats(b)); } catch (e) { return fail(errMsg(e), 500); }
}
