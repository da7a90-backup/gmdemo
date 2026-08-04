// GET /api/tptest/audit — current DB state: orders + duplicate/count checks.
import { NextResponse } from "next/server";
import { auditAll } from "@/lib/server/ticketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const audit = await auditAll();
    return NextResponse.json({ ok: true, audit });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
}
