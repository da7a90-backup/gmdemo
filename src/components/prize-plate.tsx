"use client";
import { useState } from "react";
import { usePrizeCycle } from "@/lib/cycle-store";

/**
 * Home-page prize plate.
 *  - Desktop (mouse): pure hover swap (mouseenter / mouseleave).
 *  - Mobile (touch): tap-and-hold swap (pointerdown filtered by pointerType, pointerup).
 *  - Pen / stylus: treated like touch (press-and-hold).
 */
export function PrizePlate({
  minimal = false,
  aspect = "aspect-[5/3] md:aspect-[2/1] lg:aspect-[21/9]",
}: {
  /** Hide the center hint pills + bottom caption (for heroes that overlay their own content). */
  minimal?: boolean;
  /** Tailwind aspect classes for the plate. */
  aspect?: string;
}) {
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;
  const primary = v.images[0];
  const alt = v.images[1] ?? v.images[0];
  const [active, setActive] = useState(false);
  // The hover/press "other angle" image is deferred until the first interaction so
  // its file never competes with the LCP hero image on initial paint.
  const [everActive, setEverActive] = useState(false);
  const activate = () => { setActive(true); setEverActive(true); };

  return (
    <div
      className={`relative ${aspect} overflow-hidden border-b border-ink/10 select-none`}
      style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
      onMouseEnter={activate}
      onMouseLeave={() => setActive(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          activate();
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
          backgroundImage: everActive
            ? `linear-gradient(to bottom, rgba(22,17,15,0.18) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.75) 100%), url(${alt})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <span className="absolute top-3 left-3 bg-brass text-ink font-condensed uppercase tracking-[0.22em] text-[10px] px-2.5 py-1 border border-ink/10 z-10 rounded-md">
        {v.year} · {v.make}
      </span>

      {!minimal && (
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
      )}

      {!minimal && (
      <>
      <span
        className="hint-hover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 bg-paper text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[10px] pointer-events-none transition-opacity duration-200 rounded-full"
        style={{ opacity: active ? 0 : 1 }}
      >
        ↻ hover for another angle
      </span>
      <span
        className="hint-press absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-2.5 py-1 bg-paper text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[10px] pointer-events-none transition-opacity duration-200 rounded-full"
        style={{ opacity: active ? 0 : 1 }}
      >
        ↻ press for another angle
      </span>
      </>
      )}

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
