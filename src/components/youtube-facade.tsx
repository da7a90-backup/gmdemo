"use client";
import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Lazy YouTube embed. Renders a poster image with a play button overlay;
 * only mounts the actual iframe once the user clicks. Keeps the page fast
 * (no third-party scripts on initial load) and respects bandwidth.
 */
export function YouTubeFacade({
  videoId,
  poster,
  title,
  className,
  aspect = "aspect-video",
}: {
  videoId: string;
  poster: string;
  title: string;
  className?: string;
  aspect?: string;
}) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className={`relative ${aspect} ${className ?? ""}`}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative block w-full ${aspect} overflow-hidden border-2 border-ink ${className ?? ""}`}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(22,17,15,0.2) 0%, rgba(22,17,15,0.55) 100%), url(${poster})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="relative inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center bg-accent text-paper-3 border-4 border-paper-3 shadow-[6px_6px_0_0_var(--color-ink)] transition-transform group-hover:scale-110 group-hover:bg-ink">
          <Play size={36} strokeWidth={2.5} className="ml-1.5" fill="currentColor" />
        </span>
      </span>

      <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 pointer-events-none">
        <span className="font-condensed uppercase tracking-[0.22em] text-[11px] text-paper-3 font-semibold bg-ink/70 px-2 py-1 border border-paper-3">
          ▸ Watch · 2:14
        </span>
        <span className="font-serif italic text-[12px] text-paper-3/80">
          {title}
        </span>
      </span>
    </button>
  );
}
