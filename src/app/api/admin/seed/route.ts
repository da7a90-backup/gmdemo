import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { seedContent } from "@/lib/server/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await seedContent()); } catch (e) { return fail(errMsg(e), 500); }
}
