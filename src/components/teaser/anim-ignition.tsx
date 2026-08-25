"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { LOGO_VIEWBOX, MARK_G, MARK_M, WORDMARK, BRAND } from "@/components/teaser/logo-data";

/** #1 — Ignition: the mark strokes on like an engine turning over, fills in,
 *  the wordmark letters catch one by one, then the whole logo gives a rev-pulse
 *  and a redline bar sweeps underneath. */
export function AnimIgnition({ theme = "dark" }: { theme?: "dark" | "paper" }) {
  const reduce = useReducedMotion();
  const wordmark = theme === "paper" ? BRAND.ink : BRAND.fg;

  const letters: Variants = {
    hidden: { opacity: 0 },
    show: (i: number) => ({ opacity: 1, transition: { delay: 1.15 + i * 0.05, duration: 0.3 } }),
  };

  if (reduce) return <StaticLogo wordmark={wordmark} />;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-[min(88vw,560px)]">
        <svg viewBox={LOGO_VIEWBOX} className="block w-full overflow-visible">
          {/* G swoosh + M chevron: stroke-draw, then fill in */}
          {[MARK_G, MARK_M].map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill={BRAND.teal}
              stroke={BRAND.teal}
              strokeWidth={3}
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{
                pathLength: { duration: 1.05, ease: "easeInOut", delay: i * 0.12 },
                fillOpacity: { delay: 0.95 + i * 0.12, duration: 0.5 },
              }}
            />
          ))}
          {/* wordmark catches letter by letter */}
          <g>
            {WORDMARK.map((d, i) => (
              <motion.path key={i} d={d} fill={wordmark} custom={i} variants={letters} initial="hidden" animate="show" />
            ))}
          </g>
        </svg>
      </div>

      {/* redline sweep */}
      <div className="relative mt-7 h-[3px] w-[min(70vw,380px)] overflow-hidden rounded-full bg-[color:var(--color-ink)]/10">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${BRAND.teal}, transparent)` }}
          initial={{ x: "-120%" }}
          animate={{ x: "360%" }}
          transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.1, delay: 1.6 }}
        />
      </div>
    </div>
  );
}

function StaticLogo({ wordmark = BRAND.fg }: { wordmark?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className="block w-[min(88vw,560px)] overflow-visible">
      <path d={MARK_G} fill={BRAND.teal} />
      <path d={MARK_M} fill={BRAND.teal} />
      {WORDMARK.map((d, i) => (
        <path key={i} d={d} fill={wordmark} />
      ))}
    </svg>
  );
}
