import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";
import { getCurrentCycle } from "@/lib/server/editorial";
import { niceDateTime, intl } from "@/lib/format";
import { Tv2, Facebook, Youtube } from "lucide-react";
import { Label } from "@/components/sticker";

export const metadata = { title: "Live draw — Generous Motors" };

export default async function LivePage() {
  const c = await getCurrentCycle();
  const cycle = c?.cycle ?? activeDraw.cycle;
  const drawDateISO = c?.drawDateISO || activeDraw.drawDateISO;
  const ticketsSold = c?.ticketsSold ?? activeDraw.ticketsSold;
  const charityName = c?.charity.name || activeDraw.charity.name;
  const fb = c?.livestreamFacebook || "#";
  const yt = c?.livestreamYoutube || "#";
  return (
    <section className="relative border-y border-ink/10 bg-ink text-paper grain overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 350px at 70% 30%, rgba(255,242,0,0.22), transparent 60%), radial-gradient(500px 200px at 10% 100%, rgba(31,64,49,0.22), transparent 60%)",
        }}
      />
      <span aria-hidden className="absolute -top-6 -right-6 display-mega text-paper/[0.05] select-none">DRAW</span>

      <div className="relative mx-auto max-w-[1400px] px-5 py-24 grid gap-10 lg:grid-cols-12 border-b border-paper/15">
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <Label tone="accent" variant="outline">Cycle №{String(cycle).padStart(2, "0")}</Label>
            <span className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/85 border border-paper/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Pre-stream
            </span>
          </div>
          <h1 className="hero-headline on-dark">
            Draw starts <span className="accent-serif">in…</span>
          </h1>
          <div className="mt-8">
            <Countdown targetISO={drawDateISO} />
          </div>
          <p className="mt-8 text-paper/80 max-w-xl text-lg font-serif">
            We&apos;ll go live at <strong className="text-paper font-condensed uppercase tracking-[0.04em]">{niceDateTime(drawDateISO)}</strong> on Facebook (primary) with a YouTube mirror. Tickets close 30 minutes before the stream begins. The drum is loaded on camera.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={fb} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-full bg-paper text-ink border border-paper px-5 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-brass">
              <Facebook size={14} /> Facebook Live
            </a>
            <a href={yt} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-full bg-paper/10 border border-paper/30 px-5 font-condensed uppercase tracking-[0.22em] text-[12px] hover:bg-paper hover:text-ink">
              <Youtube size={14} /> YouTube mirror
            </a>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <div className="relative rounded-xl border border-paper bg-paper/5 p-6">
            <p className="section-eyebrow !text-paper/60">Live counter</p>
            <div className="mt-5 grid grid-cols-2 gap-5 pb-6 border-b border-paper/15">
              <div>
                <p className="font-condensed numeral font-semibold text-5xl leading-[0.9]">{intl(ticketsSold)}</p>
                <p className="font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/60 mt-3">paid entries</p>
              </div>
              <div>
                <p className="font-condensed numeral font-semibold text-5xl text-brass leading-[0.9]">+412</p>
                <p className="font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/60 mt-3">bonus entries</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/60">This cycle&apos;s charity</p>
              <p className="font-display font-bold text-2xl">{charityName}</p>
              <p className="dateline !text-paper/60 mt-2">10%. Wired within 7 business days of close.</p>
            </div>
          </div>

          <div className="rounded-xl border border-paper/30 bg-paper/5 p-6 flex items-start gap-3">
            <Tv2 className="mt-0.5 text-brass" size={20} />
            <div>
              <p className="font-display font-bold text-lg">Set a reminder</p>
              <p className="mt-1 text-[14px] text-paper/70 font-serif">We&apos;ll send a 30-minute heads-up to your email.</p>
              <Link href="/lookup" className="mt-3 inline-flex font-serif italic text-base text-brass underline underline-offset-4">use my entries to subscribe</Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
