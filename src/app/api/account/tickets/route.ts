// GET /api/account/tickets — the signed-in customer's REAL minted entries (from the
// Shopify session). 401 when not signed in. Once the account/lookup UI reads this,
// it replaces the mock entryDB.
import { ok, fail } from "@/lib/server/http";
import { sessionFromRequest } from "@/lib/server/customer-auth";
import { listCustomerEntries } from "@/lib/server/customer-tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = sessionFromRequest(req);
  if (!s) return fail("not signed in", 401);
  try {
    return ok(await listCustomerEntries({ email: s.email, gid: s.customerGid }));
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
