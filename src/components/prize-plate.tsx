"use client";
import { useState } from "react";
import { activeDraw } from "@/lib/mock-data";
import { usd } from "@/lib/format";

/**
 * Home-page prize plate.
 *  - Desktop (mouse): pure hover swap (mouseenter / mouseleave).
 *  - Mobile (touch): tap-and-hold swap (pointerdown filtered by pointerType, pointerup).
 *  - Pen / stylus: treated like touch (press-and-hold).
 */
export function PrizePlate() {
  const v = activeDraw.vehicle;
  const primary = v.images[0];
  const alt = v.images[1] ?? v.images[0];
  const [active, setActive] = useState(false);

  return (
    <div
      className="relative aspect-[5/3] overflow-hidden border-b-2 border-ink select-none"
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setActive(true);
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          setActive(false);
        }
      }}
      onPointerCancel={() => setActive(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 0 : 1,
          backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.18) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.75) 100%), url(${primary})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.18) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.75) 100%), url(${alt})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <span className="absolute top-3 left-3 bg-brass text-paper-3 font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink z-10">
        {v.year} · {v.make}
      </span>
      <span className="absolute top-3 right-3 bg-accent-bright text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border-2 border-ink z-10">
        {usd(v.valueUSD)}
      </span>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
        <div>
          <p className="font-condensed uppercase tracking-[0.22em] text-[10px] text-paper/70">Prize</p>
          <p className="font-display font-bold text-2xl text-paper leading-tight drop-shadow">
            {v.make} {v.model}
          </p>
        </div>
        <p className="text-[11px] text-paper/80 max-w-[55%] text-right font-serif italic">
          {v.trim}
        </p>
      </div>

      <span
        className="hint-hover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 bg-paper text-ink border border-ink font-condensed uppercase tracking-[0.22em] text-[10px] pointer-events-none transition-opacity duration-200"
        style={{ opacity: active ? 0 : 1 }}
      >
        ↻ hover for another angle
      </span>
      <span
        className="hint-press absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 bg-paper text-ink border border-ink font-condensed uppercase tracking-[0.22em] text-[10px] pointer-events-none transition-opacity duration-200"
        style={{ opacity: active ? 0 : 1 }}
      >
        ↻ press for another angle
      </span>

      <style>{`
        .hint-press { display: none; }
        @media (hover: none) {
          .hint-hover { display: none; }
          .hint-press { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}
