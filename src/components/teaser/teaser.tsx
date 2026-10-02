import { LanderSurvey } from "@/components/teaser/lander-survey";
import { LOGO_VIEWBOX, MARK_G, MARK_M, WORDMARK } from "@/components/teaser/logo-data";

const SOCIALS = [
  { href: "https://www.facebook.com/generousmotors.org", label: "Generous Motors on Facebook", icon: "/icons/facebook.svg" },
  { href: "https://www.instagram.com/generousmotors/", label: "Generous Motors on Instagram", icon: "/icons/instagram.svg" },
];

const maskStyle = (icon: string) => ({
  maskImage: `url(${icon})`,
  WebkitMaskImage: `url(${icon})`,
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
});

/** Coming-soon launch lander at "/" — prize-preference survey + free-ticket capture. */
export function Teaser() {
  return (
    <div className="gm-lander relative isolate min-h-dvh overflow-x-hidden bg-background text-foreground">
      <main className="flex w-full flex-col items-center">
        {/* First viewport — header, headline, survey + email capture */}
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-10 sm:px-6">
          <header className="flex flex-col items-center gap-6 text-center sm:gap-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <svg viewBox={LOGO_VIEWBOX} className="block w-32 overflow-visible sm:w-44" role="img" aria-label="Generous Motors">
                <path d={MARK_G} className="fill-primary" />
                <path d={MARK_M} className="fill-primary" />
                <g className="fill-foreground">
                  {WORDMARK.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </g>
              </svg>
              <span className="h-14 w-px bg-foreground/20 sm:h-20" aria-hidden />
              <p className="gm-display flex flex-col items-start text-left text-2xl font-extrabold uppercase leading-[0.9] tracking-tight text-foreground sm:text-4xl">
                <span>Launching</span>
                <span className="flex items-center gap-2.5 text-primary-ink sm:gap-3">
                  Soon
                  <span className="relative flex size-2.5 sm:size-3" aria-hidden>
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-full rounded-full bg-primary" />
                  </span>
                </span>
              </p>
            </div>
            <h1 className="gm-display text-4xl font-extrabold leading-[0.95] tracking-tight text-foreground text-balance sm:text-6xl">
              Our First-Ever Giveaway
            </h1>
          </header>

          <LanderSurvey />
        </div>

        {/* Second block — venue image, cause card, footer */}
        <div className="relative isolate w-full pt-16 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent,black_45%)]"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              loading="lazy"
              decoding="async"
              src="/teaser/archive-courtyard.webp"
              className="absolute inset-0 h-full w-full object-cover object-[50%_65%]"
            />
            <div className="absolute inset-0 bg-background/55" />
          </div>
          <p className="sr-only">Background: the Motoring Archives courtyard, home of the prize vehicle.</p>

          <div className="mx-auto w-full max-w-3xl px-4 pb-12 sm:px-6 sm:pb-16">
            <section
              aria-labelledby="cause-heading"
              className="flex w-full flex-col items-center gap-5 rounded-3xl border border-border bg-background/80 px-5 py-10 text-center shadow-xl shadow-foreground/5 backdrop-blur-md sm:px-10 sm:py-12"
            >
              <h2 id="cause-heading" className="gm-display text-3xl font-extrabold tracking-tight text-foreground text-balance sm:text-4xl">
                Win the car. <span className="highlight">Fund the cause.</span>
              </h2>
              <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
                Generous Motors is a new kind of car giveaway. Every ticket you buy helps fund another nonprofit, and every
                draw is streamed live so you can watch it happen.
              </p>
              <p className="max-w-xl text-pretty font-semibold leading-relaxed text-foreground">
                10% of every giveaway goes directly to charity. Each giveaway&apos;s named partner gets a portion of every ticket.
              </p>
            </section>
          </div>

          <footer className="flex flex-col items-center gap-4 pb-16">
            <ul className="flex items-center gap-4">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-12 items-center justify-center rounded-full border border-primary-ink/40 bg-card/70 text-primary-ink transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <span aria-hidden className="inline-block size-5 bg-current" style={maskStyle(s.icon)} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">© 2026 Generous Motors. No purchase necessary to enter or win.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
