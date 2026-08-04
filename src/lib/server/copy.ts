// Static page copy in Shopify Metaobjects: one `copy_<page>` definition per page,
// each a single "default" entry with typed text fields (one per CONTENT_FIELDS key).
// Kevin edits it in Shopify admin; the site reads it via the Storefront API.
import { CONTENT_FIELDS } from "@/lib/content";
import { shopifyAdmin, shopifyStorefront } from "./shopify";

const typeFor = (page: string) => "copy_" + page.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const fieldKey = (k: string) => k.replace(/\./g, "_");   // 'hero.h1.lead' → 'hero_h1_lead'
const contentKey = (fk: string) => fk.replace(/_/g, "."); // reverse (keys have no natural underscores)

function pages() {
  const m = new Map<string, typeof CONTENT_FIELDS>();
  for (const f of CONTENT_FIELDS) m.set(f.page, [...(m.get(f.page) ?? []), f]);
  return m;
}

type UE = { message: string }[];

/** Create the definitions (if missing) and seed each with a 'default' entry of defaults. */
export async function ensureCopy() {
  const done: { page: string; type: string; definition: string; entry: string }[] = [];
  for (const [page, fields] of pages()) {
    const type = typeFor(page);

    const defRes = await shopifyAdmin<{ metaobjectDefinitionCreate: { userErrors: UE } }>(
      `mutation($def: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id } userErrors { message code } }
      }`,
      {
        def: {
          type, name: `Copy — ${page}`.slice(0, 60),
          access: { storefront: "PUBLIC_READ" },
          capabilities: { publishable: { enabled: true } },
          fieldDefinitions: fields.map((f) => ({
            key: fieldKey(f.key), name: f.label.slice(0, 60),
            type: f.long ? "multi_line_text_field" : "single_line_text_field",
          })),
        },
      },
    ).catch((e) => ({ metaobjectDefinitionCreate: { userErrors: [{ message: String(e) }] } }));
    const defErr = defRes.metaobjectDefinitionCreate.userErrors?.[0]?.message ?? "";
    const defStatus = defErr ? (/taken|already/i.test(defErr) ? "exists" : `err: ${defErr}`) : "created";

    const entRes = await shopifyAdmin<{ metaobjectCreate: { userErrors: UE } }>(
      `mutation($m: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $m) { metaobject { id } userErrors { message code } }
      }`,
      {
        m: {
          type, handle: "default",
          capabilities: { publishable: { status: "ACTIVE" } },
          fields: fields.map((f) => ({ key: fieldKey(f.key), value: f.def })),
        },
      },
    ).catch((e) => ({ metaobjectCreate: { userErrors: [{ message: String(e) }] } }));
    const entErr = entRes.metaobjectCreate.userErrors?.[0]?.message ?? "";
    const entStatus = entErr ? (/taken|already/i.test(entErr) ? "exists" : `err: ${entErr}`) : "seeded";

    done.push({ page, type, definition: defStatus, entry: entStatus });
  }
  return done;
}

/** Read all copy from Shopify (Storefront), returned as the content-key → value map. */
export async function getCopyMap(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    [...pages().keys()].map(async (page) => {
      const type = typeFor(page);
      const res = await shopifyStorefront<{ metaobject: { fields: { key: string; value: string | null }[] } | null }>(
        `query($h: MetaobjectHandleInput!) { metaobject(handle: $h) { fields { key value } } }`,
        { h: { type, handle: "default" } },
      ).catch(() => null);
      for (const f of res?.metaobject?.fields ?? []) {
        if (f.value != null && f.value !== "") out[contentKey(f.key)] = f.value;
      }
    }),
  );
  return out;
}
