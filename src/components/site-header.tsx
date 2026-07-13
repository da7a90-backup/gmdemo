"use client";
import Link from "next/link";
import { Menu, X, CircleUserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getUser, SESSION_EVENT } from "@/lib/session";
import { Logo } from "@/components/logo";
import { CountdownCompact } from "@/components/countdown";
import { activeDraw } from "@/lib/mock-data";

const NAV = [
  { href: "/tickets", label: "Tickets" },
  { href: "/winners", label: "Winners" },
  { href: "/live", label: "Live draw" },
  { href: "/partners", label: "Partners" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Field Notes" },
  { href: "/lookup", label: "My Entries" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const load = () => setSignedIn(!!getUser());
    load();
    window.addEventListener(SESSION_EVENT, load);
    return () => window.removeEventListener(SESSION_EVENT, load);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 gap-6">
        <Link href="/" aria-label="Generous Motors home" className="flex items-center group">
          <Logo
            height={32}
            markColor="var(--color-accent-bright)"
            letterColor="var(--color-ink)"
            className="group-hover:[&_path:first-child]:fill-[var(--color-accent-hover)]"
          />
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-condensed uppercase tracking-[0.22em] text-[11px] px-4 py-2 text-ink hover:text-accent transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Live-draw countdown — desktop: between My Entries and Buy tickets;
            mobile: nav is hidden, so it sits between the logo and the hamburger. */}
        <Link href="/live" aria-label="Countdown to the live drawing" className="shrink-0">
          <CountdownCompact targetISO={activeDraw.drawDateISO} />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-label="Your account"
            className="inline-flex h-11 items-center gap-2 px-3.5 border border-ink/10 bg-paper text-ink rounded-full hover:bg-ink hover:text-paper transition-colors font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold"
          >
            <CircleUserRound size={18} />
            <span suppressHydrationWarning>{signedIn ? "Account" : "Sign in"}</span>
          </Link>
          <Link
            href="/tickets"
            className="hidden md:inline-flex items-center gap-2 bg-accent-bright text-ink px-6 py-2.5 font-condensed uppercase tracking-[0.24em] text-[12px] font-bold border border-ink/10 btn-poly hover:bg-accent hover:text-paper-3 transition-colors"
          >
            Buy tickets · $10
            <span aria-hidden>→</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center border border-ink/10 bg-paper text-ink rounded-full"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink/10 bg-paper">
          <nav aria-label="Mobile" className="mx-auto max-w-7xl px-5 py-3 flex flex-col divide-y divide-rule-soft">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 font-condensed uppercase tracking-[0.22em] text-[13px] text-ink">
                {n.label}
              </Link>
            ))}
            <Link href="/tickets" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center bg-accent-bright px-5 py-3 border border-ink/10 text-ink font-condensed uppercase tracking-[0.24em] text-[12px] font-bold btn-poly">
              Buy tickets · $10
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
