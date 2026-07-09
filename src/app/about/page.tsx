import Link from "next/link";
import { lifetimeStats } from "@/lib/mock-data";
import { Drum, Tv2, HeartHandshake, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";

export const metadata = { title: "About — Generous Motors" };

export default function AboutPage() {
  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 400px at 90% -10%, rgba(235,200,82,0.14), transparent 60%), radial-gradient(700px 350px at 0% 100%, rgba(31,64,49,0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-3xl px-5 py-12 relative">
          <p className="section-eyebrow section-eyebrow-rule">About · Generosity in Motion</p>
          <h1 className="mt-3 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.75rem)" }}>
            We give cars away <span className="accent-serif">on camera.</span>
          </h1>
          <p className="mt-5 text-[16px] text-ink-2 font-serif leading-relaxed dropcap">
            Generous Motors was founded on a simple belief: good things happen when good people come together. We make giving exciting, transparent, and rewarding.
          </p>
          <p className="mt-3 text-[16px] text-ink-2 font-serif leading-relaxed">
            Each 60-day cycle partners with a new nonprofit. Ten percent of every cycle&apos;s gross profits goes directly to that cycle&apos;s nonprofit partner.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Label tone="charity" variant="outline">Registered 501(c)(3)</Label>
            <Label tone="brass" variant="outline">Drawn live, every cycle</Label>
            <Label tone="ink" variant="outline">10% of gross to charity</Label>
          </div>
        </div>
      </section>

      <Announce
        label="The whole process"
        tone="ink"
        items={[
          "Printed in a drum",
          "On camera",
          "Fully transparent",
          "Streamed, archived",
          "10% of gross paid first",
        ]}
      />

      {/* HOW THE DRAW WORKS */}
      <section className="mx-auto max-w-[1400px] px-5 py-24" id="draw">
        <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-rule-soft pb-12">
          <div className="lg:col-span-8">
            <p className="section-eyebrow section-eyebrow-rule">How the draw works</p>
            <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)" }}>
              Software-fair. <span className="accent-serif">Live-streamed.</span><br />
              Fully transparent.
            </h2>
          </div>
          <p className="lg:col-span-4 text-ink-2 text-[17px] font-serif leading-[1.55] lg:text-right">
            Every drawing is conducted live via livestream — transparent, real-time, and verifiable.
          </p>
        </div>

        <div className="mt-12 grid rounded-2xl overflow-hidden border border-ink/10 bg-paper-3 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10">
          <Card icon={<Drum />} title="Printed and dropped" index={1}>
            Every entry is printed onto a paper ticket and dropped into the drum before the draw. Each ticket has a unique GM-cycle-buyer ID.
          </Card>
          <Card icon={<Tv2 />} title="Pulled on camera" index={2}>
            The grand-prize drawing is fully livestreamed in front of thousands of viewers. One ticket is pulled. The ID is read aloud and into the chat. The full clip stays in the archive.
          </Card>
          <Card icon={<HeartHandshake />} title="Winner announced live" index={3}>
            The winner is announced in real time, on stream. Win or not, every ticket bought helps fund the cycle&apos;s charity partner.
          </Card>
        </div>
      </section>

      {/* CHARITY FLOW */}
      <section className="bg-charity text-paper-3 border-y border-ink/10 relative overflow-hidden grain" id="charity">
        <span aria-hidden className="absolute -top-6 -left-6 display-mega text-paper-3/[0.07] select-none">10%</span>
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 grid gap-12 lg:grid-cols-12 border-b border-paper-3/15">
          <div className="lg:col-span-5">
            <p className="section-eyebrow !text-paper-3/70 section-eyebrow-rule">Charity flow</p>
            <h2 className="mt-4 hero-headline">
              10% of gross. <span className="accent-serif">Paid first.</span>
            </h2>
            <p className="mt-7 text-paper-3/85 text-lg font-serif">
              Most raffles talk about &ldquo;net&rdquo; donations. We pay charity on <em>gross</em> — before the car is bought, before payroll, before any expense. It is a smaller number than &ldquo;net&rdquo; would let us say. It is a number we can defend.
            </p>
            <Link
              href="/blog/cycle-12-corvette-charity-pick"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-brass text-ink border border-brass px-5 py-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:border-paper-3 transition"
            >
              How cycle 12&apos;s charity was picked <ArrowRight size={14} />
            </Link>
          </div>

          <ul className="lg:col-span-7 grid gap-0 rounded-2xl overflow-hidden border border-paper-3 divide-y divide-paper-3/20 self-start">
            <Flow step="01" head="Cycle ends" body="Ticket sales close. Gross is locked. Numbers are published." />
            <Flow step="02" head="10% goes to the partner" body="The partner charity receives the donation directly." />
            <Flow step="03" head="Receipt produced" body="Each cycle produces a receipt for the charity&apos;s records." />
            <Flow step="04" head="Next cycle" body="A new cycle starts immediately with a new vehicle and a new nonprofit partner." />
          </ul>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="grid rounded-2xl overflow-hidden border border-ink/10 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10 bg-paper-3">
          <Stat label="Lifetime payout (USD)" big={`$${(lifetimeStats.lifetimePayoutUSD / 1000).toFixed(0)}k`} />
          <Stat label="Donated to charity (USD)" big={`$${(lifetimeStats.totalDonatedUSD / 1000).toFixed(0)}k`} tone="charity" />
          <Stat label="Cars given away" big={String(lifetimeStats.carsGivenAway)} />
        </div>

        <div className="mt-10 rounded-2xl border border-ink/10 bg-paper-3 p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-ink text-paper border border-ink/10">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="font-display font-bold text-xl text-ink">Transparent by design.</p>
              <p className="text-[15px] text-ink-2 font-serif">
                Every drawing is livestreamed in front of thousands. Every cycle has a receipt for the partner charity.
              </p>
            </div>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper-3 px-5 py-3 font-condensed uppercase tracking-[0.22em] text-[12px] text-ink hover:bg-ink hover:text-paper-3 transition"
          >
            <FileText size={14} /> Read the receipts
          </Link>
        </div>
      </section>
    </div>
  );
}

function Card({ icon, title, children, index }: { icon: React.ReactNode; title: string; children: React.ReactNode; index: number }) {
  return (
    <article className="p-8">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <span className="font-condensed text-5xl font-semibold text-ink leading-none numeral">№{String(index).padStart(2, "0")}</span>
        <span className="text-ink-3">{icon}</span>
      </div>
      <h3 className="font-display font-bold text-xl text-ink">{title}</h3>
      <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{children}</p>
    </article>
  );
}

function Flow({ step, head, body }: { step: string; head: string; body: string }) {
  return (
    <li className="flex gap-5 p-5">
      <span className="font-condensed numeral text-3xl font-semibold text-brass shrink-0 leading-none">{step}</span>
      <div>
        <p className="font-display font-bold text-lg leading-tight">{head}</p>
        <p className="text-[15px] text-paper-3/80">{body}</p>
      </div>
    </li>
  );
}

function Stat({ label, big, tone }: { label: string; big: string; tone?: "charity" }) {
  return (
    <div className="p-6">
      <p className={`font-condensed numeral font-semibold text-5xl tabular-nums leading-[0.9] ${tone === "charity" ? "text-charity" : "text-ink"}`}>{big}</p>
      <p className="mt-3 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2">{label}</p>
    </div>
  );
}
