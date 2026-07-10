"use client";
import type { Partner } from "@/lib/partners-store";

/**
 * Partner logo. Renders the uploaded logo image when one is set; otherwise a
 * styled wordmark plate (monogram + name) so partners without image assets
 * still read as logos.
 */
export function PartnerMark({
  partner,
  size = "md",
  dark = false,
}: {
  partner: Partner;
  size?: "sm" | "md" | "lg";
  dark?: boolean;
}) {
  const h = size === "sm" ? "h-9" : size === "lg" ? "h-20" : "h-14";
  const monogram = partner.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  if (partner.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={partner.logoUrl}
        alt={partner.name}
        className={`${h} w-auto object-contain ${dark ? "bg-paper-3 rounded-lg px-2 py-1" : ""}`}
      />
    );
  }

  const tone = dark
    ? "border-paper-3/50 bg-paper-3/10 text-paper-3"
    : "border-ink/15 bg-paper-4 text-ink";
  const mono = dark ? "bg-paper-3 text-ink" : "bg-ink text-paper";

  return (
    <span className={`inline-flex items-center gap-2 border rounded-lg px-2.5 py-1.5 ${h} ${tone}`}>
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-condensed font-bold text-[10px] ${mono}`}>
        {monogram}
      </span>
      <span className="font-display font-bold text-[13px] leading-tight whitespace-nowrap">
        {partner.name}
      </span>
    </span>
  );
}
