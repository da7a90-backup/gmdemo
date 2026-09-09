import { ok, fail, readJson, isEmail } from "@/lib/server/http";
import { subscribeEmail } from "@/lib/server/subscribers";
import { startFreeTicketClaim } from "@/lib/server/free-ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; source?: string; claim?: boolean }>(req);
  if (!b || !isEmail(b.email)) return fail("A valid email is required.");
  const origin = process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  try {
    // The teaser signup (claim) skips the generic welcome and instead emails a
    // confirm-to-claim link for the free ticket.
    const sub = await subscribeEmail(b.email!, b.source ?? "Footer", { sendWelcome: !b.claim });
    if (b.claim) {
      const claim = await startFreeTicketClaim(b.email!, origin);
      return ok({ ...sub, claim });
    }
    return ok(sub);
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
