import Link from "next/link";
import { zeroStats } from "@/lib/mock-data";
import { Drum, Tv2, HeartHandshake, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";
import { listAboutSteps } from "@/lib/server/content-lists";
import { DEFAULT_ABOUT_STEPS } from "@/lib/about-data";
import { getContentServer } from "@/lib/server/copy";
import { getLifetimeStats } from "@/lib/server/editorial";

export const metadata = { title: "About — Generous Motors" };

// Rendered per-request so Kevin's Shopify edits to the process steps show up.
export const dynamic = "force-dynamic";

// Icons are structural (not editable copy), matched to the steps by position.
const STEP_ICONS = [<Drum key="0" />, <Tv2 key="1" />, <HeartHandshake key="2" />];

export default async function AboutPage() {
  const [fetched, copy, dbStats] = await Promise.all([listAboutSteps(), getContentServer(), getLifetimeStats().catch(() => null)]);
  const steps = fetched.length ? fetched : DEFAULT_ABOUT_STEPS;
  const lifetimeStats = { ...zeroStats, ...(dbStats ?? {}) }; // real over an honest zero baseline (no invented figures)
  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 400px at 90% -10%, rgba(255,242,0,0.14), transparent 60%), radial-gradient(700px 350px at 0% 100%, rgba(31,64,49,0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-3xl px-5 py-12 relative">
          <p className="section-eyebrow section-eyebrow-rule">{copy["about.eyebrow"]}</p>
          <h1 className="mt-3 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.75rem)" }}>
            {copy["about.h.lead"]} <span className="accent-serif">{copy["about.h.accent"]}</span>
          </h1>
          <p className="mt-5 text-[16px] text-ink-2 font-serif leading-relaxed dropcap">
            {copy["about.p1"]}
          </p>
          <p className="mt-3 text-[16px] text-ink-2 font-serif leading-relaxed">
            {copy["about.p2"]}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Label tone="charity" variant="outline">{copy["about.badge1"]}</Label>
            <Label tone="brass" variant="outline">{copy["about.badge2"]}</Label>
            <Label tone="ink" variant="outline">{copy["about.badge3"]}</Label>
          </div>
        </div>
      </section>

      <Announce
        label={copy["about.process.label"]}
        tone="ink"
        items={[
          copy["about.process.i1"],
          copy["about.process.i2"],
          copy["about.process.i3"],
          copy["about.process.i4"],
          copy["about.process.i5"],
        ]}
      />

      {/* HOW THE DRAW WORKS */}
      <section className="mx-auto max-w-[1400px] px-5 py-24" id="draw">
        <div className="grid lg:grid-cols-12 gap-8 items-end border-b border-rule-soft pb-12">
          <div className="lg:col-span-8">
            <p className="section-eyebrow section-eyebrow-rule">{copy["about.draw.eyebrow"]}</p>
            <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)" }}>
              {copy["about.draw.h.l1"]} <span className="accent-serif">{copy["about.draw.h.accent"]}</span><br />
              {copy["about.draw.h.l2"]}
            </h2>
          </div>
          <p className="lg:col-span-4 text-ink-2 text-[17px] font-serif leading-[1.55] lg:text-right">
            {copy["about.draw.side"]}
          </p>
        </div>

        <div className="mt-12 grid rounded-2xl overflow-hidden border border-ink/10 bg-paper-3 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10">
          {steps.map((s, i) => (
            <Card key={i} icon={STEP_ICONS[i] ?? STEP_ICONS[STEP_ICONS.length - 1]} title={s.title} index={i + 1}>
              {s.body}
            </Card>
          ))}
        </div>
      </section>

      {/* CHARITY FLOW */}
      <section className="bg-charity text-paper-3 border-y border-ink/10 relative overflow-hidden grain" id="charity">
        <span aria-hidden className="absolute -top-6 -left-6 display-mega text-paper-3/[0.07] select-none">10%</span>
        <div className="relative mx-auto max-w-[1400px] px-5 py-24 grid gap-12 lg:grid-cols-12 border-b border-paper-3/15">
          <div className="lg:col-span-5">
            <p className="section-eyebrow !text-paper-3/70 section-eyebrow-rule">{copy["about.flow.eyebrow"]}</p>
            <h2 className="mt-4 hero-headline">
              {copy["about.flow.h.lead"]} <span className="accent-serif">{copy["about.flow.h.accent"]}</span>
            </h2>
            <p className="mt-7 text-paper-3/85 text-lg font-serif">
              {copy["about.flow.body"]}
            </p>
            <Link
              href="/blog/cycle-12-corvette-charity-pick"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-brass text-ink border border-brass px-5 py-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:border-paper-3 transition"
            >
              {copy["about.flow.cta"]} <ArrowRight size={14} />
            </Link>
          </div>

          <ul className="lg:col-span-7 grid gap-0 rounded-2xl overflow-hidden border border-paper-3 divide-y divide-paper-3/20 self-start">
            <Flow step="01" head={copy["about.flow.s1.head"]} body={copy["about.flow.s1.body"]} />
            <Flow step="02" head={copy["about.flow.s2.head"]} body={copy["about.flow.s2.body"]} />
            <Flow step="03" head={copy["about.flow.s3.head"]} body={copy["about.flow.s3.body"]} />
            <Flow step="04" head={copy["about.flow.s4.head"]} body={copy["about.flow.s4.body"]} />
          </ul>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="mx-auto max-w-[1400px] px-5 py-24">
        <div className="grid rounded-2xl overflow-hidden border border-ink/10 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10 bg-paper-3">
          <Stat label={copy["about.stat.payout"]} big={`$${(lifetimeStats.lifetimePayoutUSD / 1000).toFixed(0)}k`} />
          <Stat label={copy["about.stat.donated"]} big={`$${(lifetimeStats.totalDonatedUSD / 1000).toFixed(0)}k`} tone="charity" />
          <Stat label={copy["about.stat.cars"]} big={String(lifetimeStats.carsGivenAway)} />
        </div>

        <div className="mt-10 rounded-2xl border border-ink/10 bg-paper-3 p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-ink text-paper border border-ink/10">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="font-display font-bold text-xl text-ink">{copy["about.guarantee.title"]}</p>
              <p className="text-[15px] text-ink-2 font-serif">
                {copy["about.guarantee.body"]}
              </p>
            </div>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper-3 px-5 py-3 font-condensed uppercase tracking-[0.22em] text-[12px] text-ink hover:bg-ink hover:text-paper-3 transition"
          >
            <FileText size={14} /> {copy["about.guarantee.cta"]}
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
