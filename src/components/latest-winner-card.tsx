import { winners } from "@/lib/mock-data";
import { niceDate } from "@/lib/format";
import { PlayCircle } from "lucide-react";
import { Label } from "@/components/sticker";

/** Featured card for the most recent winner (winners[0]). Shared by home + tickets. */
export function LatestWinnerCard() {
  const latest = winners[0];

  return (
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
  );
}
