"use client";
import { useEffect, useState } from "react";
import { Gauge, Save } from "lucide-react";
import { adminGet, adminSend } from "@/lib/admin-api";

type Stats = {
  carsGivenAway: number;
  lifetimePayoutUSD: number;
  totalDonatedUSD: number;
  cyclesRun: number;
  charitiesFunded: number;
  ticketsCounted: number;
};

const ZERO: Stats = {
  carsGivenAway: 0,
  lifetimePayoutUSD: 0,
  totalDonatedUSD: 0,
  cyclesRun: 0,
  charitiesFunded: 0,
  ticketsCounted: 0,
};

// The order + copy of the fields, with where each number actually surfaces so
// Kevin knows what he's changing. Money fields are whole US dollars.
const FIELDS: { key: keyof Stats; label: string; prefix?: string; hint: string }[] = [
  { key: "carsGivenAway", label: "Cars given away", hint: "Homepage counters, /winners, /about, the scrolling marquee." },
  { key: "lifetimePayoutUSD", label: "Lifetime prize value", prefix: "$", hint: "Total retail value of every car awarded. Shows on /winners and /about." },
  { key: "totalDonatedUSD", label: "Total donated to charity", prefix: "$", hint: "The charity band, /winners, /about, and the marquee." },
  { key: "charitiesFunded", label: "Charities funded", hint: "/winners KPI band." },
  { key: "cyclesRun", label: "Cycles run", hint: "Lifetime count of completed draws." },
  { key: "ticketsCounted", label: "Tickets counted (lifetime)", hint: "Total entries across every cycle." },
];

export default function AdminStatsPage() {
  const [form, setForm] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGet<Partial<Stats> | null>("/api/admin/stats")
      .then((d) => setForm({ ...ZERO, ...(d ?? {}) }))
      .catch((e) => { setErr(String(e.message)); setForm(ZERO); });
  }, []);

  if (!form) return null;

  const set = (k: keyof Stats) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f!, [k]: Math.max(0, Math.round(Number(e.target.value) || 0)) }));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      await adminSend<Stats>("/api/admin/stats", "PUT", form);
      setSaved(true);
    } catch (e) { setErr(String((e as Error).message)); }
    finally { setSaving(false); }
  };

  const input = "w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent numeral tabular-nums";

  return (
    <main>
      <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
        Lifetime <span className="accent-serif">stats.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
        The headline totals shown across the site. Enter only <em>real</em> figures — these are
        public claims for a 501(c)(3), so leave them at zero until they&rsquo;ve actually happened.
      </p>

      <form onSubmit={onSave} className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex items-center gap-2">
          <Gauge size={15} className="text-brass-deep" />
          <p className="font-display font-bold text-ink">Public totals</p>
        </div>
        <div className="p-5 grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="dateline on-paper">{f.label}</span>
              <div className="mt-1.5 relative">
                {f.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-[15px] pointer-events-none">{f.prefix}</span>
                )}
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form[f.key]}
                  onChange={set(f.key)}
                  className={`${input} ${f.prefix ? "pl-7" : ""}`}
                />
              </div>
              <span className="mt-1.5 block text-[12px] text-ink-3 font-serif italic leading-snug">{f.hint}</span>
            </label>
          ))}
        </div>
        <div className="px-5 pb-5 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-50"
          >
            <Save size={13} /> {saving ? "Saving…" : "Save totals"}
          </button>
          {saved && <span className="text-[13px] text-charity font-condensed">✓ Saved — live on the site.</span>}
        </div>
      </form>

      {err && <p className="mt-4 text-[13px] text-red-600 font-condensed">⚠ {err}</p>}
    </main>
  );
}
