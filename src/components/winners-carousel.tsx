"use client";
import Link from "next/link";
import { useWinners } from "@/lib/winners-store";
import { niceDate } from "@/lib/format";
import { ArrowRight, PlayCircle } from "lucide-react";
import { LatestWinnerCard } from "@/components/latest-winner-card";
import { Copy } from "@/components/copy";

/**
 * Auto-scrolling winners carousel for the home page.
 * Uses the marquee animation pattern (CSS keyframe) so it never JS-loops,
 * and respects prefers-reduced-motion globally.
 */
export function WinnersCarousel() {
  const winners = useWinners();
  const row = [...winners, ...winners]; // duplicate for seamless -50% loop

  return (
    <section className="bg-paper-3 text-ink border-y border-ink/10 py-12 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-5 flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="section-eyebrow section-eyebrow-rule"><Copy k="home.winners.eyebrow" /></p>
          <h2 className="mt-3 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)" }}>
            <Copy k="home.winners.h.lead" /> <span className="accent-serif"><Copy k="home.winners.h.accent" /></span>
          </h2>
        </div>
        <Link
          href="/winners"
          className="hidden sm:inline-flex items-center gap-2 border border-ink/10 bg-paper-4 px-4 py-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper rounded-full"
        >
          Full archive <ArrowRight size={12} />
        </Link>
      </div>

      {/* LATEST WINNER — featured card above the marquee */}
      <div className="mx-auto max-w-[1400px] px-5 mb-7">
        <LatestWinnerCard />
      </div>

      <div className="relative">
        {/* Edge fade overlays — guide the eye without hiding content */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10" style={{ background: "linear-gradient(to right, var(--color-paper-3), transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10" style={{ background: "linear-gradient(to left, var(--color-paper-3), transparent)" }} />

        <div className="marquee-track" style={{ animationDuration: "44s" }}>
          {row.map((w, i) => (
            <article
              key={`${w.id}-${i}`}
              className="w-[280px] shrink-0 border border-ink/10 bg-paper-4 mr-4 rounded-lg overflow-hidden"
            >
              <div
                className="relative aspect-[5/3] border-b border-ink/10"
                style={{ background: "linear-gradient(135deg, #16110f 0%, #2e261f 60%, #3d2e1d 100%)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 border border-paper-3/40 flex items-center justify-center font-condensed font-bold text-2xl text-paper-3 rounded-full">
                    {w.firstName[0]}{w.lastInitial}
                  </div>
                </div>
                <span className="absolute top-2 left-2 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-0.5 border border-ink/10 rounded-md">
                  Cycle №{String(w.drawCycle).padStart(2, "0")}
                </span>
                <button aria-label="Watch reveal" className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-1 border border-ink/10 rounded-full">
                  <PlayCircle size={10} /> Reveal
                </button>
              </div>
              <div className="p-4">
                <p className="font-display font-bold text-ink leading-tight">{w.firstName} {w.lastInitial}.</p>
                <p className="dateline on-paper mt-0.5">{w.city}, {w.state} · {niceDate(w.drawDateISO)}</p>
                <p className="mt-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-accent">{w.vehicle}</p>
                <p className="mt-2 dateline on-paper">→ {w.charity}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
