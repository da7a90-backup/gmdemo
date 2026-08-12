// Real Shopify checkout via the Storefront GraphQL Cart API (cartCreate) — NOT the
// deprecated shopify-buy JS Buy SDK. Buying a ticket bundle creates a cart with the
// matching "Tickets" product variant, a per-line `_entries` attribute (entries per
// unit, read by the orders/paid webhook) and cart attributes (`_multiplier` +
// attribution for Track E), then hands the shopper Shopify's hosted checkoutUrl.
import { shopifyStorefront } from "./shopify";
import { BUNDLES } from "./shopify-products";

const entriesForBundle = (name: string) => BUNDLES.find((b) => b.name === name)?.entries ?? null;

/** Headless domain fix: Shopify builds `checkoutUrl` from the store's PRIMARY domain. When
 * that domain points at this Next.js app (headless), the checkout link 404s and Shopify even
 * 301-redirects the myshopify host to it. Set SHOPIFY_CHECKOUT_DOMAIN to a Shopify-served host
 * (the `*.myshopify.com` domain, or a checkout subdomain CNAME'd to Shopify) to force checkout
 * onto a host that actually resolves to Shopify's hosted checkout. */
function withCheckoutHost(url: string): string {
  const host = process.env.SHOPIFY_CHECKOUT_DOMAIN;
  if (!host) return url;
  try {
    const u = new URL(url);
    u.host = host;
    u.protocol = "https:";
    return u.toString();
  } catch {
    return url;
  }
}

export type TicketVariant = { variantId: string; bundle: string; entries: number; price: number };

/** The live "Tickets" product variants (Storefront), mapped to entry counts via
 * the Bundle option name. Empty when the product isn't published to Storefront. */
export async function getTicketVariants(): Promise<TicketVariant[]> {
  const r = await shopifyStorefront<{
    product: { variants: { nodes: { id: string; availableForSale: boolean; price: { amount: string }; selectedOptions: { name: string; value: string }[] }[] } } | null;
  }>(
    `query {
      product(handle: "tickets") {
        variants(first: 20) {
          nodes { id availableForSale price { amount } selectedOptions { name value } }
        }
      }
    }`,
  ).catch(() => null);

  return (r?.product?.variants?.nodes ?? [])
    .map((n) => {
      const bundle = n.selectedOptions.find((o) => o.name === "Bundle")?.value ?? "";
      return { variantId: n.id, bundle, entries: entriesForBundle(bundle), price: Number(n.price.amount) };
    })
    .filter((v): v is TicketVariant => v.entries != null);
}

export type CartAttr = { key: string; value: string };

/** Create a cart for `entries`-worth of tickets and return the hosted checkout URL.
 * `attributes` become order note_attributes; `_entries` is set per line. */
export async function createTicketCart(opts: {
  entries: number;
  quantity?: number;
  multiplier?: number;
  attributes: CartAttr[];
}): Promise<{ cartId: string; checkoutUrl: string }> {
  const variants = await getTicketVariants();
  const v = variants.find((x) => x.entries === opts.entries);
  if (!v) throw new Error(`no ticket variant for ${opts.entries} entries`);

  const quantity = Math.max(1, Math.floor(opts.quantity ?? 1));
  const multiplier = Math.max(1, Math.floor(opts.multiplier ?? 1));
  const totalEntries = opts.entries * quantity * multiplier;

  // Line-item properties. `_entries` stays hidden (leading underscore) for the
  // orders/paid webhook. When a promo multiplier is active we ALSO add a VISIBLE
  // property (no underscore → Shopify shows it in the hosted checkout + order
  // summary) so the shopper actually sees the boosted entry count they're getting,
  // not just the "1 Ticket" bundle name at the base price.
  const lineAttributes: CartAttr[] = [{ key: "_entries", value: String(opts.entries) }];
  if (multiplier > 1) {
    lineAttributes.push({ key: "Entries", value: `${totalEntries} (${multiplier}× promo bonus)` });
  }

  const res = await shopifyStorefront<{
    cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(
    `mutation($input: CartInput!) {
      cartCreate(input: $input) { cart { id checkoutUrl } userErrors { message field } }
    }`,
    {
      input: {
        lines: [
          {
            merchandiseId: v.variantId,
            quantity,
            attributes: lineAttributes,
          },
        ],
        attributes: opts.attributes,
      },
    },
  );

  const err = res.cartCreate.userErrors?.[0]?.message;
  if (err || !res.cartCreate.cart) throw new Error("cartCreate: " + (err ?? "no cart returned"));
  return { cartId: res.cartCreate.cart.id, checkoutUrl: withCheckoutHost(res.cartCreate.cart.checkoutUrl) };
}

/* ------------------------------ membership -------------------------------- */
import { MEMBERSHIP_PLANS } from "./shopify-membership";

export type MembershipVariant = { tier: string; variantId: string; sellingPlanId: string; entries: number; price: number };

/** The "Membership" product variants + their monthly selling plan (Storefront). */
export async function getMembershipVariants(): Promise<MembershipVariant[]> {
  const r = await shopifyStorefront<{
    product: { variants: { nodes: { id: string; price: { amount: string }; selectedOptions: { name: string; value: string }[]; sellingPlanAllocations: { nodes: { sellingPlan: { id: string } }[] } }[] } } | null;
  }>(
    `query {
      product(handle: "membership") {
        variants(first: 10) {
          nodes {
            id price { amount } selectedOptions { name value }
            sellingPlanAllocations(first: 5) { nodes { sellingPlan { id } } }
          }
        }
      }
    }`,
  ).catch(() => null);

  return (r?.product?.variants?.nodes ?? [])
    .map((n) => {
      const tier = n.selectedOptions.find((o) => o.name === "Tier")?.value ?? "";
      const plan = MEMBERSHIP_PLANS.find((p) => p.tier === tier);
      const sellingPlanId = n.sellingPlanAllocations?.nodes?.[0]?.sellingPlan?.id ?? "";
      return plan && sellingPlanId ? { tier, variantId: n.id, sellingPlanId, entries: plan.entries, price: Number(n.price.amount) } : null;
    })
    .filter((v): v is MembershipVariant => v != null);
}

/** Create a SUBSCRIPTION cart for a membership tier (variant + selling plan on the
 * line) → hosted checkout. `_entries` = the tier's monthly allotment; `membership`
 * flags it for the orders/paid webhook. */
export async function createMembershipCart(opts: { tier: string; attributes: CartAttr[] }): Promise<{ cartId: string; checkoutUrl: string }> {
  const variants = await getMembershipVariants();
  const v = variants.find((x) => x.tier.toLowerCase() === opts.tier.toLowerCase());
  if (!v) throw new Error(`no membership variant for tier ${opts.tier}`);

  const res = await shopifyStorefront<{
    cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: { message: string }[] };
  }>(
    `mutation($input: CartInput!) { cartCreate(input: $input) { cart { id checkoutUrl } userErrors { message field } } }`,
    {
      input: {
        lines: [{
          merchandiseId: v.variantId,
          quantity: 1,
          sellingPlanId: v.sellingPlanId,
          attributes: [{ key: "_entries", value: String(v.entries) }, { key: "membership", value: "true" }],
        }],
        attributes: opts.attributes,
      },
    },
  );
  const err = res.cartCreate.userErrors?.[0]?.message;
  if (err || !res.cartCreate.cart) throw new Error("membership cartCreate: " + (err ?? "no cart returned"));
  return { cartId: res.cartCreate.cart.id, checkoutUrl: withCheckoutHost(res.cartCreate.cart.checkoutUrl) };
}
