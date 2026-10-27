import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { listEmailSubscribers, listSmsSubscribers, removeEmailSubscriber, removeSmsSubscriber } from "@/lib/server/subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type");
  try {
    if (type === "sms") {
      return ok(await listSmsSubscribers({
        page: Number(sp.get("page")) || 1,
        pageSize: Number(sp.get("pageSize")) || 50,
        status: sp.get("status") || undefined,
      }));
    }
    return ok(await listEmailSubscribers());
  } catch (e) { return fail(errMsg(e), 500); }
}
export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const p = new URL(req.url).searchParams;
  const id = Number(p.get("id"));
  if (!id) return fail("id required");
  try {
    if (p.get("type") === "sms") await removeSmsSubscriber(id);
    else await removeEmailSubscriber(id);
    return ok({ deleted: id });
  } catch (e) { return fail(errMsg(e), 500); }
}
