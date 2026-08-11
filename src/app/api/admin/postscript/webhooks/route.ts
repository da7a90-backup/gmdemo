// GET/POST /api/admin/postscript/webhooks — list / (idempotently) register the Postscript
// subscriber opt-in + opt-out webhooks against a public HTTPS base URL ({url} body, or
// PUBLIC_BASE_URL, or request origin). Postscript (unlike Shopify) has no own-domain block,
// so the app's own domain works. See src/lib/server/providers/postscript.ts.
import { ok, fail, requireAdmin, errMsg, readJson } from "@/lib/server/http";
import {
  postscriptConfigured, listPostscriptWebhooks, registerPostscriptWebhooks, getPostscriptWebhookToken,
} from "@/lib/server/providers/postscript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  if (!postscriptConfigured()) return fail("postscript not configured (POSTSCRIPT_API_KEY)", 503);
  try {
    return ok({ webhooks: await listPostscriptWebhooks(), tokenConfigured: !!(await getPostscriptWebhookToken()) });
  } catch (e) { return fail(errMsg(e), 500); }
}

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  if (!postscriptConfigured()) return fail("postscript not configured (POSTSCRIPT_API_KEY)", 503);
  const body = await readJson<{ url?: string }>(req);
  const url = body?.url || process.env.PUBLIC_BASE_URL || new URL(req.url).origin;
  try { return ok(await registerPostscriptWebhooks(url)); } catch (e) { return fail(errMsg(e), 500); }
}
