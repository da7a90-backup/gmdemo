import { AnimatedCounter } from "@/components/animated-counter";
import { activeDraw, lifetimeStats } from "@/lib/mock-data";
import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/sticker";
import { Copy } from "@/components/copy";
import { CharityName, CharityBlurb, CyclePartnerBadge } from "@/components/cycle-partner";

export function CharityBand() {
  return (
    <section className="relative overflow-hidden border-y border-ink/10 bg-ink text-paper-3 grain grain-dark">
      <span aria-hidden className="absolute -top-12 -left-12 text-paper-3/[0.08] display-mega select-none">10%</span>

      <div className="relative mx-auto max-w-[1400px] px-5 py-24 grid gap-12 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7">
          <p className="section-eyebrow !text-paper-3/70 section-eyebrow-rule"><Copy k="charity.eyebrow" /></p>
          <h2 className="mt-4 hero-headline on-dark">
            <Copy k="charity.h.lead" /> <span className="accent-serif"><Copy k="charity.h.accent" /></span>
          </h2>
          <p className="mt-7 max-w-xl text-lg text-paper-3/85">
            Cycle {activeDraw.cycle}&apos;s 10% goes to{" "}
            <span className="font-condensed uppercase tracking-[0.06em]">
              <CharityName />
            </span>
            . &ldquo;<CharityBlurb />&rdquo;
          </p>

          <p className="mt-4 max-w-xl text-[15px] text-paper-3/75 font-serif">
            <Copy k="charity.body" />
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/about#charity"
              className="inline-flex items-center gap-2 bg-brass text-ink px-5 py-3 border border-brass font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:border-paper-3 transition rounded-full"
            >
              How the funds flow <ArrowRight size={14} />
            </Link>
            <Link
              href="/blog/cycle-12-corvette-charity-pick"
              className="inline-flex items-center gap-2 border border-paper-3 bg-transparent px-5 py-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:text-ink transition rounded-full"
            >
              <FileText size={14} /> Why we picked them
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2 text-[12px]">
            <Label tone="brass" variant="solid">Registered 501(c)(3)</Label>
            <Label tone="paper" variant="outline">10% of gross to charity</Label>
          </div>

          <div className="mt-6">
            <CyclePartnerBadge dark />
          </div>
        </div>

        <div className="lg:col-span-5 border border-paper-3 bg-ink-raised rounded-2xl overflow-hidden">
          <div className="border-b border-paper-3 p-5 flex items-baseline justify-between">
            <p className="section-eyebrow !text-paper-3/70">Lifetime · all cycles</p>
            <p className="dateline !text-paper-3/60">cumulative</p>
          </div>

          <div className="p-6">
            <CounterRow value={lifetimeStats.totalDonatedUSD} prefix="$" label="Donated to partner charities" big />
            <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-paper-3/20">
              <CounterRow value={lifetimeStats.charitiesFunded} label="Partner charities" />
              <CounterRow value={lifetimeStats.cyclesRun} label="Cycles run" />
              <CounterRow value={lifetimeStats.carsGivenAway} label="Cars given away" />
              <CounterRow value={lifetimeStats.ticketsCounted} label="Entries verified" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CounterRow({
  value, label, prefix, big,
}: { value: number; label: string; prefix?: string; big?: boolean }) {
  return (
    <div>
      <p
        className={
          big
            ? "font-condensed numeral font-semibold text-5xl sm:text-6xl text-brass leading-[0.9]"
            : "font-condensed numeral text-2xl text-paper-3 leading-none"
        }
      >
        <AnimatedCounter value={value} prefix={prefix} />
      </p>
      <p className={`mt-2 font-condensed uppercase tracking-[0.22em] ${big ? "text-[12px] text-paper-3/85" : "text-[11px] text-paper-3/70"}`}>
        {label}
      </p>
    </div>
  );
}
