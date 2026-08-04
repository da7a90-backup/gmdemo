// GET /api/content — the static page copy from Shopify, as a content-key → value map.
// Empty {} if Shopify isn't configured/seeded (the site falls back to defaults).
import { ok, fail, errMsg } from "@/lib/server/http";
import { getCopyMap } from "@/lib/server/copy";
import { shopifyStorefrontConfigured } from "@/lib/server/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!shopifyStorefrontConfigured()) return ok({});
  try { return ok(await getCopyMap()); } catch (e) { return fail(errMsg(e), 500); }
}
