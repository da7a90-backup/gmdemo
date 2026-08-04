// GET /api/faq — the FAQ items from Shopify metaobjects (public read).
import { ok, fail, errMsg } from "@/lib/server/http";
import { listFaq } from "@/lib/server/faq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return ok(await listFaq()); } catch (e) { return fail(errMsg(e), 500); }
}
