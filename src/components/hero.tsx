import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";
import { intl, usd, niceWeekday } from "@/lib/format";
import { Tv2, Radio, HeartHandshake, Drum, ArrowRight } from "lucide-react";

export function Hero() {
  const sold = activeDraw.ticketsSold;
  const cap = activeDraw.ticketsCap;
  const pct = Math.round((sold / cap) * 100);
  const v = activeDraw.vehicle;

  return (
    <section className="relative overflow-hidden bg-paper text-ink border-b-2 border-ink grain">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 450px at 90% -10%, rgba(208,44,30,0.14), transparent 60%), radial-gradient(700px 350px at 0% 100%, rgba(26,77,48,0.14), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-[1400px] grid gap-8 px-5 pt-8 pb-10 lg:grid-cols-12 lg:gap-10 lg:pt-10 lg:pb-12">
        <div className="lg:col-span-7 relative flex flex-col">
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
            Drive the <span className="accent-serif">car.</span><br />
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
              className="inline-flex h-14 items-center gap-3 bg-accent px-6 text-paper-3 border-2 border-ink font-condensed uppercase tracking-[0.24em] text-[14px] font-bold hover:bg-ink transition-colors shadow-[5px_5px_0_0_var(--color-ink)]"
            >
              Buy tickets · {usd(10)} each
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-14 items-center gap-2 border-2 border-ink px-5 text-ink bg-paper-3 font-condensed uppercase tracking-[0.24em] text-[12px] hover:bg-ink hover:text-paper transition-colors"
            >
              How the draw works
            </Link>
          </div>

          {/* Trust chips — compressed to a single row */}
          <ul className="mt-auto pt-7 flex flex-wrap gap-2">
            <TrustChip icon={<HeartHandshake size={14} />} label="10% to charity" tone="charity" />
            <TrustChip icon={<Tv2 size={14} />} label="Drawn live" tone="ink" />
            <TrustChip icon={<Drum size={14} />} label="Real drum" tone="ink" />
            <TrustChip icon={<Radio size={14} />} label="501(c)(3)" tone="ink" />
          </ul>
        </div>

        {/* RIGHT — compact vehicle plate + ticker */}
        <div className="lg:col-span-5 flex flex-col border-2 border-ink bg-paper-3 shadow-[6px_6px_0_0_var(--color-ink)]">
          <div className="group relative aspect-[5/3] overflow-hidden border-b-2 border-ink">
            {/* Primary image */}
            <div
              className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.18) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.75) 100%), url(${v.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Hover-swap image */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.18) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.75) 100%), url(${v.images[1] ?? v.images[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />

            <span className="absolute top-3 left-3 bg-brass text-paper-3 font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink z-10">
              {v.year} · {v.make}
            </span>
            <span className="absolute top-3 right-3 bg-accent-bright text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink z-10">
              {usd(v.valueUSD)}
            </span>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
              <div>
                <p className="font-condensed uppercase tracking-[0.22em] text-[10px] text-paper/70">Prize</p>
                <p className="font-display font-bold text-2xl text-paper leading-tight drop-shadow">
                  {v.make} {v.model}
                </p>
              </div>
              <p className="text-[11px] text-paper/80 max-w-[55%] text-right font-serif italic">
                {v.trim}
              </p>
            </div>

            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-0 transition-opacity">
              {/* placeholder */}
            </span>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 bg-paper text-ink border border-ink font-condensed uppercase tracking-[0.22em] text-[10px] pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity">
              ↻ hover for another angle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-ink border-b-2 border-ink bg-paper-3">
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

          <div className="p-4 bg-paper-3">
            <div className="flex items-baseline justify-between mb-2 text-[13px]">
              <span className="text-ink-2">
                <strong className="text-ink font-condensed numeral text-base">{intl(sold)}</strong>
                {" / "}
                <span className="numeral">{intl(cap)}</span> sold
              </span>
              <span className="font-condensed numeral text-accent font-bold">{pct}%</span>
            </div>
            <div className="h-2.5 bg-paper border-2 border-ink overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} aria-hidden />
            </div>
            <p className="mt-2 dateline on-paper">Sales close when the cap is reached.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustChip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "ink" | "charity" }) {
  const cls = tone === "charity"
    ? "bg-charity-soft border-charity text-charity"
    : "bg-paper-3 border-ink text-ink";
  return (
    <li className={`inline-flex items-center gap-1.5 border-2 ${cls} px-2.5 py-1 font-condensed uppercase tracking-[0.22em] text-[11px] font-semibold`}>
      {icon}
      {label}
    </li>
  );
}
