// Shopify Admin + Storefront GraphQL client.
// Admin auth uses the CLIENT CREDENTIALS GRANT: exchange client_id + client_secret
// at /admin/oauth/access_token for a short-lived (24h) token carrying the app's
// scopes. We cache it and refresh before expiry.
// docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_API_KEY;
const CLIENT_SECRET = process.env.SHOPIFY_API_SECRET;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2024-10";

export const shopifyAdminConfigured = () => !!(DOMAIN && CLIENT_ID && CLIENT_SECRET);
export const shopifyStorefrontConfigured = () => !!(DOMAIN && STOREFRONT_TOKEN);

type TokenCache = { token: string; expiresAt: number };
const g = globalThis as unknown as { __shopToken?: TokenCache };

async function getAdminToken(): Promise<string> {
  if (!shopifyAdminConfigured()) throw new Error("Shopify admin not configured");
  const cached = g.__shopToken;
  if (cached && Date.now() < cached.expiresAt - 60_000) return cached.token;
  const res = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) throw new Error(`shopify token exchange ${res.status}: ${await res.text().catch(() => "")}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  g.__shopToken = { token: j.access_token, expiresAt: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function gql<T>(url: string, headers: Record<string, string>, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = (await res.json()) as { data?: T; errors?: unknown };
  if (j.errors) throw new Error(`shopify graphql: ${JSON.stringify(j.errors)}`);
  return j.data as T;
}

export async function shopifyAdmin<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getAdminToken();
  return gql<T>(`https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`, { "X-Shopify-Access-Token": token }, query, variables);
}

export async function shopifyStorefront<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!shopifyStorefrontConfigured()) throw new Error("Shopify storefront not configured");
  return gql<T>(
    `https://${DOMAIN}/api/${API_VERSION}/graphql.json`,
    { "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN! },
    query,
    variables,
  );
}
