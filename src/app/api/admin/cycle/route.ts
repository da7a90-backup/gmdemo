import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { getCurrentCycle, updateCurrentCycle, type CycleContent } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await getCurrentCycle()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function PUT(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<Partial<CycleContent>>(req);
  if (!b) return fail("body required");
  try {
    const c = await updateCurrentCycle(b);
    return c ? ok(c) : fail("no open cycle", 404);
  } catch (e) { return fail(errMsg(e), 500); }
}
