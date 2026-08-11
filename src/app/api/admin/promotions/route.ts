// GET/PUT /api/admin/promotions — read / save the promo tier config (server-stored so
// edits reach all visitors). Behind the admin gate. See editorial.ts getPromosServer.
import { ok, fail, requireAdmin, errMsg, readJson } from "@/lib/server/http";
import { getPromosServer, savePromosServer } from "@/lib/server/editorial";
import type { PromoTier } from "@/lib/promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await getPromosServer()); } catch (e) { return fail(errMsg(e), 500); }
}

export async function PUT(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{ promos?: PromoTier[] }>(req);
  if (!b || !Array.isArray(b.promos)) return fail("promos[] required");
  try {
    await savePromosServer(b.promos);
    return ok(await getPromosServer());
  } catch (e) { return fail(errMsg(e), 500); }
}
