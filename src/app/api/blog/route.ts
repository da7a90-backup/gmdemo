// GET /api/blog — PUBLIC read of the admin's published articles ("article" metaobjects,
// via the Storefront API). Public so it isn't caught by the /api/admin auth gate.
import { ok, fail, errMsg } from "@/lib/server/http";
import { listArticles, type Article } from "@/lib/server/blog-shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Only the admin's real published articles (Shopify metaobjects) — no built-in demo posts.
    const live = await listArticles({ publishedOnly: true }).catch(() => [] as Article[]);
    const sorted = [...live].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
    return ok(sorted);
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
