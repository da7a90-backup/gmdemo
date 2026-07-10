"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, ArrowRight, HeartHandshake, MessageSquareText, Smartphone } from "lucide-react";
import { addSmsSubscriber } from "@/lib/subscribers";

/** Routes where the SMS popup should never appear (interrupts the buy / confirmation flow). */
const SUPPRESS_PATHS = ["/checkout", "/thank-you"];

/**
 * SMS list-grabber popup (phone capture).
 *
 * Trigger logic comes from Popupsmart's 2025 benchmark report (1.24B displays)
 * + Omnisend/Wisepops data: scroll-based triggers convert at ~5.37% and 6-10s
 * time-delay popups convert at ~2.4%, both materially better than exit-intent (~3.94%)
 * or instant load (~1.9%). We fire on whichever comes first — 8s delay OR 50% scroll —
 * once per session, with a 1-click skip.
 *
 * SMS capture pattern follows Postscript/Attentive guidance:
 *  - phone opt-in stands alone (carriers prohibit combining it with email in one CTA)
 *  - TCPA consent disclosure sits directly under the CTA, with an asterisk on the CTA
 *  - Terms/Privacy links visually distinct from surrounding disclosure text
 *  - double opt-in: success state tells the subscriber to reply Y to confirm
 */
const STORAGE_KEY = "gm:popup-seen-v1";
const DELAY_MS = 8000;
const SCROLL_PCT = 0.5;

/** Format a US phone number as (XXX) XXX-XXXX while typing. */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function EmailPopup() {
  const pathname = usePathname();
  const suppressed = SUPPRESS_PATHS.some((p) => pathname?.startsWith(p));
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
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
    if (phone.replace(/\D/g, "").length !== 10) return;
    addSmsSubscriber(phone, "Popup");
    setSubmitted(true);
    setTimeout(() => setOpen(false), 3200);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sms-popup-title"
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

        <div className="border-heavy-3 bg-paper-3 shadow-lift rounded-2xl overflow-hidden max-h-[88dvh] overflow-y-auto">
        <div className="bg-accent-bright text-ink border-b border-ink/10 px-5 py-2.5 flex items-center justify-between">
          <span className="font-condensed uppercase tracking-[0.24em] text-[12px] font-bold">★ Text club</span>
          <span className="font-condensed uppercase tracking-[0.22em] text-[11px]">Free to join</span>
        </div>

        {!submitted ? (
          <div className="px-5 pt-5 pb-5 sm:px-6 sm:pt-7 sm:pb-6">
            <p className="section-eyebrow on-paper">Don&apos;t miss the next draw</p>
            <h2 id="sms-popup-title" className="mt-2 font-display font-bold text-ink leading-[1.05] text-2xl sm:text-3xl">
              Get draw-night alerts<br />
              <span className="text-accent">by text.</span>
            </h2>
            <p className="mt-2 text-[13px] sm:text-[15px] text-ink-2 font-serif">
              Texts land first: bonus ticket offers, flash sales, and a heads-up before we go live. Beat the inbox crowd.
            </p>

            <form onSubmit={onSubmit} className="mt-4 sm:mt-6">
              <label className="block">
                <span className="dateline on-paper">Mobile number</span>
                <span className="mt-1.5 flex items-center border border-ink/10 bg-paper-4 px-3 rounded-lg">
                  <Smartphone size={16} className="text-ink-3 shrink-0" />
                  <span className="ml-2 font-condensed text-[15px] text-ink-3 select-none">+1</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(555) 123-4567"
                    className="ml-2 w-full h-11 sm:h-12 bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none numeral"
                    autoFocus
                  />
                </span>
              </label>
              <button
                type="submit"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 h-11 sm:h-12 bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.24em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 btn-poly transition-colors"
              >
                Text me the alerts* <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              {/* TCPA consent disclosure — must sit directly under the CTA, no gaps */}
              <p className="mt-2.5 text-[10px] sm:text-[11px] leading-snug text-ink-3">
                *By signing up via text, you agree to receive recurring automated promotional and personalized marketing text messages (e.g. draw reminders) from Generous Motors at the number provided. Consent is not a condition of any purchase. Reply HELP for help and STOP to cancel. Msg frequency varies. Msg &amp; data rates may apply. View{" "}
                <Link href="/about" className="font-bold underline underline-offset-2 text-accent">TERMS</Link>
                {" "}&amp;{" "}
                <Link href="/about" className="font-bold underline underline-offset-2 text-accent">PRIVACY</Link>.
              </p>
            </form>

            <div className="mt-4 pt-4 border-t border-rule-soft hidden sm:flex items-start gap-2.5 text-[12px] text-ink-3 font-serif italic">
              <HeartHandshake size={14} className="mt-0.5 text-charity shrink-0" />
              <span>10% of every cycle&apos;s gross goes to that cycle&apos;s nonprofit partner. Joining the text club helps us reach more drivers — and more charities.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 sm:mt-4 w-full text-center text-[12px] text-ink-3 underline underline-offset-4 hover:text-ink"
            >
              No thanks, take me back
            </button>
          </div>
        ) : (
          <div className="px-6 pt-9 pb-9 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center bg-charity text-paper-3 border border-ink/10 rounded-full">
              <MessageSquareText size={22} />
            </div>
            <h2 className="mt-5 font-display font-bold text-2xl text-ink">Check your phone.</h2>
            <p className="mt-2 text-ink-2 font-serif">
              We just texted {phone || "you"}. Reply <strong className="font-condensed not-italic">Y</strong> to confirm your spot — that&apos;s it.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
