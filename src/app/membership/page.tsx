import Link from "next/link";
import { membershipTiers } from "@/lib/mock-data";
import { usd } from "@/lib/format";
import { Check, ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";
import { getContentServer } from "@/lib/server/copy";
import { getMembershipVariants } from "@/lib/server/cart";
import { MembershipJoinButton } from "@/components/membership-join";

export const metadata = { title: "Membership — Generous Motors" };

// Rendered per-request so admin/Shopify edits (prices, copy) show up live.
export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const [copy, variants] = await Promise.all([getContentServer(), getMembershipVariants().catch(() => [])]);
  const priceByTier: Record<string, number> = Object.fromEntries(variants.map((v) => [v.tier.toLowerCase(), v.price]));
  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center relative border-b border-rule-soft pb-14">
          <p className="section-eyebrow">{copy["mem.eyebrow"]}</p>
          <h1 className="mt-4 hero-headline">
            {copy["mem.h.lead"]} <span className="accent-serif">{copy["mem.h.accent"]}</span>
          </h1>
          <p className="mt-7 text-ink-2 text-lg max-w-xl mx-auto font-serif">
            {copy["mem.intro"]}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Label tone="charity" variant="outline">{copy["mem.badge1"]}</Label>
            <Label tone="brass" variant="outline">{copy["mem.badge2"]}</Label>
          </div>
        </div>
      </section>

      <Announce
        label={copy["mem.math.label"]}
        tone="ink"
        items={[
          copy["mem.math.i1"],
          copy["mem.math.i2"],
          copy["mem.math.i3"],
          copy["mem.math.i4"],
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
                <p className={`section-eyebrow ${m.popular ? "!text-paper-3/70" : ""}`}>{copy["mem.tierPrefix"]}{String(i + 1).padStart(2, "0")}</p>
                {m.popular && <Label tone="brass">{copy["mem.bestValue"]}</Label>}
              </div>
              <h2 className="font-display font-bold text-3xl">{m.name}</h2>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-condensed numeral text-6xl leading-none font-semibold">{usd(priceByTier[m.name.toLowerCase()] ?? m.monthlyUSD)}</span>
                <span className={`${m.popular ? "text-paper-3/70" : "text-ink-3"} text-sm`}>{copy["mem.perMonth"]}</span>
              </div>
              <p className={`mt-3 font-condensed uppercase tracking-[0.22em] text-[12px]`}>
                <span className="numeral text-base">{m.monthlyEntries}</span> {copy["mem.entriesMeta"]}
              </p>
              <ul className="mt-7 space-y-3">
                {m.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-[15px]">
                    <Check size={18} className={`mt-0.5 shrink-0 ${m.popular ? "text-brass-deep" : "text-charity"}`} />
                    {p}
                  </li>
                ))}
              </ul>
              <MembershipJoinButton
                tier={m.name}
                id={m.id}
                className={`mt-8 inline-flex h-12 items-center justify-center rounded-full border font-condensed uppercase tracking-[0.22em] text-[12px] ${
                  m.popular ? "bg-brass text-ink border-brass hover:bg-paper-3 hover:border-paper-3" : "bg-ink text-paper-3 border-ink/10 hover:bg-charity hover:border-charity"
                } transition-colors`}
              >
                {copy["mem.join"]} {m.name} <ArrowRight size={14} className="ml-2" />
              </MembershipJoinButton>
              <p className={`mt-3 text-center text-[13px] font-serif italic ${m.popular ? "text-paper-3/70" : "text-ink-3"}`}>
                {copy["mem.cancel"]}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
