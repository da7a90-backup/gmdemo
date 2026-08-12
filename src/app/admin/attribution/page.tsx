"use client";
import { useEffect, useState } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { adminGet, adminSend } from "@/lib/admin-api";
import { usd } from "@/lib/format";

type Row = { channel: string; visits: number; purchases: number; revenue: number };
type Recent = { order_token: string; channel: string; rev: number; created_at: string };
type Data = { rows: Row[]; totals: { visits: number; purchases: number; revenue: number }; recent: Recent[] };

export default function AdminAttributionPage() {
  const [data, setData] = useState<Data | null>(null);

  const load = () =>
    adminGet<Data>("/api/admin/attribution")
      .then(setData)
      .catch(() => setData({ rows: [], totals: { visits: 0, purchases: 0, revenue: 0 }, recent: [] }));
  useEffect(() => { load(); }, []);
  if (!data) return null;

  const { rows, totals, recent } = data;
  const clearVisits = async () => {
    if (!confirm("Clear the visit log? Real orders are kept.")) return;
    await adminSend("/api/admin/attribution", "DELETE");
    load();
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Attribution <span className="accent-serif">desk.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Real numbers: <strong>visits</strong> are actual page landings tagged by channel; <strong>purchases</strong> and{" "}
            <strong>revenue</strong> come from <strong>completed orders</strong> only (not button clicks).
          </p>
        </div>
        <button
          type="button"
          onClick={clearVisits}
          className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          <Trash2 size={13} /> Clear visits
        </button>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3">
        <Stat label="Visits" value={String(totals.visits)} />
        <Stat label="Purchases" value={String(totals.purchases)} />
        <Stat label="Revenue" value={usd(totals.revenue)} />
      </div>

      <div className="mt-5 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-ink text-paper-3 font-condensed uppercase tracking-[0.18em] text-[10px]">
                <th className="px-5 py-2.5 font-semibold">Channel</th>
                <th className="px-4 py-2.5 font-semibold text-right">Visits</th>
                <th className="px-4 py-2.5 font-semibold text-right">Purchases</th>
                <th className="px-4 py-2.5 font-semibold text-right">Conversion</th>
                <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map((r) => (
                <tr key={r.channel}>
                  <td className="px-5 py-3 font-semibold text-ink">{r.channel}</td>
                  <td className="px-4 py-3 text-right numeral">{r.visits}</td>
                  <td className="px-4 py-3 text-right numeral font-bold">{r.purchases}</td>
                  <td className="px-4 py-3 text-right numeral">
                    {r.visits > 0 ? `${Math.min(100, Math.round((r.purchases / r.visits) * 100))}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right numeral font-bold">{usd(r.revenue)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-3 font-serif italic">
                    No traffic or orders yet — visits appear as people browse, purchases when orders complete.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">Recent orders</p>
        <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {recent.map((o) => (
            <li key={o.order_token} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0 bg-brass text-ink"><ShoppingCart size={13} /></span>
                <div className="min-w-0">
                  <p className="text-[14px] text-ink truncate">
                    Order <strong className="numeral">#{o.order_token}</strong> · <strong>{o.channel}</strong>
                    {o.rev ? ` · ${usd(o.rev)}` : ""}
                  </p>
                  <p className="dateline on-paper mt-0.5">
                    {o.created_at ? new Date(o.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="px-5 py-8 text-center text-ink-3 font-serif italic">No orders yet.</li>}
        </ul>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/10 bg-ink text-paper rounded-xl px-5 py-4">
      <p className="font-condensed numeral font-bold text-3xl text-brass leading-none">{value}</p>
      <p className="mt-1.5 font-condensed uppercase tracking-[0.22em] text-[10px] text-paper/60">{label}</p>
    </div>
  );
}
