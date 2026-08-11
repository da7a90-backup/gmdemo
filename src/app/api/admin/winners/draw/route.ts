// POST /api/admin/winners/draw { cycleCode? } — run a real weighted random draw from a
// cycle's entries, record the winner, and fire the "Won Drawing" email. Defaults to the
// open cycle. See editorial.drawWinner.
import { ok, fail, requireAdmin, errMsg, readJson } from "@/lib/server/http";
import { drawWinner, createWinner } from "@/lib/server/editorial";
import { emitEmailEvent } from "@/lib/server/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const g = requireAdmin(req); if (g) return g;
  const b = await readJson<{ cycleCode?: string }>(req);
  try {
    const d = await drawWinner(b?.cycleCode);
    if (!d) return fail("No entries to draw from in that cycle.", 400);

    const parts = d.fullName.trim().split(/\s+/);
    const firstName = parts[0] || "Winner";
    const lastInitial = parts.length > 1 ? (parts[parts.length - 1][0] || "").toUpperCase() : "";

    const w = await createWinner({
      firstName, lastInitial, city: "", state: "", vehicle: d.prize,
      drawCycle: Number(d.cycleCode) || 0, charity: "", quote: "",
      drawDateISO: new Date().toISOString(), photo: "", videoClipUrl: undefined,
    });

    if (d.email) {
      await emitEmailEvent("Won Drawing", "won_drawing", d.email, {
        prize: d.prize, cycle: d.cycleCode, charity: "", winner_name: `${firstName} ${lastInitial}`.trim(),
      }).catch(() => {});
    }
    return ok({ winner: w, ticket: d.ticket, email: d.email });
  } catch (e) {
    return fail(errMsg(e), 500);
  }
}
