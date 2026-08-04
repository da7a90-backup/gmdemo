"use client";
import { usePrizeCycle } from "@/lib/cycle-store";
import { niceDateTime } from "@/lib/format";
import Link from "next/link";
import { Tv2, Radio, Drum, ArrowRight } from "lucide-react";
import { Label } from "@/components/sticker";
import { Copy } from "@/components/copy";

export function LiveDrawBlock() {
  const activeDraw = usePrizeCycle();
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24">
      <div className="relative border border-ink/10 bg-bg-dark text-fg rounded-2xl overflow-hidden grain grain-dark shadow-soft">
        <span aria-hidden className="absolute -top-6 -left-6 display-mega text-fg/[0.08] select-none">LIVE</span>

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 300px at 80% 30%, rgba(255,242,0,0.22), transparent 60%), radial-gradient(600px 200px at 10% 90%, rgba(26,77,48,0.22), transparent 60%)",
          }}
        />
        <div className="relative grid gap-10 p-8 lg:grid-cols-12 lg:p-14 border-b border-paper/30">
          <div className="lg:col-span-7">
            <p className="section-eyebrow on-dark section-eyebrow-rule"><Copy k="home.live.eyebrow" /></p>
            <h2 className="mt-4 hero-headline on-dark" style={{ fontSize: "clamp(2.25rem,5vw,4.25rem)" }}>
              <Copy k="home.live.h.l1" /><br />
              <Copy k="home.live.h.l2" /> <span className="accent-serif"><Copy k="home.live.h.accent" /></span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-fg font-serif">
              <Copy k="home.live.body" />
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/live"
                className="inline-flex h-12 items-center gap-2 bg-paper text-ink px-5 border border-paper font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-brass rounded-full"
              >
                <Copy k="home.live.cta" /> <ArrowRight size={14} />
              </Link>
              <span className="inline-flex h-12 items-center border border-paper/40 px-5 text-fg-2 font-condensed uppercase tracking-[0.22em] text-[11px] rounded-full">
                {niceDateTime(activeDraw.drawDateISO)}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Label tone="brass" variant="solid"><Copy k="live.block.badge1" /></Label>
              <Label tone="paper" variant="solid"><Copy k="live.block.badge2" /></Label>
            </div>
          </div>

          <ul className="lg:col-span-5 grid gap-3 self-center">
            <Step icon={<Drum size={20} />} label={<Copy k="live.block.step1.label" />} body={<Copy k="live.block.step1.body" />} />
            <Step icon={<Radio size={20} />} label={<Copy k="live.block.step2.label" />} body={<Copy k="live.block.step2.body" />} />
            <Step icon={<Tv2 size={20} />} label={<Copy k="live.block.step3.label" />} body={<Copy k="live.block.step3.body" />} />
          </ul>
        </div>
      </div>
    </section>
  );
}

function Step({ icon, label, body }: { icon: React.ReactNode; label: React.ReactNode; body: React.ReactNode }) {
  return (
    <li className="flex gap-4 border border-paper/40 bg-paper/[0.05] p-4 rounded-lg">
      <span className="inline-flex h-11 w-11 items-center justify-center bg-brass text-ink border border-paper shrink-0 rounded-md">{icon}</span>
      <div>
        <p className="font-display font-bold text-lg leading-tight text-fg">{label}</p>
        <p className="text-[14px] text-fg-2 mt-0.5">{body}</p>
      </div>
    </li>
  );
}
