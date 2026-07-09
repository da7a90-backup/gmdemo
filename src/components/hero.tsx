import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";
import { PrizePlate } from "@/components/prize-plate";

export function Hero() {
  const v = activeDraw.vehicle;

  return (
    <section className="relative overflow-hidden bg-paper text-ink border-b border-ink/10 grain">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 450px at 90% -10%, rgba(242,185,13,0.14), transparent 60%), radial-gradient(700px 350px at 0% 100%, rgba(26,77,48,0.14), transparent 60%)",
        }}
      />

      {/* Full-bleed prize image */}
      <PrizePlate />

      {/* Headline → countdown → Enter Now, centered under the image */}
      <div className="mx-auto max-w-3xl px-5 py-10 lg:py-12 flex flex-col items-center text-center">
        <h1 className="hero-headline" style={{ fontSize: "clamp(2.25rem, 4.5vw + 0.5rem, 4.5rem)" }}>
          Win the <span className="accent-serif">car.</span>{" "}
          Fund the <span className="accent-brass">cause.</span>
        </h1>

        <p className="mt-4 max-w-xl text-[17px] text-ink-2">
          One $10 ticket enters you to win this <strong className="text-ink">{v.year} {v.make} {v.model}</strong>,
          drawn live from a real drum. 10% goes to {activeDraw.charity.name}. 501(c)(3).
        </p>

        <p className="mt-8 section-eyebrow on-paper" style={{ paddingLeft: 0 }}>
          Special promotion ends in
        </p>
        <div className="mt-2.5">
          <Countdown targetISO={activeDraw.drawDateISO} />
        </div>

        <Link
          href="/tickets"
          className="mt-7 inline-flex h-14 items-center gap-3 bg-brass px-10 text-ink border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[15px] font-bold hover:bg-ink hover:text-paper-3 transition-colors shadow-soft rounded-full"
        >
          Enter now
          <ArrowRight size={18} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
