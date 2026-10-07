// Create a $0 "comped" ticket order in Shopify for the free-entry-on-signup flow.
// Uses a draft order (100% off the 1-ticket variant) completed as paid, so it flows
// through the exact same orders/paid mint pipeline as a purchase. Requires
// write_draft_orders + write_orders (both granted).
import { shopifyAdmin, shopifyAdminConfigured } from "./shopify";

// The "1 Ticket" variant on the live store; override via env if the catalog changes.
const TICKET_1_VARIANT = process.env.SHOPIFY_FREE_TICKET_VARIANT || "gid://shopify/ProductVariant/53664372523371";

const numericId = (gid: string) => Number(gid.split("/").pop());

export type CompedOrder = { orderId: number; lineId: number; name: string };

type CustomerNode = { id: string; firstName: string | null; lastName: string | null; phone: string | null };

/**
 * Resolve a Shopify customer for `email` carrying the claimant's name and (best-effort)
 * phone, returning its gid — or null so the caller can fall back to an email-only order.
 *
 * Why this exists: a draft order links an existing customer by email on completion
 * but never backfills that customer's name, and auto-creates a *nameless* one for new
 * emails. Either way the order's "Customer" card shows only the email. So we resolve a
 * named customer up front and attach it by id. Phone is best-effort — Shopify enforces
 * phone uniqueness, so a collision just leaves it off the customer record (it still
 * rides on the order contact + address).
 */
async function ensureCustomer(email: string, firstName?: string, lastName?: string, phone?: string): Promise<string | null> {
  const nameInput = firstName || lastName ? { firstName, lastName } : {};

  const find = async (): Promise<CustomerNode | undefined> => {
    const r = await shopifyAdmin<{ customers: { edges: { node: CustomerNode }[] } }>(
      `query($q: String!) { customers(first: 1, query: $q) { edges { node { id firstName lastName phone } } } }`,
      { q: `email:"${email}"` },
    );
    return r.customers.edges?.[0]?.node;
  };

  // Fill only what's missing so we never clobber a customer's existing name/phone.
  const update = async (existing: CustomerNode) => {
    const input: Record<string, unknown> = { id: existing.id };
    if ((firstName || lastName) && !existing.firstName && !existing.lastName) Object.assign(input, nameInput);
    if (phone && !existing.phone) input.phone = phone;
    if (Object.keys(input).length === 1) return; // nothing to change
    const r = await shopifyAdmin<{ customerUpdate: { customer: { id: string } | null; userErrors: { message: string }[] } }>(
      `mutation($input: CustomerInput!) { customerUpdate(input: $input) { customer { id } userErrors { field message } } }`,
      { input },
    );
    if (!r.customerUpdate.customer && input.phone) {
      delete input.phone; // phone belongs to another customer — set the name alone
      if (Object.keys(input).length > 1) {
        await shopifyAdmin(
          `mutation($input: CustomerInput!) { customerUpdate(input: $input) { customer { id } userErrors { message } } }`,
          { input },
        ).catch(() => {});
      }
    }
  };

  try {
    const existing = await find();
    if (existing) {
      await update(existing);
      return existing.id;
    }
    const create = (withPhone: boolean) =>
      shopifyAdmin<{ customerCreate: { customer: { id: string } | null; userErrors: { field: string[]; message: string }[] } }>(
        `mutation($input: CustomerInput!) { customerCreate(input: $input) { customer { id } userErrors { field message } } }`,
        { input: { email, ...nameInput, ...(withPhone && phone ? { phone } : {}) } },
      );
    let res = await create(!!phone);
    const emailTaken = res.customerCreate.userErrors?.some((e) => /take|exist/i.test(e.message));
    if (!res.customerCreate.customer && phone && !emailTaken) res = await create(false); // phone collision → retry sans phone
    if (res.customerCreate.customer) return res.customerCreate.customer.id;
    if (emailTaken) {
      // Customer exists but the search index hadn't surfaced it yet — re-query, then update.
      const again = await find();
      if (again) {
        await update(again);
        return again.id;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create + complete a $0 order granting one free entry to `email`. The line carries
 * `_entries=1` so the mint reads it; the order is tagged for reporting. When the
 * claimant's name/phone are known, a named customer is resolved and linked by id and
 * the name/phone are set on the order contact + billing/shipping address, so the order
 * shows who claimed it — not just the email. Returns the numeric order id + line id
 * (for a deterministic direct mint) or throws.
 */
export async function createCompedTicketOrder(opts: { email: string; fullName?: string; phone?: string }): Promise<CompedOrder> {
  if (!shopifyAdminConfigured()) throw new Error("Shopify admin not configured");

  const fullName = (opts.fullName ?? "").trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = fullName ? fullName.split(" ") : [];
  const lastName = rest.join(" ") || undefined;
  const phone = opts.phone?.trim() || undefined;
  const address = firstName || phone ? { firstName: firstName || undefined, lastName, phone } : undefined;

  // Resolve a named customer first and link it by id — that (not the address) is what
  // populates the order's Customer card. Best-effort: on failure, null → email-only order.
  const customerId = firstName || lastName || phone ? await ensureCustomer(opts.email, firstName || undefined, lastName, phone) : null;

  const input: Record<string, unknown> = {
    email: opts.email,
    note: "Free entry — email signup",
    tags: ["free-entry", "email-signup"],
    appliedDiscount: { valueType: "PERCENTAGE", value: 100, title: "Free entry (email signup)" },
    lineItems: [{ variantId: TICKET_1_VARIANT, quantity: 1, customAttributes: [{ key: "_entries", value: "1" }] }],
  };
  if (customerId) input.customerId = customerId;
  if (phone) input.phone = phone;
  if (address) {
    input.billingAddress = address;
    input.shippingAddress = address;
  }

  const created = await shopifyAdmin<{
    draftOrderCreate: { draftOrder: { id: string } | null; userErrors: { field: string[]; message: string }[] };
  }>(
    `mutation($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) { draftOrder { id } userErrors { field message } }
    }`,
    { input },
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
