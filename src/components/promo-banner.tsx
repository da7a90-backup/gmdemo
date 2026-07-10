"use client";
import { useEffect, useState } from "react";
import { timeUntil } from "@/lib/format";
import type { PromoTier } from "@/lib/promotions";
import { Sparkles } from "lucide-react";

/**
 * Active-promotion strip for the tickets pages. Runs its own countdown,
 * independent of the giveaway countdown, when the promo has an end time.
 */
export function PromoBanner({ promo }: { promo: PromoTier }) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0 });
  const hasTimer = !!(promo.endISO && promo.showCountdown);

  useEffect(() => {
    if (!hasTimer || !promo.endISO) return;
    const target = promo.endISO;
    setT(timeUntil(target));
    const id = setInterval(() => setT(timeUntil(target)), 1000);
    return () => clearInterval(id);
  }, [hasTimer, promo.endISO]);

  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <div suppressHydrationWarning className="bg-ink text-paper border-b border-ink/10">
      <div className="mx-auto max-w-[1400px] px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1 bg-brass text-ink px-2.5 py-0.5 rounded-full font-condensed uppercase tracking-[0.14em] text-[11px] font-bold shrink-0">
            <Sparkles size={11} /> {promo.multiplier}X entries
          </span>
          <p className="font-condensed uppercase tracking-[0.12em] text-[12px] text-paper/90 truncate">
            {promo.message}
          </p>
        </div>
        {hasTimer && (
          <p className="font-condensed uppercase tracking-[0.14em] text-[11px] text-paper/70 shrink-0">
            Promo ends in{" "}
            <span className="numeral font-bold text-brass text-[13px] tracking-[0.06em]">
              {p(t.days)} : {p(t.hours)} : {p(t.minutes)} : {p(t.seconds)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
