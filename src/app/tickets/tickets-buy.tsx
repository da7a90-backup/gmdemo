"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Tv2, HeartHandshake, Lock, Drum, ArrowRight, Quote, PlayCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { activeDraw, ticketTiers, membershipTiers, winners, lifetimeStats } from "@/lib/mock-data";
import { usdc, intl, niceWeekday, niceDate, usd } from "@/lib/format";
import { Label } from "@/components/sticker";
import { AnimatedCounter } from "@/components/animated-counter";
import { FAQAccordion } from "@/components/faq-accordion";
import { LatestWinnerCard } from "@/components/latest-winner-card";

export function TicketsBuy() {
  const router = useRouter();
  const v = activeDraw.vehicle;
  const [activeImage, setActiveImage] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [mode, setMode] = useState<"once" | "monthly">("once");
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prevImage = () => setActiveImage((i) => (i - 1 + v.images.length) % v.images.length);
  const nextImage = () => setActiveImage((i) => (i + 1) % v.images.length);

  const onBuy = (tierId: string, type: "once" | "monthly") => {
    setRedirecting(true);
    // Brief delay sells the "leaving the merchant site for Shopify checkout" handoff.
    setTimeout(() => router.push(`/checkout?tier=${tierId}&type=${type}`), 900);
  };

  return (
    <div className="bg-paper text-ink">
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center">
          <div className="text-center px-5">
            <div className="mx-auto h-10 w-10 border-4 border-[#e1e3e5] border-t-[#1773b0] rounded-full animate-spin" />
            <p className="mt-5 text-[15px] text-[#202223]">Redirecting to secure checkout…</p>
            <p className="mt-1 text-[12px] text-[#6b7177]">Powered by Shopify</p>
          </div>
        </div>
      )}
      {/* MAIN — viewport-fitting: small vehicle + tall buy machine side-by-side */}
      <section className="mx-auto max-w-[1400px] px-5 pt-6 pb-8 grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* LEFT — vehicle gallery (first on mobile too) */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Tall landscape vehicle plate — image only, no duplicated stats */}
          <div className="border-heavy bg-paper-3 relative rounded-xl overflow-hidden">
            {/* Mobile: image on top, thumbs in a horizontal row below.
                Desktop (md+): image on left, thumbs in a vertical strip on right. */}
            <div className="flex flex-col md:flex-row">
              <div
                className="relative md:flex-1 aspect-[16/10] overflow-hidden transition-[background-image] duration-300 touch-pan-y"
                onTouchStart={(e) => {
                  touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }}
                onTouchEnd={(e) => {
                  const start = touchStart.current;
                  touchStart.current = null;
                  if (!start) return;
                  const dx = e.changedTouches[0].clientX - start.x;
                  const dy = e.changedTouches[0].clientY - start.y;
                  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                    if (dx < 0) nextImage(); else prevImage();
                  }
                }}
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.1) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.55) 100%), url(${v.images[activeImage] ?? v.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span className="absolute bottom-2.5 right-2.5 bg-ink/25 text-paper backdrop-blur-[1px] font-condensed uppercase tracking-[0.22em] text-[10px] px-2 py-1 rounded-md">
                  {activeImage + 1} / {v.images.length}
                </span>

                {/* Mobile: transparent chevrons page through the gallery */}
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={prevImage}
                  className="md:hidden absolute left-1.5 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-ink/25 text-paper backdrop-blur-[1px] active:bg-ink/40"
                >
                  <ChevronLeft size={24} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={nextImage}
                  className="md:hidden absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-ink/25 text-paper backdrop-blur-[1px] active:bg-ink/40"
                >
                  <ChevronRight size={24} strokeWidth={2.5} />
                </button>
              </div>

              {v.images.length > 1 && (
                <div className="hidden md:grid md:border-l border-ink/10 bg-paper-3 md:grid-cols-1 md:w-[90px]">
                  {v.images.slice(0, 4).map((src, i) => {
                    const selected = i === activeImage;
                    return (
                      <button
                        key={src + i}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`View image ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        className={`relative aspect-[4/3] md:aspect-auto md:flex-1 border-r md:border-r-0 md:border-b last:border-r-0 md:last:border-b-0 border-ink/10 overflow-hidden transition ${
                          selected ? "ring-2 ring-inset ring-accent" : "hover:opacity-90"
                        }`}
                        style={{
                          backgroundImage: `url(${src})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <span className="sr-only">Image {i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Car name + draw date — right under the gallery */}
          <div className="mt-3">
            <h1 className="hero-headline" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", lineHeight: "1.05" }}>
              {v.year} {v.make} {v.model}
            </h1>
            <p className="mt-1 dateline on-paper">
              Drawn live · {niceWeekday(activeDraw.drawDateISO)}
            </p>
          </div>

          {/* SPEC SHEET — headline figures */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="section-eyebrow on-paper section-eyebrow-rule">Spec sheet · what you&apos;re winning</p>
              <Label tone="brass" variant="outline" size="sm">As configured</Label>
            </div>

            <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-paper/10 bg-ink text-paper rounded-xl overflow-hidden border border-ink/10 shadow-soft">
              {v.headlineSpecs.map((s) => (
                <div key={s.label} className="px-2.5 py-2.5 text-center">
                  <dd className="font-condensed numeral font-bold text-brass leading-none" style={{ fontSize: "clamp(1.15rem, 1.5vw, 1.5rem)" }}>
                    {s.decimals ? (
                      <>{s.value.toFixed(s.decimals)}{s.suffix}</>
                    ) : (
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    )}
                  </dd>
                  <dt className="mt-1 font-condensed uppercase tracking-[0.22em] text-[9px] text-paper/60">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* RIGHT — Compact ticket machine */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 border-heavy-3 bg-paper-4 relative shadow-soft rounded-2xl overflow-hidden">
            {/* One-time / Membership selector */}
            <div className="px-4 pt-3 pb-2.5 bg-paper-3 border-b border-ink/10">
              <div className="flex items-center border border-ink/10 bg-paper-4 rounded-full overflow-hidden">
                <button
                  type="button"
                  aria-pressed={mode === "once"}
                  onClick={() => setMode("once")}
                  className={`flex-1 h-9 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold transition ${
                    mode === "once" ? "bg-ink text-paper" : "text-ink hover:bg-accent-soft"
                  }`}
                >
                  One-time bundles
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "monthly"}
                  onClick={() => setMode("monthly")}
                  className={`flex-1 h-9 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold transition ${
                    mode === "monthly" ? "bg-ink text-paper" : "text-ink hover:bg-accent-soft"
                  }`}
                >
                  Membership · save more
                </button>
              </div>

              {mode === "once" ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticketTiers.map((t) => (
                    <div
                      key={t.id}
                      className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3 pb-2.5 ${
                        t.popular ? "border-brass ring-1 ring-brass" : "border-ink/10"
                      }`}
                    >
                      {t.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0 border border-ink/10 bg-brass text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold rounded-full">
                          ★ Most picked
                        </span>
                      )}
                      <span className="font-condensed numeral text-2xl leading-none font-bold text-ink">{t.entries}</span>
                      <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-3 mt-0.5">
                        {t.entries === 1 ? "ticket" : "tickets"}
                      </span>
                      <span className="mt-1 font-display font-bold text-lg text-ink leading-none">{usdc(t.priceUSD)}</span>
                      <span className={`dateline on-paper mt-1 ${t.blurb ? "" : "invisible"}`}>{t.blurb ?? "—"}</span>
                      <button
                        type="button"
                        onClick={() => onBuy(t.id, "once")}
                        className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-brass text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-ink hover:text-paper transition-colors"
                      >
                        Buy now
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {membershipTiers.map((m) => {
                    const listValue = m.monthlyEntries * 10;
                    const pctOff = Math.round((1 - m.monthlyUSD / listValue) * 100);
                    return (
                      <div
                        key={m.id}
                        className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3 pb-2.5 text-center ${
                          m.popular ? "border-brass ring-1 ring-brass" : "border-ink/10"
                        }`}
                      >
                        {m.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0 border border-ink/10 bg-brass text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold rounded-full">
                            ★ Best value
                          </span>
                        )}
                        <span className="font-display font-bold text-[15px] text-ink leading-none">{m.name}</span>
                        <span className="mt-1.5 font-condensed numeral text-2xl leading-none font-bold text-ink">{m.monthlyEntries}</span>
                        <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-3 mt-0.5">
                          entries / cycle
                        </span>
                        <span className="mt-1.5 flex items-baseline gap-1.5">
                          <s className="font-condensed numeral text-ink-3 text-[13px]" aria-label={`Normal price ${usd(listValue)}`}>
                            {usd(listValue)}
                          </s>
                          <span className="font-display font-bold text-lg text-ink leading-none">
                            {usd(m.monthlyUSD)}<span className="text-ink-3 text-[11px] font-condensed">/mo</span>
                          </span>
                        </span>
                        <span className="mt-1 dateline on-paper">Save {pctOff}%</span>
                        <button
                          type="button"
                          onClick={() => onBuy(m.id, "monthly")}
                          className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-brass text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-ink hover:text-paper transition-colors"
                        >
                          Buy now
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                <Pillar icon={<Lock size={11} />} label="Secure" />
                <Pillar icon={<ShieldCheck size={11} />} label="501(c)(3)" />
                <Pillar icon={<HeartHandshake size={11} />} label="10% → charity" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WINNERS CAROUSEL */}
      <section className="border-y border-ink/10 bg-paper-3">
        <div className="mx-auto max-w-[1400px] px-5 py-14">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="section-eyebrow on-paper section-eyebrow-rule">Recent winners</p>
              <h2 className="mt-3 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)" }}>
                The wall <span className="accent-serif">is real.</span>
              </h2>
            </div>
            <Link
              href="/winners"
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-4 px-4 py-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper rounded-full"
            >
              Full archive <ArrowRight size={12} />
            </Link>
          </div>

          {/* Latest winner — featured above the strip */}
          <div className="mb-7">
            <LatestWinnerCard />
          </div>

          <div className="-mx-5 px-5 overflow-x-auto scrollbar-thin">
            <ul className="flex gap-4 min-w-max pb-3">
              {winners.slice(0, 8).map((w) => (
                <li key={w.id} className="w-[280px] shrink-0 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden">
                  <div
                    className="relative aspect-[5/3] border-b border-ink/10"
                    style={{ background: "linear-gradient(135deg, #16110f 0%, #2e261f 60%, #3d2e1d 100%)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 border border-paper-3/40 rounded-full flex items-center justify-center font-condensed font-bold text-2xl text-paper-3">
                        {w.firstName[0]}{w.lastInitial}
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-0.5 border border-ink/10 rounded-md">
                      Cycle №{String(w.drawCycle).padStart(2, "0")}
                    </span>
                    <button aria-label="Watch reveal" className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-1 border border-ink/10 hover:bg-accent-bright rounded-full">
                      <PlayCircle size={10} /> Reveal
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-display font-bold text-ink leading-tight">{w.firstName} {w.lastInitial}.</p>
                    <p className="dateline on-paper mt-0.5">{w.city}, {w.state} · {niceDate(w.drawDateISO)}</p>
                    <p className="mt-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-accent">{w.vehicle}</p>
                    <p className="mt-2 dateline on-paper">→ {w.charity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-eyebrow on-paper" style={{ paddingLeft: 0 }}>What winners say</p>
            <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)" }}>
              In <span className="accent-serif">their own</span> words.
            </h2>
          </div>

          <ul className="grid gap-5 md:grid-cols-3">
            {winners.slice(0, 3).map((w) => (
              <li key={w.id} className="border border-ink/10 bg-paper-4 p-6 relative shadow-soft rounded-xl">
                <Quote size={28} className="text-accent mb-3" />
                <p className="font-display font-medium text-ink text-[18px] leading-snug">
                  &ldquo;{w.quote}&rdquo;
                </p>
                <div className="mt-5 pt-5 border-t border-ink/10 flex items-center gap-3">
                  <div className="h-11 w-11 border border-ink/10 bg-ink text-paper font-condensed font-bold text-base flex items-center justify-center rounded-full">
                    {w.firstName[0]}{w.lastInitial}
                  </div>
                  <div>
                    <p className="font-display font-bold text-ink leading-tight">{w.firstName} {w.lastInitial}.</p>
                    <p className="dateline on-paper">Winner, Cycle №{String(w.drawCycle).padStart(2, "0")} · {w.vehicle}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CHARITY PARTNER — giving back, this cycle */}
      <section className="bg-ink text-paper-3 border-y border-ink/10 relative overflow-hidden grain grain-dark">
        <span aria-hidden className="absolute -top-10 -right-10 display-mega text-paper-3/[0.08] select-none">10%</span>
        <div className="relative mx-auto max-w-[1400px] px-5 py-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="section-eyebrow on-dark section-eyebrow-rule">Giving back · this cycle&apos;s partner</p>
            <h2 className="mt-4 hero-headline on-dark" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              10% of cycle {activeDraw.cycle} goes to<br />
              <span className="accent-serif">{activeDraw.charity.name}.</span>
            </h2>
            <p className="mt-5 max-w-xl text-paper-3/90 font-serif text-lg">
              &ldquo;{activeDraw.charity.blurb}&rdquo;
            </p>
            <p className="mt-4 max-w-xl text-paper-3/80">
              Paid on <em>gross</em> — before the car is bought, before payroll, before any expense. Receipt is wired within seven business days of the close and published on the blog.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/about#charity"
                className="inline-flex h-12 items-center gap-2 bg-accent-bright text-ink px-5 border border-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper-3 btn-poly"
              >
                How the funds flow <ArrowRight size={14} />
              </Link>
              <Link
                href="/blog/cycle-12-corvette-charity-pick"
                className="inline-flex h-12 items-center gap-2 border border-paper-3 px-5 text-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:text-ink rounded-full"
              >
                Why we picked them
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 border border-paper-3 bg-ink-raised rounded-2xl overflow-hidden">
            <div className="border-b border-paper-3 px-5 py-3 flex items-baseline justify-between">
              <p className="section-eyebrow on-dark">Lifetime · all cycles</p>
              <p className="dateline on-dark">all 501(c)(3) cycles</p>
            </div>
            <div className="p-6">
              <p className="font-condensed numeral font-bold leading-none text-accent-bright" style={{ fontSize: "4.5rem" }}>
                {usd(lifetimeStats.totalDonatedUSD)}
              </p>
              <p className="mt-2 font-condensed uppercase tracking-[0.22em] text-[12px] text-paper-3">
                Donated to partner charities
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-paper-3/30">
                <KCharity label="Cycles run" v={String(lifetimeStats.cyclesRun)} />
                <KCharity label="Charities funded" v={String(lifetimeStats.charitiesFunded)} />
                <KCharity label="Cars given away" v={String(lifetimeStats.carsGivenAway)} />
                <KCharity label="Entries verified" v={intl(lifetimeStats.ticketsCounted)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="bg-bg-dark text-fg border-b border-ink/10 relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 py-12 grid gap-8 md:grid-cols-3 items-center">
          <Trust icon={<Tv2 size={28} />} title="Drawn live" body="Facebook Live, archived to YouTube." />
          <Trust icon={<Drum size={28} />} title="Real paper drum" body="Every entry is printed and drawn from a physical drum." />
          <Trust icon={<HeartHandshake size={28} />} title="10% to charity" body={`Cycle ${activeDraw.cycle}: ${activeDraw.charity.name}.`} />
        </div>
      </section>

      {/* FAQ + Official Rules link (Fla. Stat. § 849.0935 disclosure) */}
      <FAQAccordion />
    </div>
  );
}

function Pillar({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 border border-ink/10 bg-paper-3 rounded-lg">
      <span className="text-ink-2">{icon}</span>
      <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-2 font-semibold whitespace-nowrap">{label}</span>
    </div>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="inline-flex h-14 w-14 items-center justify-center bg-accent-bright text-ink border border-paper shrink-0 rounded-full">{icon}</span>
      <div>
        <p className="font-display font-bold text-2xl text-fg">{title}</p>
        <p className="mt-1 text-fg-2 font-serif">{body}</p>
      </div>
    </div>
  );
}

function KCharity({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <p className="font-condensed numeral font-bold text-2xl leading-none text-paper-3">{v}</p>
      <p className="mt-1 font-condensed uppercase tracking-[0.22em] text-[11px] text-paper-3/70">{label}</p>
    </div>
  );
}
