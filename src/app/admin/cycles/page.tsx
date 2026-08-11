"use client";
import { useEffect, useState } from "react";
import { Save, Check, Plus, Trash2, HeartHandshake } from "lucide-react";
import { type Partner } from "@/lib/partners-store";
import { adminGet, adminSend } from "@/lib/admin-api";
import { ImageUpload, GalleryUpload } from "@/components/admin/image-upload";
import { PartnerMark } from "@/components/partner-mark";
import { Label } from "@/components/sticker";

type CycleContent = {
  id: string; cycle: number; vehicleLabel: string; drawDateISO: string;
  charityPartnerId?: string; charityBlurb?: string;
  vehicle: { year: number; make: string; model: string; trim: string; valueUSD: number; images: string[] };
  pricePerTicketUSD: number; ticketsSold: number;
  livestreamFacebook?: string; livestreamYoutube?: string;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const EMPTY_PARTNER = { name: "", kind: "charity" as Partner["kind"], logoUrl: "", url: "", blurb: "" };

export default function AdminCyclesPage() {
  const [config, setConfig] = useState<CycleContent | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(EMPTY_PARTNER);
  const [err, setErr] = useState<string | null>(null);

  const loadConfig = () => adminGet<CycleContent>("/api/admin/cycle").then(setConfig).catch((e) => setErr(String(e.message)));
  const loadPartners = () => adminGet<Partner[]>("/api/admin/partners").then(setPartners).catch((e) => setErr(String(e.message)));
  useEffect(() => { loadConfig(); loadPartners(); }, []);

  if (!config) return null;

  const charities = partners.filter((p) => p.kind === "charity");
  const currentPartner = partners.find((p) => p.id === config.charityPartnerId);

  const onSave = async () => {
    setErr(null);
    try {
      await adminSend("/api/admin/cycle", "PUT", {
        vehicleLabel: config.vehicleLabel,
        drawDateISO: config.drawDateISO,
        charityPartnerId: config.charityPartnerId ?? null,
        charityBlurb: config.charityBlurb,
        vehicleYear: config.vehicle.year,
        vehicleMake: config.vehicle.make,
        vehicleModel: config.vehicle.model,
        vehicleTrim: config.vehicle.trim,
        valueUSD: config.vehicle.valueUSD,
        pricePerTicketUSD: config.pricePerTicketUSD,
        images: config.vehicle.images,
        livestreamFacebook: config.livestreamFacebook ?? "",
        livestreamYoutube: config.livestreamYoutube ?? "",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setErr(String((e as Error).message)); }
  };

  const onAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setErr(null);
    try {
      const p = await adminSend<Partner>("/api/admin/partners", "POST", {
        name: form.name.trim(),
        kind: form.kind,
        logoUrl: form.logoUrl.trim() || undefined,
        url: form.url.trim() || undefined,
        blurb: form.blurb.trim() || undefined,
      });
      if (form.kind === "charity") setConfig((c) => (c ? { ...c, charityPartnerId: p.id } : c));
      setForm(EMPTY_PARTNER);
      loadPartners();
    } catch (e) { setErr(String((e as Error).message)); }
  };

  const removePartner = async (id: string) => {
    setErr(null);
    try { await adminSend(`/api/admin/partners?id=${id}`, "DELETE"); loadPartners(); }
    catch (e) { setErr(String((e as Error).message)); }
  };

  const input = "mt-1.5 w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";

  const openNextCycle = async () => {
    if (!confirm("Open the NEXT cycle? This CLOSES the current cycle and starts fresh ticket numbering. Afterward, set the new prize + draw date and save.")) return;
    setErr(null);
    try {
      await adminSend("/api/admin/cycle", "POST", {});
      loadConfig();
    } catch (e) { setErr(String((e as Error).message)); }
  };

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Cycle <span className="accent-serif">desk.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
            Set the current cycle&apos;s draw date and charity partner — countdowns and the
            charity sections across the site pick it up live. Manage the partner registry below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Saved" : "Save cycle"}
          </button>
          <button
            type="button"
            onClick={openNextCycle}
            className="inline-flex items-center gap-2 border border-ink/15 bg-paper-4 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <Plus size={13} /> Open next cycle
          </button>
        </div>
      </div>

      {err && <p className="mt-4 text-[13px] text-red-600 font-condensed">⚠ {err}</p>}

      {/* Current cycle */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink">Cycle №{String(config.cycle).padStart(2, "0")} · {config.vehicleLabel}</p>
          {currentPartner && <PartnerMark partner={currentPartner} size="sm" />}
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="dateline on-paper">Cycle number</span>
            <input type="text" value={config.cycle} readOnly className={`${input} numeral opacity-70`} /></label>
          <label className="block"><span className="dateline on-paper">Vehicle label</span>
            <input type="text" value={config.vehicleLabel}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicleLabel: e.target.value }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Live draw date &amp; time</span>
            <input type="datetime-local" value={toLocalInput(config.drawDateISO)}
              onChange={(e) => e.target.value && setConfig((c) => ({ ...c!, drawDateISO: new Date(e.target.value).toISOString() }))}
              className={input} /></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Charity partner (10% of every cycle)</span>
            <select value={config.charityPartnerId ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c!, charityPartnerId: e.target.value }))}
              className={input}>
              <option value="">— none —</option>
              {charities.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Charity blurb (shown in the charity sections)</span>
            <input type="text" value={config.charityBlurb ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c!, charityBlurb: e.target.value }))}
              className={input} /></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Livestream — Facebook URL</span>
            <input type="url" value={config.livestreamFacebook ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c!, livestreamFacebook: e.target.value }))}
              placeholder="https://facebook.com/…/live" className={input} /></label>
          <label className="block sm:col-span-2"><span className="dateline on-paper">Livestream — YouTube URL</span>
            <input type="url" value={config.livestreamYoutube ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c!, livestreamYoutube: e.target.value }))}
              placeholder="https://youtube.com/…" className={input} /></label>
        </div>
      </div>

      {/* Prize (vehicle) — editable */}
      <div className="mt-6 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10">
          <p className="font-display font-bold text-ink">The prize</p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="dateline on-paper">Year</span>
            <input type="number" value={config.vehicle.year}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, year: Number(e.target.value) || 0 } }))}
              className={`${input} numeral`} /></label>
          <label className="block"><span className="dateline on-paper">Make</span>
            <input value={config.vehicle.make}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, make: e.target.value } }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Model</span>
            <input value={config.vehicle.model}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, model: e.target.value } }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Trim</span>
            <input value={config.vehicle.trim}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, trim: e.target.value } }))}
              className={input} /></label>
          <label className="block"><span className="dateline on-paper">Value (USD)</span>
            <input type="number" value={config.vehicle.valueUSD}
              onChange={(e) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, valueUSD: Number(e.target.value) || 0 } }))}
              className={`${input} numeral`} /></label>
          <label className="block"><span className="dateline on-paper">Price per ticket (USD)</span>
            <input type="number" value={config.pricePerTicketUSD}
              onChange={(e) => setConfig((c) => ({ ...c!, pricePerTicketUSD: Number(e.target.value) || 0 }))}
              className={`${input} numeral`} /></label>
          <label className="block sm:col-span-2 lg:col-span-4"><span className="dateline on-paper">Prize gallery — first image is the primary (uploads to Shopify Files)</span>
            <GalleryUpload value={config.vehicle.images} onChange={(urls) => setConfig((c) => ({ ...c!, vehicle: { ...c!.vehicle, images: urls } }))} /></label>
        </div>
        <p className="px-5 pb-4 dateline on-paper">Spec-sheet rows are seeded from the current data; image URLs point at Shopify Files CDN.</p>
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
            <label className="block"><span className="dateline on-paper">Partner logo (upload)</span>
              <ImageUpload value={form.logoUrl} onChange={(url) => setForm((f) => ({ ...f, logoUrl: url }))} /></label>
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

        {partners.length > 0 && (
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
                <button
                  type="button"
                  onClick={() => removePartner(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
                >
                  <Trash2 size={11} /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
