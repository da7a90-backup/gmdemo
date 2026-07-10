"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getUser } from "@/lib/session";
import { activeDraw, ticketTiers } from "@/lib/mock-data";
import { getPromoConfig, PROMOS_EVENT, isPromoLive, type PromoTier } from "@/lib/promotions";
import { usdc, intl } from "@/lib/format";
import { CountdownBar } from "@/components/countdown";
import { Label } from "@/components/sticker";

export default function MemberTicketsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<PromoTier | null>(null);
  const [redirecting, setRedirecting] = useState(false);
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
    window.addEventListener(PROMOS_EVENT, loadPromos);
    return () => window.removeEventListener(PROMOS_EVENT, loadPromos);
  }, [router]);

  if (!ready) return null;

  const mult = member && isPromoLive(member) ? member.multiplier : 1;

  const onBuy = (tierId: string) => {
    setRedirecting(true);
    setTimeout(() => router.push(`/checkout?tier=${tierId}&type=once&promo=member`), 900);
  };

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center">
          <div className="text-center px-5">
            <div className="mx-auto h-10 w-10 border-4 border-[#e1e3e5] border-t-[#1773b0] rounded-full animate-spin" />
            <p className="mt-5 text-[15px] text-[#202223]">Redirecting to secure checkout…</p>
            <p className="mt-1 text-[12px] text-[#6b7177]">Powered by Shopify</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[900px] px-5 py-12">
        <Link href="/account" className="inline-flex items-center gap-1.5 dateline on-paper hover:text-ink">
          <ArrowLeft size={12} /> Back to your garage
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Label tone="brass" variant="solid">★ Member pricing</Label>
          <Label tone="ink" variant="outline">Cycle №{String(activeDraw.cycle).padStart(2, "0")}</Label>
        </div>
        <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          {mult > 1 ? <>Every ticket counts <span className="accent-serif">{mult} times.</span></> : <>Buy tickets.</>}
        </h1>
        <p className="mt-3 text-[15px] text-ink-2 font-serif">
          {v.year} {v.make} {v.model} — member entries are multiplied automatically at checkout. No code needed.
        </p>

        <div className="mt-7 border-heavy-3 bg-paper-4 rounded-2xl overflow-hidden shadow-soft">
          <CountdownBar targetISO={activeDraw.drawDateISO} label="Draw closes in" />

          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-paper-3">
            {ticketTiers.map((t) => (
              <div
                key={t.id}
                className={`relative flex flex-col items-center border rounded-lg bg-paper-4 px-2.5 pt-3.5 pb-3 ${
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
                {mult > 1 && (
                  <span className="mt-1.5 inline-flex items-center gap-1 bg-ink text-brass px-2 py-0.5 rounded-full font-condensed uppercase tracking-[0.14em] text-[9px] font-bold">
                    <Sparkles size={9} /> = {intl(t.entries * mult)} entries
                  </span>
                )}
                <span className="mt-1.5 font-display font-bold text-lg text-ink leading-none">{usdc(t.priceUSD)}</span>
                <button
                  type="button"
                  onClick={() => onBuy(t.id)}
                  className="mt-2.5 w-full h-8 inline-flex items-center justify-center gap-1 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.18em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
                >
                  Buy now
                </button>
              </div>
            ))}
          </div>

          <p className="px-5 py-3 dateline on-paper border-t border-ink/10">
            {mult > 1
              ? `Member ${mult}X applied to every bundle above · entries land in the drum instantly`
              : "Member multiplier is currently unavailable — standard entry rates apply."}
          </p>
        </div>
      </div>
    </main>
  );
}
