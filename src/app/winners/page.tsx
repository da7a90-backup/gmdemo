import Link from "next/link";
import { WinnerCard } from "@/components/winners-gallery";
import { AnimatedCounter } from "@/components/animated-counter";
import { winners as mockWinners, lifetimeStats as mockStats } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";
import { getContentServer } from "@/lib/server/copy";
import { listWinners, getLifetimeStats } from "@/lib/server/editorial";

export const metadata = { title: "Winners — Generous Motors" };

// Rendered per-request so Kevin's Shopify copy edits show up.
export const dynamic = "force-dynamic";

export default async function WinnersPage() {
  // Real winners + lifetime stats from the DB, with the mock as fallback (so the
  // deployed demo without a DB still renders); stats merged over mock so no field is missing.
  const [copy, dbWinners, dbStats] = await Promise.all([getContentServer(), listWinners().catch(() => []), getLifetimeStats().catch(() => null)]);
  const winners = dbWinners.length ? dbWinners : mockWinners;
  const lifetimeStats = { ...mockStats, ...(dbStats ?? {}) };
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
            <p className="section-eyebrow section-eyebrow-rule">{copy["winners.page.eyebrow"]}</p>
            <h1 className="mt-3 hero-headline" style={{ fontSize: "clamp(2rem,4.5vw,3.75rem)" }}>
              {copy["winners.page.h.lead"]} <span className="accent-serif">{copy["winners.page.h.accent"]}</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] text-ink-2 font-serif">
              {copy["winners.page.intro"]}
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-end justify-end gap-2">
            <Label tone="brass" variant="outline">{copy["winners.page.badge1"]}</Label>
            <Label tone="ink" variant="outline">{copy["winners.page.badge2"]}</Label>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-5 pb-8 grid grid-cols-2 gap-0 md:grid-cols-4 rounded-xl overflow-hidden border-x border-ink/10 mt-6 divide-x divide-ink/10">
          <KPI label={copy["winners.kpi.cars"]} value={lifetimeStats.carsGivenAway} />
          <KPI label={copy["winners.kpi.charities"]} value={lifetimeStats.charitiesFunded} />
          <KPI label={copy["winners.kpi.payout"]} value={lifetimeStats.lifetimePayoutUSD} prefix="$" />
          <KPI label={copy["winners.kpi.donated"]} value={lifetimeStats.totalDonatedUSD} prefix="$" tone="charity" />
        </div>
      </section>

      <Announce
        label={copy["winners.recent.label"]}
        tone="paper"
        items={[
          copy["winners.recent.i1"],
          copy["winners.recent.i2"],
          copy["winners.recent.i3"],
          copy["winners.recent.i4"],
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
          <p className="section-eyebrow">{copy["winners.cta.eyebrow"]}</p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}>
            {copy["winners.cta.h.lead"]} <span className="accent-serif">{copy["winners.cta.h.accent"]}</span>
          </h2>
          <Link
            href="/tickets"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink text-paper-3 px-6 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-accent hover:border-accent transition-colors"
          >
            {copy["winners.cta.button"]} <ArrowRight size={14} />
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
