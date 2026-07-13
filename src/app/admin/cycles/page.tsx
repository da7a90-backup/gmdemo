"use client";
import { useEffect, useState } from "react";
import { Save, RotateCcw, Check, Plus, Trash2, HeartHandshake } from "lucide-react";
import {
  getCycleConfig, saveCycleConfig, resetCycleConfig, CYCLE_EVENT, type CycleConfig,
} from "@/lib/cycle-store";
import {
  getPartners, addPartner, removePartner, isCustomPartner,
  PARTNERS_EVENT, type Partner,
} from "@/lib/partners-store";
import { PartnerMark } from "@/components/partner-mark";
import { Label } from "@/components/sticker";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const EMPTY_PARTNER = { name: "", kind: "charity" as Partner["kind"], logoUrl: "", url: "", blurb: "" };

export default function AdminCyclesPage() {
  const [config, setConfig] = useState<CycleConfig | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(EMPTY_PARTNER);

  useEffect(() => {
    const loadConfig = () => setConfig(getCycleConfig());
    const loadPartners = () => setPartners(getPartners());
    loadConfig();
    loadPartners();
    window.addEventListener(CYCLE_EVENT, loadConfig);
    window.addEventListener(PARTNERS_EVENT, loadPartners);
    return () => {
      window.removeEventListener(CYCLE_EVENT, loadConfig);
      window.removeEventListener(PARTNERS_EVENT, loadPartners);
    };
  }, []);

  if (!config) return null;

  const charities = partners.filter((p) => p.kind === "charity");
  const currentPartner = partners.find((p) => p.id === config.charityPartnerId);

  const onSave = () => {
    saveCycleConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const p = addPartner({
      name: form.name.trim(),
      kind: form.kind,
      logoUrl: form.logoUrl.trim() || undefined,
      url: form.url.trim() || undefined,
      blurb: form.blurb.trim() || undefined,
    });
    if (form.kind === "charity") setConfig((c) => ({ ...c!, charityPartnerId: p.id }));
    setForm(EMPTY_PARTNER);
  };

  const input = "mt-1.5 w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Cycle <span className="accent-serif">desk.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Set the current cycle&apos;s draw date, entry cap, and charity partner — countdowns and the
            charity sections across the site pick it up live. Manage the partner registry below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { resetCycleConfig(); setConfig(getCycleConfig()); }}
            className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Saved" : "Save cycle"}
          </button>
        </div>
      </div>

      {/* Current cycle */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">Cycle №{String(config.cycle).padStart(2, "0")} · {config.vehicleLabel}</p>
          {currentPartner && <PartnerMark partner={currentPartner} size="sm" />}
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="dateline on-paper">Cycle number</span>
            <input type="number" min={1} value={config.cycle}
              onChange={(e) => setConfig((c) => ({ ...c!, cycle: Number(e.target.value) || c!.cycle }))}
              className={`${input} numeral`} /></label>
          <label className="block"><span className="dateline on-paper">Vehicle label</span>
            <input type="text" value={config.vehicleLabel}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicleLabel: e.target.value }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Live draw date &amp; time</span>
            <input type="datetime-local" value={toLocalInput(config.drawDateISO)}
              onChange={(e) => e.target.value && setConfig((c) => ({ ...c!, drawDateISO: new Date(e.target.value).toISOString() }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Entry cap</span>
            <input type="number" min={100} step={100} value={config.ticketsCap}
              onChange={(e) => setConfig((c) => ({ ...c!, ticketsCap: Number(e.target.value) || c!.ticketsCap }))}
              className={`${input} numeral`} /></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Charity partner (10% of every cycle)</span>
            <select value={config.charityPartnerId}
              onChange={(e) => setConfig((c) => ({ ...c!, charityPartnerId: e.target.value }))}
              className={input}>
              {charities.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Charity blurb (shown in the charity sections)</span>
            <input type="text" value={config.charityBlurb}
              onChange={(e) => setConfig((c) => ({ ...c!, charityBlurb: e.target.value }))}
              className={input} /></label>
        </div>
        <p className="px-5 pb-4 dateline on-paper">
          Vehicle photos and spec data stay in the giveaway product — in production they live on the Shopify product/metaobject.
        </p>
      </div>

      {/* Partner registry */}
      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">Partner registry · shown on /partners</p>

        <form onSubmit={onAddPartner} className="mt-4 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex items-center gap-2">
            <HeartHandshake size={15} className="text-charity" />
            <p className="font-display font-bold text-ink">Add a partner</p>
          </div>
          <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block"><span className="dateline on-paper">Name</span>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Second Wind Foundation" className={input} /></label>
            <label className="block"><span className="dateline on-paper">Type</span>
              <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Partner["kind"] }))} className={input}>
                <option value="charity">Charity partner</option>
                <option value="sponsor">Brand sponsor</option>
              </select></label>
            <label className="block"><span className="dateline on-paper">Logo URL (optional)</span>
              <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="https://…/logo.svg" className={input} /></label>
            <label className="block"><span className="dateline on-paper">Website (optional)</span>
              <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://example.org" className={input} /></label>
            <label className="block sm:col-span-2"><span className="dateline on-paper">One-line blurb (optional)</span>
              <input value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} placeholder="What they do / which cycle" className={input} /></label>
          </div>
          <div className="px-5 pb-5">
            <button type="submit" className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors">
              <Plus size={13} /> Add partner
            </button>
          </div>
        </form>

        <ul className="mt-4 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {partners.map((p) => (
            <li key={p.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PartnerMark partner={p} size="sm" />
                <Label tone={p.kind === "charity" ? "charity" : "ink"} variant="outline" size="sm">
                  {p.kind}
                </Label>
                {p.id === config.charityPartnerId && (
                  <Label tone="brass" variant="solid" size="sm">Current cycle</Label>
                )}
              </div>
              {isCustomPartner(p.id) && (
                <button
                  type="button"
                  onClick={() => removePartner(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
                >
                  <Trash2 size={11} /> Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
