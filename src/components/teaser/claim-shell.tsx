"use client";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Ticket } from "lucide-react";
import { Logo } from "@/components/logo";
import { RootDark } from "@/components/teaser/root-dark";

function fmtPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const input =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-[15px] text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-[var(--color-accent-bright)]";

export function ClaimShell({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ticketNumbers: string; cycle: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/free-ticket/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, name, phone }),
      });
      const j = await r.json();
      if (j?.ok) setDone(j.data);
      else setError(j?.error || "Something went wrong — please try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teaser-root relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-white">
      <RootDark />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% -10%, rgba(0,209,189,0.12), transparent 60%)" }}
      />

      <div className="relative z-[1] w-full max-w-md text-center">
        <Logo height={30} markColor="var(--color-accent-bright)" letterColor="#ffffff" className="mx-auto" />

        {!token ? (
          <div className="mt-10">
            <h1 className="font-display text-2xl font-bold">This link isn&apos;t valid</h1>
            <p className="mt-3 font-serif text-[15px] text-white/70">
              The claim link is missing or malformed. Open the most recent &ldquo;claim your free ticket&rdquo; email and tap the button again.
            </p>
          </div>
        ) : done ? (
          <div className="mt-10">
            <CheckCircle2 size={40} className="mx-auto text-[var(--color-accent-bright)]" />
            <h1 className="mt-4 font-display text-2xl font-bold">You&apos;re in the drum.</h1>
            <p className="mt-3 font-serif text-[15px] text-white/75">
              Your free entry for Cycle {done.cycle} is locked in.
            </p>
            {done.ticketNumbers && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-condensed text-[13px] font-bold tracking-[0.14em] text-white">
                <Ticket size={15} className="text-[var(--color-accent-bright)]" /> {done.ticketNumbers}
              </p>
            )}
            <p className="mt-5 font-serif text-[14px] text-white/60">
              We emailed your confirmation — good luck, and thanks for funding the cause.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 text-left">
            <h1 className="text-center font-display text-2xl font-bold">Claim your free ticket 🎟️</h1>
            <p className="mt-3 text-center font-serif text-[15px] text-white/70">
              Confirm your details — we print your name on the physical barrel ticket.
            </p>
            <div className="mt-6 space-y-3">
              <input
                className={input}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
              <input
                className={input}
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(fmtPhone(e.target.value))}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
            {error && <p className="mt-3 text-center text-[13px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-bright)] px-6 py-3.5 font-condensed text-[13px] font-bold uppercase tracking-[0.2em] text-[#0a0a0a] transition-colors hover:bg-[var(--color-brass)] disabled:opacity-60"
            >
              {busy ? "Claiming…" : "Claim my ticket"} <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <p className="mt-4 text-center font-condensed text-[10px] uppercase tracking-[0.24em] text-white/40">
              One free entry · No purchase necessary
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
