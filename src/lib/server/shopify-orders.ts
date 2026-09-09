// Create a $0 "comped" ticket order in Shopify for the free-entry-on-signup flow.
// Uses a draft order (100% off the 1-ticket variant) completed as paid, so it flows
// through the exact same orders/paid mint pipeline as a purchase. Requires
// write_draft_orders + write_orders (both granted).
import { shopifyAdmin, shopifyAdminConfigured } from "./shopify";

// The "1 Ticket" variant on the live store; override via env if the catalog changes.
const TICKET_1_VARIANT = process.env.SHOPIFY_FREE_TICKET_VARIANT || "gid://shopify/ProductVariant/53664372523371";

const numericId = (gid: string) => Number(gid.split("/").pop());

export type CompedOrder = { orderId: number; lineId: number; name: string };

/**
 * Create + complete a $0 order granting one free entry to `email`. The line carries
 * `_entries=1` so the mint reads it; the order is tagged for reporting. Returns the
 * numeric order id + line id (for a deterministic direct mint) or throws.
 */
export async function createCompedTicketOrder(opts: { email: string }): Promise<CompedOrder> {
  if (!shopifyAdminConfigured()) throw new Error("Shopify admin not configured");

  const created = await shopifyAdmin<{
    draftOrderCreate: { draftOrder: { id: string } | null; userErrors: { field: string[]; message: string }[] };
  }>(
    `mutation($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) { draftOrder { id } userErrors { field message } }
    }`,
    {
      input: {
        email: opts.email,
        note: "Free entry — email signup",
        tags: ["free-entry", "email-signup"],
        appliedDiscount: { valueType: "PERCENTAGE", value: 100, title: "Free entry (email signup)" },
        lineItems: [{ variantId: TICKET_1_VARIANT, quantity: 1, customAttributes: [{ key: "_entries", value: "1" }] }],
      },
    },
  );
  const draftErr = created.draftOrderCreate.userErrors?.[0]?.message;
  if (draftErr || !created.draftOrderCreate.draftOrder) throw new Error(`draftOrderCreate: ${draftErr ?? "no draft"}`);
  const draftId = created.draftOrderCreate.draftOrder.id;

  const done = await shopifyAdmin<{
    draftOrderComplete: {
      draftOrder: { order: { legacyResourceId: string; name: string; lineItems: { edges: { node: { id: string } }[] } } | null } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(
    `mutation($id: ID!) {
      draftOrderComplete(id: $id, paymentPending: false) {
        draftOrder { order { legacyResourceId name lineItems(first: 1) { edges { node { id } } } } }
        userErrors { field message }
      }
    }`,
    { id: draftId },
  );
  const doneErr = done.draftOrderComplete.userErrors?.[0]?.message;
  const order = done.draftOrderComplete.draftOrder?.order;
  if (doneErr || !order) throw new Error(`draftOrderComplete: ${doneErr ?? "no order"}`);

  const lineGid = order.lineItems.edges?.[0]?.node?.id;
  if (!lineGid) throw new Error("draftOrderComplete: no line item");
  return { orderId: Number(order.legacyResourceId), lineId: numericId(lineGid), name: order.name };
}
