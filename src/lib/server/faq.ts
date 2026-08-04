// FAQ items as repeatable Shopify Metaobjects (type "faq_item").
import { shopifyAdmin, shopifyStorefront } from "./shopify";
import type { FaqItem } from "@/lib/faq-data";

const TYPE = "faq_item";
type Field = { key: string; value: string | null };
const g = (fs: Field[], k: string) => fs.find((x) => x.key === k)?.value ?? "";
export type Faq = { id: string; question: string; answer: string; sort: number };

export async function ensureFaqDefinition() {
  await shopifyAdmin(
    `mutation($def: MetaobjectDefinitionCreateInput!) {
       metaobjectDefinitionCreate(definition: $def) { metaobjectDefinition { id } userErrors { message } }
     }`,
    {
      def: {
        type: TYPE, name: "FAQ item", displayNameKey: "question",
        access: { storefront: "PUBLIC_READ" }, capabilities: { publishable: { enabled: true } },
        fieldDefinitions: [
          { key: "question", name: "Question", type: "multi_line_text_field" },
          { key: "answer", name: "Answer", type: "multi_line_text_field" },
          { key: "sort", name: "Sort order", type: "number_integer" },
        ],
      },
    },
  ).catch(() => {});
}

export async function listFaq(): Promise<Faq[]> {
  const r = await shopifyStorefront<{ metaobjects: { nodes: { id: string; fields: Field[] }[] } }>(
    `query { metaobjects(type: "${TYPE}", first: 100) { nodes { id fields { key value } } } }`,
  ).catch(() => null);
  const list = (r?.metaobjects?.nodes ?? []).map((n) => ({
    id: n.id, question: g(n.fields, "question"), answer: g(n.fields, "answer"), sort: Number(g(n.fields, "sort")) || 0,
  }));
  return list.sort((a, b) => a.sort - b.sort);
}

export async function seedFaq(items: FaqItem[]) {
  await ensureFaqDefinition();
  for (let i = 0; i < items.length; i++) {
    await shopifyAdmin(
      `mutation($h: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) {
         metaobjectUpsert(handle: $h, metaobject: $m) { metaobject { id } userErrors { message } }
       }`,
      {
        h: { type: TYPE, handle: `faq-${i + 1}` },
        m: {
          capabilities: { publishable: { status: "ACTIVE" } },
          fields: [
            { key: "question", value: items[i].question },
            { key: "answer", value: items[i].answer },
            { key: "sort", value: String(i) },
          ],
        },
      },
    ).catch(() => {});
  }
}
