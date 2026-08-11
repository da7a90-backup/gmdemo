// GET /api/auth/me — the current signed-in customer (self-hosted OTP session) or null,
// plus whether they're an active member (users.is_member) for the member multiplier.
import { ok } from "@/lib/server/http";
import { sessionFromRequest, customerAuthConfigured } from "@/lib/server/customer-auth";
import { pool } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = sessionFromRequest(req);
  let isMember = false;
  if (s && (s.email || s.phone || s.customerGid)) {
    const r = await pool
      .query(
        `select is_member from users
         where ($1::citext is not null and email = $1)
            or ($2::text  is not null and phone = $2)
            or ($3::text  is not null and shopify_customer_gid = $3)
         limit 1`,
        [s.email ?? null, s.phone ?? null, s.customerGid ?? null],
      )
      .catch(() => null);
    isMember = !!r?.rows?.[0]?.is_member;
  }
  return ok({
    authConfigured: customerAuthConfigured(),
    signedIn: !!s,
    email: s?.email ?? null,
    phone: s?.phone ?? null,
    customerGid: s?.customerGid ?? null,
    isMember,
  });
}
