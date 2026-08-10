// POST/GET /api/admin/shopify/membership — ensure the Membership subscription
// product + monthly selling plan group in Shopify (idempotent). Returns the
// selling plan id (used by the Storefront cart) + variant summary.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { ensureMembershipProduct } from "@/lib/server/shopify-membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await ensureMembershipProduct()); } catch (e) { return fail(errMsg(e), 500); }
}
export async function GET() {
  try { return ok(await ensureMembershipProduct()); } catch (e) { return fail(errMsg(e), 500); }
}
