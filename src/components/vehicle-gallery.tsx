"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrizeCycle } from "@/lib/cycle-store";

/**
 * Prize image carousel — shared by the public + member tickets pages. One large
 * full-width image (no thumbnail strip, so the photo is bigger), translucent
 * prev/next buttons, dot indicators, and gentle auto-advance that pauses on
 * hover / touch (and respects prefers-reduced-motion). Swipe on mobile.
 */
export function VehicleGallery() {
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;
  const images = v.images.length ? v.images : [v.image];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = (n: number) => setI(((n % images.length) + images.length) % images.length);

  // Gentle auto-advance; pauses while hovered/touched or when the user prefers
  // reduced motion.
  useEffect(() => {
    if (paused || images.length <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((c) => (c + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, [paused, images.length]);

  const navBtn =
    "absolute top-1/2 -translate-y-1/2 z-10 h-11 w-11 inline-flex items-center justify-center rounded-full bg-ink/25 text-paper backdrop-blur-sm hover:bg-ink/45 active:bg-ink/50 transition-colors";

  return (
    <div
      className="border-heavy bg-paper-3 relative rounded-xl overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative aspect-[4/3] sm:aspect-[16/10] touch-pan-y select-none"
        onTouchStart={(e) => {
          setPaused(true);
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          window.setTimeout(() => setPaused(false), 6000); // resume auto-advance shortly after a swipe
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? i + 1 : i - 1);
        }}
      >
        {/* Crossfade slides */}
        {images.map((src, idx) => (
          <div
            key={src + idx}
            aria-hidden={idx !== i}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{
              opacity: idx === i ? 1 : 0,
              backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.1) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.55) 100%), url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}

        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => go(i - 1)} className={`${navBtn} left-2 sm:left-3`}>
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button type="button" aria-label="Next image" onClick={() => go(i + 1)} className={`${navBtn} right-2 sm:right-3`}>
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>

            <span className="absolute top-2.5 right-2.5 z-10 bg-ink/25 text-paper backdrop-blur-sm font-condensed uppercase tracking-[0.22em] text-[10px] px-2 py-1 rounded-md">
              {i + 1} / {images.length}
            </span>

            {/* Dot indicators — click to jump; active dot elongates */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to image ${idx + 1}`}
                  aria-current={idx === i}
                  onClick={() => go(idx)}
                  className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-paper" : "w-1.5 bg-paper/50 hover:bg-paper/80"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
