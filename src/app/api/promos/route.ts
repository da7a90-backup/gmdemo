// GET /api/promos — PUBLIC promo config (admin-managed, server-stored). The client
// promotions module hydrates its cache from here so admin edits reach every visitor.
import { ok, fail, errMsg } from "@/lib/server/http";
import { getPromosServer } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await getPromosServer()); } catch (e) { return fail(errMsg(e), 500); }
}
