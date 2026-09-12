// Sprint 2 — the "Tickets" product in Shopify: one product, one "Bundle" option,
// six variants (own prices). The entry count for each variant is simply the number
// in its name (e.g. "10 Tickets" -> 10) — see cart.ts getTicketVariants. No
// metafields. Idempotent by handle. Promo multiplier is applied at add-to-cart
// (line-item property) + webhook.
import { shopifyAdmin } from "./shopify";

export const TICKETS_HANDLE = "tickets";
const HANDLE = TICKETS_HANDLE;
// Seed catalog used ONLY to create the product the first time. At runtime the entry
// count is parsed from each variant's name (cart.ts getTicketVariants), so this list
// is not the source of truth — edit the variants in Shopify.
export const BUNDLES = [
  { name: "1 Ticket", price: "10.00" },
  { name: "5 Tickets", price: "45.00" },
  { name: "10 Tickets", price: "85.00" },
  { name: "25 Tickets", price: "200.00" },
  { name: "50 Tickets", price: "375.00" },
  { name: "100 Tickets", price: "700.00" },
];

/** The entry count for a ticket variant = the first positive integer in its name,
 *  e.g. "5 Tickets" -> 5. */
export function entriesFromTitle(title: string): number | null {
  const m = String(title ?? "").match(/\d[\d,]*/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type UE = { field?: string[]; message: string }[];

async function productIdByHandle(): Promise<string | null> {
  const r = await shopifyAdmin<{ productByHandle: { id: string } | null }>(
    `query($h: String!) { productByHandle(handle: $h) { id } }`, { h: HANDLE },
  ).catch(() => ({ productByHandle: null }));
  return r.productByHandle?.id ?? null;
}

async function summarize(productId: string, status: "created" | "exists") {
  const r = await shopifyAdmin<{
    product: { id: string; title: string; handle: string; status: string; productType: string;
      variants: { nodes: { title: string; price: string }[] } };
  }>(
    `query($id: ID!) {
       product(id: $id) {
         id title handle status productType
         variants(first: 50) { nodes { title price } }
       }
     }`,
    { id: productId },
  );
  const p = r.product;
  const numericId = p.id.split("/").pop();
  const shop = (process.env.SHOPIFY_STORE_DOMAIN ?? "").replace(".myshopify.com", "");
  return {
    status,
    id: p.id,
    title: p.title,
    handle: p.handle,
    productStatus: p.status,
    productType: p.productType,
    adminUrl: `https://admin.shopify.com/store/${shop}/products/${numericId}`,
    variants: p.variants.nodes.map((v) => ({ bundle: v.title, price: v.price, entries: entriesFromTitle(v.title) ?? 1 })),
  };
}

/** Mark every variant of a product as NOT requiring shipping, so Shopify's hosted
 * checkout skips the delivery/shipping step — tickets & memberships are digital.
 * Idempotent; only writes the variants that are still flagged physical. */
export async function setVariantsNoShipping(productId: string) {
  const v = await shopifyAdmin<{
    product: { variants: { nodes: { inventoryItem: { id: string; requiresShipping: boolean } }[] } };
  }>(
    `query($id: ID!) { product(id: $id) { variants(first: 50) { nodes { inventoryItem { id requiresShipping } } } } }`,
    { id: productId },
  ).catch(() => null);
  for (const n of v?.product.variants.nodes ?? []) {
    if (n.inventoryItem.requiresShipping) {
      await shopifyAdmin(
        `mutation($id: ID!) { inventoryItemUpdate(id: $id, input: { requiresShipping: false }) { userErrors { message } } }`,
        { id: n.inventoryItem.id },
      ).catch(() => {});
    }
  }
}

/** Publish the product to every sales channel/publication so the Storefront API
 * (used by the cart) can see it. Idempotent; needs write_publications scope. */
export async function publishEverywhere(productId: string) {
  const pubs = await shopifyAdmin<{ publications: { nodes: { id: string }[] } }>(
    `{ publications(first: 25) { nodes { id name } } }`,
  ).catch(() => ({ publications: { nodes: [] as { id: string }[] } }));
  const input = pubs.publications.nodes.map((p) => ({ publicationId: p.id }));
  if (input.length) {
    await shopifyAdmin(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
         publishablePublish(id: $id, input: $input) { userErrors { message } }
       }`,
      { id: productId, input },
    ).catch(() => {});
  }
}

/** Entry counts come from the variant name now — purge the old base_entries metafield
 * definitions (both namespaces) and their values entirely, so nothing dangles. */
async function cleanupEntriesMetafields() {
  for (const ns of ["gm_raffle", "gm_tickets"]) {
    const r = await shopifyAdmin<{ metafieldDefinitions: { nodes: { id: string }[] } }>(
      `query($ns: String!) { metafieldDefinitions(first: 5, ownerType: PRODUCTVARIANT, namespace: $ns, key: "base_entries") { nodes { id } } }`,
      { ns },
    ).catch(() => null);
    const id = r?.metafieldDefinitions?.nodes?.[0]?.id;
    if (id) {
      await shopifyAdmin(
        `mutation($id: ID!) { metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: true) { deletedDefinitionId userErrors { message } } }`,
        { id },
      ).catch(() => {});
    }
  }
}

export async function ensureTicketsProduct() {
  await cleanupEntriesMetafields();

  const existing = await productIdByHandle();
  if (existing) {
    // enforce the correct title + product type on the live product
    await shopifyAdmin(
      `mutation($p: ProductUpdateInput!) { productUpdate(product: $p) { product { id } userErrors { message } } }`,
      { p: { id: existing, title: "Tickets", productType: "Tickets" } },
    ).catch(() => {});
    await setVariantsNoShipping(existing); // digital → no shipping step at checkout
    await publishEverywhere(existing); // ensure Storefront (cart) can see it
    return summarize(existing, "exists");
  }

  const set = await shopifyAdmin<{ productSet: { product: { id: string } | null; userErrors: UE } }>(
    `mutation($input: ProductSetInput!) {
       productSet(input: $input, synchronous: true) { product { id } userErrors { field message } }
     }`,
    {
      input: {
        title: "Tickets",
        handle: HANDLE,
        status: "ACTIVE",
        productType: "Tickets",
        productOptions: [{ name: "Bundle", values: BUNDLES.map((b) => ({ name: b.name })) }],
        variants: BUNDLES.map((b) => ({
          optionValues: [{ optionName: "Bundle", name: b.name }],
          price: b.price,
          inventoryPolicy: "CONTINUE",
        })),
      },
    },
  );
  if (set.productSet.userErrors?.length) throw new Error("productSet: " + JSON.stringify(set.productSet.userErrors));
  const productId = set.productSet.product!.id;
  await setVariantsNoShipping(productId); // digital → no shipping step at checkout
  await publishEverywhere(productId); // ensure Storefront (cart) can see it
  return summarize(productId, "created");
}
