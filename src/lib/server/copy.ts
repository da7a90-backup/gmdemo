// Static page copy in Shopify Metaobjects: one `copy_<page>` definition per page,
// each a single "default" entry with typed text fields (one per CONTENT_FIELDS key).
// Kevin edits it in Shopify admin; the site reads it via the Storefront API.
import { CONTENT_FIELDS, type ContentField } from "@/lib/content";
import { shopifyAdmin, shopifyStorefront } from "./shopify";

const typeFor = (page: string) => "copy_" + page.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const fieldKey = (k: string) => k.replace(/\./g, "_");   // 'hero.h1.lead' → 'hero_h1_lead'
const contentKey = (fk: string) => fk.replace(/_/g, "."); // reverse (keys have no natural underscores)

function pages() {
  const m = new Map<string, typeof CONTENT_FIELDS>();
  for (const f of CONTENT_FIELDS) m.set(f.page, [...(m.get(f.page) ?? []), f]);
  return m;
}

type UE = { message: string }[] | undefined;
const firstErr = (ue: UE) => ue?.[0]?.message ?? "";

// One field definition (shared by create + incremental update).
const fieldDef = (f: ContentField) => ({
  key: fieldKey(f.key), name: f.label.slice(0, 60),
  type: f.long ? "multi_line_text_field" : "single_line_text_field",
});

/**
 * Idempotent, NON-DESTRUCTIVE sync of the code registry → Shopify.
 * For each page it:
 *   1. reads the existing `copy_<page>` definition (if any),
 *   2. creates it with all fields when missing,
 *   3. else adds only the NEW field definitions (never deletes/recreates — Shopify
 *      deletes definitions asynchronously, so delete-then-recreate fails "key in use"),
 *   4. backfills the `default` entry with defaults for ONLY the fields Kevin hasn't
 *      set yet (empty/absent), never overwriting his existing edits.
 * Safe to run repeatedly; `_reset` is accepted for API compatibility but ignored.
 */
export async function ensureCopy(_reset = false) {
  const done: { page: string; type: string; definition: string; entry: string }[] = [];
  for (const [page, fields] of pages()) {
    const type = typeFor(page);

    // 1) Read the existing definition + its current field keys.
    const existing = await shopifyAdmin<{
      metaobjectDefinitionByType: { id: string; fieldDefinitions: { key: string }[] } | null;
    }>(
      `query($t: String!) {
        metaobjectDefinitionByType(type: $t) { id fieldDefinitions { key } }
      }`,
      { t: type },
    ).catch(() => null);
    const def = existing?.metaobjectDefinitionByType ?? null;

    let definition: string;
    if (!def) {
      // 2) Missing → create with the full field set.
      const res = await shopifyAdmin<{ metaobjectDefinitionCreate: { userErrors: UE } }>(
        `mutation($def: MetaobjectDefinitionCreateInput!) {
          metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id } userErrors { message code } }
        }`,
        {
          def: {
            type, name: `Copy — ${page}`.slice(0, 60),
            access: { storefront: "PUBLIC_READ" },
            capabilities: { publishable: { enabled: true } },
            fieldDefinitions: fields.map(fieldDef),
          },
        },
      ).catch((e) => ({ metaobjectDefinitionCreate: { userErrors: [{ message: String(e) }] } }));
      const err = firstErr(res.metaobjectDefinitionCreate.userErrors);
      definition = err ? (/taken|already/i.test(err) ? "exists" : `err: ${err}`) : "created";
    } else {
      // 3) Exists → add only the field definitions not already present.
      const have = new Set(def.fieldDefinitions.map((d) => d.key));
      const add = fields.filter((f) => !have.has(fieldKey(f.key)));
      if (add.length === 0) {
        definition = "unchanged";
      } else {
        const res = await shopifyAdmin<{ metaobjectDefinitionUpdate: { userErrors: UE } }>(
          `mutation($id: ID!, $def: MetaobjectDefinitionUpdateInput!) {
            metaobjectDefinitionUpdate(id: $id, definition: $def) { metaobjectDefinition { id } userErrors { message code } }
          }`,
          { id: def.id, def: { fieldDefinitions: add.map((f) => ({ create: fieldDef(f) })) } },
        ).catch((e) => ({ metaobjectDefinitionUpdate: { userErrors: [{ message: String(e) }] } }));
        const err = firstErr(res.metaobjectDefinitionUpdate.userErrors);
        definition = err ? `err: ${err}` : `+${add.length} fields`;
      }
    }

    // 4) Backfill the `default` entry — defaults for missing values only.
    const entry = await backfillDefaultEntry(type, fields);
    done.push({ page, type, definition, entry });
  }
  return done;
}

/** Seed/backfill the `default` entry: set defaults for fields with no value; never overwrite edits. */
async function backfillDefaultEntry(type: string, fields: ContentField[]): Promise<string> {
  const cur = await shopifyAdmin<{
    metaobjectByHandle: { id: string; fields: { key: string; value: string | null }[] } | null;
  }>(
    `query($h: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $h) { id fields { key value } }
    }`,
    { h: { type, handle: "default" } },
  ).catch(() => null);
  const entry = cur?.metaobjectByHandle ?? null;

  if (!entry) {
    // No entry yet → create it with every default.
    const res = await shopifyAdmin<{ metaobjectCreate: { userErrors: UE } }>(
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
    const err = firstErr(res.metaobjectCreate.userErrors);
    return err ? (/taken|already/i.test(err) ? "exists" : `err: ${err}`) : "seeded";
  }

  // Entry exists → only fill fields that are currently empty/absent. metaobjectUpdate
  // merges (omitted fields keep their value), so Kevin's edits are untouched.
  const value = new Map(entry.fields.map((f) => [f.key, f.value]));
  const missing = fields.filter((f) => {
    const v = value.get(fieldKey(f.key));
    return v == null || v === "";
  });
  if (missing.length === 0) return "unchanged";

  const res = await shopifyAdmin<{ metaobjectUpdate: { userErrors: UE } }>(
    `mutation($id: ID!, $m: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $m) { metaobject { id } userErrors { message code } }
    }`,
    { id: entry.id, m: { fields: missing.map((f) => ({ key: fieldKey(f.key), value: f.def })) } },
  ).catch((e) => ({ metaobjectUpdate: { userErrors: [{ message: String(e) }] } }));
  const err = firstErr(res.metaobjectUpdate.userErrors);
  return err ? `err: ${err}` : `+${missing.length} defaults`;
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

// Defaults from the code registry, merged under the Shopify values (server-side read).
const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.def]));

/** Full copy map for server components: code defaults overlaid with Shopify copy. */
export async function getContentServer(): Promise<Record<string, string>> {
  const shop = await getCopyMap().catch(() => ({}));
  return { ...DEFAULTS, ...shop };
}

/**
 * Publish admin copy edits to Shopify: overwrite each `copy_<page>` default entry
 * with the provided values (code default for any absent key). Used by the admin
 * Content desk so Kevin's edits become the live CMS the public site reads.
 * Returns a per-page status; `metaobjectUpsert` creates the entry if missing.
 */
export async function writeCopyValues(values: Record<string, string>) {
  const done: { page: string; type: string; status: string }[] = [];
  for (const [page, fields] of pages()) {
    const type = typeFor(page);
    const res = await shopifyAdmin<{ metaobjectUpsert: { userErrors: UE } }>(
      `mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id } userErrors { message code } }
      }`,
      {
        h: { type, handle: "default" },
        m: {
          capabilities: { publishable: { status: "ACTIVE" } },
          fields: fields.map((f) => ({ key: fieldKey(f.key), value: values[f.key] ?? f.def })),
        },
      },
    ).catch((e) => ({ metaobjectUpsert: { userErrors: [{ message: String(e) }] } }));
    const err = firstErr(res.metaobjectUpsert.userErrors);
    done.push({ page, type, status: err ? `err: ${err}` : "published" });
  }
  return done;
}
