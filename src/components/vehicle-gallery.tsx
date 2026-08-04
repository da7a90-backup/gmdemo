"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrizeCycle } from "@/lib/cycle-store";

/**
 * Prize image gallery — shared by the public tickets page and the member
 * tickets page. Desktop: vertical thumbnail strip. Mobile: swipe + transparent
 * chevrons, no thumbs.
 */
export function VehicleGallery() {
  const activeDraw = usePrizeCycle();
  const v = activeDraw.vehicle;
  const [activeImage, setActiveImage] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const prevImage = () => setActiveImage((i) => (i - 1 + v.images.length) % v.images.length);
  const nextImage = () => setActiveImage((i) => (i + 1) % v.images.length);

  return (
    <div className="border-heavy bg-paper-3 relative rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div
          className="relative md:flex-1 aspect-[16/10] overflow-hidden transition-[background-image] duration-300 touch-pan-y"
          onTouchStart={(e) => {
            touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const dx = e.changedTouches[0].clientX - start.x;
            const dy = e.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) nextImage(); else prevImage();
            }
          }}
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.1) 0%, rgba(22,17,15,0.05) 35%, rgba(22,17,15,0.55) 100%), url(${v.images[activeImage] ?? v.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <span className="absolute bottom-2.5 right-2.5 bg-ink/25 text-paper backdrop-blur-[1px] font-condensed uppercase tracking-[0.22em] text-[10px] px-2 py-1 rounded-md">
            {activeImage + 1} / {v.images.length}
          </span>

          {/* Mobile: transparent chevrons page through the gallery */}
          <button
            type="button"
            aria-label="Previous image"
            onClick={prevImage}
            className="md:hidden absolute left-1.5 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-ink/25 text-paper backdrop-blur-[1px] active:bg-ink/40"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={nextImage}
            className="md:hidden absolute right-1.5 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-full bg-ink/25 text-paper backdrop-blur-[1px] active:bg-ink/40"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>
        </div>

        {v.images.length > 1 && (
          <div className="hidden md:grid md:border-l border-ink/10 bg-paper-3 md:grid-cols-1 md:w-[90px]">
            {v.images.slice(0, 4).map((src, i) => {
              const selected = i === activeImage;
              return (
                <button
                  key={src + i}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-[4/3] md:aspect-auto md:flex-1 border-r md:border-r-0 md:border-b last:border-r-0 md:last:border-b-0 border-ink/10 overflow-hidden transition ${
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
    </div>
  );
}
