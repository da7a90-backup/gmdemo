import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrizeSurvey } from "@/components/teaser/prize-survey";

const SOCIALS = [
  { href: "https://www.facebook.com/generousmotors.org", label: "Generous Motors on Facebook", Icon: Facebook },
  { href: "https://www.instagram.com/generousmotors/", label: "Generous Motors on Instagram", Icon: Instagram },
];

/**
 * Coming-soon lander shown at "/" while the full site is soft-launched under /beta.
 * Prize-preference survey (which car you'd want to win) + free-ticket email capture.
 */
export function Teaser() {
  return (
    <div className="min-h-[100dvh] w-full bg-[var(--color-paper)] text-ink">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Logo height={26} markColor="var(--color-accent-bright)" letterColor="var(--color-ink)" />
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper-4 px-3 py-1 font-condensed text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-bright opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-bright" />
          </span>
          Launching soon
        </span>
      </header>

      {/* Hero + survey */}
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-6 text-center sm:pt-12">
        <p className="section-eyebrow">Our First-Ever Giveaway</p>
        <h1 className="mx-auto mt-5 max-w-3xl hero-headline" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05 }}>
          Tell us which car you&apos;d <span className="accent-serif">want to win!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-serif text-[16px] text-ink-2 sm:text-[18px]">
          We&apos;ll announce the giveaway prize soon via email.
        </p>

        <div className="mt-10">
          <PrizeSurvey />
        </div>
      </main>

      {/* Venue image */}
      <section className="relative">
        <div className="relative h-[clamp(300px,46vh,560px)] w-full overflow-hidden border-y border-ink/10">
          <Image
            src="/teaser/archive-courtyard.webp"
            alt="The Motoring Archives courtyard"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <p className="mx-auto max-w-5xl px-6 py-3 text-center font-serif text-[13px] italic text-ink-3">
          Background: the Motoring Archives courtyard, home of the prize vehicle.
        </p>
      </section>

      {/* Value proposition */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="hero-headline" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          Win the car. <span className="accent-serif">Fund the cause.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-serif text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
          Generous Motors is a new kind of car giveaway. Every ticket you buy helps fund another nonprofit, and every
          draw is streamed live so you can watch it happen.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-ink-3">
          10% of every giveaway goes directly to charity. Each giveaway&apos;s named partner gets a portion of every ticket.
        </p>

        {/* Socials */}
        <div className="mt-9 flex items-center justify-center gap-3">
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:bg-accent hover:text-paper"
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden />
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 px-6 py-6 text-center font-condensed text-[11px] uppercase tracking-[0.18em] text-ink-3">
        © 2026 Generous Motors. No purchase necessary to enter or win.
      </footer>
    </div>
  );
}
