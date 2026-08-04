"use client";
import { useEffect, useState } from "react";
import { timeUntil } from "@/lib/format";
import { useCycleDrawDate } from "@/lib/cycle-store";
import { Copy } from "@/components/copy";

/** Slim one-line countdown pill for the site header — ticks every second. */
export function CountdownCompact({ targetISO }: { targetISO: string }) {
  const target = useCycleDrawDate(targetISO);
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0 });

  useEffect(() => {
    setT(timeUntil(target));
    const id = setInterval(() => setT(timeUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <span
      suppressHydrationWarning
      className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full whitespace-nowrap"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" aria-hidden />
      <span className="dateline on-paper hidden sm:inline"><Copy k="countdown.compactLabel" /></span>
      <span className="font-condensed numeral font-bold text-[13px] text-ink tracking-[0.06em]">
        {p(t.days)}d : {p(t.hours)}h : {p(t.minutes)}m : {p(t.seconds)}s
      </span>
    </span>
  );
}

/** Full-width dark countdown bar — buy-box header on the tickets page. */
export function CountdownBar({ targetISO, label = "Draw closes in" }: { targetISO: string; label?: React.ReactNode }) {
  const target = useCycleDrawDate(targetISO);
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0 });

  useEffect(() => {
    setT(timeUntil(target));
    const id = setInterval(() => setT(timeUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      suppressHydrationWarning
      className="w-full bg-ink text-paper px-5 py-3 flex items-center justify-between gap-3"
    >
      <span className="font-condensed uppercase tracking-[0.22em] text-[11px] text-paper/70">{label}</span>
      <span className="font-condensed numeral font-bold text-xl text-brass tracking-[0.08em]">
        {p(t.days)} : {p(t.hours)} : {p(t.minutes)} : {p(t.seconds)}
      </span>
    </div>
  );
}

export function Countdown({ targetISO }: { targetISO: string }) {
  const target = useCycleDrawDate(targetISO);
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ms: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setT(timeUntil(target));
    const id = setInterval(() => setT(timeUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const Cell = ({ n, label, k }: { n: number; label: string; k: string }) => (
    <div className="flex flex-col items-center min-w-[42px]">
      <span
        className="font-condensed numeral text-2xl font-bold text-ink leading-none"
        aria-label={mounted ? `${n} ${label}` : undefined}
      >
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-[9px] font-condensed uppercase tracking-[0.22em] text-ink-3 mt-1">
        <Copy k={k} />
      </span>
    </div>
  );

  return (
    <div
      aria-live="off"
      suppressHydrationWarning
      className="inline-flex items-end gap-2 border border-ink/10 bg-paper px-3 py-2 rounded-md"
    >
      <Cell n={t.days} label="days" k="countdown.days" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.hours} label="hours" k="countdown.hours" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.minutes} label="minutes" k="countdown.minutes" />
      <span className="font-condensed text-xl text-ink-3 mb-3">:</span>
      <Cell n={t.seconds} label="seconds" k="countdown.seconds" />
    </div>
  );
}
