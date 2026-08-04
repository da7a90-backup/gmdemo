"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, ArrowRight, Inbox } from "lucide-react";
import { getUser, signIn } from "@/lib/session";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export default function AccountLoginPage() {
  const cp = useCopy();
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const otpRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (getUser()) router.replace("/account");
  }, [router]);

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code);
    setOtp("");
    setError("");
    setStep("otp");
    setTimeout(() => otpRef.current?.focus(), 50);
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== sentCode) {
      setError(cp("acc.login.error"));
      return;
    }
    signIn(email);
    router.push("/account");
  };

  return (
    <main className="bg-paper text-ink min-h-[70vh] grain relative overflow-hidden">
      <div className="mx-auto max-w-md px-5 py-14">
        <Label tone="ink" variant="outline"><Copy k="acc.login.badge" /></Label>
        <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          <Copy k="acc.login.h.pre" /> <span className="accent-serif"><Copy k="acc.login.h.accent" /></span>
        </h1>
        <p className="mt-3 text-[15px] text-ink-2 font-serif">
          <Copy k="acc.login.intro" />
        </p>

        <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
          {step === "email" ? (
            <form onSubmit={sendCode} className="p-6">
              <label className="block">
                <span className="dateline on-paper"><Copy k="acc.login.emailLabel" /></span>
                <span className="mt-1.5 flex items-center border border-ink/10 bg-paper-3 px-3 rounded-lg">
                  <Mail size={16} className="text-ink-3 shrink-0" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={cp("lookup.ph.email")}
                    className="ml-2 w-full h-12 bg-transparent text-[16px] text-ink placeholder:text-ink-3 outline-none"
                  />
                </span>
              </label>
              <button
                type="submit"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
              >
                <Copy k="acc.login.sendCode" /> <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="p-6">
              <p className="dateline on-paper"><Copy k="acc.login.codeSentTo" /></p>
              <p className="font-display font-bold text-ink">{email}</p>
              <label className="block mt-4">
                <span className="dateline on-paper"><Copy k="acc.login.otpLabel" /></span>
                <span className="mt-1.5 flex items-center border border-ink/10 bg-paper-3 px-3 rounded-lg">
                  <KeyRound size={16} className="text-ink-3 shrink-0" />
                  <input
                    ref={otpRef}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="ml-2 w-full h-12 bg-transparent text-[20px] tracking-[0.4em] text-ink placeholder:text-ink-3 outline-none numeral"
                  />
                </span>
              </label>
              {error && <p className="mt-2 text-[13px] text-brass-deep font-semibold">{error}</p>}
              <button
                type="submit"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent-bright text-ink border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[13px] font-bold hover:bg-accent hover:text-paper-3 transition-colors"
              >
                <Copy k="acc.login.verify" /> <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-3 w-full text-center text-[12px] text-ink-3 underline underline-offset-4 hover:text-ink"
              >
                <Copy k="acc.login.differentEmail" />
              </button>

              {/* Demo inbox — stands in for the real email delivery */}
              <div className="mt-5 border border-brass bg-brass-soft rounded-xl p-4 flex items-start gap-3">
                <Inbox size={16} className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <p className="font-condensed uppercase tracking-[0.22em] text-[10px] font-bold text-ink">
                    <Copy k="acc.login.demoInboxTitle" />
                  </p>
                  <p className="mt-1 text-[14px] text-ink-2">
                    <Copy k="acc.login.demoInboxBody" />{" "}
                    <strong className="numeral text-ink text-base tracking-[0.2em]">{sentCode}</strong>
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
