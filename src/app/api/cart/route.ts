// POST /api/cart — create a real Shopify cart for a ticket bundle and return the
// hosted checkoutUrl. Public (a shopper action). Body:
//   { entries: number, quantity?: number, multiplier?: number,
//     attribution?: Record<string,string> }  // source/channel/promo/utm for Track E
// The client redirects to checkoutUrl; on failure it falls back to the demo checkout.
import { ok, fail, errMsg } from "@/lib/server/http";
import { createTicketCart } from "@/lib/server/cart";
import { shopifyStorefrontConfigured } from "@/lib/server/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!shopifyStorefrontConfigured()) return fail("storefront not configured", 503);

  const body = (await req.json().catch(() => null)) as {
    entries?: number; quantity?: number; multiplier?: number; attribution?: Record<string, unknown>;
  } | null;

  const entries = Number(body?.entries);
  if (!Number.isFinite(entries) || entries <= 0) return fail("bad entries", 400);
  const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1));
  const multiplier = Math.max(1, Math.floor(Number(body?.multiplier) || 1));

  const attribution = body?.attribution && typeof body.attribution === "object" ? body.attribution : {};
  const attributes = [
    { key: "_multiplier", value: String(multiplier) },
    ...Object.entries(attribution)
      .filter(([, v]) => v != null && String(v) !== "")
      .map(([k, v]) => ({ key: String(k), value: String(v) })),
  ];

  try {
    return ok(await createTicketCart({ entries, quantity, attributes }));
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
