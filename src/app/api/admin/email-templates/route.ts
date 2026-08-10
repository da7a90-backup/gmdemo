// GET  /api/admin/email-templates — all transactional templates (defaults + admin edits).
// POST /api/admin/email-templates — save one { key, subject, body }.
import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listTemplates, upsertTemplate } from "@/lib/server/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try { return ok(await listTemplates()); } catch (e) { return fail(errMsg(e), 500); }
}

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{ key?: string; subject?: string; body?: string }>(req);
  if (!b?.key || typeof b.body !== "string") return fail("key and body required");
  try {
    await upsertTemplate(b.key, b.subject ?? "", b.body);
    return ok({ key: b.key, saved: true });
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
