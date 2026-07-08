"use client";
import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Label } from "@/components/sticker";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-ink/10 bg-bg-dark text-fg grain grain-dark overflow-hidden">
      <div className="relative mx-auto max-w-[1400px] px-5 py-16">
        {/* MASTHEAD */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-fg/15 pb-10">
          <Link href="/" className="inline-flex items-center" aria-label="Generous Motors">
            <Logo
              height={42}
              markColor="var(--color-accent-bright)"
              letterColor="var(--color-fg)"
            />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Label tone="paper" variant="outline">501(c)(3) nonprofit</Label>
            <Label tone="paper" variant="outline">10% of gross to charity</Label>
            <Label tone="paper" variant="outline">Drawn live</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 pt-10">
          <div className="col-span-2 max-w-sm">
            <p className="font-serif text-[15px] text-fg-2 leading-relaxed">
              Drive the car. Fund the cause. 10% of every cycle goes to a real, named US charity — paid on gross before any operating cost.
            </p>
            <button
              type="button"
              onClick={() => { if (typeof window !== "undefined") window.dispatchEvent(new Event("gm:open-popup")); }}
              className="mt-5 inline-flex items-center gap-2 bg-accent-bright text-ink px-4 py-2.5 border border-paper font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-paper hover:text-ink btn-poly"
            >
              <Mail size={14} /> Get drawing alerts
            </button>
            <div className="mt-5 flex gap-1.5">
              {[Youtube, Facebook, Instagram].map((I, i) => (
                <a key={i} aria-label="Social" className="inline-flex h-10 w-10 items-center justify-center border border-fg/30 text-fg hover:bg-accent-bright hover:border-accent-bright hover:text-ink transition rounded-full" href="#">
                  <I size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Draws" links={[
            ["/tickets", "Current draw"],
            ["/winners", "Past winners"],
            ["/lookup", "My entries"],
          ]} />
          <FooterCol title="Trust" links={[
            ["/about", "How the draw works"],
            ["/blog", "Field notes"],
            ["/about#charity", "Charity flow"],
            ["/legal/rules", "Official rules"],
          ]} />
          <FooterCol title="Help" links={[
            ["/legal/privacy", "Privacy"],
            ["/legal/terms", "Terms"],
            ["/legal/play", "Responsible play"],
            ["/legal/accessibility", "Accessibility"],
          ]} />
        </div>

        <div className="mt-16 border-t border-fg/15 pt-6 grid gap-5 md:grid-cols-[1fr_auto]">
          <p className="font-condensed uppercase tracking-[0.18em] text-[10px] text-fg-2 leading-[1.7]">
            Generous Motors is a registered 501(c)(3) nonprofit organization. No purchase necessary to enter or win. A purchase does not increase your chances of winning. Open to legal residents of the United States, 18 years of age or older. Void where prohibited. Charitable contribution: 10% of gross profits per cycle donated to featured nonprofit partner.
          </p>
          <p className="font-serif italic text-[13px] text-fg-3 md:text-right">
            Generous Motors · 120 Cedar Ave · Brooklyn, NY 11215 · © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-condensed uppercase tracking-[0.22em] text-[11px] text-accent-bright border-b border-fg/15 pb-2 mb-3">{title}</h3>
      <ul className="space-y-2 text-[15px]">
        {links.map(([href, label]) => (
          <li key={href}><Link className="text-fg hover:text-accent-bright" href={href}>{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
