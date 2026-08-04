// Upload an image to Shopify Files (staged upload → fileCreate → poll for the
// CDN url). The admin uploads a file to our endpoint; we push it to Shopify and
// return the permanent cdn.shopify.com URL, which is stored on the record.
import { shopifyAdmin } from "./shopify";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

type StagedTarget = { url: string; resourceUrl: string; parameters: { name: string; value: string }[] };

export async function uploadImageToShopify(bytes: Buffer, filename: string, mimeType: string): Promise<string> {
  if (!DOMAIN) throw new Error("Shopify not configured");

  // 1) ask Shopify for a staged upload target
  const staged = await shopifyAdmin<{ stagedUploadsCreate: { stagedTargets: StagedTarget[]; userErrors: { message: string }[] } }>(
    `mutation($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    { input: [{ filename, mimeType, resource: "IMAGE", httpMethod: "POST" }] },
  );
  if (staged.stagedUploadsCreate.userErrors?.length) throw new Error("staged: " + JSON.stringify(staged.stagedUploadsCreate.userErrors));
  const target = staged.stagedUploadsCreate.stagedTargets[0];

  // 2) POST the bytes to the staged target (form-data: params first, then file)
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`staged upload POST failed: ${up.status} ${await up.text().catch(() => "")}`);

  // 3) register the file in Shopify Files
  const fc = await shopifyAdmin<{ fileCreate: { files: { id: string }[]; userErrors: { message: string }[] } }>(
    `mutation($files: [FileCreateInput!]!) {
       fileCreate(files: $files) { files { id } userErrors { field message } }
     }`,
    { files: [{ originalSource: target.resourceUrl, contentType: "IMAGE" }] },
  );
  if (fc.fileCreate.userErrors?.length) throw new Error("fileCreate: " + JSON.stringify(fc.fileCreate.userErrors));
  const fileId = fc.fileCreate.files[0].id;

  // 4) poll until the CDN url is ready (image processing is async)
  for (let i = 0; i < 12; i++) {
    const q = await shopifyAdmin<{ node: { fileStatus?: string; image?: { url: string } } | null }>(
      `query($id: ID!) { node(id: $id) { ... on MediaImage { fileStatus image { url } } } }`,
      { id: fileId },
    );
    const url = q.node?.image?.url;
    if (url) return url;
    if (q.node?.fileStatus === "FAILED") throw new Error("Shopify file processing failed");
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Shopify file URL not ready after upload");
}
