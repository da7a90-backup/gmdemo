// Blog articles as Shopify Metaobjects (type "article"). Handle = slug.
// Admin writes via the Admin API; the public reads via the Storefront API
// (which only returns ACTIVE = published entries). Same Article shape as before.
import { shopifyAdmin, shopifyStorefront } from "./shopify";

const TYPE = "article";
export type Article = {
  id: string; slug: string; title: string; author: string; tag: string; excerpt: string;
  body: string; format: "markdown" | "html"; published: boolean; dateISO: string;
  seo: { title?: string; description?: string; ogImage?: string };
};
type Field = { key: string; value: string | null };
const g = (fields: Field[], k: string) => fields.find((x) => x.key === k)?.value ?? "";

const FIELD_DEFS = [
  { key: "title", name: "Title", type: "single_line_text_field" },
  { key: "author", name: "Author", type: "single_line_text_field" },
  { key: "tag", name: "Section", type: "single_line_text_field" },
  { key: "excerpt", name: "Excerpt", type: "multi_line_text_field" },
  { key: "body", name: "Body (markdown or HTML)", type: "multi_line_text_field" },
  { key: "format", name: "Format", type: "single_line_text_field" },
  { key: "published", name: "Published", type: "boolean" },
  { key: "date", name: "Publish date (ISO)", type: "single_line_text_field" },
  { key: "seo_title", name: "SEO title", type: "single_line_text_field" },
  { key: "seo_description", name: "SEO description", type: "multi_line_text_field" },
  { key: "og_image", name: "OG image URL", type: "single_line_text_field" },
];

export async function ensureArticleDefinition() {
  await shopifyAdmin(
    `mutation($def: MetaobjectDefinitionCreateInput!) {
       metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id } userErrors { message } }
     }`,
    {
      def: {
        type: TYPE, name: "Article",
        displayNameKey: "title",
        access: { storefront: "PUBLIC_READ" },
        capabilities: { publishable: { enabled: true } },
        fieldDefinitions: FIELD_DEFS.map((f) => ({ key: f.key, name: f.name, type: f.type })),
      },
    },
  ).catch(() => {}); // ignore "already exists"
}

function toArticle(node: { id: string; handle: string; fields: Field[] }): Article {
  return {
    id: node.id, slug: node.handle,
    title: g(node.fields, "title"), author: g(node.fields, "author"), tag: g(node.fields, "tag"),
    excerpt: g(node.fields, "excerpt"), body: g(node.fields, "body"),
    format: (g(node.fields, "format") as "markdown" | "html") || "markdown",
    published: g(node.fields, "published") === "true",
    dateISO: g(node.fields, "date") || new Date().toISOString(),
    seo: {
      title: g(node.fields, "seo_title") || undefined,
      description: g(node.fields, "seo_description") || undefined,
      ogImage: g(node.fields, "og_image") || undefined,
    },
  };
}

export async function listArticles(opts?: { publishedOnly?: boolean }): Promise<Article[]> {
  const query = `query { metaobjects(type: "${TYPE}", first: 100) { nodes { id handle fields { key value } } } }`;
  const res = opts?.publishedOnly
    ? await shopifyStorefront<{ metaobjects: { nodes: { id: string; handle: string; fields: Field[] }[] } }>(query).catch(() => null)
    : await shopifyAdmin<{ metaobjects: { nodes: { id: string; handle: string; fields: Field[] }[] } }>(query).catch(() => null);
  const list = (res?.metaobjects?.nodes ?? []).map(toArticle);
  return list.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const res = await shopifyStorefront<{ metaobject: { id: string; handle: string; fields: Field[] } | null }>(
    `query($h: MetaobjectHandleInput!) { metaobject(handle: $h) { id handle fields { key value } } }`,
    { h: { type: TYPE, handle: slug } },
  ).catch(() => null);
  return res?.metaobject ? toArticle(res.metaobject) : null;
}

export async function upsertArticle(a: Omit<Article, "id"> & { id?: string }): Promise<Article> {
  await ensureArticleDefinition();
  const res = await shopifyAdmin<{ metaobjectUpsert: { metaobject: { id: string; handle: string; fields: Field[] } | null; userErrors: { message: string }[] } }>(
    `mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) {
       metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id handle fields { key value } } userErrors { field message } }
     }`,
    {
      h: { type: TYPE, handle: a.slug },
      m: {
        capabilities: { publishable: { status: a.published ? "ACTIVE" : "DRAFT" } },
        fields: [
          { key: "title", value: a.title }, { key: "author", value: a.author || "" }, { key: "tag", value: a.tag || "" },
          { key: "excerpt", value: a.excerpt || "" }, { key: "body", value: a.body || "" }, { key: "format", value: a.format },
          { key: "published", value: String(!!a.published) }, { key: "date", value: a.dateISO || new Date().toISOString() },
          { key: "seo_title", value: a.seo?.title || "" }, { key: "seo_description", value: a.seo?.description || "" }, { key: "og_image", value: a.seo?.ogImage || "" },
        ],
      },
    },
  );
  if (res.metaobjectUpsert.userErrors?.length) throw new Error("article upsert: " + JSON.stringify(res.metaobjectUpsert.userErrors));
  return toArticle(res.metaobjectUpsert.metaobject!);
}

export async function deleteArticle(id: string) {
  await shopifyAdmin(`mutation($id: ID!) { metaobjectDelete(id: $id) { deletedId userErrors { message } } }`, { id });
}
