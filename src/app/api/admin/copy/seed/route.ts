// POST /api/admin/copy/seed — create the copy_<page> metaobject definitions in
// Shopify and seed each with a 'default' entry from CONTENT_FIELDS. Idempotent.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { ensureCopy } from "@/lib/server/copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await ensureCopy()); } catch (e) { return fail(errMsg(e), 500); }
}
