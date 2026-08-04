// POST /api/admin/upload — multipart file → Shopify Files → returns the CDN url.
import { ok, fail, requireAdmin, errMsg } from "@/lib/server/http";
import { uploadImageToShopify } from "@/lib/server/shopify-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("file required");
    if (!file.type.startsWith("image/")) return fail("image files only");
    if (file.size > 20 * 1024 * 1024) return fail("max 20MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageToShopify(bytes, file.name || "upload.jpg", file.type);
    return ok({ url });
  } catch (e) { return fail(errMsg(e), 500); }
}
