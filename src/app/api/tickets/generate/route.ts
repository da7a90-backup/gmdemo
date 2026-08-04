// POST /api/tickets/generate — mint raffle tickets from a (mocked) Shopify
// orders/paid webhook, idempotently and collision-free. Logic in @/lib/server/ticketing.
//   ?mode=safe (default) | seq (recommended, lock-free) | naive (demonstrates failure)
import { NextResponse } from "next/server";
import { mintOne, type Body, type Mode } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const m = new URL(req.url).searchParams.get("mode");
  const mode: Mode = m === "naive" ? "naive" : m === "seq" ? "seq" : "safe";

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  if (!body?.webhookId || !body?.order?.id) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const r = await mintOne(body, mode);
  // Non-2xx on failure → in production Shopify re-delivers the webhook, so the
  // order is never lost; the reconciliation cron is the final net.
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}
