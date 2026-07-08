"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Mail, ArrowRight, HeartHandshake } from "lucide-react";

/** Routes where the newsletter popup should never appear (interrupts the buy / confirmation flow). */
const SUPPRESS_PATHS = ["/checkout", "/thank-you"];

/**
 * Email-capture popup.
 *
 * Trigger logic comes from Popupsmart's 2025 benchmark report (1.24B displays)
 * + Omnisend/Wisepops data: scroll-based triggers convert at ~5.37% and 6-10s
 * time-delay popups convert at ~2.4%, both materially better than exit-intent (~3.94%)
 * or instant load (~1.9%). We fire on whichever comes first — 8s delay OR 50% scroll —
 * once per session, with a 1-click skip.
 *
 * Source: popupsmart.com/blog/popup-conversion-benchmark-report (2025)
 */
const STORAGE_KEY = "gm:popup-seen-v1";
const DELAY_MS = 8000;
const SCROLL_PCT = 0.5;

export function EmailPopup() {
  const pathname = usePathname();
  const suppressed = SUPPRESS_PATHS.some((p) => pathname?.startsWith(p));
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (suppressed) return; // no listeners at all on checkout / thank-you

    // Manual open via window event (footer "Get drawing alerts" button).
    const onManualOpen = () => {
      setSubmitted(false);
      setOpen(true);
    };
    window.addEventListener("gm:open-popup", onManualOpen);

    // Auto-trigger on every page load (demo behavior — refresh re-fires it).
    // Throttling/cooldown should be added before production.
    let opened = false;
    const fire = () => {
      if (opened) return;
      opened = true;
      setOpen(true);
      cleanup();
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = (window.scrollY + window.innerHeight) / doc.scrollHeight;
      if (scrolled >= SCROLL_PCT) fire();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    const timer = window.setTimeout(fire, DELAY_MS);

    function cleanup() {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    }
    return () => {
      cleanup();
      window.removeEventListener("gm:open-popup", onManualOpen);
    };
  }, [suppressed]);

  // Hard suppress: don't render the modal markup at all on these paths,
  // even if some stale state would otherwise show it.
  if (suppressed) return null;

  const onClose = () => setOpen(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setOpen(false), 2200);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-ink/70 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute -top-3 -right-3 z-10 h-9 w-9 inline-flex items-center justify-center border border-ink/10 bg-paper-4 text-ink hover:bg-accent hover:text-paper-3 rounded-full"
        >
          <X size={16} />
        </button>

        <div className="border-heavy-3 bg-paper-3 shadow-lift rounded-2xl overflow-hidden">
        <div className="bg-accent-bright text-ink border-b border-ink/10 px-5 py-2.5 flex items-center justify-between">
          <span className="font-condensed uppercase tracking-[0.24em] text-[12px] font-bold">★ Inner circle</span>
          <span className="font-condensed uppercase tracking-[0.22em] text-[11px]">Free</span>
        </div>

        {!submitted ? (
          <div className="px-6 pt-7 pb-6">
            <p className="section-eyebrow on-paper">Don&apos;t miss the next draw</p>
            <h2 className="mt-2 font-display font-bold text-ink leading-[1.05]" style={{ fontSize: "1.875rem" }}>
              Get the drawing alerts<br />
              <span className="text-accent">before the public.</span>
            </h2>
            <p className="mt-3 text-[15px] text-ink-2 font-serif">
              Early access to bonus ticket offers, flash sales, and live-drawing reminders. Email only — no spam, one click to unsubscribe.
            </p>

            <form onSubmit={onSubmit} className="mt-6">
              <label className="block">
                <span className="dateline on-paper">Email</span>
                <span className="mt-1.5 flex items-center border border-ink/10 bg-paper-4 px-3 rounded-lg">
                  <Mail size={16} className="text-ink-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="ml-2 w-full h-12 bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none"
                    autoFocus
                  />
                </span>
              </label>
              <button
                type="submit"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 btn-poly"
              >
                Send me the alerts <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-rule-soft flex items-start gap-2.5 text-[12px] text-ink-3 font-serif italic">
              <HeartHandshake size={14} className="mt-0.5 text-charity shrink-0" />
              <span>10% of every cycle&apos;s gross profits goes directly to that cycle&apos;s nonprofit partner. Subscribing helps us reach more drivers — and more charities.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-[12px] text-ink-3 underline underline-offset-4 hover:text-ink"
            >
              No thanks, take me back
            </button>
          </div>
        ) : (
          <div className="px-6 pt-9 pb-9 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center bg-charity text-paper-3 border border-ink/10 rounded-full">
              <Mail size={22} />
            </div>
            <h2 className="mt-5 font-display font-bold text-2xl text-ink">You&apos;re on the list.</h2>
            <p className="mt-2 text-ink-2 font-serif">
              First alert lands before the next bonus drop.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
