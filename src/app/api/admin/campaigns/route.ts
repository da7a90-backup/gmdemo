// GET    /api/admin/campaigns?channel=email|sms  — list campaigns
// POST   /api/admin/campaigns                     — create a draft, and send if send=true;
//                                                    or send an existing draft with { id, send:true }
// DELETE /api/admin/campaigns?id=123              — delete (also removes the Klaviyo draft)
import { ok, fail, readJson, requireAdmin, errMsg } from "@/lib/server/http";
import { listCampaigns, saveCampaign, sendCampaign, deleteCampaignEverywhere } from "@/lib/server/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const baseUrl = (req: Request) => process.env.PUBLIC_BASE_URL || new URL(req.url).origin;

export async function GET(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const channel = new URL(req.url).searchParams.get("channel") === "sms" ? "sms" : "email";
  try { return ok(await listCampaigns(channel)); } catch (e) { return fail(errMsg(e), 500); }
}

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{
    id?: number; channel?: "email" | "sms"; audience?: "newsletter" | "members"; subject?: string; body?: string; promoCode?: string; send?: boolean;
  }>(req);
  try {
    // Send an existing draft.
    if (b?.id) return ok(await sendCampaign(b.id, baseUrl(req)));
    // Create a new draft (+ send now if requested).
    if (!b?.channel || typeof b.body !== "string" || !b.body.trim()) return fail("channel and body required");
    if (b.channel === "email" && !b.subject?.trim()) return fail("subject required for email");
    const c = await saveCampaign({ channel: b.channel, audience: b.audience, subject: b.subject, body: b.body, promoCode: b.promoCode });
    if (b.send) return ok(await sendCampaign(c.id, baseUrl(req)));
    return ok(c);
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}

export async function DELETE(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id required");
  try { await deleteCampaignEverywhere(id); return ok({ deleted: id }); } catch (e) { return fail(errMsg(e), 500); }
}
