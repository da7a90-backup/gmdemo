import { Facebook, Instagram } from "lucide-react";
import { AnimIgnition } from "@/components/teaser/anim-ignition";
import { TeaserSignup } from "@/components/teaser/signup";
import { RootDark } from "@/components/teaser/root-dark";

const SOCIALS = [
  { href: "https://www.facebook.com/generousmotors.org", label: "Generous Motors on Facebook", Icon: Facebook },
  { href: "https://www.instagram.com/generousmotors/", label: "Generous Motors on Instagram", Icon: Instagram },
];

/**
 * Coming-soon teaser shown at "/" while the full site is soft-launched under /beta.
 * Ignition logo animation over a darkened brand video + the newsletter capture.
 */
export function Teaser() {
  return (
    <div className="teaser-root relative w-full bg-[#0a0a0a] text-white">
      {/* darken the document root so the browser backdrop (behind the address bar
          + overscroll) isn't the site's cream */}
      <RootDark />
      {/* Fixed, full-viewport background so no cream gap ever shows when the mobile
          address bar collapses (svh→lvh). Sits behind the content. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/teaser/ignition-poster.jpg"
        >
          <source src="/teaser/ignition-bg-1080.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, rgba(0,209,189,0.12), transparent 60%), radial-gradient(80% 50% at 50% 115%, rgba(0,209,189,0.14), transparent 70%)",
          }}
        />
      </div>

      {/* content column — main block centered in the free space, tagline pinned at
          the bottom of the flow so nothing clips on short mobile viewports */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-6 py-5 sm:py-8">
        <div className="flex flex-1 flex-col items-center justify-center">
          <AnimIgnition theme="dark" />

          <h1 className="mt-4 text-center font-display text-[clamp(1.3rem,5vw,2.25rem)] font-bold leading-[1.05] text-white sm:mt-6">
            Win the car. <span className="text-[var(--color-accent-bright)]">Fund the cause.</span>
          </h1>

          <p className="mt-2 max-w-xl text-center font-serif text-[13px] leading-snug text-white/75 sm:mt-3 sm:text-[15px] sm:leading-relaxed">
            Generous Motors is a new kind of car giveaway. Every ticket you buy helps fund another nonprofit, and every draw is streamed live so you can watch it happen.
          </p>

          <p className="mt-2.5 max-w-md text-center text-[13px] text-white/80 sm:mt-4 sm:text-[14px]">
            Drop your email below and get a <span className="font-bold text-[var(--color-accent-bright)]">free ticket</span> the moment we launch.
          </p>
          <div className="mt-2.5 flex w-full justify-center">
            <TeaserSignup source="Coming soon" claim submitLabel="Get My Free Ticket" />
          </div>
        </div>

        <p className="shrink-0 pt-3 text-center font-condensed text-[13px] font-bold uppercase tracking-[0.28em] text-white/85 sm:pt-6 sm:text-[17px]">
          Launching soon…
        </p>

        {/* Socials — centered under "Launching soon…" on mobile; bottom-right corner on desktop.
            Outline icons in the brand teal, matching the GM logo. */}
        <div className="mt-3 flex shrink-0 items-center justify-center gap-3 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0">
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-accent-bright)]/50 text-[var(--color-accent-bright)] transition-colors hover:bg-[var(--color-accent-bright)] hover:text-[#0a0a0a] sm:h-10 sm:w-10"
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden />
            </a>
          ))}
        </div>

        {/* Nonprofit blurb — under the socials (below them on mobile, above the corner
            socials' baseline on desktop). General Sans, italic. */}
        <p className="mt-2.5 max-w-xl shrink-0 text-center font-sans text-[11px] italic leading-snug text-white/55 sm:mt-4 sm:text-[13px] sm:leading-relaxed">
          Generous Motors is a registered 501(c)(3) nonprofit. We give away cars to raise funds and awareness for other nonprofit causes, and 10% of each cycle&apos;s proceeds go directly to charity.
        </p>
      </div>
    </div>
  );
}
