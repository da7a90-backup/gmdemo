"use client";
import { useState } from "react";
import Link from "next/link";
import { Facebook, Instagram, Youtube, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Label } from "@/components/sticker";
import { Copy } from "@/components/copy";
import { addEmailSubscriber } from "@/lib/subscribers";

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="border-b border-fg/15 py-10 grid gap-6 md:grid-cols-2 md:items-center">
      <div>
        <p className="font-condensed uppercase tracking-[0.24em] text-[11px] font-bold text-brass">
          <Copy k="newsletter.eyebrow" />
        </p>
        <p className="mt-2 font-display font-bold text-2xl text-fg leading-tight">
          <Copy k="newsletter.title" />
        </p>
        <p className="mt-1.5 font-serif text-[14px] text-fg-2">
          <Copy k="newsletter.body" />
        </p>
      </div>

      {!done ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addEmailSubscriber(email, "Footer"); // demo store (kept during transition)
            // Real capture → Supabase + Klaviyo (no-op if backend/env absent).
            fetch("/api/subscribe/email", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email, source: "Footer" }),
            }).catch(() => {});
            setDone(true);
          }}
          className="flex w-full max-w-md md:justify-self-end items-center border border-fg/30 bg-bg-dark-2 rounded-full overflow-hidden focus-within:border-accent-bright"
        >
          <Mail size={16} className="text-fg-3 shrink-0 ml-4" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 min-w-0 h-12 bg-transparent px-3 text-[15px] text-fg placeholder:text-fg-3 outline-none"
          />
          <button
            type="submit"
            className="shrink-0 h-12 inline-flex items-center gap-2 bg-accent-bright text-ink px-5 font-condensed uppercase tracking-[0.18em] text-[12px] font-bold hover:bg-brass transition-colors"
          >
            Subscribe <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </form>
      ) : (
        <div className="flex w-full max-w-md md:justify-self-end items-center gap-3 border border-accent-bright/50 bg-bg-dark-2 rounded-full px-5 py-3">
          <CheckCircle2 size={18} className="text-accent-bright shrink-0" />
          <p className="text-[14px] text-fg">
            You&apos;re on the list — your 2X kicks in with the next cycle&apos;s email.
          </p>
        </div>
      )}
    </div>
  );
}

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
            <Label tone="paper" variant="outline">10% to charity</Label>
            <Label tone="paper" variant="outline">Drawn live</Label>
          </div>
        </div>

        {/* Email newsletter — the email-subscriber tier's front door */}
        <NewsletterSignup />

        <div className="grid grid-cols-2 gap-10 md:grid-cols-5 pt-10">
          <div className="col-span-2 max-w-sm">
            <p className="font-serif text-[15px] text-fg-2 leading-relaxed">
              <Copy k="footer.mission" />
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
            ["/partners", "Our partners"],
            ["/blog", "Field notes"],
            ["/rules", "Official rules"],
          ]} />
          <FooterCol title="Help" links={[
            ["/contact", "Contact us"],
            ["/legal/privacy", "Privacy"],
            ["/legal/terms", "Terms"],
            ["/legal/play", "Responsible play"],
            ["/legal/accessibility", "Accessibility"],
          ]} />
        </div>

        <div className="mt-16 border-t border-fg/15 pt-6 grid gap-5 md:grid-cols-[1fr_auto]">
          <p className="font-condensed uppercase tracking-[0.18em] text-[10px] text-fg-2 leading-[1.7]">
            <Copy k="footer.fineprint" />
          </p>
          <p className="font-serif italic text-[13px] text-fg-3 md:text-right">
            <Copy k="footer.address" /> · © {new Date().getFullYear()}
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
