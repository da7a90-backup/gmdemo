import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { getCurrentCycle, updateCurrentCycle, type CycleUpdate } from "@/lib/server/editorial";
import { openNewCycle } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await getCurrentCycle()); } catch (e) { return fail(errMsg(e), 500); }
}

// POST — open the NEXT cycle (closes the current one, starts fresh numbering).
export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{ vehicleLabel?: string; drawDateISO?: string }>(req);
  try {
    return ok(await openNewCycle({ vehicleLabel: b?.vehicleLabel ?? null, drawDateISO: b?.drawDateISO ?? null }));
  } catch (e) { return fail(errMsg(e), 500); }
}
export async function PUT(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<CycleUpdate>(req);
  if (!b) return fail("body required");
  try {
    const c = await updateCurrentCycle(b);
    return c ? ok(c) : fail("no open cycle", 404);
  } catch (e) { return fail(errMsg(e), 500); }
}
