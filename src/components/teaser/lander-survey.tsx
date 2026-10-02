"use client";
import { useState } from "react";

// Survey: which car would you want to win. Stored in prize_votes via /api/subscribe/email.
const CARS = [
  { year: "1969", name: "Camaro", full: "1969 Camaro", alt: "1969 Chevrolet Camaro", img: "/teaser/cars/1969-camaro.webp" },
  { year: "1964", name: "Corvette", full: "1964 Corvette", alt: "1964 Chevrolet Corvette", img: "/teaser/cars/1964-corvette.webp" },
  { year: "1984", name: "911 Targa", full: "1984 911 Targa", alt: "1984 Porsche 911 Targa", img: "/teaser/cars/1984-911-targa.webp" },
];

export function LanderSurvey() {
  const [prize, setPrize] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!prize) { setErr("Pick the car you'd want to win first."); return; }
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/subscribe/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "Lander", claim: true, prize }),
      });
      if ((await r.json())?.ok) setDone(true);
      else setErr("Something went wrong — please try again.");
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="pick-heading" className="flex w-full flex-col items-center gap-4 sm:gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 id="pick-heading" className="gm-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Tell us which car you&apos;d want to win!
        </h2>
        <p className="text-pretty text-sm font-medium text-foreground">We&apos;ll announce the giveaway prize soon via email.</p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Choose your prize car">
        {CARS.map((c) => {
          const sel = prize === c.full;
          return (
            <button
              type="button"
              key={c.full}
              aria-pressed={sel}
              onClick={() => setPrize(c.full)}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card/60 text-left backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                sel ? "border-primary ring-2 ring-primary" : "border-border hover:-translate-y-0.5 hover:border-primary/50"
              }`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={c.alt}
                  loading="lazy"
                  decoding="async"
                  src={c.img}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-card/80 to-transparent" />
                <span
                  aria-hidden
                  className={`absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border transition-all sm:size-7 ${
                    sel ? "border-primary bg-primary text-primary-foreground" : "border-foreground/40 bg-background/40 text-transparent"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 sm:size-4" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 bg-card/90 px-2.5 pb-2.5 pt-1.5 sm:px-3">
                <span className="gm-display text-sm font-bold leading-tight text-foreground sm:text-base">
                  <span className="text-primary-ink">{c.year}</span> {c.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-full">
        {done ? (
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full border-2 border-primary/40 bg-card/95 px-4 py-3 text-center text-sm font-medium text-foreground">
            Check your inbox — confirm to claim your free ticket 🎟️
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="flex w-full flex-col items-center gap-2">
            <h2 className="gm-display text-lg font-bold text-foreground text-balance sm:text-xl">
              Enter your email for a <span className="highlight">Free Ticket</span> before launch.
            </h2>
            <div className="flex w-full max-w-md items-center rounded-full border-2 border-foreground/15 bg-card/95 p-1 shadow-lg backdrop-blur-sm transition-colors focus-within:border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-3 size-4 shrink-0 text-muted-foreground" aria-hidden>
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                <rect x="2" y="4" width="20" height="16" rx="2" />
              </svg>
              <label htmlFor="ticket-email" className="sr-only">Email address</label>
              <input
                id="ticket-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                aria-label="Claim my free ticket"
                className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-foreground/15 bg-cta px-4 font-semibold text-cta-foreground shadow-sm transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60 sm:px-5"
              >
                <span className="hidden text-sm sm:inline">{busy ? "…" : "Claim"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
            {err && <p className="text-xs font-medium text-red-600">{err}</p>}
            <p className="rounded-full bg-card/80 px-3 py-0.5 text-xs font-medium text-foreground/80">
              No purchase necessary. One free ticket per person.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
