"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, ArrowRight, CheckCircle2 } from "lucide-react";

// Survey options — which car would you want to win. Selection is stored (prize_votes).
const CARS = [
  { name: "1969 Camaro", img: "/teaser/cars/1969-camaro.webp" },
  { name: "1964 Corvette", img: "/teaser/cars/1964-corvette.webp" },
  { name: "1984 911 Targa", img: "/teaser/cars/1984-911-targa.webp" },
];

export function PrizeSurvey() {
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
    <div className="mx-auto w-full max-w-4xl">
      {/* Car selection cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CARS.map((c) => {
          const sel = prize === c.name;
          return (
            <button
              type="button"
              key={c.name}
              onClick={() => setPrize(c.name)}
              aria-pressed={sel}
              className={`group relative overflow-hidden rounded-2xl border bg-paper-4 text-left shadow-soft transition ${
                sel ? "border-accent ring-2 ring-accent" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              <div className="relative aspect-[16/10]">
                <Image src={c.img} alt={c.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                {sel && (
                  <span className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-paper shadow">
                    <Check size={16} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-display font-bold text-ink">{c.name}</span>
                <span className={`font-condensed text-[11px] uppercase tracking-[0.18em] ${sel ? "text-accent" : "text-ink-3"}`}>
                  {sel ? "Selected" : "Pick"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Email capture */}
      {done ? (
        <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-full border border-accent/40 bg-accent-soft px-5 py-3.5 text-ink">
          <CheckCircle2 size={18} className="shrink-0 text-accent" />
          <p className="text-[14px]">Check your inbox — confirm to claim your free ticket 🎟️</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-8 w-full max-w-md">
          <p className="text-[14.5px] text-ink-2">
            Enter your email for a <span className="font-bold text-accent">Free Ticket</span> before launch.
          </p>
          <div className="mt-3 flex items-center overflow-hidden rounded-full border border-ink/15 bg-paper-4 focus-within:border-accent">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-label="Email address"
              className="h-12 min-w-0 flex-1 bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 shrink-0 items-center gap-2 self-stretch bg-accent-bright px-6 font-condensed text-[12px] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-brass disabled:opacity-60"
            >
              {busy ? "…" : "Claim"} {!busy && <ArrowRight size={15} strokeWidth={2.5} />}
            </button>
          </div>
          {err && <p className="mt-2.5 text-[13px] text-red-600">{err}</p>}
          <p className="mt-3 font-condensed text-[11px] uppercase tracking-[0.18em] text-ink-3">
            No purchase necessary. One free ticket per person.
          </p>
        </form>
      )}
    </div>
  );
}
