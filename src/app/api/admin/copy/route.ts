// POST /api/admin/copy — publish the admin Content desk's copy edits to Shopify.
// Body: { values: Record<contentKey, string> }. Overwrites each copy_<page>
// default entry with the provided values (code defaults for absent keys), so
// Kevin's edits become the live CMS the public pages read via /api/content.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { writeCopyValues } from "@/lib/server/copy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const body = (await req.json().catch(() => null)) as { values?: Record<string, string> } | null;
    const values = body?.values;
    if (!values || typeof values !== "object") return fail("missing values", 400);
    return ok(await writeCopyValues(values));
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
