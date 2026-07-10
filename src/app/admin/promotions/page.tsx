"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, RotateCcw, ExternalLink, Check } from "lucide-react";
import {
  getPromoConfig, savePromoConfig, resetPromoConfig, isPromoLive, type PromoTier,
} from "@/lib/promotions";
import { Label } from "@/components/sticker";

/** ISO → value usable by <input type="datetime-local"> (local wall time). */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AdminPage() {
  const [promos, setPromos] = useState<PromoTier[] | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPromos(getPromoConfig());
  }, []);

  if (!promos) return null;

  const update = (id: string, patch: Partial<PromoTier>) => {
    setSaved(false);
    setPromos((prev) => prev!.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const onSave = () => {
    savePromoConfig(promos);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onReset = () => {
    resetPromoConfig();
    setPromos(getPromoConfig());
    setSaved(false);
  };

  return (
    <main>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
              Promotions <span className="accent-serif">desk.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
              One multiplier per channel, configurable without a deploy. The tickets pages pick these up
              live — by membership login, by <code className="numeral">?promo=CODE</code> link, or by
              UTM parameter for external campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-4 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors"
            >
              <RotateCcw size={13} /> Reset defaults
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-2 bg-accent-bright text-ink border border-ink/10 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
            >
              {saved ? <Check size={13} /> : <Save size={13} />}
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {promos.map((t, i) => (
            <div key={t.id} className={`border rounded-2xl bg-paper-4 shadow-soft overflow-hidden ${isPromoLive(t) ? "border-brass" : "border-ink/10"}`}>
              <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-condensed numeral font-bold text-xl text-ink-3">№{i + 1}</span>
                  <div>
                    <p className="font-display font-bold text-ink leading-tight">{t.label}</p>
                    <p className="dateline on-paper">{t.audience}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isPromoLive(t) ? (
                    <Label tone="brass" variant="solid" size="sm">Live · {t.multiplier}X</Label>
                  ) : (
                    <Label tone="ink" variant="outline" size="sm">{t.multiplier <= 1 ? "Baseline" : "Off"}</Label>
                  )}
                  <label className="inline-flex items-center gap-2 dateline on-paper cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.active}
                      onChange={(e) => update(t.id, { active: e.target.checked })}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Entry multiplier">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={t.multiplier}
                    onChange={(e) => update(t.id, { multiplier: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 numeral text-lg text-ink outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Promo code trigger (?promo=)">
                  <input
                    type="text"
                    value={t.code ?? ""}
                    placeholder={t.id === "member" ? "auto — login" : t.id === "organic" ? "—" : "e.g. VIP3X"}
                    disabled={t.id === "member" || t.id === "organic"}
                    onChange={(e) => update(t.id, { code: e.target.value.toUpperCase() || undefined })}
                    className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 font-condensed uppercase tracking-[0.08em] text-ink outline-none focus:border-accent disabled:opacity-50"
                  />
                </Field>
                <Field label="UTM trigger (utm_source/campaign)">
                  <input
                    type="text"
                    value={t.utm ?? ""}
                    placeholder={t.id === "member" ? "auto — login" : t.id === "organic" ? "—" : "e.g. summer-blast"}
                    disabled={t.id === "member" || t.id === "organic"}
                    onChange={(e) => update(t.id, { utm: e.target.value.toLowerCase() || undefined })}
                    className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 font-condensed lowercase tracking-[0.04em] text-ink outline-none focus:border-accent disabled:opacity-50"
                  />
                </Field>
                <Field label="Promo ends (own countdown)">
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={toLocalInput(t.endISO)}
                      onChange={(e) => update(t.id, { endISO: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-2.5 text-[13px] text-ink outline-none focus:border-accent"
                    />
                    <label className="inline-flex items-center gap-1.5 dateline on-paper cursor-pointer shrink-0" title="Show countdown in the promo banner">
                      <input
                        type="checkbox"
                        checked={!!t.showCountdown}
                        onChange={(e) => update(t.id, { showCountdown: e.target.checked })}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      Timer
                    </label>
                  </div>
                </Field>
                <Field label="Countdown label (tickets pages)">
                  <input
                    type="text"
                    value={t.countdownLabel ?? ""}
                    placeholder="Promo closes in"
                    onChange={(e) => update(t.id, { countdownLabel: e.target.value || undefined })}
                    className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent"
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Marketing message (shown in the promo banner)">
                    <input
                      type="text"
                      value={t.message}
                      onChange={(e) => update(t.id, { message: e.target.value })}
                      className="w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent"
                    />
                  </Field>
                </div>
              </div>

              {(t.code || t.utm) && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {t.code && (
                    <Link href={`/tickets?promo=${t.code}`} className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                      /tickets?promo={t.code} <ExternalLink size={10} />
                    </Link>
                  )}
                  {t.utm && (
                    <Link href={`/tickets?utm_campaign=${t.utm}`} className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                      /tickets?utm_campaign={t.utm} <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 dateline on-paper">
          Production build: promotions live as Shopify products/metafields or discount rules — this desk writes the same shape of config, stored locally for the demo.
        </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="dateline on-paper">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
