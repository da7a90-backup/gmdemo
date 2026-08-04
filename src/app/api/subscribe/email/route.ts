import { ok, fail, readJson, isEmail } from "@/lib/server/http";
import { subscribeEmail } from "@/lib/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ email?: string; source?: string }>(req);
  if (!b || !isEmail(b.email)) return fail("A valid email is required.");
  try {
    return ok(await subscribeEmail(b.email!, b.source ?? "Footer"));
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
