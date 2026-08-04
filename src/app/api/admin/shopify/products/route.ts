// POST /api/admin/shopify/products — create/ensure the "Tickets" product + variants
// in Shopify (idempotent). GET returns the current product summary.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { ensureTicketsProduct } from "@/lib/server/shopify-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await ensureTicketsProduct()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function GET() {
  try { return ok(await ensureTicketsProduct()); } catch (e) { return fail(errMsg(e), 500); }
}
