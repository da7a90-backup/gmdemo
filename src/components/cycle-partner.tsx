"use client";
import { activeDraw } from "@/lib/mock-data";
import { useCycleConfig, useCyclePartner } from "@/lib/cycle-store";
import { PartnerMark } from "@/components/partner-mark";

/** Admin-configured charity name (falls back to the mock cycle charity). */
export function CharityName() {
  const partner = useCyclePartner();
  return <>{partner?.name ?? activeDraw.charity.name}</>;
}

/** Admin-configured charity blurb. */
export function CharityBlurb() {
  const c = useCycleConfig();
  return <>{c.charityBlurb}</>;
}

/** Partner logo badge for the charity sections (home + tickets). */
export function CyclePartnerBadge({ dark = false }: { dark?: boolean }) {
  const partner = useCyclePartner();
  if (!partner) return null;
  return (
    <span className="inline-flex items-center gap-2.5">
      <PartnerMark partner={partner} size="sm" dark={dark} />
      <span className={`font-condensed uppercase tracking-[0.18em] text-[10px] ${dark ? "text-paper-3/70" : "text-ink-3"}`}>
        Official cycle partner
      </span>
    </span>
  );
}
