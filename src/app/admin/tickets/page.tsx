"use client";
import { useMemo, useState } from "react";
import { Printer, FileDown } from "lucide-react";
import { purchases, draws, activeDraw } from "@/lib/mock-data";
import { buildCycleSheetsPdf, downloadPdf } from "@/lib/pdf";
import { niceDate, intl } from "@/lib/format";
import { Label } from "@/components/sticker";

const CYCLE_META: Record<number, { vehicle: string; drawDateISO: string }> = {
  12: { vehicle: `${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`, drawDateISO: activeDraw.drawDateISO },
  11: { vehicle: "1969 Mustang Fastback", drawDateISO: "2026-05-31T19:00:00-04:00" },
  10: { vehicle: "2023 Corvette Stingray", drawDateISO: "2026-04-19T19:00:00-04:00" },
};

export default function AdminTicketsPage() {
  const cycles = useMemo(
    () => [...new Set(purchases.map((p) => p.drawCycle))].sort((a, b) => b - a),
    [],
  );
  const [cycle, setCycle] = useState<number>(activeDraw.cycle);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [building, setBuilding] = useState(false);

  const filtered = useMemo(() => {
    const fromT = from ? new Date(`${from}T00:00:00`) : null;
    const toT = to ? new Date(`${to}T23:59:59`) : null;
    return purchases
      .filter((p) => p.drawCycle === cycle)
      .filter((p) => {
        const t = new Date(p.purchasedAtISO);
        if (fromT && t < fromT) return false;
        if (toT && t > toT) return false;
        return true;
      })
      .sort((a, b) => a.purchasedAtISO.localeCompare(b.purchasedAtISO));
  }, [cycle, from, to]);

  const ticketTotal = filtered.reduce((n, p) => n + p.ticketCount, 0);
  const meta = CYCLE_META[cycle] ?? { vehicle: `Cycle ${cycle}`, drawDateISO: draws[0].drawDateISO };

  const onPrint = async () => {
    setBuilding(true);
    try {
      const rangeLabel =
        from || to
          ? `${from ? niceDate(`${from}T12:00:00`) : "start"} – ${to ? niceDate(`${to}T12:00:00`) : "today"}`
          : "all dates";
      const bytes = await buildCycleSheetsPdf({
        cycleLabel: `Cycle ${String(cycle).padStart(2, "0")} · ${meta.vehicle}`,
        drawDateLabel: niceDate(meta.drawDateISO),
        rangeLabel,
        purchases: filtered,
      });
      downloadPdf(bytes, `gm-cycle-${String(cycle).padStart(2, "0")}-ticket-sheets.pdf`);
    } finally {
      setBuilding(false);
    }
  };

  const input = "mt-1.5 w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <main>
      <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
        Print <span className="accent-serif">tickets.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
        Generates the physical barrel tickets as an A3 sheet PDF — black &amp; white, 15 per sheet, each
        carrying the GM mark, the purchaser&apos;s name and phone number, and the ticket number. Filter by
        cycle and purchase date range, including past cycles.
      </p>

      {/* Filters */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft p-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="dateline on-paper">Cycle</span>
          <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))} className={input}>
            {cycles.map((c) => (
              <option key={c} value={c}>
                Cycle {String(c).padStart(2, "0")} — {CYCLE_META[c]?.vehicle ?? "…"}{c === activeDraw.cycle ? " (current)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="dateline on-paper">Purchased from</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="dateline on-paper">Purchased to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </label>
      </div>

      {/* Matching purchases */}
      <div className="mt-5 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">
            {filtered.length} order{filtered.length === 1 ? "" : "s"} · {intl(ticketTotal)} tickets · {Math.ceil(ticketTotal / 15) || 0} A3 sheet{ticketTotal > 15 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={onPrint}
            disabled={building || filtered.length === 0}
            className="inline-flex items-center gap-2 bg-ink text-brass px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-40"
          >
            {building ? <FileDown size={13} className="animate-pulse" /> : <Printer size={13} />}
            {building ? "Building PDF…" : "Generate A3 PDF"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-ink text-paper-3 font-condensed uppercase tracking-[0.18em] text-[10px]">
                <th className="px-5 py-2.5 font-semibold">Order</th>
                <th className="px-4 py-2.5 font-semibold">Purchaser</th>
                <th className="px-4 py-2.5 font-semibold">Phone</th>
                <th className="px-4 py-2.5 font-semibold">Purchased</th>
                <th className="px-4 py-2.5 font-semibold text-right">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filtered.map((p) => (
                <tr key={p.orderId}>
                  <td className="px-5 py-3 numeral text-[13px]">{p.orderId}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{p.fullName}</td>
                  <td className="px-4 py-3 numeral text-[13px]">{p.phone}</td>
                  <td className="px-4 py-3 text-ink-2">{niceDate(p.purchasedAtISO)}</td>
                  <td className="px-4 py-3 text-right numeral font-bold">{p.ticketCount}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-3 font-serif italic">
                    No purchases match this cycle and date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 dateline on-paper">
        <Label tone="ink" variant="outline" size="sm">Tip</Label>{" "}
        Print at 100% scale on A3 — each sheet cuts into 15 tickets along the borders.
      </p>
    </main>
  );
}
