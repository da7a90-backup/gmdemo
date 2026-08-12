// Sprint 2 — membership as a Shopify SUBSCRIPTION (selling plan). One "Membership"
// product with a Tier option (Essential/Premium/VIP), attached to a monthly selling
// plan group. Buying a tier with the selling plan on the cart line creates a
// subscription contract at checkout → the subscription-contracts webhook flips
// is_member; the `_entries` line attribute mints the monthly allotment.
// (Ongoing recurring billing — subscription billing attempts — is a separate
// production concern and is NOT scheduled here.)
import { shopifyAdmin } from "./shopify";
import { publishEverywhere, setVariantsNoShipping } from "./shopify-products";

const HANDLE = "membership";
const MERCHANT_CODE = "gm-membership-monthly";

export const MEMBERSHIP_PLANS = [
  { tier: "Essential", price: "19.00", entries: 20 },
  { tier: "Premium", price: "49.00", entries: 60 },
  { tier: "VIP", price: "149.00", entries: 200 },
];

type UE = { field?: string[]; message: string }[];

async function productIdByHandle(): Promise<string | null> {
  const r = await shopifyAdmin<{ productByHandle: { id: string } | null }>(
    `query($h: String!) { productByHandle(handle: $h) { id } }`, { h: HANDLE },
  ).catch(() => ({ productByHandle: null }));
  return r.productByHandle?.id ?? null;
}

/** Ensure the monthly selling plan group exists and is attached to the product.
 * Idempotent by merchantCode. Returns the selling plan id (for the Storefront cart). */
async function ensureSellingPlanGroup(productId: string): Promise<string | null> {
  const q = await shopifyAdmin<{ sellingPlanGroups: { nodes: { id: string; merchantCode: string; sellingPlans: { nodes: { id: string }[] } }[] } }>(
    `{ sellingPlanGroups(first: 50) { nodes { id merchantCode sellingPlans(first: 1) { nodes { id } } } } }`,
  ).catch(() => ({ sellingPlanGroups: { nodes: [] } }));
  const existing = q.sellingPlanGroups.nodes.find((g) => g.merchantCode === MERCHANT_CODE);
  if (existing) {
    await shopifyAdmin(
      `mutation($id: ID!, $ids: [ID!]!) { sellingPlanGroupAddProducts(id: $id, productIds: $ids) { userErrors { message } } }`,
      { id: existing.id, ids: [productId] },
    ).catch(() => {});
    return existing.sellingPlans.nodes[0]?.id ?? null;
  }
  const res = await shopifyAdmin<{ sellingPlanGroupCreate: { sellingPlanGroup: { sellingPlans: { nodes: { id: string }[] } } | null; userErrors: UE } }>(
    `mutation($input: SellingPlanGroupInput!, $resources: SellingPlanGroupResourceInput) {
       sellingPlanGroupCreate(input: $input, resources: $resources) {
         sellingPlanGroup { id sellingPlans(first: 1) { nodes { id } } }
         userErrors { field message }
       }
     }`,
    {
      input: {
        name: "Membership",
        merchantCode: MERCHANT_CODE,
        options: ["Monthly"],
        sellingPlansToCreate: [{
          name: "Monthly membership",
          options: "1 Month",
          category: "SUBSCRIPTION",
          billingPolicy: { recurring: { interval: "MONTH", intervalCount: 1 } },
          deliveryPolicy: { recurring: { interval: "MONTH", intervalCount: 1 } },
        }],
      },
      resources: { productIds: [productId], productVariantIds: [] },
    },
  );
  if (res.sellingPlanGroupCreate.userErrors?.length) throw new Error("sellingPlanGroupCreate: " + JSON.stringify(res.sellingPlanGroupCreate.userErrors));
  return res.sellingPlanGroupCreate.sellingPlanGroup?.sellingPlans.nodes[0]?.id ?? null;
}

async function summarize(productId: string, sellingPlanId: string | null, status: "created" | "exists") {
  const r = await shopifyAdmin<{ product: { id: string; handle: string; status: string; variants: { nodes: { title: string; price: string }[] } } }>(
    `query($id: ID!) { product(id: $id) { id handle status variants(first: 20) { nodes { title price } } } }`,
    { id: productId },
  );
  const p = r.product;
  const shop = (process.env.SHOPIFY_STORE_DOMAIN ?? "").replace(".myshopify.com", "");
  return {
    status, id: p.id, handle: p.handle, productStatus: p.status, sellingPlanId,
    adminUrl: `https://admin.shopify.com/store/${shop}/products/${p.id.split("/").pop()}`,
    variants: p.variants.nodes.map((v) => ({ tier: v.title, price: v.price })),
  };
}

export async function ensureMembershipProduct() {
  let productId = await productIdByHandle();
  let status: "created" | "exists" = "exists";
  if (!productId) {
    const set = await shopifyAdmin<{ productSet: { product: { id: string } | null; userErrors: UE } }>(
      `mutation($input: ProductSetInput!) { productSet(input: $input, synchronous: true) { product { id } userErrors { field message } } }`,
      {
        input: {
          title: "Membership", handle: HANDLE, status: "ACTIVE", productType: "Membership",
          productOptions: [{ name: "Tier", values: MEMBERSHIP_PLANS.map((p) => ({ name: p.tier })) }],
          variants: MEMBERSHIP_PLANS.map((p) => ({ optionValues: [{ optionName: "Tier", name: p.tier }], price: p.price, inventoryPolicy: "CONTINUE" })),
        },
      },
    );
    if (set.productSet.userErrors?.length) throw new Error("productSet: " + JSON.stringify(set.productSet.userErrors));
    productId = set.productSet.product!.id;
    status = "created";
  } else {
    await shopifyAdmin(
      `mutation($p: ProductUpdateInput!) { productUpdate(product: $p) { product { id } userErrors { message } } }`,
      { p: { id: productId, title: "Membership", productType: "Membership" } },
    ).catch(() => {});
  }
  const sellingPlanId = await ensureSellingPlanGroup(productId);
  await setVariantsNoShipping(productId); // digital subscription → no shipping step at checkout
  await publishEverywhere(productId);
  return summarize(productId, sellingPlanId, status);
}
