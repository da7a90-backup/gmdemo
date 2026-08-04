// POST /api/tptest/reset — wipe + reseed the ticketing schema (one open cycle).
import { NextResponse } from "next/server";
import { resetDb, auditAll } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const r = await resetDb();
    const audit = await auditAll();
    return NextResponse.json({ ...r, audit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
