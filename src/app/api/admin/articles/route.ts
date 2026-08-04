import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listArticles, getArticleBySlug, upsertArticle, deleteArticle, type Article } from "@/lib/server/editorial";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    if (p.get("slug")) {
      const a = await getArticleBySlug(p.get("slug")!);
      return a ? ok(a) : fail("not found", 404);
    }
    return ok(await listArticles({ publishedOnly: p.get("published") === "1" }));
  } catch (e) { return fail(errMsg(e), 500); }
}
export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<Omit<Article, "id"> & { id?: string }>(req);
  if (!b?.slug || !b?.title) return fail("slug and title required");
  try { return ok(await upsertArticle(b)); } catch (e) { return fail(errMsg(e), 500); }
}
export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  try { await deleteArticle(id); return ok({ deleted: id }); } catch (e) { return fail(errMsg(e), 500); }
}
