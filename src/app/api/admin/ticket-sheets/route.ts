import { ok, fail, errMsg } from "@/lib/server/http";
import { getCycleTicketBlocks, listCycleTicketSummaries } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const cycles = await listCycleTicketSummaries();
    const cycle = p.get("cycle");
    const blocks = cycle
      ? await getCycleTicketBlocks(cycle, p.get("from") || undefined, p.get("to") || undefined)
      : [];
    return ok({ cycles, blocks });
  } catch (e) { return fail(errMsg(e), 500); }
}
