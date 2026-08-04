// Cycle manager (demo) — the admin sets the current cycle's draw date, cap,
// and charity partner without touching code. Overrides layer on top of the
// mock activeDraw; countdowns and charity sections pick them up live.

import { useEffect, useState } from "react";
import { activeDraw, type Draw } from "@/lib/mock-data";
import { getPartners, type Partner } from "@/lib/partners-store";

/** The current cycle's prize as a `Draw`-shaped object (Supabase, with the mock
 * activeDraw as fallback). Drop-in for components that read `activeDraw`. */
export function usePrizeCycle(): Draw {
  const [d, setD] = useState<Draw>(activeDraw);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/cycle")
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j.ok || !j.data) return;
        const c = j.data;
        const v = c.vehicle ?? {};
        setD({
          ...activeDraw,
          cycle: c.cycle || activeDraw.cycle,
          drawDateISO: c.drawDateISO || activeDraw.drawDateISO,
          ticketsSold: c.ticketsSold ?? activeDraw.ticketsSold,
          pricePerTicketUSD: c.pricePerTicketUSD || activeDraw.pricePerTicketUSD,
          vehicle: {
            ...activeDraw.vehicle,
            year: v.year || activeDraw.vehicle.year,
            make: v.make || activeDraw.vehicle.make,
            model: v.model || activeDraw.vehicle.model,
            trim: v.trim || activeDraw.vehicle.trim,
            valueUSD: v.valueUSD || activeDraw.vehicle.valueUSD,
            images: v.images?.length ? v.images : activeDraw.vehicle.images,
            image: v.image || activeDraw.vehicle.image,
            headlineSpecs: v.headlineSpecs?.length ? v.headlineSpecs : activeDraw.vehicle.headlineSpecs,
            specGroups: v.specGroups?.length ? v.specGroups : activeDraw.vehicle.specGroups,
          },
          charity: { ...activeDraw.charity, blurb: c.charityBlurb || activeDraw.charity.blurb },
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return d;
}

export type CycleConfig = {
  cycle: number;
  vehicleLabel: string;
  drawDateISO: string;
  /** Partner id from the partner registry. */
  charityPartnerId: string;
  charityBlurb: string;
};

export const DEFAULT_CYCLE: CycleConfig = {
  cycle: activeDraw.cycle,
  vehicleLabel: `${activeDraw.vehicle.year} ${activeDraw.vehicle.make} ${activeDraw.vehicle.model}`,
  drawDateISO: activeDraw.drawDateISO,
  charityPartnerId: "p-habitat",
  charityBlurb: activeDraw.charity.blurb,
};

const STORAGE_KEY = "gm:cycle-v1";
export const CYCLE_EVENT = "gm:cycle-updated";

export function getCycleConfig(): CycleConfig {
  if (typeof window === "undefined") return DEFAULT_CYCLE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CYCLE, ...(JSON.parse(raw) as Partial<CycleConfig>) } : DEFAULT_CYCLE;
  } catch {
    return DEFAULT_CYCLE;
  }
}

export function saveCycleConfig(c: CycleConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event(CYCLE_EVENT));
}

export function resetCycleConfig() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CYCLE_EVENT));
}

export function getCyclePartner(config = getCycleConfig()): Partner | undefined {
  return getPartners().find((p) => p.id === config.charityPartnerId);
}

export function useCycleConfig(): CycleConfig {
  const [c, setC] = useState<CycleConfig>(DEFAULT_CYCLE);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/cycle").then((r) => r.json()).then((j) => {
      if (!alive || !j.ok || !j.data) return;
      const d = j.data as { cycle: string; vehicleLabel: string; drawDateISO: string; charityPartnerId?: string; charityBlurb?: string };
      setC({
        cycle: Number(d.cycle) || DEFAULT_CYCLE.cycle,
        vehicleLabel: d.vehicleLabel || DEFAULT_CYCLE.vehicleLabel,
        drawDateISO: d.drawDateISO || DEFAULT_CYCLE.drawDateISO,
        charityPartnerId: d.charityPartnerId || DEFAULT_CYCLE.charityPartnerId,
        charityBlurb: d.charityBlurb || DEFAULT_CYCLE.charityBlurb,
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return c;
}

export function useCyclePartner(): Partner | undefined {
  const config = useCycleConfig();
  const [partner, setPartner] = useState<Partner | undefined>(undefined);
  useEffect(() => {
    if (!config.charityPartnerId) return;
    let alive = true;
    fetch("/api/admin/partners").then((r) => r.json()).then((j) => {
      if (alive && j.ok) setPartner((j.data as Partner[]).find((p) => p.id === config.charityPartnerId));
    }).catch(() => {});
    return () => { alive = false; };
  }, [config.charityPartnerId]);
  return partner;
}

/**
 * Draw-date override hook for the countdown components: when the passed
 * target is the default draw date, the admin-configured date wins; explicit
 * targets (promo end times) pass through untouched.
 */
export function useCycleDrawDate(target: string): string {
  const config = useCycleConfig();
  return target === activeDraw.drawDateISO ? config.drawDateISO : target;
}
