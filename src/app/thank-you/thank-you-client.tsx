"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Share2,
  ArrowRight,
  Ticket,
  Mail,
  HeartHandshake,
} from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { activeDraw } from "@/lib/mock-data";
import { usePrizeCycle } from "@/lib/cycle-store";
import { niceDateTime, usdc, usd } from "@/lib/format";
import { buildTicketsPdf, downloadPdf } from "@/lib/pdf";
import { generateTicketIDs } from "@/lib/ticket-gen";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

type Order = {
  orderId: string;
  kind: "ticket" | "membership";
  name: string;
  entries: number;
  drawCycle: number;
  drawSlug: string;
  vehicleLabel: string;
  charityName: string;
  charityCut: number;
  total: number;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
  placedAtISO: string;
};

const FALLBACK: Order = {
  orderId: "order-DEMO",
  kind: "ticket",
  name: "Crowd Favorite · 10 entries",
  entries: 10,
  drawCycle: activeDraw.cycle,
  drawSlug: activeDraw.slug,
  vehicleLabel: `${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`,
  charityName: activeDraw.charity.name,
  charityCut: 4.9,
  total: 49,
  buyer: {
    firstName: "Demo",
    lastName: "Player",
    email: "demo@generousmotors.org",
    phone: "5550101234",
    city: "Brooklyn",
    state: "NY",
  },
  placedAtISO: new Date().toISOString(),
};

export function ThankYouClient() {
  const t = useCopy();
  const activeDraw = usePrizeCycle();
  const [order, setOrder] = useState<Order>(FALLBACK);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gm:lastOrder");
      if (raw) setOrder(JSON.parse(raw));
    } catch {}
  }, []);

  const ticketIds = useMemo(
    () =>
      generateTicketIDs({
        drawCycle: order.drawCycle,
        contact: { email: order.buyer.email, phone: order.buyer.phone },
        count: order.entries,
      }),
    [order]
  );

  const onDownload = async () => {
    setBusy(true);
    try {
      const bytes = await buildTicketsPdf({
        contact: { email: order.buyer.email, phone: order.buyer.phone },
        count: order.entries,
        batch: {
          drawCycle: order.drawCycle,
          vehicleLabel: order.vehicleLabel,
          charityName: order.charityName,
          drawDateLabel: niceDateTime(activeDraw.drawDateISO),
          buyer: {
            firstName: order.buyer.firstName,
            lastInitial: (order.buyer.lastName?.[0] ?? "X").toUpperCase(),
            city: order.buyer.city,
            state: order.buyer.state,
          },
          orderId: order.orderId,
        },
      });
      downloadPdf(bytes, `generous-motors-cycle-${order.drawCycle}-${order.orderId}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden grain bg-paper-3 text-ink">
      <ConfettiOnce />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 400px at 50% -10%, rgba(255,242,0,0.15), transparent 60%), radial-gradient(600px 250px at 30% 110%, rgba(31,64,49,0.13), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-3xl px-5 pt-14 pb-24 text-center relative">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="mx-auto inline-flex h-20 w-20 items-center justify-center bg-charity text-paper-3 border border-ink/10 rounded-full"
        >
          <CheckCircle2 size={40} strokeWidth={2} />
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="hero-headline mt-8"
        >
          <Copy k="ty.h.pre" /> <span className="accent-serif"><Copy k="ty.h.accent" /></span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          <Label tone="charity" variant="outline"><Copy k="ty.orderPrefix" />{order.orderId.slice(-6).toUpperCase()}</Label>
          <Label tone="accent" variant="outline"><Copy k="winners.cardCycle" />{String(order.drawCycle).padStart(2, "0")}</Label>
          <Label tone="ink" variant="outline">{order.entries} <Copy k="ty.ticketsBadge" /></Label>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 170, damping: 18 }}
          className="mt-9 mx-auto max-w-xl border-heavy bg-paper-3 shadow-soft rounded-xl overflow-hidden"
        >
          <div
            className="relative aspect-[16/9] overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.15) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.65) 100%), url(${activeDraw.vehicle.images[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span className="absolute top-3 left-3 bg-brass text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border border-ink/10 rounded-md">
              <Copy k="ty.inFor" />
            </span>
            <span className="absolute top-3 right-3 bg-accent-bright text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border border-ink/10 rounded-md">
              {usd(activeDraw.vehicle.valueUSD)}
            </span>
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-left">
              <div>
                <p className="font-condensed uppercase tracking-[0.22em] text-[10px] text-paper/70"><Copy k="ty.prizeLabel" /></p>
                <p className="font-display font-bold text-2xl text-paper leading-tight drop-shadow">
                  {activeDraw.vehicle.make} {activeDraw.vehicle.model}
                </p>
              </div>
              <p className="text-[11px] text-paper/80 max-w-[55%] text-right font-serif italic">
                {activeDraw.vehicle.trim}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-8 text-lg text-ink-2 max-w-xl mx-auto font-serif"
        >
          <Copy k="ty.printed.pre" />{" "}
          <strong className="font-condensed numeral text-2xl text-accent">
            <AnimatedCounter value={order.entries} />
          </strong>{" "}
          {order.entries === 1 ? t("ty.unitSingular") : t("ty.unitPlural")} {t("ty.printed.post")}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-9 flex flex-wrap justify-center gap-3"
        >
          <button
            onClick={onDownload}
            disabled={busy}
            className="inline-flex h-14 items-center gap-2 bg-accent border border-accent px-7 text-paper-3 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-ink hover:border-ink/10 disabled:opacity-60 rounded-full"
          >
            <Download size={16} />
            {busy ? t("ty.pdfBusy") : t("ty.pdfDownload")}
          </button>
          <button
            type="button"
            className="inline-flex h-14 items-center gap-2 border border-ink/10 bg-paper-3 px-6 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-ink hover:text-paper-3 rounded-full"
          >
            <Share2 size={16} /> <Copy k="ty.share" />
          </button>
        </motion.div>

        {/* POST-PURCHASE UPSELL — fires after payment, better than the checkout offer */}
        <PostPurchaseOffer />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-14 mx-auto text-left"
        >
          <p className="section-eyebrow section-eyebrow-rule"><Copy k="ty.ticketsHeading" /></p>
          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <ul className="flex gap-3 min-w-max">
              {ticketIds.slice(0, 8).map((tk, i) => (
                <motion.li
                  key={tk.full}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 180 }}
                  className="w-[240px] shrink-0 border border-ink/10 bg-paper-3 p-4 text-left rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="dateline"><Copy k="winners.cardCycle" />{String(order.drawCycle).padStart(2, "0")}</span>
                    <Ticket size={12} className="text-accent" />
                  </div>
                  <p className="mt-3 font-condensed numeral text-base text-ink">{tk.full}</p>
                  <p className="mt-1 font-serif italic text-sm text-ink-3"><Copy k="ty.card.note" /></p>
                  <div className="mt-3 pt-3 border-t border-rule-soft font-condensed uppercase tracking-[0.22em] text-[10px] text-charity">
                    <Copy k="ty.card.charityPrefix" /> {order.charityName}
                  </div>
                </motion.li>
              ))}
              {order.entries > 8 && (
                <motion.li
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="w-[240px] shrink-0 border border-dashed border-ink/10 flex flex-col items-center justify-center text-ink-2 font-condensed uppercase tracking-[0.22em] text-[11px] rounded-xl"
                >
                  +{order.entries - 8} {t("ty.moreSuffix")}
                </motion.li>
              )}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid gap-0 sm:grid-cols-3 text-left border border-ink/10 divide-y sm:divide-y-0 sm:divide-x divide-ink/10 rounded-xl overflow-hidden"
        >
          <RBox icon={<Mail size={16} />} label={t("ty.receipt.email")} value={order.buyer.email} />
          <RBox icon={<HeartHandshake size={16} />} label={t("ty.receipt.charity")} value={usdc(order.charityCut)} accent="charity" />
          <RBox icon={<Ticket size={16} />} label={t("ty.receipt.draw")} value={niceDateTime(activeDraw.drawDateISO)} />
        </motion.div>

        <div className="mt-14 grid gap-0 sm:grid-cols-2 text-left border border-ink/10 divide-y sm:divide-y-0 sm:divide-x divide-ink/10 rounded-xl overflow-hidden">
          <Link
            href="/lookup"
            className="group flex items-center justify-between bg-paper-3 p-5 hover:bg-brass"
          >
            <div>
              <p className="font-display font-bold text-lg"><Copy k="ty.link1.title" /></p>
              <p className="dateline"><Copy k="ty.link1.sub" /></p>
            </div>
            <ArrowRight className="text-ink-2 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            href="/live"
            className="group flex items-center justify-between bg-paper-3 p-5 hover:bg-brass"
          >
            <div>
              <p className="font-display font-bold text-lg"><Copy k="ty.link2.title" /></p>
              <p className="dateline"><Copy k="ty.link2.sub" /></p>
            </div>
            <ArrowRight className="text-ink-2 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RBox({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: "charity" }) {
  return (
    <div className={`p-5 ${accent === "charity" ? "bg-charity-soft" : "bg-paper-3"}`}>
      <div className="flex items-center gap-2 text-ink-2">
        {icon}
        <span className="font-condensed uppercase tracking-[0.22em] text-[11px]">{label}</span>
      </div>
      <p className={`mt-2 font-display font-bold text-xl ${accent === "charity" ? "text-charity" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function ConfettiOnce() {
  // Editorial-restrained: fewer pieces, shorter, only brand colors
  const N = 18;
  const pieces = Array.from({ length: N }).map((_, i) => {
    const hue = i % 3 === 0 ? "#8b2017" : i % 3 === 1 ? "#1f4031" : "#9c7e1e";
    const left = (i / N) * 100 + (Math.sin(i) * 3);
    const delay = (i % 5) * 0.04;
    return { hue, left, delay, key: i };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[60vh] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.key}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 500, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.2, delay: p.delay, ease: [0.2, 0.8, 0.3, 1] }}
          className="absolute top-0 block h-3 w-1"
          style={{ left: `${p.left}%`, background: p.hue }}
        />
      ))}
    </div>
  );
}

/**
 * Post-purchase upsell — separate trigger from the checkout upsell, shown
 * only after payment confirms. Framed as a reward: a deeper discount than
 * anything offered pre-payment.
 */
function PostPurchaseOffer() {
  const [claimed, setClaimed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="mt-10 mx-auto max-w-xl text-left border border-brass bg-ink text-paper rounded-2xl overflow-hidden shadow-lift"
    >
      <div className="px-5 py-2.5 bg-brass text-ink flex items-center justify-between">
        <span className="font-condensed uppercase tracking-[0.22em] text-[11px] font-bold"><Copy k="ty.offer.badge" /></span>
        <span className="font-condensed uppercase tracking-[0.18em] text-[10px]"><Copy k="ty.offer.note" /></span>
      </div>
      {!claimed ? (
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-xl leading-tight">
              <Copy k="ty.offer.title" /> <span className="text-brass"><Copy k="ty.offer.price" /></span>
            </p>
            <p className="mt-1 text-[13px] text-paper/70">
              <Copy k="ty.offer.body" />
            </p>
          </div>
          <button
            type="button"
            onClick={() => setClaimed(true)}
            className="inline-flex h-11 items-center gap-2 bg-brass text-ink px-6 rounded-full font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-paper transition-colors"
          >
            <Copy k="ty.offer.claim" />
          </button>
        </div>
      ) : (
        <div className="p-5">
          <p className="font-display font-bold text-lg text-brass"><Copy k="ty.offer.claimedTitle" /></p>
          <p className="mt-1 text-[13px] text-paper/70">
            <Copy k="ty.offer.claimedBody" />
          </p>
        </div>
      )}
    </motion.div>
  );
}
