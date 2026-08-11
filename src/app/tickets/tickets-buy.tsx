"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Tv2, HeartHandshake, Lock, Drum, ArrowRight, PlayCircle,
} from "lucide-react";
import { ticketTiers, membershipTiers } from "@/lib/mock-data";
import { usePrizeCycle, useLifetimeStats } from "@/lib/cycle-store";
import { usePricing } from "@/lib/pricing-store";
import { useWinners } from "@/lib/winners-store";
import { usdc, intl, niceWeekday, niceDate, usd } from "@/lib/format";
import { Label } from "@/components/sticker";
import { AnimatedCounter } from "@/components/animated-counter";
import { CountdownBar } from "@/components/countdown";
import { FAQAccordion } from "@/components/faq-accordion";
import { LatestWinnerCard } from "@/components/latest-winner-card";
import { PromoBanner } from "@/components/promo-banner";
import { resolvePromo, getPromoConfig, isPromoLive, PROMOS_EVENT, type PromoTier } from "@/lib/promotions";
import { trackVisit, track, describeTrigger } from "@/lib/analytics";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { startTicketCheckout, startMembershipCheckout, utmAttrs } from "@/lib/checkout";
import { Copy, useCopy } from "@/components/copy";
import { CharityName, CharityBlurb, CyclePartnerBadge } from "@/components/cycle-partner";

export function TicketsBuy() {
  const t = useCopy();
  const router = useRouter();
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;
  const [redirecting, setRedirecting] = useState(false);
  const [mode, setMode] = useState<"once" | "monthly">("once");
  const winners = useWinners();
  const [promo, setPromo] = useState<PromoTier | null>(null);
  const searchParams = useSearchParams();
  const stats = useLifetimeStats();
  const pricing = usePricing();
  const [isMember, setIsMember] = useState(false);

  // Real signed-in member? (Shopify OTP session → users.is_member). Drives the member multiplier.
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me").then((r) => r.json()).then((j) => { if (alive) setIsMember(!!j?.data?.isMember); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Promotion pickup: membership session, ?promo=CODE links, or utm_* ad campaigns.
  useEffect(() => {
    const resolve = () => {
      const p = resolvePromo(searchParams, isMember, getPromoConfig());
      setPromo(p);
      trackVisit({
        source: p?.id ?? "organic",
        channel: p?.label ?? "Organic",
        trigger: describeTrigger(searchParams, p?.id === "member"),
        page: "/tickets",
      });
    };
    resolve();
    window.addEventListener(PROMOS_EVENT, resolve);
    return () => window.removeEventListener(PROMOS_EVENT, resolve);
  }, [searchParams, isMember]);

  const mult = promo?.multiplier ?? 1;

  const onBuy = async (tierId: string, type: "once" | "monthly") => {
    const item = type === "once"
      ? ticketTiers.find((t) => t.id === tierId)
      : membershipTiers.find((m) => m.id === tierId);
    track({
      type: "purchase",
      source: promo?.id ?? "organic",
      channel: promo?.label ?? "Organic",
      trigger: describeTrigger(searchParams, promo?.id === "member"),
      page: "/tickets",
      item: item ? ("name" in item ? item.name : tierId) : tierId,
      amountUSD: item ? ("priceUSD" in item ? item.priceUSD : item.monthlyUSD) : undefined,
    });
    setRedirecting(true);

    // Real Shopify checkout for one-time ticket bundles (membership = selling plan,
    // not wired yet → falls through to the demo checkout).
    if (type === "once" && item && "entries" in item) {
      const redirected = await startTicketCheckout({
        entries: item.entries,
        multiplier: mult,
        attribution: {
          attr_source: promo?.id ?? "organic",
          attr_channel: promo?.label ?? "Organic",
          attr_promo: promo?.code ?? (promo && promo.id !== "organic" ? promo.id : ""),
          attr_trigger: describeTrigger(searchParams, promo?.id === "member") ?? "",
          attr_page: "/tickets",
          ...utmAttrs(searchParams),
        },
      });
      if (redirected) return;
    }

    // Membership tier → real Shopify subscription checkout.
    if (type === "monthly" && item && "name" in item) {
      const redirected = await startMembershipCheckout(item.name, {
        attr_source: promo?.id ?? "organic",
        attr_channel: promo?.label ?? "Organic",
        attr_page: "/tickets",
        ...utmAttrs(searchParams),
      });
      if (redirected) return;
    }

    // Fallback: simulated checkout (Shopify unavailable).
    const promoQS = promo ? `&promo=${encodeURIComponent(promo.code ?? promo.id)}` : "";
    router.push(`/checkout?tier=${tierId}&type=${type}${promoQS}`);
  };

  return (
    <div className="bg-paper text-ink">
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center">
          <div className="text-center px-5">
            <div className="mx-auto h-10 w-10 border-4 border-[#e1e3e5] border-t-[#1773b0] rounded-full animate-spin" />
            <p className="mt-5 text-[15px] text-[#202223]">{t("tickets.redirecting")}</p>
            <p className="mt-1 text-[12px] text-[#6b7177]">{t("tickets.poweredBy")}</p>
          </div>
        </div>
      )}
      {/* Active promotion — triggered by login, ?promo= links, or utm_* params */}
      {promo && <PromoBanner promo={promo} />}

      {/* MAIN — viewport-fitting: small vehicle + tall buy machine side-by-side */}
      <section className="mx-auto max-w-[1400px] px-5 pt-6 pb-8 grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* LEFT — vehicle gallery (first on mobile too) */}
        <div className="lg:col-span-7 flex flex-col">
          <VehicleGallery />

          {/* Car name + draw date — right under the gallery */}
          <div className="mt-3">
            <h1 className="hero-headline" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", lineHeight: "1.05" }}>
              {v.year} {v.make} {v.model}
            </h1>
            <p className="mt-1 dateline on-paper">
              <Copy k="tickets.drawnLivePrefix" /> {niceWeekday(activeDraw.drawDateISO)}
            </p>
          </div>

        </div>

        {/* RIGHT — Compact ticket machine */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 border-heavy-3 bg-paper-4 relative shadow-soft rounded-2xl overflow-hidden">
            {promo && isPromoLive(promo) ? (
              <CountdownBar
                targetISO={promo.endISO ?? activeDraw.drawDateISO}
                label={promo.countdownLabel ?? "Promo closes in"}
              />
            ) : (
              <CountdownBar targetISO={activeDraw.drawDateISO} label={<Copy k="tickets.drawLabel" />} />
            )}

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
                  <Copy k="tickets.toggle.once" />
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "monthly"}
                  onClick={() => setMode("monthly")}
                  className={`flex-1 h-9 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold transition ${
                    mode === "monthly" ? "bg-ink text-paper" : "text-ink hover:bg-accent-soft"
                  }`}
                >
                  <Copy k="tickets.toggle.monthly" />
                </button>
              </div>

              {mode === "once" ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticketTiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3 pb-2.5 ${
                        tier.popular ? "border-brass ring-1 ring-brass" : "border-ink/10"
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0 border border-ink/10 bg-brass text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold rounded-full">
                          <Copy k="tickets.mostPicked" />
                        </span>
                      )}
                      <span className="flex items-baseline gap-1.5">
                        {mult > 1 && (
                          <s className="font-condensed numeral text-sm text-ink-3" aria-label={`Normally ${tier.entries}`}>
                            {intl(tier.entries)}
                          </s>
                        )}
                        <span className="font-condensed numeral text-2xl leading-none font-bold text-ink">
                          {intl(tier.entries * mult)}
                        </span>
                      </span>
                      <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-3 mt-0.5">
                        {tier.entries * mult === 1 ? t("tickets.unitSingular") : t("tickets.unitPlural")}
                      </span>
                      <span className="mt-1 font-display font-bold text-lg text-ink leading-none">{usdc(pricing.ticketPrice(tier.entries) ?? tier.priceUSD)}</span>
                      <button
                        type="button"
                        onClick={() => onBuy(tier.id, "once")}
                        className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
                      >
                        <Copy k="tickets.buy" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {membershipTiers.map((m) => {
                    const listValue = m.monthlyEntries * 10;
                    const monthly = pricing.membershipPrice(m.name) ?? m.monthlyUSD;
                    const pctOff = Math.round((1 - monthly / listValue) * 100);
                    return (
                      <div
                        key={m.id}
                        className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3 pb-2.5 text-center ${
                          m.popular ? "border-brass ring-1 ring-brass" : "border-ink/10"
                        }`}
                      >
                        {m.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0 border border-ink/10 bg-brass text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold rounded-full">
                            <Copy k="tickets.bestValue" />
                          </span>
                        )}
                        <span className="font-display font-bold text-[15px] text-ink leading-none">{m.name}</span>
                        <span className="mt-1.5 font-condensed numeral text-2xl leading-none font-bold text-ink">{m.monthlyEntries}</span>
                        <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-3 mt-0.5">
                          <Copy k="tickets.entriesPerCycle" />
                        </span>
                        <span className="mt-1.5 flex items-baseline gap-1.5">
                          <s className="font-condensed numeral text-ink-3 text-[13px]" aria-label={`Normal price ${usd(listValue)}`}>
                            {usd(listValue)}
                          </s>
                          <span className="font-display font-bold text-lg text-ink leading-none">
                            {usd(monthly)}<span className="text-ink-3 text-[11px] font-condensed"><Copy k="tickets.perMo" /></span>
                          </span>
                        </span>
                        <span className="mt-1 dateline on-paper"><Copy k="tickets.savePrefix" /> {pctOff}%</span>
                        <button
                          type="button"
                          onClick={() => onBuy(m.id, "monthly")}
                          className="mt-2 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
                        >
                          <Copy k="tickets.buy" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                <Pillar icon={<Lock size={11} />} label={t("tickets.pillar.secure")} />
                <Pillar icon={<ShieldCheck size={11} />} label={t("tickets.pillar.nonprofit")} />
                <Pillar icon={<HeartHandshake size={11} />} label={t("tickets.pillar.charity")} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPEC SHEET — what you're winning, full-width */}
      <section className="border-y border-ink/10 bg-paper-3">
        <div className="mx-auto max-w-[1400px] px-5 py-14">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="section-eyebrow on-paper section-eyebrow-rule"><Copy k="tickets.spec.eyebrow" /></p>
              <h2 className="mt-3 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)" }}>
                <Copy k="tickets.spec.h.lead" /> <span className="accent-serif"><Copy k="tickets.spec.h.accent" /></span>
              </h2>
            </div>
            <Label tone="brass" variant="outline">{v.year} {v.make} {v.model}</Label>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-paper/10 bg-ink text-paper rounded-2xl overflow-hidden border border-ink/10 shadow-soft">
            {v.headlineSpecs.map((s) => (
              <div key={s.label} className="px-4 py-7 text-center">
                <dd className="font-condensed numeral font-bold text-brass leading-none" style={{ fontSize: "clamp(1.9rem, 3vw, 3rem)" }}>
                  {s.decimals ? (
                    <>{s.value.toFixed(s.decimals)}{s.suffix}</>
                  ) : (
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  )}
                </dd>
                <dt className="mt-2.5 font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/60">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* WINNERS CAROUSEL */}
      <section className="border-y border-ink/10 bg-paper-3">
        <div className="mx-auto max-w-[1400px] px-5 py-14">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="section-eyebrow on-paper section-eyebrow-rule"><Copy k="tickets.winners.eyebrow" /></p>
              <h2 className="mt-3 hero-headline" style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)" }}>
                <Copy k="tickets.winners.h.lead" /> <span className="accent-serif"><Copy k="tickets.winners.h.accent" /></span>
              </h2>
            </div>
            <Link
              href="/winners"
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-4 px-4 py-2 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper rounded-full"
            >
              <Copy k="winners.fullArchive" /> <ArrowRight size={12} />
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
                      <Copy k="winners.cardCycle" />{String(w.drawCycle).padStart(2, "0")}
                    </span>
                    <button aria-label="Watch reveal" className="absolute right-2 bottom-2 inline-flex items-center gap-1 bg-paper text-ink font-condensed uppercase tracking-[0.22em] text-[9px] px-2 py-1 border border-ink/10 hover:bg-accent-bright rounded-full">
                      <PlayCircle size={10} /> <Copy k="winners.reveal" />
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

      {/* CHARITY PARTNER — giving back, this cycle */}
      <section className="bg-ink text-paper-3 border-y border-ink/10 relative overflow-hidden grain grain-dark">
        <span aria-hidden className="absolute -top-10 -right-10 display-mega text-paper-3/[0.08] select-none">10%</span>
        <div className="relative mx-auto max-w-[1400px] px-5 py-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="section-eyebrow on-dark section-eyebrow-rule">{t("tickets.charity.eyebrow")}</p>
            <h2 className="mt-4 hero-headline on-dark" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
              {t("tickets.charity.h").replace("{cycle}", String(activeDraw.cycle))}<br />
              <span className="accent-serif"><CharityName />.</span>
            </h2>
            <p className="mt-5 max-w-xl text-paper-3/90 font-serif text-lg">
              &ldquo;<CharityBlurb />&rdquo;
            </p>

            <div className="mt-5">
              <CyclePartnerBadge dark />
            </div>
            <p className="mt-4 max-w-xl text-paper-3/80">
              {t("tickets.charity.body")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/about#charity"
                className="inline-flex h-12 items-center gap-2 bg-accent-bright text-ink px-5 border border-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper-3 btn-poly"
              >
                <Copy k="tickets.charity.cta1" /> <ArrowRight size={14} />
              </Link>
              <Link
                href="/blog/cycle-12-corvette-charity-pick"
                className="inline-flex h-12 items-center gap-2 border border-paper-3 px-5 text-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper-3 hover:text-ink rounded-full"
              >
                <Copy k="tickets.charity.cta2" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 border border-paper-3 bg-ink-raised rounded-2xl overflow-hidden">
            <div className="border-b border-paper-3 px-5 py-3 flex items-baseline justify-between">
              <p className="section-eyebrow on-dark"><Copy k="tickets.charity.statsEyebrow" /></p>
              <p className="dateline on-dark"><Copy k="tickets.charity.statsNote" /></p>
            </div>
            <div className="p-6">
              <p className="font-condensed numeral font-bold leading-none text-accent-bright" style={{ fontSize: "4.5rem" }}>
                {usd(stats.totalDonatedUSD)}
              </p>
              <p className="mt-2 font-condensed uppercase tracking-[0.22em] text-[12px] text-paper-3">
                <Copy k="tickets.charity.donated" />
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-paper-3/30">
                <KCharity label={t("tickets.charity.k.cycles")} v={String(stats.cyclesRun)} />
                <KCharity label={t("tickets.charity.k.charities")} v={String(stats.charitiesFunded)} />
                <KCharity label={t("tickets.charity.k.cars")} v={String(stats.carsGivenAway)} />
                <KCharity label={t("tickets.charity.k.entries")} v={intl(stats.ticketsCounted)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="bg-bg-dark text-fg border-b border-ink/10 relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-5 py-12 grid gap-8 md:grid-cols-3 items-center">
          <Trust icon={<Tv2 size={28} />} title={t("tickets.trust1.title")} body={t("tickets.trust1.body")} />
          <Trust icon={<Drum size={28} />} title={t("tickets.trust2.title")} body={t("tickets.trust2.body")} />
          <Trust icon={<HeartHandshake size={28} />} title={t("tickets.trust3.title")} body={t("tickets.trust3.body").replace("{cycle}", String(activeDraw.cycle)).replace("{charity}", activeDraw.charity.name)} />
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
