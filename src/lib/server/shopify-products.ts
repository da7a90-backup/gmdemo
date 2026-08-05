// Sprint 2 — the "Tickets" product in Shopify: one product, one "Bundle" option,
// six variants (own prices), each with a base_entries metafield (namespace gm_tickets). Idempotent by
// handle. Promo multiplier is applied at add-to-cart (line-item property) + webhook.
import { shopifyAdmin } from "./shopify";

const HANDLE = "tickets";
export const BUNDLES = [
  { name: "1 Ticket", price: "10.00", entries: 1 },
  { name: "5 Tickets", price: "45.00", entries: 5 },
  { name: "10 Tickets", price: "85.00", entries: 10 },
  { name: "25 Tickets", price: "200.00", entries: 25 },
  { name: "50 Tickets", price: "375.00", entries: 50 },
  { name: "100 Tickets", price: "700.00", entries: 100 },
];

type UE = { field?: string[]; message: string }[];

async function ensureBaseEntriesDefinition() {
  await shopifyAdmin(
    `mutation($def: MetafieldDefinitionInput!) {
       metafieldDefinitionCreate(definition: $def) { createdDefinition { id } userErrors { message code } }
     }`,
    {
      def: {
        name: "Base entries", namespace: "gm_tickets", key: "base_entries",
        type: "number_integer", ownerType: "PRODUCTVARIANT",
        description: "Base entries for this bundle (before promo multiplier).",
      },
    },
  ).catch(() => {}); // ignore "already exists"
}

async function productIdByHandle(): Promise<string | null> {
  const r = await shopifyAdmin<{ productByHandle: { id: string } | null }>(
    `query($h: String!) { productByHandle(handle: $h) { id } }`, { h: HANDLE },
  ).catch(() => ({ productByHandle: null }));
  return r.productByHandle?.id ?? null;
}

async function setBaseEntries(productId: string) {
  const v = await shopifyAdmin<{ product: { variants: { nodes: { id: string; selectedOptions: { name: string; value: string }[] }[] } } }>(
    `query($id: ID!) { product(id: $id) { variants(first: 20) { nodes { id selectedOptions { name value } } } } }`,
    { id: productId },
  );
  const metafields = v.product.variants.nodes
    .map((node) => {
      const bundleName = node.selectedOptions.find((o) => o.name === "Bundle")?.value;
      const b = BUNDLES.find((x) => x.name === bundleName);
      return b ? { ownerId: node.id, namespace: "gm_tickets", key: "base_entries", type: "number_integer", value: String(b.entries) } : null;
    })
    .filter(Boolean);
  if (metafields.length) {
    await shopifyAdmin(
      `mutation($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`,
      { m: metafields },
    );
  }
}

async function summarize(productId: string, status: "created" | "exists") {
  const r = await shopifyAdmin<{
    product: { id: string; title: string; handle: string; status: string; productType: string;
      variants: { nodes: { title: string; price: string; metafield: { value: string } | null }[] } };
  }>(
    `query($id: ID!) {
       product(id: $id) {
         id title handle status productType
         variants(first: 20) { nodes { title price metafield(namespace: "gm_tickets", key: "base_entries") { value } } }
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
    variants: p.variants.nodes.map((v) => ({ bundle: v.title, price: v.price, base_entries: v.metafield?.value ?? null })),
  };
}

/** Publish the product to every sales channel/publication so the Storefront API
 * (used by the cart) can see it. Idempotent; needs write_publications scope. */
async function publishEverywhere(productId: string) {
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

async function cleanupOldDefinition() {
  // Remove the earlier gm_raffle namespace + its metafields entirely.
  const r = await shopifyAdmin<{ metafieldDefinitions: { nodes: { id: string }[] } }>(
    `{ metafieldDefinitions(first: 5, ownerType: PRODUCTVARIANT, namespace: "gm_raffle", key: "base_entries") { nodes { id } } }`,
  ).catch(() => null);
  const id = r?.metafieldDefinitions?.nodes?.[0]?.id;
  if (id) {
    await shopifyAdmin(
      `mutation($id: ID!) { metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: true) { deletedDefinitionId userErrors { message } } }`,
      { id },
    ).catch(() => {});
  }
}

export async function ensureTicketsProduct() {
  await cleanupOldDefinition();
  await ensureBaseEntriesDefinition();

  const existing = await productIdByHandle();
  if (existing) {
    // enforce the correct title + product type on the live product
    await shopifyAdmin(
      `mutation($p: ProductUpdateInput!) { productUpdate(product: $p) { product { id } userErrors { message } } }`,
      { p: { id: existing, title: "Tickets", productType: "Tickets" } },
    ).catch(() => {});
    await setBaseEntries(existing); // idempotent — (re)sets base_entries metafields
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
  await setBaseEntries(productId);
  await publishEverywhere(productId); // ensure Storefront (cart) can see it
  return summarize(productId, "created");
}
