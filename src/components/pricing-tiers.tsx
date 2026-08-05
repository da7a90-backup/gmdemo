"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Minus } from "lucide-react";
import { ticketTiers, membershipTiers } from "@/lib/mock-data";
import { usePrizeCycle } from "@/lib/cycle-store";
import { usd } from "@/lib/format";
import { startTicketCheckout } from "@/lib/checkout";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export function PricingTiers() {
  const cp = useCopy();
  const router = useRouter();
  const activeDraw = usePrizeCycle();
  const [mode, setMode] = useState<"once" | "monthly">("once");
  const [showAll, setShowAll] = useState(false);
  const visibleOnce = showAll ? ticketTiers : ticketTiers.slice(0, 3);

  // One-time bundle → real Shopify checkout (baseline attribution); falls back to
  // the demo checkout if Shopify is unavailable.
  const buyOnce = async (tierId: string, entries: number) => {
    const redirected = await startTicketCheckout({
      entries,
      multiplier: 1,
      attribution: { attr_source: "organic", attr_channel: "Organic", attr_page: "/" },
    });
    if (!redirected) router.push(`/checkout?tier=${tierId}&type=once`);
  };

  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="tickets">
      <div className="mx-auto max-w-[1400px] px-5 py-24">
      <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-rule-soft pb-12">
        <div className="lg:col-span-8">
          <p className="section-eyebrow section-eyebrow-rule"><Copy k="home.pricing.eyebrow" /></p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4.25rem)" }}>
            <Copy k="home.pricing.h.lead" /> <span className="accent-serif"><Copy k="home.pricing.h.accent" /></span>
          </h2>
        </div>
        <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-4">
          <p className="text-ink-2 text-[17px] font-serif leading-[1.55]">
            <Copy k="home.pricing.blurb" />
          </p>
          <div
            role="tablist"
            aria-label="Purchase frequency"
            className="inline-flex border border-ink/10 bg-paper-3 text-sm font-condensed uppercase tracking-[0.22em] rounded-full overflow-hidden"
          >
            <button
              role="tab"
              aria-selected={mode === "once"}
              onClick={() => setMode("once")}
              className={`px-5 py-2.5 transition ${
                mode === "once" ? "bg-ink text-paper-3" : "text-ink"
              }`}
            >
              <Copy k="pricing.tab.once" />
            </button>
            <button
              role="tab"
              aria-selected={mode === "monthly"}
              onClick={() => setMode("monthly")}
              className={`px-5 py-2.5 transition inline-flex items-center gap-2 border-l border-ink/10 ${
                mode === "monthly" ? "bg-ink text-paper-3" : "text-ink"
              }`}
            >
              <Copy k="pricing.tab.monthly" />
              <span className="text-[10px] px-1.5 py-0.5 bg-brass text-ink rounded-full"><Copy k="pricing.save" /></span>
            </button>
          </div>
        </div>
      </div>

      {mode === "once" ? (
        <>
          <div className="mt-12 grid border border-ink/10 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10 rounded-2xl overflow-hidden">
            {visibleOnce.map((t, i) => (
              <article
                key={t.id}
                className={`relative p-8 flex flex-col ${
                  t.popular ? "bg-ink text-paper" : "bg-paper-3 text-ink"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`section-eyebrow ${t.popular ? "!text-paper/70" : ""}`}>№{String(i + 1).padStart(2, "0")}</p>
                  {t.badge && (
                    <Label tone={t.popular ? "brass" : "accent"} variant={t.popular ? "solid" : "outline"}>{t.badge}</Label>
                  )}
                </div>
                <h3 className="font-display font-bold text-3xl">{t.name}</h3>
                <p className={`mt-1 text-[14px] font-serif italic ${t.popular ? "text-paper/70" : "text-ink-3"}`}>{t.blurb}</p>
                <div className="mt-7 flex items-baseline gap-2">
                  <span className="font-condensed numeral text-6xl leading-none font-semibold">{usd(t.priceUSD)}</span>
                  <span className={`${t.popular ? "text-paper/70" : "text-ink-2"} text-sm`}><Copy k="pricing.oneTime" /></span>
                </div>
                <p className={`mt-3 font-condensed uppercase tracking-[0.22em] text-[12px] ${t.popular ? "text-paper" : "text-ink"}`}>
                  <span className={`numeral text-base ${t.popular ? "text-brass" : "text-accent"}`}>{t.entries}</span> {t.entries === 1 ? cp("pricing.entrySingular") : cp("pricing.entryPlural")} {cp("pricing.cyclePrefix")} {activeDraw.cycle}
                </p>
                <button
                  type="button"
                  onClick={() => buyOnce(t.id, t.entries)}
                  className={`mt-8 inline-flex h-12 items-center justify-center border font-condensed uppercase tracking-[0.22em] text-[12px] rounded-full ${
                    t.popular ? "bg-accent text-paper-3 border-accent hover:bg-paper-3 hover:text-ink hover:border-paper-3" : "bg-ink text-paper-3 border-ink/10 hover:bg-accent hover:border-accent"
                  } transition-colors`}
                >
                  <Copy k="pricing.buy" />
                </button>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-5 py-2.5 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper-3 transition-colors rounded-full"
            >
              {showAll ? <Minus size={14} /> : <Plus size={14} />}
              {showAll ? <Copy k="pricing.hide" /> : <Copy k="pricing.show" />} <Copy k="pricing.ladder" />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-12 grid border border-ink/10 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10 rounded-2xl overflow-hidden">
          {membershipTiers.map((m, i) => (
            <article
              key={m.id}
              className={`relative p-8 flex flex-col ${
                m.popular ? "bg-ink text-paper-3" : "bg-paper-3 text-ink"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`section-eyebrow ${m.popular ? "!text-paper-3/70" : ""}`}><Copy k="pricing.tierPrefix" />{String(i + 1).padStart(2, "0")}</p>
                {m.popular && <Label tone="brass"><Copy k="pricing.bestValue" /></Label>}
              </div>
              <h3 className="font-display font-bold text-3xl">{m.name}</h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-condensed numeral text-6xl leading-none font-semibold">{usd(m.monthlyUSD)}</span>
                <span className={`${m.popular ? "text-paper-3/70" : "text-ink-3"} text-sm`}><Copy k="pricing.perMonth" /></span>
              </div>
              <p className={`mt-3 font-condensed uppercase tracking-[0.22em] text-[12px]`}>
                <span className="numeral text-base">{m.monthlyEntries}</span> <Copy k="pricing.monthlyMeta" />
              </p>
              <ul className="mt-6 space-y-2.5">
                {m.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-[15px]">
                    <Check size={18} className={`mt-0.5 shrink-0 ${m.popular ? "text-brass" : "text-charity"}`} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/checkout?tier=${m.id}&type=monthly`}
                className={`mt-8 inline-flex h-12 items-center justify-center border font-condensed uppercase tracking-[0.22em] text-[12px] rounded-full ${
                  m.popular ? "bg-brass text-ink border-brass hover:bg-paper-3 hover:border-paper-3" : "bg-ink text-paper-3 border-ink/10 hover:bg-accent hover:border-accent"
                } transition-colors`}
              >
                <Copy k="pricing.join" /> {m.name}
              </Link>
              <p className={`mt-3 text-center font-serif italic text-[13px] ${m.popular ? "text-paper-3/70" : "text-ink-3"}`}>
                <Copy k="pricing.cancel" />
              </p>
            </article>
          ))}
        </div>
      )}

      </div>
    </section>
  );
}
