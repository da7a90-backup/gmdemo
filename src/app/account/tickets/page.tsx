"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/session";
import { ticketTiers } from "@/lib/mock-data";
import { usePrizeCycle } from "@/lib/cycle-store";
import { getPromoConfig, PROMOS_EVENT, isPromoLive, type PromoTier } from "@/lib/promotions";
import { trackVisit, track } from "@/lib/analytics";
import { usdc, intl, niceWeekday } from "@/lib/format";
import { CountdownBar } from "@/components/countdown";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export default function MemberTicketsPage() {
  const cp = useCopy();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<PromoTier | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;

  useEffect(() => {
    if (!getUser()) {
      router.replace("/account/login");
      return;
    }
    const loadPromos = () => {
      setMember(getPromoConfig().find((t) => t.id === "member") ?? null);
    };
    loadPromos();
    setReady(true);
    trackVisit({ source: "member", channel: "Members", trigger: "member login", page: "/account/tickets" });
    window.addEventListener(PROMOS_EVENT, loadPromos);
    return () => window.removeEventListener(PROMOS_EVENT, loadPromos);
  }, [router]);

  if (!ready) return null;

  const live = member ? isPromoLive(member) : false;
  const mult = member && live ? member.multiplier : 1;

  const onBuy = (tierId: string) => {
    const tier = ticketTiers.find((t) => t.id === tierId);
    track({
      type: "purchase",
      source: "member",
      channel: "Members",
      trigger: "member login",
      page: "/account/tickets",
      item: tier?.name ?? tierId,
      amountUSD: tier?.priceUSD,
    });
    setRedirecting(true);
    setTimeout(() => router.push(`/checkout?tier=${tierId}&type=once&promo=member`), 900);
  };

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center">
          <div className="text-center px-5">
            <div className="mx-auto h-10 w-10 border-4 border-[#e1e3e5] border-t-[#1773b0] rounded-full animate-spin" />
            <p className="mt-5 text-[15px] text-[#202223]">{cp("tickets.redirecting")}</p>
            <p className="mt-1 text-[12px] text-[#6b7177]">{cp("tickets.poweredBy")}</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-5 py-10">
        <Link href="/account" className="inline-flex items-center gap-1.5 dateline on-paper hover:text-ink">
          <ArrowLeft size={12} /> <Copy k="acc.tix.back" />
        </Link>

        <div className="mt-4 grid gap-5 lg:grid-cols-12 lg:gap-6">
          {/* LEFT — prize gallery, same as the public tickets page */}
          <div className="lg:col-span-7 flex flex-col">
            <VehicleGallery />
            <div className="mt-3">
              <h1 className="hero-headline" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)", lineHeight: "1.05" }}>
                {v.year} {v.make} {v.model}
              </h1>
              <p className="mt-1 dateline on-paper">
                <Copy k="tickets.drawnLivePrefix" /> {niceWeekday(activeDraw.drawDateISO)}
              </p>
            </div>
          </div>

          {/* RIGHT — member bundle grid */}
          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-2">
              <Label tone="brass" variant="solid"><Copy k="acc.tix.badge" /></Label>
              <Label tone="ink" variant="outline"><Copy k="winners.cardCycle" />{String(activeDraw.cycle).padStart(2, "0")}</Label>
            </div>
            <p className="mt-2.5 text-[14px] text-ink-2 font-serif">
              {mult > 1
                ? <><Copy k="acc.tix.blurbPre" /> <strong className="text-ink">{mult} <Copy k="acc.tix.blurbStrong" /></strong><Copy k="acc.tix.blurbPost" /></>
                : <Copy k="acc.tix.blurbSimple" />}
            </p>

            <div className="mt-4 border-heavy-3 bg-paper-4 rounded-2xl overflow-hidden shadow-soft">
              {live && member ? (
                <CountdownBar
                  targetISO={member.endISO ?? activeDraw.drawDateISO}
                  label={member.countdownLabel ?? "Promo closes in"}
                />
              ) : (
                <CountdownBar targetISO={activeDraw.drawDateISO} label={<Copy k="tickets.drawLabel" />} />
              )}

              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-paper-3">
                {ticketTiers.map((t) => (
                  <div
                    key={t.id}
                    className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3.5 pb-3 ${
                      t.popular ? "border-brass ring-1 ring-brass" : "border-ink/10"
                    }`}
                  >
                    {t.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0 border border-ink/10 bg-brass text-ink font-condensed uppercase tracking-[0.18em] text-[8px] whitespace-nowrap font-bold rounded-full">
                        <Copy k="tickets.mostPicked" />
                      </span>
                    )}
                    <span className="flex items-baseline gap-1.5">
                      {mult > 1 && (
                        <s className="font-condensed numeral text-sm text-ink-3" aria-label={`Normally ${t.entries}`}>
                          {intl(t.entries)}
                        </s>
                      )}
                      <span className="font-condensed numeral text-2xl leading-none font-bold text-ink">
                        {intl(t.entries * mult)}
                      </span>
                    </span>
                    <span className="font-condensed uppercase tracking-[0.18em] text-[9px] text-ink-3 mt-0.5">
                      {t.entries * mult === 1 ? cp("tickets.unitSingular") : cp("tickets.unitPlural")}
                    </span>
                    <span className="mt-1.5 font-display font-bold text-lg text-ink leading-none">{usdc(t.priceUSD)}</span>
                    <button
                      type="button"
                      onClick={() => onBuy(t.id)}
                      className="mt-2.5 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
                    >
                      <Copy k="tickets.buy" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="px-5 py-3 dateline on-paper border-t border-ink/10">
                {mult > 1
                  ? cp("acc.tix.footNote").replace("{mult}", String(mult))
                  : cp("acc.tix.footNoteOff")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
