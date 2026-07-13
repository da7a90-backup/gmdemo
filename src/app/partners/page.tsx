"use client";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Wrench } from "lucide-react";
import { usePartners } from "@/lib/partners-store";
import { PartnerMark } from "@/components/partner-mark";
import { Label } from "@/components/sticker";

export default function PartnersPage() {
  const partners = usePartners();
  const charities = partners.filter((p) => p.kind === "charity");
  const sponsors = partners.filter((p) => p.kind === "sponsor");

  return (
    <main className="bg-paper text-ink">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-ink/10 grain">
        <div className="mx-auto max-w-[1400px] px-5 pt-16 pb-12">
          <div className="flex flex-wrap items-center gap-2">
            <Label tone="brass" variant="outline">Every cycle, named</Label>
            <Label tone="ink" variant="outline">{partners.length} partners</Label>
          </div>
          <h1 className="mt-5 hero-headline" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
            The people <span className="accent-serif">behind it.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-2 font-serif">
            Each giveaway runs with a named charity partner and the businesses that build, prep,
            and back the prize. This page is the receipts.
          </p>
        </div>
      </section>

      {/* CHARITY PARTNERS */}
      <section className="mx-auto max-w-[1400px] px-5 py-14">
        <div className="flex items-center gap-2.5">
          <HeartHandshake size={16} className="text-charity" />
          <p className="section-eyebrow on-paper">Charity partners · 10%, every cycle</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {charities.map((p) => (
            <div key={p.id} className="border border-ink/10 bg-paper-4 rounded-2xl p-6 shadow-soft flex flex-col items-start gap-4">
              <PartnerMark partner={p} size="md" />
              {p.blurb && <p className="text-[14px] text-ink-2 font-serif leading-relaxed">{p.blurb}</p>}
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="mt-auto dateline on-paper underline underline-offset-4 hover:text-ink">
                  {p.url.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SPONSORS */}
      <section className="border-t border-ink/10 bg-paper-3">
        <div className="mx-auto max-w-[1400px] px-5 py-14">
          <div className="flex items-center gap-2.5">
            <Wrench size={16} className="text-brass-deep" />
            <p className="section-eyebrow on-paper">Brand partners · behind every giveaway build</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-4">
            {sponsors.map((p) => (
              <div key={p.id} className="border border-ink/10 bg-paper-4 rounded-2xl px-6 py-5 shadow-soft flex flex-col gap-2">
                <PartnerMark partner={p} size="md" />
                {p.blurb && <p className="text-[13px] text-ink-3 font-serif">{p.blurb}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPONSOR CTA */}
      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-[1400px] px-5 py-14 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="hero-headline" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}>
              Sponsor a <span className="accent-serif">giveaway.</span>
            </h2>
            <p className="mt-2 max-w-xl text-[15px] text-ink-2 font-serif">
              Put your brand behind a cycle — logo on the page, the tickets, and the live stream.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-12 items-center gap-2 bg-brass text-ink px-6 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-ink hover:text-paper-3 transition-colors rounded-full"
          >
            Talk to us <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
