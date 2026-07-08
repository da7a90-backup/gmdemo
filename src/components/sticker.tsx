import { ReactNode } from "react";

/**
 * Editorial primitives only. No rotations, no bursts, no tape, no stars.
 * Rounded-modernist style: pill labels and softly rounded lot tags with hairline borders.
 */

type Tone = "ink" | "accent" | "charity" | "brass" | "paper";

const TONE_BOX: Record<Tone, string> = {
  ink: "bg-ink text-paper border-ink/10",
  accent: "bg-accent text-paper-3 border-accent",
  charity: "bg-charity text-paper-3 border-charity",
  brass: "bg-brass text-ink border-brass",
  paper: "bg-paper-3 text-ink border-ink/10",
};

const TONE_OUTLINE: Record<Tone, string> = {
  ink: "bg-transparent text-ink border-ink/10",
  accent: "bg-transparent text-accent border-accent",
  charity: "bg-transparent text-charity border-charity",
  brass: "bg-transparent text-brass-deep border-brass",
  /* "paper" outline is meant for dark backgrounds — cream-on-dark, not invisible-on-cream */
  paper: "bg-transparent text-paper border-paper",
};

/** Label — pill-shaped boxed label, like an auction lot tag. */
export function Label({
  children,
  tone = "ink",
  variant = "solid",
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const padding =
    size === "sm" ? "px-2 py-1 text-[10px]" : size === "lg" ? "px-3.5 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]";
  const tones = variant === "solid" ? TONE_BOX[tone] : TONE_OUTLINE[tone];
  return (
    <span
      className={`inline-flex items-center font-condensed uppercase tracking-[0.22em] border rounded-full ${padding} ${tones} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Tag — auction-house style lot number tag, with a small hole punch. */
export function Tag({
  number,
  label,
  tone = "paper",
  className,
}: {
  number: string;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const tones = TONE_BOX[tone];
  return (
    <span className={`relative inline-flex items-center gap-2 border rounded-md px-3 py-1.5 ${tones} ${className ?? ""}`}>
      <span aria-hidden className="inline-block h-2 w-2 border border-current opacity-50 rounded-full" />
      <span className="font-condensed uppercase tracking-[0.22em] text-[10px] opacity-70">{label ?? "Lot"}</span>
      <span className="font-condensed text-[14px]">{number}</span>
    </span>
  );
}

/** SectionRule — hairline rule with optional eyebrow text inline. */
export function SectionRule({
  label,
  align = "left",
}: {
  label?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`flex items-center gap-4 ${align === "center" ? "justify-center" : ""}`}>
      <span className="block h-px flex-1 bg-rule-soft" />
      {label && (
        <span className="font-condensed uppercase tracking-[0.28em] text-[10px] text-ink-3">{label}</span>
      )}
      <span className="block h-px flex-1 bg-rule-soft" />
    </div>
  );
}

/** Byline — newspaper-style dateline. */
export function Byline({
  cycle,
  place,
  date,
}: {
  cycle: number;
  place: string;
  date: string;
}) {
  return (
    <p className="dateline">
      Cycle №{String(cycle).padStart(2, "0")} &nbsp;·&nbsp; {place} &nbsp;·&nbsp; {date}
    </p>
  );
}
