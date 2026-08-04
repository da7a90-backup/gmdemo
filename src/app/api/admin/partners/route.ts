import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listPartners, createPartner, deletePartner, type Partner } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await listPartners()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<Omit<Partner, "id">>(req);
  if (!b?.name || (b.kind !== "charity" && b.kind !== "sponsor")) return fail("name and kind (charity|sponsor) required");
  try { return ok(await createPartner(b)); } catch (e) { return fail(errMsg(e), 500); }
}
export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  try { await deletePartner(id); return ok({ deleted: id }); } catch (e) { return fail(errMsg(e), 500); }
}
