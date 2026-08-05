// GET /api/auth/me — the current signed-in customer (Shopify session) or null.
import { ok } from "@/lib/server/http";
import { sessionFromRequest, customerAuthConfigured } from "@/lib/server/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = sessionFromRequest(req);
  return ok({
    authConfigured: customerAuthConfigured(),
    signedIn: !!s,
    email: s?.email ?? null,
    customerGid: s?.customerGid ?? null,
  });
}
