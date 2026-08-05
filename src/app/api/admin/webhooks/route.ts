// GET  /api/admin/webhooks — list the store's current webhook subscriptions.
// POST /api/admin/webhooks — (idempotently) register this app's webhook topics
//   (orders/paid + subscription_contracts create/update) against a public HTTPS
//   base URL. Body { url } or ?url=; falls back to PUBLIC_BASE_URL or the request
//   origin. Shopify rejects non-HTTPS/localhost callbacks, so pass the deploy URL.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { registerWebhooks, listWebhooks } from "@/lib/server/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    return ok(await listWebhooks());
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const base =
      body?.url ||
      new URL(req.url).searchParams.get("url") ||
      process.env.PUBLIC_BASE_URL ||
      new URL(req.url).origin;
    return ok(await registerWebhooks(base));
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
