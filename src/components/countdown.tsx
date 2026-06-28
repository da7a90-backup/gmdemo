"use client";
import { useEffect, useState } from "react";
import { timeUntil } from "@/lib/format";

export function Countdown({ targetISO }: { targetISO: string }) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(timeUntil(targetISO));
    const id = setInterval(() => setT(timeUntil(targetISO)), 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  const Cell = ({ n, label }: { n: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[42px]">
      <span
        className="font-condensed numeral text-2xl font-bold text-ink leading-none"
        aria-label={mounted ? `${n} ${label}` : undefined}
      >
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] font-condensed uppercase tracking-[0.22em] text-ink-3 mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div
      aria-live="off"
      suppressHydrationWarning
      className="inline-flex items-end gap-2 border-2 border-ink bg-paper px-3 py-2"
    >
      <Cell n={t.days} label="d" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.hours} label="h" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.minutes} label="m" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.seconds} label="s" />
    </div>
  );
}
