// POST /api/tptest/run — fire a concurrent batch server-side (true concurrency,
// not limited by the browser's ~6 connections) and return results + fresh audit.
import { NextResponse } from "next/server";
import { runBatch, auditAll, type Mode } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { count?: number; mode?: Mode; min?: number; max?: number; multiplier?: number };
    const mode: Mode = b.mode === "naive" ? "naive" : b.mode === "seq" ? "seq" : "safe";
    const batch = await runBatch({
      count: Number(b.count) || 1,
      mode,
      min: Number(b.min) || 1,
      max: Number(b.max) || Number(b.min) || 1,
      multiplier: Number(b.multiplier) || 1,
    });
    const audit = await auditAll();
    return NextResponse.json({ ok: true, batch, audit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
