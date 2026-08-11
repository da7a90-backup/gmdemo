// Repeatable editorial content as Shopify Metaobjects — one entry per item,
// same shape as `faq_item` (src/lib/server/faq.ts). Covers:
//   rule_section    — the Official Rules sections (/rules)
//   legal_doc       — the standalone legal pages (/legal/[slug])
//   about_step      — the "how the draw works" process steps (/about)
//   membership_perk — the loyalty-ladder rows (/membership)
// Each type has: ensure* (create definition), list*/get* (Storefront read),
// seed* (upsert defaults). Reads fall back to code defaults when Shopify is
// unreachable, so the deployed demo keeps working.
import { shopifyAdmin, shopifyStorefront } from "./shopify";
import type { RuleSection } from "@/lib/rules-data";
import type { LegalDoc } from "@/lib/legal-data";
import type { AboutStep } from "@/lib/about-data";
import type { MembershipPerk } from "@/lib/membership-data";
import { ensureFaqDefinition } from "./faq";

type Field = { key: string; value: string | null };
type FieldSpec = { key: string; name: string; type: "single_line_text_field" | "multi_line_text_field" | "number_integer" };
const g = (fs: Field[], k: string) => fs.find((x) => x.key === k)?.value ?? "";

/** Create a metaobject definition (idempotent — ignores "already exists"). */
async function ensureDefinition(type: string, name: string, fields: FieldSpec[], displayNameKey?: string) {
  await shopifyAdmin(
    `mutation($def: MetaobjectDefinitionCreateInput!) {
       metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id } userErrors { message } }
     }`,
    {
      def: {
        type, name, ...(displayNameKey ? { displayNameKey } : {}),
        access: { storefront: "PUBLIC_READ" }, capabilities: { publishable: { enabled: true } },
        fieldDefinitions: fields,
      },
    },
  ).catch(() => {});
}

/** Read all entries of a type (Storefront); returns [] when unreachable/empty. */
async function listNodes(type: string): Promise<Field[][]> {
  const r = await shopifyStorefront<{ metaobjects: { nodes: { fields: Field[] }[] } }>(
    `query { metaobjects(type: "${type}", first: 100) { nodes { fields { key value } } } }`,
  ).catch(() => null);
  return (r?.metaobjects?.nodes ?? []).map((n) => n.fields);
}

/** Upsert one entry by handle (idempotent). */
async function upsert(type: string, handle: string, fields: Field[]) {
  await shopifyAdmin(
    `mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) {
       metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id } userErrors { message } }
     }`,
    { h: { type, handle }, m: { capabilities: { publishable: { status: "ACTIVE" } }, fields } },
  ).catch(() => {});
}

/* ------------------------------ rule_section ------------------------------ */
const RULE = "rule_section";

export async function ensureRuleDefinition() {
  await ensureDefinition(RULE, "Rule section", [
    { key: "title", name: "Title", type: "single_line_text_field" },
    { key: "body", name: "Body", type: "multi_line_text_field" },
    { key: "sort", name: "Sort order", type: "number_integer" },
  ], "title");
}

export async function listRuleSections(): Promise<RuleSection[]> {
  const rows = (await listNodes(RULE)).map((f) => ({
    title: g(f, "title"), body: g(f, "body"), sort: Number(g(f, "sort")) || 0,
  }));
  return rows.sort((a, b) => a.sort - b.sort).map(({ title, body }) => ({ title, body }));
}

export async function seedRuleSections(items: RuleSection[]) {
  await ensureRuleDefinition();
  for (let i = 0; i < items.length; i++) {
    await upsert(RULE, `rule-${i + 1}`, [
      { key: "title", value: items[i].title },
      { key: "body", value: items[i].body },
      { key: "sort", value: String(i) },
    ]);
  }
}

/* ------------------------------- legal_doc -------------------------------- */
const LEGAL = "legal_doc";

export async function ensureLegalDefinition() {
  await ensureDefinition(LEGAL, "Legal document", [
    { key: "slug", name: "Slug", type: "single_line_text_field" },
    { key: "title", name: "Title", type: "single_line_text_field" },
    { key: "body", name: "Body", type: "multi_line_text_field" },
  ], "title");
}

/** One legal doc by slug (Storefront, by handle); null when unreachable/missing. */
export async function getLegalDoc(slug: string): Promise<LegalDoc | null> {
  const r = await shopifyStorefront<{ metaobject: { fields: Field[] } | null }>(
    `query($h: MetaobjectHandleInput!) { metaobject(handle: $h) { fields { key value } } }`,
    { h: { type: LEGAL, handle: `legal-${slug}` } },
  ).catch(() => null);
  const f = r?.metaobject?.fields;
  if (!f) return null;
  return { slug: g(f, "slug") || slug, title: g(f, "title"), body: g(f, "body") };
}

export async function seedLegalDocs(items: LegalDoc[]) {
  await ensureLegalDefinition();
  for (const d of items) {
    await upsert(LEGAL, `legal-${d.slug}`, [
      { key: "slug", value: d.slug },
      { key: "title", value: d.title },
      { key: "body", value: d.body },
    ]);
  }
}

/* ------------------------------- about_step ------------------------------- */
const ABOUT = "about_step";

export async function ensureAboutStepDefinition() {
  await ensureDefinition(ABOUT, "About step", [
    { key: "title", name: "Title", type: "single_line_text_field" },
    { key: "body", name: "Body", type: "multi_line_text_field" },
    { key: "sort", name: "Sort order", type: "number_integer" },
  ], "title");
}

export async function listAboutSteps(): Promise<AboutStep[]> {
  const rows = (await listNodes(ABOUT)).map((f) => ({
    title: g(f, "title"), body: g(f, "body"), sort: Number(g(f, "sort")) || 0,
  }));
  return rows.sort((a, b) => a.sort - b.sort).map(({ title, body }) => ({ title, body }));
}

export async function seedAboutSteps(items: AboutStep[]) {
  await ensureAboutStepDefinition();
  for (let i = 0; i < items.length; i++) {
    await upsert(ABOUT, `about-${i + 1}`, [
      { key: "title", value: items[i].title },
      { key: "body", value: items[i].body },
      { key: "sort", value: String(i) },
    ]);
  }
}

/* ----------------------------- membership_perk ---------------------------- */
const PERK = "membership_perk";

export async function ensureMembershipPerkDefinition() {
  await ensureDefinition(PERK, "Membership perk", [
    { key: "month", name: "Month", type: "number_integer" },
    { key: "multiplier", name: "Loyalty multiplier", type: "single_line_text_field" },
    { key: "sort", name: "Sort order", type: "number_integer" },
  ]);
}

export async function listMembershipPerks(): Promise<MembershipPerk[]> {
  const rows = (await listNodes(PERK)).map((f) => ({
    month: Number(g(f, "month")) || 0, multiplier: g(f, "multiplier"), sort: Number(g(f, "sort")) || 0,
  }));
  return rows.sort((a, b) => a.sort - b.sort).map(({ month, multiplier }) => ({ month, multiplier }));
}

export async function seedMembershipPerks(items: MembershipPerk[]) {
  await ensureMembershipPerkDefinition();
  for (let i = 0; i < items.length; i++) {
    await upsert(PERK, `perk-${i + 1}`, [
      { key: "month", value: String(items[i].month) },
      { key: "multiplier", value: items[i].multiplier },
      { key: "sort", value: String(i) },
    ]);
  }
}

/* ============================================================================
 * Generic, schema-driven CRUD so the GM admin can edit every repeatable list
 * (FAQ, Rules, Legal, About steps, Loyalty ladder) without touching Shopify.
 * The UI + API are fully driven by LIST_SCHEMAS. Saving replaces the whole list:
 * upsert each row by a stable handle, then delete any entries no longer present.
 * ========================================================================== */
export type ListKind = "faq" | "rules" | "legal" | "about" | "perks";
export type ListFieldType = "text" | "textarea" | "number";
export type ListField = { key: string; label: string; type: ListFieldType };
export type ListRow = Record<string, string>;

export const LIST_SCHEMAS: Record<ListKind, { title: string; blurb: string; itemName: string; fields: ListField[] }> = {
  faq: {
    title: "FAQ", blurb: "Questions & answers on the FAQ page.", itemName: "question",
    fields: [{ key: "question", label: "Question", type: "textarea" }, { key: "answer", label: "Answer", type: "textarea" }],
  },
  rules: {
    title: "Official Rules", blurb: "Sections of the Official Rules page.", itemName: "section",
    fields: [{ key: "title", label: "Title", type: "text" }, { key: "body", label: "Body", type: "textarea" }],
  },
  legal: {
    title: "Legal documents", blurb: "Standalone /legal/[slug] pages.", itemName: "document",
    fields: [{ key: "slug", label: "Slug (URL)", type: "text" }, { key: "title", label: "Title", type: "text" }, { key: "body", label: "Body", type: "textarea" }],
  },
  about: {
    title: "How the draw works", blurb: "The process steps on the About page.", itemName: "step",
    fields: [{ key: "title", label: "Title", type: "text" }, { key: "body", label: "Body", type: "textarea" }],
  },
  perks: {
    title: "Loyalty ladder", blurb: "Monthly loyalty multipliers on the Membership page.", itemName: "tier",
    fields: [{ key: "month", label: "Month", type: "number" }, { key: "multiplier", label: "Multiplier (e.g. 1.25)", type: "text" }],
  },
};

const KIND_TYPE: Record<ListKind, string> = { faq: "faq_item", rules: RULE, legal: LEGAL, about: ABOUT, perks: PERK };
const KIND_ENSURE: Record<ListKind, () => Promise<void>> = {
  faq: ensureFaqDefinition, rules: ensureRuleDefinition, legal: ensureLegalDefinition, about: ensureAboutStepDefinition, perks: ensureMembershipPerkDefinition,
};
const handleFor = (kind: ListKind, row: ListRow, i: number) =>
  kind === "legal" ? `legal-${(row.slug || `doc-${i + 1}`).trim()}` : `${{ faq: "faq", rules: "rule", about: "about", perks: "perk" }[kind]}-${i + 1}`;

/** All entries of a type with id + handle + fields (Admin API — needed for delete/diff). */
async function listNodesAdmin(type: string): Promise<{ id: string; handle: string; fields: Field[] }[]> {
  const r = await shopifyAdmin<{ metaobjects: { nodes: { id: string; handle: string; fields: Field[] }[] } }>(
    `query { metaobjects(type: "${type}", first: 100) { nodes { id handle fields { key value } } } }`,
  ).catch(() => null);
  return r?.metaobjects?.nodes ?? [];
}

async function deleteById(id: string) {
  await shopifyAdmin(`mutation($id: ID!) { metaobjectDelete(id: $id) { deletedId userErrors { message } } }`, { id }).catch(() => {});
}

/** Read a list as generic rows (schema-keyed), sorted by the `sort` field when present. */
export async function getContentList(kind: ListKind): Promise<ListRow[]> {
  const nodes = await listNodesAdmin(KIND_TYPE[kind]);
  const keys = LIST_SCHEMAS[kind].fields.map((f) => f.key);
  return nodes
    .map((n) => {
      const row: ListRow = {};
      for (const k of keys) row[k] = g(n.fields, k);
      return { row, sort: Number(g(n.fields, "sort")) || 0 };
    })
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.row);
}

/** Replace the whole list: upsert each row, then delete entries no longer present. */
export async function saveContentList(kind: ListKind, rows: ListRow[]): Promise<void> {
  await KIND_ENSURE[kind]();
  const type = KIND_TYPE[kind];
  const existing = await listNodesAdmin(type);
  const hasSort = kind !== "legal";
  const handles: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const handle = handleFor(kind, rows[i], i);
    handles.push(handle);
    const fields: Field[] = LIST_SCHEMAS[kind].fields.map((f) => ({ key: f.key, value: String(rows[i][f.key] ?? "") }));
    if (hasSort) fields.push({ key: "sort", value: String(i) });
    await upsert(type, handle, fields);
  }
  for (const e of existing) if (!handles.includes(e.handle)) await deleteById(e.id);
}
