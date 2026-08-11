// GET/PUT /api/admin/content-lists?kind=faq|rules|legal|about|perks — read / replace a
// repeatable content list (Shopify metaobjects). Schema-driven so one route + one UI cover
// them all. Behind the admin gate. See src/lib/server/content-lists.ts.
import { ok, fail, requireAdmin, errMsg, readJson } from "@/lib/server/http";
import { LIST_SCHEMAS, getContentList, saveContentList, type ListKind, type ListRow } from "@/lib/server/content-lists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isKind = (v: string | null): v is ListKind => !!v && v in LIST_SCHEMAS;

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const kind = new URL(req.url).searchParams.get("kind");
  if (!isKind(kind)) return fail("unknown kind", 400);
  try {
    return ok({ schema: LIST_SCHEMAS[kind], rows: await getContentList(kind) });
  } catch (e) { return fail(errMsg(e), 500); }
}

export async function PUT(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const kind = new URL(req.url).searchParams.get("kind");
  if (!isKind(kind)) return fail("unknown kind", 400);
  const body = await readJson<{ rows: ListRow[] }>(req);
  if (!body || !Array.isArray(body.rows)) return fail("rows[] required", 400);
  try {
    await saveContentList(kind, body.rows);
    return ok({ rows: await getContentList(kind) });
  } catch (e) { return fail(errMsg(e), 500); }
}
