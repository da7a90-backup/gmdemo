import Link from "next/link";
import { winners } from "@/lib/mock-data";
import { niceDate } from "@/lib/format";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Label } from "@/components/sticker";

/**
 * Auto-scrolling winners carousel for the home page.
 * Uses the marquee animation pattern (CSS keyframe) so it never JS-loops,
 * and respects prefers-reduced-motion globally.
 */
export function WinnersCarousel() {
  const row = [...winners, ...winners]; // duplicate for seamless -50% loop
  const latest = winners[0];

  return (
    <section className="bg-paper-3 text-ink border-y border-ink/10 py-12 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-5 flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="section-eyebrow section-eyebrow-rule">Recent winners</p>
          <h2 className="mt-3 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)" }}>
            Real people. <span className="accent-serif">Real cars.</span>
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
        <article className="grid md:grid-cols-12 border border-ink/10 bg-paper-4 rounded-2xl overflow-hidden shadow-soft">
          <div
            className="relative md:col-span-5 aspect-[5/3] md:aspect-auto md:min-h-[240px] border-b md:border-b-0 md:border-r border-ink/10"
            style={{ background: "linear-gradient(135deg, #16110f 0%, #2e261f 60%, #3d2e1d 100%)" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 border-2 border-brass flex items-center justify-center font-condensed font-bold text-4xl text-paper-3 rounded-full">
                {latest.firstName[0]}{latest.lastInitial}
              </div>
            </div>
            <span className="absolute top-3 left-3">
              <Label tone="brass" variant="solid">★ Latest winner</Label>
            </span>
            <span className="absolute top-3 right-3 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-0.5 border border-ink/10 rounded-md">
              Cycle №{String(latest.drawCycle).padStart(2, "0")}
            </span>
            <button aria-label="Watch reveal" className="absolute right-3 bottom-3 inline-flex items-center gap-1 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border border-ink/10 hover:bg-brass rounded-full">
              <PlayCircle size={12} /> Watch the reveal
            </button>
          </div>

          <div className="md:col-span-7 p-6 md:p-7 flex flex-col">
            <p className="font-display font-bold text-2xl md:text-3xl text-ink leading-tight">
              {latest.firstName} {latest.lastInitial}.
            </p>
            <p className="dateline on-paper mt-1">
              {latest.city}, {latest.state} · drawn {niceDate(latest.drawDateISO)}
            </p>
            <p className="mt-2 font-condensed uppercase tracking-[0.22em] text-[13px] text-accent">
              Won the {latest.vehicle}
            </p>
            <blockquote className="mt-4 font-serif italic text-[17px] md:text-lg text-ink-2 leading-snug max-w-xl">
              &ldquo;{latest.quote}&rdquo;
            </blockquote>
            <p className="mt-auto pt-4 dateline on-paper">→ {latest.charity}</p>
          </div>
        </article>
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
