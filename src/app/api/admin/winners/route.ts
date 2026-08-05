import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listWinners, createWinner, deleteWinner, type Winner } from "@/lib/server/editorial";
import { klaviyoEvent } from "@/lib/server/providers/klaviyo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await listWinners()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  // `email` is optional and NOT stored — when present, it's the winner's address for
  // the "You won" Klaviyo notification (there's no draw-from-drum flow yet that would
  // carry a user email automatically).
  const b = await readJson<Omit<Winner, "id"> & { email?: string }>(req);
  if (!b?.firstName || !b?.vehicle) return fail("firstName and vehicle required");
  try {
    const w = await createWinner(b);
    if (b.email) {
      await klaviyoEvent("Won Drawing", b.email, {
        prize: w.vehicle,
        cycle: w.drawCycle,
        charity: w.charity,
        winner_name: `${w.firstName} ${w.lastInitial}`.trim(),
      }).catch(() => {});
    }
    return ok(w);
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  try { await deleteWinner(id); return ok({ deleted: id }); } catch (e) { return fail(errMsg(e), 500); }
}
