// POST /api/free-ticket/confirm { token, name, phone } — confirm a teaser signup's
// free ticket: validates the token, captures name+phone, creates the $0 order + mints.
import { ok, fail, readJson } from "@/lib/server/http";
import { confirmFreeTicket } from "@/lib/server/free-ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ token?: string; name?: string; phone?: string }>(req);
  if (!b?.token) return fail("Missing claim token.");
  const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  try {
    const r = await confirmFreeTicket(b.token, b.name ?? "", b.phone ?? "", origin);
    if (!r.ok) return fail(r.error, 400);
    return ok(r);
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
