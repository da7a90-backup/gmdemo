"use client";
import { useEffect, useState } from "react";
import {
  niceDate, niceDateTime, niceWeekday,
  niceDateLocal, niceDateTimeLocal, niceWeekdayLocal,
} from "@/lib/format";

type Kind = "date" | "datetime" | "weekday";
const ET = { date: niceDate, datetime: niceDateTime, weekday: niceWeekday };
const LOCAL = { date: niceDateLocal, datetime: niceDateTimeLocal, weekday: niceWeekdayLocal };

/**
 * Renders a draw/promo time in the VIEWER'S OWN timezone. The underlying instant
 * is anchored to Miami/ET (set in /admin); this just displays it locally.
 *
 * SSR + first client render use the ET formatting (deterministic → they match, so
 * no hydration mismatch); a mount effect then swaps in the viewer's local zone.
 */
export function LocalTime({ iso, kind = "datetime", className }: { iso: string; kind?: Kind; className?: string }) {
  const [local, setLocal] = useState<string | null>(null);
  useEffect(() => { setLocal(LOCAL[kind](iso)); }, [iso, kind]);
  return (
    <span suppressHydrationWarning className={className}>
      {local ?? ET[kind](iso)}
    </span>
  );
}
