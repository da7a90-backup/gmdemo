import Link from "next/link";
import { winners } from "@/lib/mock-data";
import { niceDate } from "@/lib/format";
import { PlayCircle, ArrowRight } from "lucide-react";
import { Label } from "@/components/sticker";

export function WinnersGallery({
  limit = 6,
  showHeader = true,
}: { limit?: number; showHeader?: boolean }) {
  const list = winners.slice(0, limit);

  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="winners">
      <div className="mx-auto max-w-[1400px] px-5 py-24">
      {showHeader && (
        <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-rule-soft pb-12">
          <div className="lg:col-span-8">
            <p className="section-eyebrow section-eyebrow-rule">Winners — every cycle, named</p>
            <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4.25rem)" }}>
              Real winners. <span className="accent-serif">Real cars.</span><br />
              Real charity checks.
            </h2>
          </div>
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-4">
            <p className="text-ink-2 text-[17px] font-serif leading-[1.55] lg:text-right">
              Every winner is named, photographed, called on stream, and posted here forever.
            </p>
            <Link
              href="/winners"
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-5 py-2.5 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper-3 transition rounded-full"
            >
              Full archive <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <ul className="mt-12 grid border border-ink/10 bg-paper-3 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-ink/10 lg:divide-y-0 lg:divide-x rounded-2xl overflow-hidden">
        {list.slice(0, 6).map((w, i) => (
          <li key={w.id} className={i >= 3 ? "lg:border-t lg:border-ink/10" : ""}>
            <WinnerCard winner={w} />
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

export function WinnerCard({ winner: w }: { winner: typeof winners[number] }) {
  return (
    <article className="group block bg-paper-3">
      <div
        className="relative aspect-[5/3] overflow-hidden border-b border-ink/10"
        style={{
          background:
            "linear-gradient(135deg, #0f0f10 0%, #211814 60%, #392617 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(400px 160px at 50% 90%, rgba(235,200,82,0.4), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 border border-paper-3/40 bg-paper-3/10 flex items-center justify-center font-condensed font-semibold text-3xl text-paper-3 rounded-full">
            {w.firstName[0]}{w.lastInitial}
          </div>
        </div>

        <span className="absolute top-3 left-3">
          <Label tone="paper">Cycle №{String(w.drawCycle).padStart(2, "0")}</Label>
        </span>

        <button
          aria-label="Watch reveal clip"
          className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 bg-paper-3 text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-3 py-1.5 border border-ink/10 hover:bg-brass rounded-full"
        >
          <PlayCircle size={12} /> Reveal
        </button>
      </div>
      <div className="p-5">
        <p className="dateline">{niceDate(w.drawDateISO)} · {w.city}, {w.state}</p>
        <p className="mt-2 font-display font-bold text-xl text-ink leading-tight">
          {w.firstName} {w.lastInitial}.
        </p>
        <p className="mt-1 font-condensed uppercase tracking-[0.22em] text-[12px] text-accent">{w.vehicle}</p>
        <blockquote className="mt-4 text-[14px] text-ink-2 font-serif italic border-l border-accent pl-3">
          &ldquo;{w.quote}&rdquo;
        </blockquote>
        <p className="mt-4 dateline">
          Charity allocation: <span className="text-charity">{w.charity}</span>
        </p>
      </div>
    </article>
  );
}
