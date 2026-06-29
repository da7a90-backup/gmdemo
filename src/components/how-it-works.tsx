import { Ticket, Printer, Tv2, Flag } from "lucide-react";
import { YouTubeFacade } from "@/components/youtube-facade";

const STEPS = [
  {
    icon: Ticket,
    label: "Get Your Ticket",
    body: "Pick a tier. Every ticket is a real chance plus a real donation to this cycle's charity.",
  },
  {
    icon: Printer,
    label: "We Print Your Ticket",
    body: "Every entry is physically printed and dropped into the drum before the draw.",
  },
  {
    icon: Tv2,
    label: "Watch Live",
    body: "Drum spins. A hand pulls one. The camera reads it. We call the winner on stream.",
  },
  {
    icon: Flag,
    label: "Drive It Away",
    body: "Winner picks delivery or cash equivalent. The charity check is presented on the next stream.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="how-it-works">
      <div className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="border-b border-rule-soft pb-10">
          <p className="section-eyebrow section-eyebrow-rule">How it works</p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4.25rem)" }}>
            Four <span className="accent-serif">steps.</span>
          </h2>
        </div>

        <ol className="mt-12 grid border border-ink bg-paper-3 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-ink lg:divide-y-0 lg:divide-x">
          {STEPS.map((s, i) => (
            <li key={s.label} className="relative p-8">
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <span className="font-condensed text-5xl font-semibold text-ink leading-none numeral">№{String(i + 1).padStart(2, "0")}</span>
                <s.icon size={22} className="text-ink-3" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink">{s.label}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-4">
            <p className="section-eyebrow section-eyebrow-rule">The whole process</p>
            <h3 className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}>
              Two minutes <span className="accent-serif">on the drum.</span>
            </h3>
            <p className="mt-3 text-[15px] text-ink-2 font-serif">
              A quick look at what a cycle actually looks like — tickets printed, drum loaded, winner pulled live.
            </p>
          </div>
          <div className="lg:col-span-8 shadow-[8px_8px_0_0_var(--color-ink)]">
            <YouTubeFacade
              videoId="dQw4w9WgXcQ"
              poster="/vehicles/drum-poster.jpg"
              title="How a Generous Motors cycle runs"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
