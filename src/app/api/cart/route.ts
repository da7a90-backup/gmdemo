// POST /api/cart — create a real Shopify cart and return the hosted checkoutUrl.
// Public (a shopper action). Two shapes:
//   ticket bundle: { entries, quantity?, multiplier?, attribution? }
//   membership:    { tier: "Essential"|"Premium"|"VIP", attribution? }  (subscription)
// The client redirects to checkoutUrl; on failure it falls back to the demo checkout.
import { ok, fail, errMsg } from "@/lib/server/http";
import { createTicketCart, createMembershipCart } from "@/lib/server/cart";
import { shopifyStorefrontConfigured } from "@/lib/server/shopify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attrList = (attribution: Record<string, unknown>, extra: { key: string; value: string }[] = []) => [
  ...extra,
  ...Object.entries(attribution).filter(([, v]) => v != null && String(v) !== "").map(([k, v]) => ({ key: String(k), value: String(v) })),
];

export async function POST(req: Request) {
  if (!shopifyStorefrontConfigured()) return fail("storefront not configured", 503);

  const body = (await req.json().catch(() => null)) as {
    tier?: string; entries?: number; quantity?: number; multiplier?: number; attribution?: Record<string, unknown>;
  } | null;
  const attribution = body?.attribution && typeof body.attribution === "object" ? body.attribution : {};

  try {
    // Membership (subscription) cart.
    if (body?.tier) {
      return ok(await createMembershipCart({ tier: String(body.tier), attributes: attrList(attribution, [{ key: "_multiplier", value: "1" }]) }));
    }
    // One-time ticket bundle.
    const entries = Number(body?.entries);
    if (!Number.isFinite(entries) || entries <= 0) return fail("bad entries", 400);
    const quantity = Math.max(1, Math.floor(Number(body?.quantity) || 1));
    const multiplier = Math.max(1, Math.floor(Number(body?.multiplier) || 1));
    return ok(await createTicketCart({ entries, quantity, multiplier, attributes: attrList(attribution, [{ key: "_multiplier", value: String(multiplier) }]) }));
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
