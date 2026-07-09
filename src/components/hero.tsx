import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";
import { PrizePlate } from "@/components/prize-plate";

export function Hero() {
  const v = activeDraw.vehicle;

  return (
    <section className="relative overflow-hidden border-b border-ink/10">
      {/* Full-bleed prize image (hover/press still swaps the angle) */}
      <PrizePlate minimal aspect="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]" />

      {/* Overlay — headline, one-liner, countdown, Enter Now. pointer-events pass
          through to the image except on the CTA. */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center px-5 pb-8 sm:pb-10 lg:pb-12 pointer-events-none">
        <h1 className="hero-headline on-dark drop-shadow" style={{ fontSize: "clamp(1.9rem, 3.5vw + 0.5rem, 3.5rem)", lineHeight: 1.15 }}>
          Win the <span className="accent-serif">car.</span>{" "}
          Fund the <span className="accent-brass">cause.</span>
        </h1>

        <p className="mt-2 text-[13px] sm:text-[15px] text-paper/90 drop-shadow max-w-2xl">
          One $10 ticket enters to win this {v.year} {v.make} {v.model} — drawn live · 10% to {activeDraw.charity.name} · 501(c)(3)
        </p>

        <p className="mt-5 font-condensed uppercase tracking-[0.24em] text-[11px] font-semibold text-paper/80">
          Special promotion ends in
        </p>
        <div className="mt-2">
          <Countdown targetISO={activeDraw.drawDateISO} />
        </div>

        <Link
          href="/tickets"
          className="pointer-events-auto mt-5 inline-flex h-12 sm:h-14 items-center gap-3 bg-brass px-10 text-ink border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[15px] font-bold hover:bg-paper hover:text-ink transition-colors shadow-lift rounded-full"
        >
          Enter now
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
