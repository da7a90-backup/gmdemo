import Link from "next/link";
import { WinnerCard } from "@/components/winners-gallery";
import { AnimatedCounter } from "@/components/animated-counter";
import { winners, lifetimeStats } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";

export const metadata = { title: "Winners — Generous Motors" };

export default function WinnersPage() {
  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(700px 350px at 80% 10%, rgba(255,242,0,0.14), transparent 60%), radial-gradient(500px 300px at 0% 100%, rgba(31,64,49,0.12), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-[1400px] px-5 py-10 grid lg:grid-cols-12 gap-6 items-end border-b border-rule-soft">
          <div className="lg:col-span-8">
            <p className="section-eyebrow section-eyebrow-rule">Winners archive · since 2024</p>
            <h1 className="mt-3 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.75rem)" }}>
              Eleven cycles. <span className="accent-serif">Eleven drivers.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] text-ink-2 font-serif">
              Every winner is real, photographed, called on stream, and named here forever.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-end justify-end gap-2">
            <Label tone="brass" variant="outline">Verified · physical drum</Label>
            <Label tone="ink" variant="outline">On camera · every cycle</Label>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 pb-8 grid grid-cols-2 gap-0 md:grid-cols-4 rounded-xl overflow-hidden border-x border-ink/10 mt-6 divide-x divide-ink/10">
          <KPI label="Cars given away" value={lifetimeStats.carsGivenAway} />
          <KPI label="Charities funded" value={lifetimeStats.charitiesFunded} />
          <KPI label="Lifetime payout (USD)" value={lifetimeStats.lifetimePayoutUSD} prefix="$" />
          <KPI label="Donated to charity (USD)" value={lifetimeStats.totalDonatedUSD} prefix="$" tone="charity" />
        </div>
      </section>

      <Announce
        label="Recent winners"
        tone="paper"
        items={[
          "Maria T · Miami · '69 Mustang Fastback",
          "James R · Houston · '23 Corvette Stingray",
          "Angela P · Tampa · Bronco Heritage",
          "Derek M · Atlanta · Challenger SRT",
        ]}
      />

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <ul className="grid rounded-xl overflow-hidden border border-ink/10 bg-paper-3 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-ink/10 lg:divide-y-0 lg:divide-x">
          {winners.map((w, i) => (
            <li key={w.id} className={i >= 3 && i < 6 ? "lg:border-t lg:border-ink/10" : i >= 6 ? "lg:border-t lg:border-ink/10" : ""}>
              <WinnerCard winner={w} />
            </li>
          ))}
        </ul>

        <div className="mt-16 rounded-2xl border border-ink/10 bg-brass p-10 text-center">
          <p className="section-eyebrow">Cycle 12 is open</p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}>
            Your name could be on this wall <span className="accent-serif">next.</span>
          </h2>
          <Link
            href="/tickets"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink text-paper-3 px-6 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-accent hover:border-accent transition-colors"
          >
            Buy tickets <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value, prefix, tone }: { label: string; value: number; prefix?: string; tone?: "charity" }) {
  return (
    <div className="bg-paper-3 p-4 sm:p-5 min-w-0">
      <p
        className={`font-condensed numeral font-semibold text-[clamp(1.5rem,5vw,3rem)] ${tone === "charity" ? "text-charity" : "text-ink"} leading-[0.95] tabular-nums break-words`}
      >
        <AnimatedCounter value={value} prefix={prefix} />
      </p>
      <p className="mt-2 sm:mt-3 font-condensed uppercase tracking-[0.18em] text-[10px] sm:text-[11px] text-ink-2 leading-tight">{label}</p>
    </div>
  );
}
