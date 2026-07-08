"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/tickets", label: "Tickets" },
  { href: "/winners", label: "Winners" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Field Notes" },
  { href: "/lookup", label: "My Entries" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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

        <div className="flex items-center gap-2">
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
