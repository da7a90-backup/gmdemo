// GET /api/health — DB connectivity + which integrations are configured.
import { query } from "@/lib/server/db";
import { ok, fail } from "@/lib/server/http";
import { providerStatus } from "@/lib/server/providers";
import { shopifyAdminConfigured, shopifyStorefrontConfigured } from "@/lib/server/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await query<{ now: string }>("select now()::text as now");
    return ok({
      db: "up",
      time: r.rows[0].now,
      integrations: {
        ...providerStatus(),
        shopify_admin: shopifyAdminConfigured() ? "configured (client-credentials)" : "not configured",
        shopify_storefront: shopifyStorefrontConfigured() ? "configured" : "not configured",
      },
    });
  } catch (e) {
    return fail(`db down: ${String((e as Error)?.message ?? e)}`, 500);
  }
}
