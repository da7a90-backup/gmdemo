import { ok, fail, readJson } from "@/lib/server/http";
import { isValidUSPhone, normalizeUSPhone } from "@/lib/phone";
import { subscribeSms } from "@/lib/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await readJson<{ phone?: string; source?: string }>(req);
  if (!isValidUSPhone(b?.phone)) return fail("Please enter a real phone number.");
  const phone = normalizeUSPhone(b?.phone)!;
  try {
    return ok(await subscribeSms(phone, b?.source ?? "Popup"));
  } catch (e) {
    return fail(String((e as Error)?.message ?? e), 500);
  }
}
