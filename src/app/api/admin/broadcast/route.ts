import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { broadcast } from "@/lib/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{ channel?: "email" | "sms"; body?: string; subject?: string }>(req);
  if (!b?.body || (b.channel !== "email" && b.channel !== "sms")) return fail("channel and body required");
  try { return ok(await broadcast(b.channel, b.body, b.subject)); } catch (e) { return fail(errMsg(e), 500); }
}
