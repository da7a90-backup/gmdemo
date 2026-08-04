import Link from "next/link";
import { membershipTiers } from "@/lib/mock-data";
import { usd } from "@/lib/format";
import { Check, ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";
import { listMembershipPerks } from "@/lib/server/content-lists";
import { DEFAULT_MEMBERSHIP_PERKS, MEMBERSHIP_BASE_ENTRIES } from "@/lib/membership-data";

export const metadata = { title: "Membership — Generous Motors" };

// Rendered per-request so Kevin's Shopify edits to the loyalty ladder show up.
export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const fetchedPerks = await listMembershipPerks();
  const perks = fetchedPerks.length ? fetchedPerks : DEFAULT_MEMBERSHIP_PERKS;
  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center relative border-b border-rule-soft pb-14">
          <p className="section-eyebrow">Membership · the Club</p>
          <h1 className="mt-4 hero-headline">
            Never miss a draw. <span className="accent-serif">Save 67%.</span>
          </h1>
          <p className="mt-7 text-ink-2 text-lg max-w-xl mx-auto font-serif">
            Members auto-enter every cycle. They also get early access to bonus ticket offers, flash-sale alerts, and drawing reminders straight to their inbox.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Label tone="charity" variant="outline">1-click cancel</Label>
            <Label tone="brass" variant="outline">Early access · bonus offers</Label>
          </div>
        </div>
      </section>

      <Announce
        label="The math"
        tone="ink"
        items={[
          "Premium saves 67% vs one-off",
          "Loyalty grows +1% per month",
          "Capped at 1.5×",
          "Drawing alerts to your inbox",
        ]}
      />

      <section className="mx-auto max-w-[1400px] px-5 py-20">
        <div className="grid rounded-2xl overflow-hidden border border-ink/10 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/10">
          {membershipTiers.map((m, i) => (
            <article
              key={m.id}
              className={`relative p-8 flex flex-col ${
                m.popular ? "bg-charity text-paper-3" : "bg-paper-3 text-ink"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`section-eyebrow ${m.popular ? "!text-paper-3/70" : ""}`}>Tier №{String(i + 1).padStart(2, "0")}</p>
                {m.popular && <Label tone="brass">Best value</Label>}
              </div>
              <h2 className="font-display font-bold text-3xl">{m.name}</h2>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-condensed numeral text-6xl leading-none font-semibold">{usd(m.monthlyUSD)}</span>
                <span className={`${m.popular ? "text-paper-3/70" : "text-ink-3"} text-sm`}>/ month</span>
              </div>
              <p className={`mt-3 font-condensed uppercase tracking-[0.22em] text-[12px]`}>
                <span className="numeral text-base">{m.monthlyEntries}</span> entries · every draw · start {m.multiplierStart.toFixed(2)}×
              </p>
              <ul className="mt-7 space-y-3">
                {m.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-[15px]">
                    <Check size={18} className={`mt-0.5 shrink-0 ${m.popular ? "text-brass-deep" : "text-charity"}`} />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={`/checkout?tier=${m.id}&type=monthly`}
                className={`mt-8 inline-flex h-12 items-center justify-center rounded-full border font-condensed uppercase tracking-[0.22em] text-[12px] ${
                  m.popular ? "bg-brass text-ink border-brass hover:bg-paper-3 hover:border-paper-3" : "bg-ink text-paper-3 border-ink/10 hover:bg-charity hover:border-charity"
                } transition-colors`}
              >
                Join {m.name} <ArrowRight size={14} className="ml-2" />
              </Link>
              <p className={`mt-3 text-center text-[13px] font-serif italic ${m.popular ? "text-paper-3/70" : "text-ink-3"}`}>
                Pause or cancel any time.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-paper-2 border-y border-ink/10">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center border-b border-rule-soft">
          <p className="section-eyebrow section-eyebrow-rule">Loyalty stacks</p>
          <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,4vw,3.25rem)" }}>
            Stay longer. <span className="accent-serif">Get more entries.</span>
          </h2>
          <p className="mt-6 text-ink-2 font-serif">
            Every month you remain a Premium or VIP member, your loyalty multiplier grows by 1% — up to a 1.5× cap. Premium starts at 60 monthly entries and reaches 90 by month 30.
          </p>
        </div>

        <ol className="max-w-3xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-0 rounded-xl overflow-hidden border-x border-ink/10 mt-0 divide-x divide-ink/10">
          {perks.map((step, i) => {
            const mult = Number(step.multiplier) || 0;
            return (
              <li key={i} className="bg-paper-3 p-5 border-b border-ink/10">
                <p className="font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-3">Month {step.month}</p>
                <p className="mt-2 font-condensed numeral font-semibold text-5xl text-charity leading-[0.9]">{mult.toFixed(2)}×</p>
                <p className="mt-2 dateline">{Math.round(MEMBERSHIP_BASE_ENTRIES * mult)} entries / cycle</p>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
