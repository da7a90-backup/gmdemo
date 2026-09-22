"use client";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

/** Teaser newsletter capture — same endpoint the footer signup uses. */
export function TeaserSignup({
  source = "Beta teaser",
  theme = "dark",
  claim = false,
  submitLabel = "Notify me",
}: {
  source?: string;
  theme?: "dark" | "paper";
  /** When true, sign up for the free-ticket claim flow (sends a confirm-to-claim email). */
  claim?: boolean;
  submitLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const paper = theme === "paper";

  if (done) {
    return (
      <div
        className={`flex w-full max-w-md items-center gap-3 rounded-full border px-5 py-3.5 ${
          paper
            ? "border-[color:var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
            : "border-[var(--color-accent-bright)]/50 bg-white/5 text-white backdrop-blur"
        }`}
      >
        <CheckCircle2 size={18} className={`shrink-0 ${paper ? "text-[var(--color-accent)]" : "text-[var(--color-accent-bright)]"}`} />
        <p className="text-[14px]">
          {claim
            ? "Check your inbox — confirm to claim your free ticket 🎟️"
            : "You're on the list — we'll email you the moment we launch."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/subscribe/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, source, claim }),
          });
          if ((await r.json())?.ok) setDone(true);
        } catch {
          /* keep the form up to retry */
        } finally {
          setBusy(false);
        }
      }}
      className="flex w-full max-w-md flex-col gap-2.5"
    >
      <div
        className={`flex items-center overflow-hidden rounded-full border ${
          paper
            ? "border-[color:var(--color-ink)]/15 bg-[var(--color-paper-4)] focus-within:border-[var(--color-accent)]"
            : "border-white/25 bg-white/5 backdrop-blur focus-within:border-[var(--color-accent-bright)]"
        }`}
      >
        <Mail size={16} className={`ml-4 shrink-0 ${paper ? "text-[var(--color-ink-3)]" : "text-white/50"}`} />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className={`h-13 min-w-0 flex-1 bg-transparent px-3 py-3.5 text-[15px] outline-none ${
            paper ? "text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]" : "text-white placeholder:text-white/40"
          }`}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-bright)] font-condensed text-[13px] font-bold uppercase tracking-[0.18em] text-[#0a0a0a] transition-colors hover:bg-[var(--color-brass)] disabled:opacity-60"
      >
        {busy ? "Working…" : submitLabel} {!busy && <ArrowRight size={15} strokeWidth={2.5} />}
      </button>
    </form>
  );
}
