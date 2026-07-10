// Partner registry (demo) — charity partners + brand sponsors.
// Admin adds/removes partners from the Cycle desk; the /partners page and
// the charity sections read the merged list.

import { useEffect, useState } from "react";

export type Partner = {
  id: string;
  name: string;
  kind: "charity" | "sponsor";
  /** Optional logo image URL; without one the site renders a styled wordmark. */
  logoUrl?: string;
  url?: string;
  blurb?: string;
};

export const SEED_PARTNERS: Partner[] = [
  { id: "p-habitat", name: "Habitat for Humanity", kind: "charity", url: "https://www.habitat.org", blurb: "Cycle 12 partner — shelter for families across the US." },
  { id: "p-stjude", name: "St. Jude Children's", kind: "charity", url: "https://www.stjude.org", blurb: "Cycle 10 partner — childhood cancer research and care." },
  { id: "p-feeding", name: "Feeding America", kind: "charity", url: "https://www.feedingamerica.org", blurb: "Cycle 9 partner — the largest US hunger-relief network." },
  { id: "p-bgc", name: "Boys & Girls Club", kind: "charity", url: "https://www.bgca.org", blurb: "Cycle 8 partner — after-school programs nationwide." },
  { id: "p-apex", name: "Apex Detailing Co.", kind: "sponsor", blurb: "Preps every prize vehicle before delivery." },
  { id: "p-sunbelt", name: "Sunbelt Tire & Wheel", kind: "sponsor", blurb: "Wheels and rubber on every giveaway build." },
  { id: "p-miamimotor", name: "Miami Motor Collective", kind: "sponsor", blurb: "Sourcing and inspection partner for the fleet." },
];

const STORAGE_KEY = "gm:partners-v1";
export const PARTNERS_EVENT = "gm:partners-updated";

export function getPartners(): Partner[] {
  if (typeof window === "undefined") return SEED_PARTNERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const custom = raw ? (JSON.parse(raw) as Partner[]) : [];
    return [...custom, ...SEED_PARTNERS];
  } catch {
    return SEED_PARTNERS;
  }
}

function customOnly(): Partner[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partner[]) : [];
  } catch {
    return [];
  }
}

export function addPartner(p: Omit<Partner, "id">): Partner {
  const partner: Partner = { ...p, id: `p-custom-${Math.random().toString(36).slice(2, 8)}` };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([partner, ...customOnly()]));
  window.dispatchEvent(new Event(PARTNERS_EVENT));
  return partner;
}

export function removePartner(id: string) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly().filter((p) => p.id !== id)));
  window.dispatchEvent(new Event(PARTNERS_EVENT));
}

export function isCustomPartner(id: string): boolean {
  return id.startsWith("p-custom-");
}

export function usePartners(): Partner[] {
  const [list, setList] = useState<Partner[]>(SEED_PARTNERS);
  useEffect(() => {
    const load = () => setList(getPartners());
    load();
    window.addEventListener(PARTNERS_EVENT, load);
    return () => window.removeEventListener(PARTNERS_EVENT, load);
  }, []);
  return list;
}
