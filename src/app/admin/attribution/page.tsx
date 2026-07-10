"use client";
import { useEffect, useMemo, useState } from "react";
import { Trash2, MousePointerClick, ShoppingCart } from "lucide-react";
import { getEvents, clearEvents, ANALYTICS_EVENT, type TrackedEvent } from "@/lib/analytics";
import { usd } from "@/lib/format";
import { Label } from "@/components/sticker";

const CHANNEL_ORDER = ["member", "sms", "email", "ads", "organic"];

export default function AdminAttributionPage() {
  const [events, setEvents] = useState<TrackedEvent[] | null>(null);

  useEffect(() => {
    const load = () => setEvents(getEvents());
    load();
    window.addEventListener(ANALYTICS_EVENT, load);
    return () => window.removeEventListener(ANALYTICS_EVENT, load);
  }, []);

  const rows = useMemo(() => {
    if (!events) return [];
    const bySource = new Map<string, { channel: string; visits: number; purchases: number; revenue: number; triggers: Set<string> }>();
    for (const e of events) {
      const r = bySource.get(e.source) ?? { channel: e.channel, visits: 0, purchases: 0, revenue: 0, triggers: new Set<string>() };
      if (e.type === "visit") r.visits++;
      else {
        r.purchases++;
        r.revenue += e.amountUSD ?? 0;
      }
      if (e.trigger) r.triggers.add(e.trigger);
      bySource.set(e.source, r);
    }
    return [...bySource.entries()].sort(
      (a, b) => CHANNEL_ORDER.indexOf(a[0]) - CHANNEL_ORDER.indexOf(b[0]),
    );
  }, [events]);

  if (!events) return null;

  const totals = rows.reduce(
    (t, [, r]) => ({ visits: t.visits + r.visits, purchases: t.purchases + r.purchases, revenue: t.revenue + r.revenue }),
    { visits: 0, purchases: 0, revenue: 0 },
  );

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Attribution <span className="accent-serif">desk.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Who came from where, and who bought. Every tickets-page landing is tagged with its channel —
            promo code, UTM campaign, member login, or organic — and every buy click carries the same tag.
          </p>
        </div>
        <button
          type="button"
          onClick={clearEvents}
          className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
        >
          <Trash2 size={13} /> Clear log
        </button>
      </div>

      {/* Totals */}
      <div className="mt-7 grid grid-cols-3 gap-3">
        <Stat label="Visits" value={String(totals.visits)} />
        <Stat label="Purchases" value={String(totals.purchases)} />
        <Stat label="Revenue" value={usd(totals.revenue)} />
      </div>

      {/* Per-channel table */}
      <div className="mt-5 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-ink text-paper-3 font-condensed uppercase tracking-[0.18em] text-[10px]">
                <th className="px-5 py-2.5 font-semibold">Channel</th>
                <th className="px-4 py-2.5 font-semibold">Triggers seen</th>
                <th className="px-4 py-2.5 font-semibold text-right">Visits</th>
                <th className="px-4 py-2.5 font-semibold text-right">Purchases</th>
                <th className="px-4 py-2.5 font-semibold text-right">Conversion</th>
                <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {rows.map(([source, r]) => (
                <tr key={source}>
                  <td className="px-5 py-3 font-semibold text-ink">{r.channel}</td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {[...r.triggers].slice(0, 3).map((t) => (
                        <span key={t} className="numeral text-[11px] border border-ink/10 bg-paper-3 px-2 py-0.5 rounded-md">{t}</span>
                      ))}
                      {r.triggers.size === 0 && <span className="text-ink-3">—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right numeral">{r.visits}</td>
                  <td className="px-4 py-3 text-right numeral font-bold">{r.purchases}</td>
                  <td className="px-4 py-3 text-right numeral">
                    {r.visits > 0 ? `${Math.round((r.purchases / r.visits) * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right numeral font-bold">{usd(r.revenue)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-3 font-serif italic">
                    No traffic logged yet — open /tickets with a promo link or UTM parameter and it lands here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event feed */}
      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">Recent activity</p>
        <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {events.slice(0, 25).map((e) => (
            <li key={e.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${e.type === "purchase" ? "bg-brass text-ink" : "bg-paper-3 border border-ink/10 text-ink-2"}`}>
                  {e.type === "purchase" ? <ShoppingCart size={13} /> : <MousePointerClick size={13} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] text-ink truncate">
                    <strong>{e.channel}</strong>
                    {e.type === "purchase"
                      ? <> bought <strong>{e.item}</strong>{e.amountUSD ? ` · ${usd(e.amountUSD)}` : ""}</>
                      : <> landed on {e.page}</>}
                    {e.trigger && <span className="text-ink-3"> · via {e.trigger}</span>}
                  </p>
                  <p className="dateline on-paper mt-0.5">
                    {new Date(e.ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <Label tone={e.type === "purchase" ? "brass" : "ink"} variant="outline" size="sm">
                {e.type}
              </Label>
            </li>
          ))}
          {events.length === 0 && (
            <li className="px-5 py-8 text-center text-ink-3 font-serif italic">Nothing yet.</li>
          )}
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
