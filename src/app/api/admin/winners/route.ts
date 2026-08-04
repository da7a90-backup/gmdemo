import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listWinners, createWinner, deleteWinner, type Winner } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await listWinners()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<Omit<Winner, "id">>(req);
  if (!b?.firstName || !b?.vehicle) return fail("firstName and vehicle required");
  try { return ok(await createWinner(b)); } catch (e) { return fail(errMsg(e), 500); }
}
export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  try { await deleteWinner(id); return ok({ deleted: id }); } catch (e) { return fail(errMsg(e), 500); }
}
