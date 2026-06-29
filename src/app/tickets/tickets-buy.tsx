"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Minus, Plus, ShieldCheck, Tv2, HeartHandshake, Lock, Drum, ArrowRight, Quote, PlayCircle,
} from "lucide-react";
import { activeDraw, ticketTiers, winners, lifetimeStats } from "@/lib/mock-data";
import { usdc, intl, niceWeekday, niceDate, usd } from "@/lib/format";

const PRESETS = [1, 5, 10, 25, 50, 100];
const POPULAR = 10;

function priceFor(qty: number): { total: number; saved: number } {
  const tier = ticketTiers.find((t) => t.entries === qty);
  const total = tier ? tier.priceUSD : qty * 10;
  const saved = qty * 10 - total;
  return { total, saved };
}

export function TicketsBuy() {
  const [qty, setQty] = useState<number>(POPULAR);
  const router = useRouter();
  const { total, saved } = useMemo(() => priceFor(qty), [qty]);
  const remaining = activeDraw.ticketsCap - activeDraw.ticketsSold;
  const charityCut = +(total * 0.10).toFixed(2);
  const v = activeDraw.vehicle;
  const [activeImage, setActiveImage] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  const onBuy = () => {
    setRedirecting(true);
    const tier = ticketTiers.find((t) => t.entries === qty);
    const target = tier ? `/checkout?tier=${tier.id}&type=once` : `/checkout?qty=${qty}`;
    // Brief delay sells the "leaving the merchant site for Shopify checkout" handoff.
    setTimeout(() => router.push(target), 900);
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
      {/* PRIZE STRIP */}
      <div className="bg-bg-dark text-fg border-b-2 border-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-3 flex flex-wrap items-center justify-between gap-3 font-condensed uppercase tracking-[0.22em] text-[12px]">
          <span><span className="text-accent-bright">Prize:</span> {v.year} {v.make} {v.model}</span>
          <span><span className="text-fg-2">Value</span> <span className="numeral text-base text-fg">${(v.valueUSD / 1000).toFixed(0)}k</span></span>
          <span><span className="text-fg-2">Drawn live</span> <span className="text-fg">{niceWeekday(activeDraw.drawDateISO)}</span></span>
        </div>
      </div>

      {/* MAIN — viewport-fitting: small vehicle + tall buy machine side-by-side */}
      <section className="mx-auto max-w-[1400px] px-5 pt-6 pb-8 grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* LEFT — vehicle (compact) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-baseline gap-3">
            <span className="font-condensed numeral font-bold text-[2.25rem] text-accent leading-none">
              №{String(activeDraw.cycle).padStart(2, "0")}
            </span>
            <div>
              <p className="dateline on-paper">Cycle · drawn {niceWeekday(activeDraw.drawDateISO)}</p>
              <p className="mt-0.5 font-condensed uppercase tracking-[0.22em] text-[11px] font-semibold text-charity">
                10% to {activeDraw.charity.name}
              </p>
            </div>
          </div>

          <h1 className="hero-headline mt-2" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: "1.05" }}>
            Win <span className="accent-serif">the</span> {v.year} {v.make} {v.model}.
          </h1>

          {/* Short, landscape vehicle plate — image only, no duplicated stats */}
          <div className="mt-3 border-heavy bg-paper-3 relative">
            {/* Mobile: image on top, thumbs in a horizontal row below.
                Desktop (md+): image on left, thumbs in a vertical strip on right. */}
            <div className="flex flex-col md:flex-row">
              <div
                className="relative md:flex-1 aspect-[2/1] overflow-hidden transition-[background-image] duration-300"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.1) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.55) 100%), url(${v.images[activeImage] ?? v.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span className="absolute top-2.5 left-2.5 bg-brass text-paper-3 font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink">
                  {v.year} · {v.make}
                </span>
                <span className="absolute top-2.5 right-2.5 bg-brass text-paper-3 font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink">
                  Worth · {usd(v.valueUSD)}
                </span>
                <span className="absolute bottom-2.5 right-2.5 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2 py-1 border border-ink">
                  {activeImage + 1} / {v.images.length}
                </span>
              </div>

              {v.images.length > 1 && (
                <div className="border-t-2 md:border-t-0 md:border-l-2 border-ink bg-paper-3 grid grid-cols-4 md:grid-cols-1 md:w-[90px]">
                  {v.images.slice(0, 4).map((src, i) => {
                    const selected = i === activeImage;
                    return (
                      <button
                        key={src + i}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`View image ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        className={`relative aspect-[4/3] md:aspect-auto md:flex-1 border-r-2 md:border-r-0 md:border-b-2 last:border-r-0 md:last:border-b-0 border-ink overflow-hidden transition ${
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

            <dl className="grid grid-cols-3 divide-x-2 divide-ink border-t-2 border-ink">
              <Cell k="Sold" v={intl(activeDraw.ticketsSold)} />
              <Cell k="Left" v={intl(remaining)} tone="accent" />
              <Cell k="Cap" v={intl(activeDraw.ticketsCap)} />
            </dl>
          </div>
        </div>

        {/* RIGHT — Compact ticket machine, single row of 6 */}
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-24 border-heavy-3 bg-paper-4 relative shadow-[8px_8px_0_0_var(--color-ink)]">
            <div className="bg-accent-bright text-ink border-b-2 border-ink px-5 py-2.5 flex items-center justify-between">
              <span className="font-condensed uppercase tracking-[0.24em] text-[12px] font-bold">★ Buy raffle tickets</span>
              <span className="font-condensed uppercase tracking-[0.22em] text-[11px]">$10 / ticket</span>
            </div>

            <div className="px-5 pt-3 pb-2.5 flex items-end justify-between gap-3 border-b-2 border-ink">
              <div>
                <p className="section-eyebrow on-paper">Today&apos;s price</p>
                <p className="mt-0.5 font-display font-bold leading-none text-ink" style={{ fontSize: "2.5rem", lineHeight: "0.85" }}>
                  $10<span className="text-ink-3 text-base align-top ml-1">/ticket</span>
                </p>
              </div>
              <p className="dateline on-paper text-right">
                Bundles save<br />up to <span className="text-accent">$300</span>
              </p>
            </div>

            <div className="px-5 py-4 border-b-2 border-ink bg-paper-3">
              <p className="section-eyebrow on-paper">Choose your quantity</p>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PRESETS.map((n) => {
                  const selected = n === qty;
                  const tier = ticketTiers.find((t) => t.entries === n);
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setQty(n)}
                      className={`relative h-[78px] border-2 flex flex-col items-center justify-center transition ${
                        selected ? "border-ink bg-ink text-paper" : "border-ink bg-paper-4 text-ink hover:bg-accent-soft"
                      }`}
                    >
                      <span className="font-condensed numeral text-2xl leading-none font-bold">{n}</span>
                      <span className={`font-condensed uppercase tracking-[0.18em] text-[9px] mt-0.5 ${selected ? "text-paper/70" : "text-ink-3"}`}>
                        {n === 1 ? "tkt" : "tkts"}
                      </span>
                      {tier && tier.priceUSD && (
                        <span className={`font-condensed numeral text-[12px] mt-0.5 ${selected ? "text-accent-bright" : "text-accent"} font-bold`}>
                          ${tier.priceUSD}
                        </span>
                      )}
                      {n === POPULAR && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0 border border-ink bg-accent-bright text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold">
                          ★ Top
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center border-2 border-ink bg-paper-4">
                <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11 flex items-center justify-center border-r-2 border-ink hover:bg-ink hover:text-paper">
                  <Minus size={16} />
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 py-1">
                  <input
                    type="number"
                    aria-label="Custom quantity"
                    min={1}
                    max={500}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                    className="w-16 text-center bg-transparent font-condensed font-bold text-2xl text-ink outline-none"
                  />
                  <p className="dateline on-paper">tickets</p>
                </div>
                <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(500, q + 1))} className="h-11 w-11 flex items-center justify-center border-l-2 border-ink hover:bg-ink hover:text-paper">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="px-5 pt-3 pb-5">
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2 font-semibold">
                  {qty} × $10.00
                </span>
                {saved > 0 && (
                  <span className="inline-flex items-center gap-1 bg-charity text-paper-3 px-2 py-0.5 font-condensed uppercase tracking-[0.22em] text-[10px] border border-ink">
                    Save ${saved}.00
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between mb-3 pb-3 border-b-2 border-ink">
                <span className="font-condensed uppercase tracking-[0.22em] text-[12px] text-ink-2 font-semibold">Total</span>
                <span className="font-display font-bold numeral text-ink leading-none" style={{ fontSize: "2.75rem" }}>
                  {usdc(total)}
                </span>
              </div>

              <button
                onClick={onBuy}
                className="w-full inline-flex items-center justify-center gap-2 bg-brass text-paper-3 border-heavy-3 font-condensed uppercase tracking-[0.24em] text-[14px] font-bold hover:bg-ink hover:text-paper-3 transition-colors btn-poly-lg"
                style={{ height: "56px" }}
              >
                Buy {qty} {qty === 1 ? "ticket" : "tickets"} — {usdc(total)}
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <Pillar icon={<Lock size={11} />} label="Secure" />
                <Pillar icon={<ShieldCheck size={11} />} label="501(c)(3)" />
                <Pillar icon={<HeartHandshake size={11} />} label={`${usdc(charityCut)} → charity`} />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CHARITY PARTNER — giving back, this cycle */}
      <section className="bg-charity text-paper-3 border-y-2 border-ink relative overflow-hidden grain grain-dark">
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
                className="inline-flex h-12 items-center gap-2 bg-accent-bright text-ink px-5 border-2 border-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper-3 btn-poly"
              >
                How the funds flow <ArrowRight size={14} />
              </Link>
              <Link
                href="/blog/cycle-12-corvette-charity-pick"
                className="inline-flex h-12 items-center gap-2 border-2 border-paper-3 px-5 text-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:text-charity"
              >
                Why we picked them
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 border-2 border-paper-3 bg-charity-hover">
            <div className="border-b-2 border-paper-3 px-5 py-3 flex items-baseline justify-between">
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
              <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t-2 border-paper-3/30">
                <KCharity label="Cycles run" v={String(lifetimeStats.cyclesRun)} />
                <KCharity label="Charities funded" v={String(lifetimeStats.charitiesFunded)} />
                <KCharity label="Cars given away" v={String(lifetimeStats.carsGivenAway)} />
                <KCharity label="Entries verified" v={intl(lifetimeStats.ticketsCounted)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WINNERS CAROUSEL */}
      <section className="border-y-2 border-ink bg-paper-3">
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
              className="inline-flex items-center gap-2 border-2 border-ink bg-paper-4 px-4 py-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper"
            >
              Full archive <ArrowRight size={12} />
            </Link>
          </div>

          <div className="-mx-5 px-5 overflow-x-auto scrollbar-thin">
            <ul className="flex gap-4 min-w-max pb-3">
              {winners.slice(0, 8).map((w) => (
                <li key={w.id} className="w-[280px] shrink-0 border-2 border-ink bg-paper-4">
                  <div
                    className="relative aspect-[5/3] border-b-2 border-ink"
                    style={{ background: "linear-gradient(135deg, #16110f 0%, #2e261f 60%, #3d2e1d 100%)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 border-2 border-paper-3/40 flex items-center justify-center font-condensed font-bold text-2xl text-paper-3">
                        {w.firstName[0]}{w.lastInitial}
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-0.5 border border-ink">
                      Cycle №{String(w.drawCycle).padStart(2, "0")}
                    </span>
                    <button aria-label="Watch reveal" className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-1 border border-ink hover:bg-accent-bright">
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
      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="section-eyebrow on-paper" style={{ paddingLeft: 0 }}>What winners say</p>
            <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)" }}>
              In <span className="accent-serif">their own</span> words.
            </h2>
          </div>

          <ul className="grid gap-5 md:grid-cols-3">
            {winners.slice(0, 3).map((w) => (
              <li key={w.id} className="border-2 border-ink bg-paper-4 p-6 relative shadow-[5px_5px_0_0_var(--color-ink)]">
                <Quote size={28} className="text-accent mb-3" />
                <p className="font-display font-medium text-ink text-[18px] leading-snug">
                  &ldquo;{w.quote}&rdquo;
                </p>
                <div className="mt-5 pt-5 border-t-2 border-ink flex items-center gap-3">
                  <div className="h-11 w-11 border-2 border-ink bg-ink text-paper font-condensed font-bold text-base flex items-center justify-center">
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

      {/* TRUST BAND */}
      <section className="bg-bg-dark text-fg border-b-2 border-ink relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 py-12 grid gap-8 md:grid-cols-3 items-center">
          <Trust icon={<Tv2 size={28} />} title="Drawn live" body="Facebook Live, archived to YouTube." />
          <Trust icon={<Drum size={28} />} title="Real paper drum" body="Every entry is printed and drawn from a physical drum." />
          <Trust icon={<HeartHandshake size={28} />} title="10% to charity" body={`Cycle ${activeDraw.cycle}: ${activeDraw.charity.name}.`} />
        </div>
      </section>
    </div>
  );
}

function Cell({ k, v, tone }: { k: string; v: string; tone?: "accent" }) {
  return (
    <div className="p-4 bg-paper-3 text-center">
      <dt className="dateline on-paper">{k}</dt>
      <dd className={`mt-1 font-condensed font-bold numeral text-2xl leading-none ${tone === "accent" ? "text-accent" : "text-ink"}`}>{v}</dd>
    </div>
  );
}

function Pillar({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 border-2 border-ink bg-paper-3">
      <span className="text-ink-2">{icon}</span>
      <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-2 font-semibold whitespace-nowrap">{label}</span>
    </div>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="inline-flex h-14 w-14 items-center justify-center bg-accent-bright text-ink border-2 border-paper shrink-0">{icon}</span>
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
