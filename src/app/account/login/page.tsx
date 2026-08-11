"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, KeyRound, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Label } from "@/components/sticker";

type Channel = "email" | "phone";

export default function AccountLoginPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("email");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [returnTo, setReturnTo] = useState("/account");
  const codeRef = useRef<HTMLInputElement>(null);

  // Already signed in → bounce to the account (or returnTo).
  useEffect(() => {
    const rt = new URLSearchParams(window.location.search).get("returnTo");
    const dest = rt && rt.startsWith("/") ? rt : "/account";
    setReturnTo(dest);
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => { if (alive && j?.data?.signedIn) router.replace(dest); })
      .catch(() => {});
    return () => { alive = false; };
  }, [router]);

  const apiChannel = channel === "phone" ? "sms" : "email";

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!identifier.trim() || busy) return;
    setBusy(true); setError(""); setInfo("");
    try {
      const r = await fetch("/api/auth/otp/start", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: apiChannel, identifier }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Couldn't send the code."); return; }
      setStep("verify");
      setInfo(`We sent a 6-digit code to your ${channel === "email" ? "email" : "phone"}.`);
      setTimeout(() => codeRef.current?.focus(), 60);
    } catch { setError("Network error — please try again."); }
    finally { setBusy(false); }
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    if (code.replace(/\D/g, "").length !== 6) { setError("Enter the 6-digit code."); return; }
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: apiChannel, identifier, code }),
      });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Incorrect code."); return; }
      router.replace(returnTo);
    } catch { setError("Network error — please try again."); }
    finally { setBusy(false); }
  };

  const restart = () => { setStep("request"); setCode(""); setError(""); setInfo(""); };
  const input = "mt-1.5 w-full border border-ink/15 bg-paper-3 rounded-lg px-3 h-12 text-[15px] text-ink outline-none focus:border-accent";

  return (
    <div className="bg-paper-3 text-ink min-h-[70vh]">
      <section className="mx-auto max-w-md px-5 py-20">
        <div className="text-center">
          <Label tone="ink" variant="solid">Sign in</Label>
          <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem,5vw,2.75rem)" }}>Your garage.</h1>
          <p className="mt-3 text-ink-2 font-serif">No password — we'll send you a one-time code.</p>
        </div>

        <div className="mt-8 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft p-6">
          {step === "request" ? (
            <>
              {/* channel tabs */}
              <div role="tablist" aria-label="Sign-in method" className="inline-flex w-full rounded-full border border-ink/10 overflow-hidden mb-5">
                {(["email", "phone"] as Channel[]).map((c) => (
                  <button key={c} role="tab" aria-selected={channel === c}
                    onClick={() => { setChannel(c); setError(""); }}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold transition-colors ${
                      channel === c ? "bg-ink text-brass" : "bg-paper-3 text-ink hover:bg-ink/5"
                    }`}>
                    {c === "email" ? <Mail size={14} /> : <Phone size={14} />} {c}
                  </button>
                ))}
              </div>

              <form onSubmit={sendCode}>
                <label className="block">
                  <span className="dateline on-paper">{channel === "email" ? "Email address" : "Mobile number"}</span>
                  <input
                    type={channel === "email" ? "email" : "tel"}
                    inputMode={channel === "email" ? "email" : "tel"}
                    autoComplete={channel === "email" ? "email" : "tel"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={channel === "email" ? "you@example.com" : "(555) 123-4567"}
                    className={input}
                    autoFocus
                  />
                </label>
                {error && <p className="mt-3 dateline text-brass-deep">⚠ {error}</p>}
                <button type="submit" disabled={busy}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-ink text-brass px-5 h-12 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} Send code
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={verify}>
              <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 dateline on-paper mb-4 hover:text-ink">
                <ArrowLeft size={13} /> Use a different {channel === "email" ? "email" : "number"}
              </button>
              {info && <p className="dateline on-paper mb-3">{info} <span className="numeral">{identifier}</span></p>}
              <label className="block">
                <span className="dateline on-paper">6-digit code</span>
                <input
                  ref={codeRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className={`${input} tracking-[0.5em] text-center numeral text-xl`}
                />
              </label>
              {error && <p className="mt-3 dateline text-brass-deep">⚠ {error}</p>}
              <button type="submit" disabled={busy}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-ink text-brass px-5 h-12 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors disabled:opacity-60">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Verify &amp; sign in
              </button>
              <button type="button" onClick={() => sendCode()} disabled={busy}
                className="mt-3 w-full dateline on-paper hover:text-ink">Resend code</button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center dateline on-paper">
          Signing in lets you see the tickets tied to your email or phone.
        </p>
      </section>
    </div>
  );
}
