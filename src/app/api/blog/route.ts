// GET /api/blog — PUBLIC read of published articles. Reads the "article" metaobjects via
// the Storefront API (published only) and merges the built-in field notes as a fallback
// (metaobject wins on slug clash). Public so it isn't caught by the /api/admin auth gate.
import { ok, fail, errMsg } from "@/lib/server/http";
import { listArticles, type Article } from "@/lib/server/blog-shopify";
import { blogPosts } from "@/lib/mock-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const live = await listArticles({ publishedOnly: true }).catch(() => [] as Article[]);
    const liveSlugs = new Set(live.map((a) => a.slug));
    const builtins: Article[] = blogPosts
      .filter((p) => !liveSlugs.has(p.slug))
      .map((p) => ({
        id: `builtin-${p.slug}`, slug: p.slug, title: p.title, author: p.author, tag: p.tag,
        excerpt: p.excerpt, body: p.body, format: "markdown", published: true,
        dateISO: new Date(p.date).toISOString(), seo: {},
      }));
    const merged = [...live, ...builtins].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    return ok(merged);
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
