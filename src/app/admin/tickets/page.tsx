"use client";
import { useEffect, useMemo, useState } from "react";
import { Printer, FileDown } from "lucide-react";
import { buildCycleSheetsPdf, downloadPdf, type AdminTicketBlock } from "@/lib/pdf";
import { adminGet } from "@/lib/admin-api";
import { niceDate, intl } from "@/lib/format";
import { Label } from "@/components/sticker";

type CycleSummary = { code: string; status: string; vehicleLabel: string; drawDateISO: string; tickets: number; orders: number };

export default function AdminTicketsPage() {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [blocks, setBlocks] = useState<AdminTicketBlock[]>([]);
  const [cycle, setCycle] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [building, setBuilding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load cycle list once; default to the open cycle.
  useEffect(() => {
    adminGet<{ cycles: CycleSummary[]; blocks: AdminTicketBlock[] }>("/api/admin/ticket-sheets")
      .then((d) => {
        setCycles(d.cycles);
        const open = d.cycles.find((c) => c.status === "open") ?? d.cycles[0];
        if (open) setCycle(open.code);
      })
      .catch((e) => setErr(String(e.message)));
  }, []);

  // Load blocks whenever cycle / range changes.
  useEffect(() => {
    if (!cycle) return;
    const q = new URLSearchParams({ cycle });
    if (from) q.set("from", `${from}T00:00:00`);
    if (to) q.set("to", `${to}T23:59:59`);
    adminGet<{ cycles: CycleSummary[]; blocks: AdminTicketBlock[] }>(`/api/admin/ticket-sheets?${q}`)
      .then((d) => { setCycles(d.cycles); setBlocks(d.blocks); })
      .catch((e) => setErr(String(e.message)));
  }, [cycle, from, to]);

  const orders = useMemo(() => {
    const m = new Map<string, { orderToken: string; fullName: string; phone: string; tickets: number; first: string; last: string }>();
    for (const b of blocks) {
      const cyc = String(b.drawCycle).padStart(2, "0");
      const g = m.get(b.orderToken) ?? { orderToken: b.orderToken, fullName: b.fullName, phone: b.phone, tickets: 0, first: "", last: "" };
      const first = `GM${cyc}-${b.orderToken}-${String(b.seqStart).padStart(4, "0")}`;
      const last = `GM${cyc}-${b.orderToken}-${String(b.seqEnd).padStart(4, "0")}`;
      if (!g.first) g.first = first;
      g.last = last;
      g.tickets += b.seqEnd - b.seqStart + 1;
      m.set(b.orderToken, g);
    }
    return [...m.values()];
  }, [blocks]);

  const ticketTotal = blocks.reduce((n, b) => n + (b.seqEnd - b.seqStart + 1), 0);
  const sel = cycles.find((c) => c.code === cycle);

  const onPrint = async () => {
    setBuilding(true);
    setErr(null);
    try {
      const rangeLabel = from || to
        ? `${from ? niceDate(`${from}T12:00:00`) : "start"} – ${to ? niceDate(`${to}T12:00:00`) : "today"}`
        : "all dates";
      const bytes = await buildCycleSheetsPdf({
        cycleLabel: `Cycle ${String(Number(cycle)).padStart(2, "0")} · ${sel?.vehicleLabel ?? ""}`,
        drawDateLabel: sel?.drawDateISO ? niceDate(sel.drawDateISO) : "TBD",
        rangeLabel,
        blocks,
      });
      downloadPdf(bytes, `gm-cycle-${String(Number(cycle)).padStart(2, "0")}-ticket-sheets.pdf`);
    } catch (e) {
      setErr(String((e as Error).message));
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
        carrying the GM mark, the holder&apos;s name and phone, and the <strong>real ticket number</strong>
        {" "}straight from the entries in the database. Filter by cycle and purchase date range.
      </p>
      {err && <p className="mt-4 text-[13px] text-red-600 font-condensed">⚠ {err}</p>}

      {/* Filters */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft p-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="dateline on-paper">Cycle</span>
          <select value={cycle} onChange={(e) => setCycle(e.target.value)} className={input}>
            {cycles.map((c) => (
              <option key={c.code} value={c.code}>
                Cycle {String(Number(c.code)).padStart(2, "0")} — {c.vehicleLabel || "…"} ({c.tickets} tix){c.status === "open" ? " · open" : ""}
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

      {/* Matching orders */}
      <div className="mt-5 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">
            {orders.length} order{orders.length === 1 ? "" : "s"} · {intl(ticketTotal)} tickets · {Math.ceil(ticketTotal / 15) || 0} A3 sheet{ticketTotal > 15 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={onPrint}
            disabled={building || ticketTotal === 0}
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
                <th className="px-4 py-2.5 font-semibold">Holder</th>
                <th className="px-4 py-2.5 font-semibold">Phone</th>
                <th className="px-4 py-2.5 font-semibold">Ticket range</th>
                <th className="px-4 py-2.5 font-semibold text-right">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {orders.map((o) => (
                <tr key={o.orderToken}>
                  <td className="px-5 py-3 numeral text-[13px]">{o.orderToken}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{o.fullName}</td>
                  <td className="px-4 py-3 numeral text-[13px]">{o.phone || "—"}</td>
                  <td className="px-4 py-3 numeral text-[12px] text-ink-2">{o.first}{o.tickets > 1 ? ` … ${o.last}` : ""}</td>
                  <td className="px-4 py-3 text-right numeral font-bold">{o.tickets}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-3 font-serif italic">
                    No entries for this cycle and date range.
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
