import { ok, fail, readJson, normalizePhone } from "@/lib/server/http";
import { subscribeSms } from "@/lib/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ phone?: string; source?: string }>(req);
  const phone = normalizePhone(b?.phone);
  if (!phone) return fail("A valid US phone number is required.");
  try {
    return ok(await subscribeSms(phone, b?.source ?? "Popup"));
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
