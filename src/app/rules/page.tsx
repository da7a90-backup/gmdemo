import type { Metadata } from "next";
import Link from "next/link";
import { activeDraw } from "@/lib/mock-data";
import { getCurrentCycle } from "@/lib/server/editorial";
import { usd } from "@/lib/format";
import { Label } from "@/components/sticker";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { listRuleSections } from "@/lib/server/content-lists";
import { DEFAULT_RULES, fillRuleTokens } from "@/lib/rules-data";
import { getContentServer } from "@/lib/server/copy";

export const metadata: Metadata = {
  title: "Official Rules — Generous Motors",
  description:
    "Official rules for the Generous Motors charitable drawing, conducted in accordance with Fla. Stat. § 849.0935. No purchase or contribution necessary.",
};

// Rendered per-request so Kevin's Shopify edits to the rule sections show up.
export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const c = await getCurrentCycle();
  const cycleNo = c?.cycle ?? activeDraw.cycle;
  const charityName = c?.charity.name || activeDraw.charity.name;
  const v = c?.vehicle ?? activeDraw.vehicle;
  const drawWhen = new Date(c?.drawDateISO || activeDraw.drawDateISO).toLocaleString("en-US", {
    timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });

  // Rule sections from Shopify (fall back to code defaults). Bodies carry {tokens}
  // for the live cycle's values, filled here so the prose stays editable.
  const [fetched, copy] = await Promise.all([listRuleSections(), getContentServer()]);
  const sections = fetched.length ? fetched : DEFAULT_RULES;
  const tokens = {
    cycle: cycleNo,
    charity: charityName,
    vehicle: `${v.year} ${v.make} ${v.model} (${v.trim})`,
    value: usd(v.valueUSD),
    drawWhen,
  };
  return (
    <main className="bg-paper text-ink">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-ink/10 grain">
        <div className="mx-auto max-w-3xl px-5 pt-14 pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Label tone="ink" variant="outline">{copy["rules.cyclePrefix"]}{String(cycleNo).padStart(2, "0")}</Label>
            <Label tone="brass" variant="outline">{copy["rules.statLabel"]}</Label>
          </div>
          <h1 className="mt-5 hero-headline" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
            {copy["rules.h.lead"]} <span className="accent-serif">{copy["rules.h.accent"]}</span>
          </h1>
          <p className="mt-5 text-lg text-ink-2 font-serif">
            {copy["rules.intro"].replace("{cycle}", String(cycleNo))}
          </p>
          <div className="mt-6 border border-ink/10 bg-paper-4 rounded-xl p-5 font-condensed uppercase tracking-[0.12em] text-[14px] text-ink font-bold">
            {copy["rules.noPurchase"]}
          </div>
        </div>
      </section>

      {/* RULES BODY */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <ol className="space-y-9">
          {sections.map((s, i) => (
            <Rule key={i} n={i + 1} title={s.title}>
              {fillRuleTokens(s.body, tokens)}
            </Rule>
          ))}
        </ol>

        <div className="mt-12 border border-ink/10 bg-paper-4 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck size={18} className="text-charity shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink-2 font-serif">
            {copy["rules.questions"]}{" "}
            <Link href="/tickets#faq" className="underline underline-offset-2 text-accent">{copy["rules.faqLink"]}</Link>.
          </p>
        </div>

        <Link
          href="/tickets"
          className="mt-8 inline-flex h-12 items-center gap-2 bg-brass text-ink px-6 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-ink hover:text-paper-3 transition-colors rounded-full"
        >
          {copy["rules.back"]} <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  );
}

function Rule({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="font-condensed numeral text-3xl font-semibold text-brass-deep shrink-0 leading-none">
        №{String(n).padStart(2, "0")}
      </span>
      <div>
        <h2 className="font-display font-bold text-xl text-ink leading-tight">{title}</h2>
        <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
