"use client";
import { useEffect, useState } from "react";

type Pricing = { tickets: Record<string, number>; memberships: Record<string, { price: number; entries: number }> };

/** Live Shopify prices (GET /api/pricing) with helpers that return null until loaded /
 * when a match isn't found, so callers fall back to their code default. */
export function usePricing() {
  const [p, setP] = useState<Pricing | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/pricing").then((r) => r.json()).then((j) => { if (alive && j?.ok) setP(j.data as Pricing); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return {
    ticketPrice: (entries: number): number | null => p?.tickets?.[String(entries)] ?? null,
    membershipPrice: (tier: string): number | null => p?.memberships?.[tier.toLowerCase()]?.price ?? null,
  };
}
