// Real Shopify checkout via the Storefront GraphQL Cart API (cartCreate) — NOT the
// deprecated shopify-buy JS Buy SDK. Buying a ticket bundle creates a cart with the
// matching "Tickets" product variant, a per-line `_entries` attribute (entries per
// unit, read by the orders/paid webhook) and cart attributes (`_multiplier` +
// attribution for Track E), then hands the shopper Shopify's hosted checkoutUrl.
import { shopifyStorefront } from "./shopify";
import { BUNDLES } from "./shopify-products";

const entriesForBundle = (name: string) => BUNDLES.find((b) => b.name === name)?.entries ?? null;

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
  attributes: CartAttr[];
}): Promise<{ cartId: string; checkoutUrl: string }> {
  const variants = await getTicketVariants();
  const v = variants.find((x) => x.entries === opts.entries);
  if (!v) throw new Error(`no ticket variant for ${opts.entries} entries`);

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
            quantity: Math.max(1, Math.floor(opts.quantity ?? 1)),
            attributes: [{ key: "_entries", value: String(opts.entries) }],
          },
        ],
        attributes: opts.attributes,
      },
    },
  );

  const err = res.cartCreate.userErrors?.[0]?.message;
  if (err || !res.cartCreate.cart) throw new Error("cartCreate: " + (err ?? "no cart returned"));
  return { cartId: res.cartCreate.cart.id, checkoutUrl: res.cartCreate.cart.checkoutUrl };
}
