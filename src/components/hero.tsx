"use client";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { usePrizeCycle } from "@/lib/cycle-store";
import { ArrowRight } from "lucide-react";
import { PrizePlate } from "@/components/prize-plate";
import { Copy } from "@/components/copy";

export function Hero() {
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;

  return (
    <section className="relative overflow-hidden border-b border-ink/10">
      {/* Full-bleed prize image (hover/press still swaps the angle) */}
      <PrizePlate minimal aspect="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]" />

      {/* Overlay — headline, one-liner, countdown, Enter Now. pointer-events pass
          through to the image except on the CTA. */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center px-5 pb-8 sm:pb-10 lg:pb-12 pointer-events-none">
        <h1 className="hero-headline on-dark drop-shadow" style={{ fontSize: "clamp(1.9rem, 3.5vw + 0.5rem, 3.5rem)", lineHeight: 1.15 }}>
          <Copy k="hero.h1.lead" /> <span className="accent-serif"><Copy k="hero.h1.car" /></span>{" "}
          <Copy k="hero.h1.fund" /> <span className="accent-brass"><Copy k="hero.h1.cause" /></span>
        </h1>


        <p className="mt-5 font-condensed uppercase tracking-[0.24em] text-[11px] font-semibold text-paper/80">
          <Copy k="hero.promoLabel" />
        </p>
        <div className="mt-2">
          <Countdown targetISO={activeDraw.drawDateISO} />
        </div>

        <Link
          href="/beta/tickets"
          className="pointer-events-auto mt-5 inline-flex h-12 sm:h-14 items-center gap-3 bg-brass px-10 text-ink border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[15px] font-bold hover:bg-paper hover:text-ink transition-colors shadow-lift rounded-full"
        >
          <Copy k="hero.cta" />
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
