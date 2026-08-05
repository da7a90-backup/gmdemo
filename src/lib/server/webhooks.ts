// Shopify webhook plumbing shared by the orders/paid + subscription routes.
// HMAC verification uses the app's client secret (SHOPIFY_API_SECRET), which is
// what Shopify signs app-registered webhooks with; SHOPIFY_WEBHOOK_SECRET can
// override it. All order→ticket minting goes through the idempotent mintOne().
import crypto from "node:crypto";
import { pool } from "./db";
import { shopifyAdmin } from "./shopify";
import type { Body } from "./ticketing";

const webhookSecret = () => process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET || "";

export const webhookSecretConfigured = () => !!webhookSecret();

/** Constant-time verify of the X-Shopify-Hmac-Sha256 header against the raw body. */
export function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = webhookSecret();
  if (!secret || !hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ------------------------------ order payload ------------------------------ */
type Prop = { name: string; value: string };
export type OrderPayload = {
  id: number;
  email?: string | null;
  contact_email?: string | null;
  note_attributes?: Prop[];
  phone?: string | null;
  customer?: { id?: number; email?: string | null; first_name?: string | null; last_name?: string | null; admin_graphql_api_id?: string | null };
  billing_address?: { name?: string | null } | null;
  shipping_address?: { name?: string | null } | null;
  line_items?: { id: number; quantity?: number; properties?: Prop[]; selling_plan_allocation?: unknown }[];
};

const prop = (props: Prop[] | undefined, name: string) =>
  props?.find((p) => p?.name?.toLowerCase() === name.toLowerCase())?.value;

const orderEmail = (o: OrderPayload) => o.email || o.contact_email || o.customer?.email || null;

/**
 * Map a Shopify order to the idempotent mint Body. Entries per line come from a
 * `_entries` (or `entries`) line-item property set by the storefront cart in C.5
 * — entries PER UNIT × quantity — falling back to quantity. The member multiplier
 * comes from an `_multiplier` order note attribute. Returns null for a non-order
 * or one with no entry-bearing lines.
 */
export function mapOrderToMintBody(webhookId: string, o: OrderPayload): Body | null {
  if (!o?.id) return null;
  const multiplier = Math.max(
    1,
    Math.floor(Number(prop(o.note_attributes, "_multiplier") ?? prop(o.note_attributes, "entry_multiplier")) || 1),
  );
  const line_items = (o.line_items ?? [])
    .map((li) => {
      const perUnit = Number(prop(li.properties, "_entries") ?? prop(li.properties, "entries"));
      const each = Number.isFinite(perUnit) && perUnit > 0 ? perUnit : 1;
      return { id: li.id, ticket_count: each * Math.max(1, li.quantity ?? 1) };
    })
    .filter((l) => l.id != null && l.ticket_count > 0);
  if (line_items.length === 0) return null;
  return { webhookId, order: { id: o.id, email: orderEmail(o) ?? "", multiplier, line_items } };
}

export const isMembershipOrder = (o: OrderPayload): boolean =>
  (o.line_items ?? []).some(
    (li) => !!li.selling_plan_allocation || prop(li.properties, "membership")?.toLowerCase() === "true",
  );

const customerGid = (o: OrderPayload): string | null =>
  o.customer?.admin_graphql_api_id || (o.customer?.id ? `gid://shopify/Customer/${o.customer.id}` : null);

const buyerName = (o: OrderPayload): string | null => {
  const n = [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ").trim();
  return n || o.shipping_address?.name || o.billing_address?.name || null;
};

/** After a successful mint, backfill the order's holder name and link the buyer
 * to their Shopify customer / member flag. Best-effort; never throws. */
export async function applyOrderMeta(o: OrderPayload, member: boolean): Promise<void> {
  const email = orderEmail(o);
  const name = buyerName(o);
  const gid = customerGid(o);
  if (name) {
    await pool
      .query(`update orders set full_name = $2 where shopify_order_id = $1 and (full_name is null or full_name = '')`, [o.id, name])
      .catch(() => {});
  }
  if (email && (gid || member)) {
    await pool
      .query(
        `update users set shopify_customer_gid = coalesce($2, shopify_customer_gid), is_member = is_member or $3 where email = $1`,
        [email, gid, member],
      )
      .catch(() => {});
  }
}

/* -------------------------- subscription contracts ------------------------- */
export type ContractPayload = {
  id?: number;
  admin_graphql_api_id?: string;
  status?: string;
  customer_id?: number;
  customer?: { id?: number; email?: string | null; admin_graphql_api_id?: string | null };
};

const contractGid = (c: ContractPayload): string | null =>
  c.admin_graphql_api_id || (c.id ? `gid://shopify/SubscriptionContract/${c.id}` : null);

const contractCustomerGid = (c: ContractPayload): string | null =>
  c.customer?.admin_graphql_api_id ||
  (c.customer?.id ? `gid://shopify/Customer/${c.customer.id}` : c.customer_id ? `gid://shopify/Customer/${c.customer_id}` : null);

/**
 * Record a subscription contract and reflect membership. active/paused → member;
 * cancelled/expired/failed → member only if another active contract remains.
 * Idempotent on the contract GID. Never throws.
 */
export async function upsertSubscriptionContract(c: ContractPayload, status: string): Promise<void> {
  const gid = contractGid(c);
  if (!gid) return;
  const custGid = contractCustomerGid(c);
  const email = c.customer?.email ?? null;
  try {
    const userRow = (
      await pool.query(
        `select id from users
         where ($1::text is not null and shopify_customer_gid = $1)
            or ($2::citext is not null and email = $2)
         limit 1`,
        [custGid, email],
      )
    ).rows[0] as { id: number } | undefined;
    const userId = userRow?.id ?? null;

    await pool.query(
      `insert into subscription_contracts (shopify_contract_gid, user_id, shopify_customer_gid, status)
       values ($1,$2,$3,$4)
       on conflict (shopify_contract_gid)
       do update set status = excluded.status,
                     user_id = coalesce(excluded.user_id, subscription_contracts.user_id),
                     shopify_customer_gid = coalesce(excluded.shopify_customer_gid, subscription_contracts.shopify_customer_gid),
                     updated_at = now()`,
      [gid, userId, custGid, status],
    );

    const active = status === "active" || status === "paused";
    if (userId) {
      // membership = any remaining active/paused contract for this user
      await pool.query(
        `update users set is_member = exists(
            select 1 from subscription_contracts sc
            where sc.user_id = $1 and sc.status in ('active','paused')
         ) where id = $1`,
        [userId],
      );
    } else if (custGid) {
      await pool.query(`update users set is_member = $2 where shopify_customer_gid = $1`, [custGid, active]).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

/* --------------------------- webhook registration -------------------------- */
// The topics this app consumes → the route each is delivered to. Registering
// points Shopify at our HTTPS endpoints; delivery is HMAC-signed with the app secret.
const WEBHOOK_TOPICS: { topic: string; path: string }[] = [
  { topic: "ORDERS_PAID", path: "/api/webhooks/orders-paid" },
  { topic: "SUBSCRIPTION_CONTRACTS_CREATE", path: "/api/webhooks/subscription-contracts" },
  { topic: "SUBSCRIPTION_CONTRACTS_UPDATE", path: "/api/webhooks/subscription-contracts" },
];

/** Register (idempotently) every consumed webhook topic against `base` (the
 * deployment's public HTTPS origin). "exists" when the topic+URL is already set. */
export async function registerWebhooks(base: string) {
  const origin = base.replace(/\/+$/, "");
  const out: { topic: string; callbackUrl: string; status: string }[] = [];
  for (const w of WEBHOOK_TOPICS) {
    const callbackUrl = origin + w.path;
    const res = await shopifyAdmin<{ webhookSubscriptionCreate: { userErrors: { message: string }[] } }>(
      `mutation($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
          webhookSubscription { id } userErrors { field message }
        }
      }`,
      { topic: w.topic, sub: { callbackUrl, format: "JSON" } },
    ).catch((e) => ({ webhookSubscriptionCreate: { userErrors: [{ message: String(e) }] } }));
    const err = res.webhookSubscriptionCreate.userErrors?.[0]?.message ?? "";
    out.push({ topic: w.topic, callbackUrl, status: err ? (/taken|already/i.test(err) ? "exists" : `err: ${err}`) : "registered" });
  }
  return out;
}

type WebhookNode = { id: string; topic: string; endpoint: { callbackUrl?: string } | null };

/** Current webhook subscriptions on the store (for the admin to inspect). */
export async function listWebhooks(): Promise<{ id: string; topic: string; callbackUrl: string }[]> {
  const res = await shopifyAdmin<{ webhookSubscriptions: { nodes: WebhookNode[] } }>(
    `query {
      webhookSubscriptions(first: 100) {
        nodes { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } }
      }
    }`,
  ).catch(() => ({ webhookSubscriptions: { nodes: [] as WebhookNode[] } }));
  return res.webhookSubscriptions.nodes.map((n) => ({ id: n.id, topic: n.topic, callbackUrl: n.endpoint?.callbackUrl ?? "" }));
}
