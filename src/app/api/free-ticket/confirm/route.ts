// POST /api/free-ticket/confirm { token, firstName, lastName, phone, address } —
// confirm a teaser signup's free ticket: validates the token, captures the holder's
// name + phone + mailing address, creates the $0 order + mints. `name` (combined) is
// still accepted for backward compatibility.
import { ok, fail, readJson } from "@/lib/server/http";
import { confirmFreeTicket } from "@/lib/server/free-ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{
    token?: string; firstName?: string; lastName?: string; name?: string; phone?: string;
    address1?: string; city?: string; state?: string; zip?: string;
  }>(req);
  if (!b?.token) return fail("Missing claim token.");
  const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  try {
    const r = await confirmFreeTicket(
      b.token,
      {
        firstName: b.firstName, lastName: b.lastName, name: b.name, phone: b.phone ?? "",
        address: { address1: b.address1, city: b.city, province: b.state, zip: b.zip },
      },
      origin,
    );
    if (!r.ok) return fail(r.error, 400);
    return ok(r);
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
