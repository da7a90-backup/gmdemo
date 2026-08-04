// Proves the full Shopify metaobject pipeline against the store, using the
// client-credentials grant: mint token → create definition → create entry →
// read via Admin → read via Storefront → clean up.
//   node scripts/shopify-check.mjs
import { loadEnv } from "./_env.mjs";
loadEnv();

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CID = process.env.SHOPIFY_API_KEY;
const CSECRET = process.env.SHOPIFY_API_SECRET;
const SF = process.env.SHOPIFY_STOREFRONT_TOKEN;
const V = process.env.SHOPIFY_API_VERSION ?? "2024-10";

async function adminToken() {
  const r = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: CID, client_secret: CSECRET }),
  });
  const j = await r.json();
  return j.access_token;
}
async function admin(tok, query, variables) {
  const r = await fetch(`https://${DOMAIN}/admin/api/${V}/graphql.json`, {
    method: "POST", headers: { "X-Shopify-Access-Token": tok, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}
async function storefront(query, variables) {
  const r = await fetch(`https://${DOMAIN}/api/${V}/graphql.json`, {
    method: "POST", headers: { "X-Shopify-Storefront-Access-Token": SF, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

const TYPE = "gm_pipeline_check";

async function main() {
  const tok = await adminToken();
  console.log("1) minted admin token via client credentials:", tok.slice(0, 12) + "…");

  const created = await admin(tok, `
    mutation($def: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $def) {
        metaobjectDefinition { id type }
        userErrors { field message code }
      }
    }`, {
    def: {
      type: TYPE, name: "GM Pipeline Check",
      access: { storefront: "PUBLIC_READ" },
      capabilities: { publishable: { enabled: true } },
      fieldDefinitions: [{ key: "message", name: "Message", type: "single_line_text_field" }],
    },
  });
  const defId = created?.data?.metaobjectDefinitionCreate?.metaobjectDefinition?.id;
  console.log("2) created definition:", defId || JSON.stringify(created?.data?.metaobjectDefinitionCreate?.userErrors || created));
  if (!defId) return;

  const entry = await admin(tok, `
    mutation($m: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $m) { metaobject { id handle } userErrors { field message } }
    }`, {
    m: { type: TYPE, handle: "check-1", capabilities: { publishable: { status: "ACTIVE" } },
         fields: [{ key: "message", value: "hello from the GM pipeline" }] },
  });
  console.log("3) created entry:", entry?.data?.metaobjectCreate?.metaobject?.handle || JSON.stringify(entry?.data?.metaobjectCreate?.userErrors));

  const ra = await admin(tok, `{ metaobjectByHandle(handle:{type:"${TYPE}",handle:"check-1"}){ handle field(key:"message"){ value } } }`);
  console.log("4) read via ADMIN:      ", ra?.data?.metaobjectByHandle?.field?.value);

  // storefront may need a moment to expose; try once
  const rs = await storefront(`{ metaobject(handle:{type:"${TYPE}",handle:"check-1"}){ handle field(key:"message"){ value } } }`);
  console.log("5) read via STOREFRONT:  ", rs?.data?.metaobject?.field?.value ?? JSON.stringify(rs?.errors || "(not yet visible)"));

  const del = await admin(tok, `mutation($id:ID!){ metaobjectDefinitionDelete(id:$id){ deletedId userErrors{message} } }`, { id: defId });
  console.log("6) cleaned up definition:", del?.data?.metaobjectDefinitionDelete?.deletedId ? "deleted ✅" : JSON.stringify(del));
}
main().catch((e) => { console.error("SHOPIFY CHECK FAILED:", e.message); process.exit(1); });
