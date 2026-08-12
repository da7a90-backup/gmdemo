import {
  Lock, ShieldCheck, HeartHandshake, CheckCircle2, Trophy, BadgeCheck,
  Landmark, Sparkles, Star, Gift, Users, Scale, type LucideIcon,
} from "lucide-react";

// Curated icon set for the admin-editable trust "pillars" on the tickets buy box.
// Keys are the values stored in copy (e.g. tickets.pillar.secure.icon = "lock").
export const ICON_SET: Record<string, LucideIcon> = {
  lock: Lock,
  shield: ShieldCheck,
  heart: HeartHandshake,
  check: CheckCircle2,
  trophy: Trophy,
  badge: BadgeCheck,
  charity: Landmark,
  sparkles: Sparkles,
  star: Star,
  gift: Gift,
  users: Users,
  scale: Scale,
};

export const ICON_NAMES = Object.keys(ICON_SET);

/** Resolve a stored icon name to its component (falls back to a lock). */
export function iconFor(name: string | undefined): LucideIcon {
  return ICON_SET[(name || "").toLowerCase()] ?? Lock;
}
