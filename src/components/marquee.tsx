"use client";
import { usePrizeCycle, useLifetimeStats } from "@/lib/cycle-store";
import { usd, intl } from "@/lib/format";

/** Top status strip — teal band, ink text, GM-style brand color band */
export function TopAnnounce() {
  const activeDraw = usePrizeCycle();
  const lifetimeStats = useLifetimeStats();
  const items = [
    `Cycle ${activeDraw.cycle} now selling`,
    `Drawn live Sat Jul 12 · Facebook + YouTube`,
    `10% to ${activeDraw.charity.name}`,
    `${intl(lifetimeStats.carsGivenAway)} cars given · ${usd(lifetimeStats.totalDonatedUSD)} donated`,
  ];
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden bg-accent-bright text-ink border-b border-ink/10" aria-hidden>
      <div className="marquee-track py-2">
        {row.map((t, i) => (
          <span key={i} className="inline-flex items-center font-condensed uppercase tracking-[0.24em] text-[12px] px-6 font-semibold">
            {t}
            <span className="ml-6 text-ink/50">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

type Tone = "ink" | "paper" | "accent" | "charity" | "brass";
const TONE: Record<Tone, string> = {
  ink: "bg-bg-dark text-fg border-fg",
  paper: "bg-paper-2 text-ink border-ink/10",
  accent: "bg-accent-bright text-ink border-ink/10",
  charity: "bg-charity text-paper-3 border-ink/10",
  brass: "bg-brass text-ink border-ink/10",
};

export function Announce({ label, items, tone = "paper" }: { label: string; items: string[]; tone?: Tone }) {
  return (
    <div className={`border-y ${TONE[tone]} px-5 py-3 flex flex-wrap items-baseline gap-x-6 gap-y-1`}>
      <span className="font-condensed uppercase tracking-[0.24em] text-[11px] opacity-80 font-semibold">{label}</span>
      {items.map((it, i) => (
        <span key={i} className="font-condensed uppercase tracking-[0.22em] text-[12px]">{it}</span>
      ))}
    </div>
  );
}
