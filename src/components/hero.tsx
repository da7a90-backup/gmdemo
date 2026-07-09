import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";
import { usd, niceWeekday } from "@/lib/format";
import { Tv2, Radio, HeartHandshake, Drum, ArrowRight } from "lucide-react";
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

      <div className="mx-auto max-w-[1400px] flex flex-col gap-8 px-5 pt-8 pb-10 lg:gap-10 lg:pt-10 lg:pb-12">
        {/* TOP — prize plate spanning most of the hero, image centered */}
        <div className="w-full lg:w-[92%] mx-auto flex flex-col border border-ink/10 bg-paper-3 shadow-soft rounded-2xl overflow-hidden">
          <PrizePlate />

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/10 bg-paper-3">
            <div className="p-4">
              <p className="section-eyebrow on-paper">Next draw</p>
              <p className="mt-1 font-condensed uppercase tracking-[0.06em] text-[14px] text-ink leading-tight">
                {niceWeekday(activeDraw.drawDateISO)}
              </p>
            </div>
            <div className="p-4 flex items-center justify-center sm:justify-end">
              <Countdown targetISO={activeDraw.drawDateISO} />
            </div>
          </div>
        </div>

        {/* BELOW — headline + copy under the prize plate */}
        <div className="w-full lg:w-[92%] mx-auto relative flex flex-col">
          {/* Serial + dateline */}
          <div className="flex items-baseline gap-4 mb-4">
            <span className="font-condensed numeral font-bold text-5xl text-accent leading-none">
              №{String(activeDraw.cycle).padStart(2, "0")}
            </span>
            <div>
              <p className="dateline on-paper">Cycle · drawn {niceWeekday(activeDraw.drawDateISO)}</p>
              <p className="mt-0.5 font-condensed uppercase tracking-[0.22em] text-[12px] font-semibold text-charity">
                10% to {activeDraw.charity.name}
              </p>
            </div>
          </div>

          {/* Headline — capped at 5rem, no longer 7.5rem */}
          <h1
            className="hero-headline"
            style={{ fontSize: "clamp(2.5rem, 5vw + 0.5rem, 5rem)" }}
          >
            Win the <span className="accent-serif">car.</span><br />
            Fund the <span className="accent-brass">cause.</span>
          </h1>

          <p className="mt-5 max-w-xl text-[17px] text-ink-2">
            One ticket enters you to win this{" "}
            <strong className="text-ink">{v.year} {v.make} {v.model}</strong>
            . Drawn live, on camera, with paper tickets pulled from a real drum.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/tickets"
              className="inline-flex h-14 items-center gap-3 bg-accent px-6 text-paper-3 border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[14px] font-bold hover:bg-ink transition-colors shadow-soft rounded-full"
            >
              Buy tickets · {usd(10)} each
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-14 items-center gap-2 border border-ink/10 px-5 text-ink bg-paper-3 font-condensed uppercase tracking-[0.24em] text-[12px] hover:bg-ink hover:text-paper transition-colors rounded-full"
            >
              How the draw works
            </Link>
          </div>

          {/* Trust chips — compressed to a single row */}
          <ul className="mt-7 flex flex-wrap gap-2">
            <TrustChip icon={<HeartHandshake size={14} />} label="10% to charity" tone="charity" />
            <TrustChip icon={<Tv2 size={14} />} label="Drawn live" tone="ink" />
            <TrustChip icon={<Drum size={14} />} label="Real drum" tone="ink" />
            <TrustChip icon={<Radio size={14} />} label="501(c)(3)" tone="ink" />
          </ul>
        </div>
      </div>
    </section>
  );
}

function TrustChip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "ink" | "charity" }) {
  const cls = tone === "charity"
    ? "bg-charity-soft border-charity text-charity"
    : "bg-paper-3 border-ink/10 text-ink";
  return (
    <li className={`inline-flex items-center gap-1.5 border ${cls} px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[11px] font-semibold rounded-full`}>
      {icon}
      {label}
    </li>
  );
}
