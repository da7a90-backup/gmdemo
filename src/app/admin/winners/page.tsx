"use client";
import { useEffect, useState } from "react";
import { Trophy, Trash2, Plus } from "lucide-react";
import { type Winner } from "@/lib/mock-data";
import { adminGet, adminSend } from "@/lib/admin-api";
import { niceDate } from "@/lib/format";

const EMPTY = {
  firstName: "",
  lastInitial: "",
  city: "",
  state: "",
  vehicle: "",
  drawCycle: 12,
  charity: "",
  quote: "",
  drawDateISO: new Date().toISOString().slice(0, 10),
};

export default function AdminWinnersPage() {
  const [list, setList] = useState<Winner[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const load = () => adminGet<Winner[]>("/api/admin/winners").then(setList).catch((e) => setErr(String(e.message)));
  useEffect(() => { load(); }, []);

  if (!list) return null;

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: k === "drawCycle" ? Number(e.target.value) : e.target.value }));

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await adminSend("/api/admin/winners", "POST", {
        firstName: form.firstName.trim(),
        lastInitial: form.lastInitial.trim().replace(/\.$/, "").toUpperCase(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        vehicle: form.vehicle.trim(),
        drawCycle: form.drawCycle,
        charity: form.charity.trim(),
        quote: form.quote.trim(),
        drawDateISO: new Date(`${form.drawDateISO}T19:00:00-04:00`).toISOString(),
      });
      setForm(EMPTY);
      load();
    } catch (e) { setErr(String((e as Error).message)); }
  };

  const remove = async (id: string) => {
    setErr(null);
    try { await adminSend(`/api/admin/winners?id=${id}`, "DELETE"); load(); }
    catch (e) { setErr(String((e as Error).message)); }
  };

  const input = "mt-1.5 w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <main>
      <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
        Winners <span className="accent-serif">wall.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
        Add the newest winner here — they immediately become the featured &ldquo;Latest winner&rdquo; on the
        homepage and tickets page, and join the public archive.
      </p>

      {/* Add form */}
      <form onSubmit={onAdd} className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex items-center gap-2">
          <Trophy size={15} className="text-brass-deep" />
          <p className="font-display font-bold text-ink">Add a winner</p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block"><span className="dateline on-paper">First name</span>
            <input required value={form.firstName} onChange={set("firstName")} placeholder="Jordan" className={input} /></label>
          <label className="block"><span className="dateline on-paper">Last initial</span>
            <input required maxLength={2} value={form.lastInitial} onChange={set("lastInitial")} placeholder="K" className={input} /></label>
          <label className="block"><span className="dateline on-paper">Vehicle won</span>
            <input required value={form.vehicle} onChange={set("vehicle")} placeholder="2024 Corvette Z06" className={input} /></label>
          <label className="block"><span className="dateline on-paper">City</span>
            <input required value={form.city} onChange={set("city")} placeholder="Orlando" className={input} /></label>
          <label className="block"><span className="dateline on-paper">State</span>
            <input required maxLength={2} value={form.state} onChange={set("state")} placeholder="FL" className={input} /></label>
          <label className="block"><span className="dateline on-paper">Cycle №</span>
            <input required type="number" min={1} max={99} value={form.drawCycle} onChange={set("drawCycle")} className={`${input} numeral`} /></label>
          <label className="block"><span className="dateline on-paper">Charity funded</span>
            <input required value={form.charity} onChange={set("charity")} placeholder="Habitat for Humanity" className={input} /></label>
          <label className="block"><span className="dateline on-paper">Draw date</span>
            <input required type="date" value={form.drawDateISO} onChange={set("drawDateISO")} className={input} /></label>
          <label className="block sm:col-span-2 lg:col-span-3"><span className="dateline on-paper">Winner quote</span>
            <textarea required rows={2} value={form.quote} onChange={set("quote")} placeholder="I didn't believe it until the phone rang…"
              className="mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 py-2.5 text-[15px] text-ink outline-none focus:border-accent leading-relaxed" /></label>
        </div>
        <div className="px-5 pb-5">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
          >
            <Plus size={13} /> Publish winner
          </button>
        </div>
      </form>

      {err && <p className="mt-4 text-[13px] text-red-600 font-condensed">⚠ {err}</p>}

      {/* Winners (Supabase) */}
      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">Published winners · {list.length}</p>
        {list.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3 font-serif italic">No winners yet — add one above.</p>
        ) : (
          <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
            {list.map((w) => (
              <li key={w.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-ink leading-tight">
                    {w.firstName} {w.lastInitial}. <span className="font-normal text-ink-2">— {w.vehicle}</span>
                  </p>
                  <p className="dateline on-paper mt-0.5">
                    {w.city}, {w.state} · Cycle №{String(w.drawCycle).padStart(2, "0")} · {w.drawDateISO ? niceDate(w.drawDateISO) : "—"} · → {w.charity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(w.id)}
                  aria-label={`Remove ${w.firstName}`}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
