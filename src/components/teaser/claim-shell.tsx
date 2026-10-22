"use client";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Ticket } from "lucide-react";
import { Logo } from "@/components/logo";
import { RootDark } from "@/components/teaser/root-dark";
import { isValidUSPhone } from "@/lib/phone";
import { validateClaimAddress } from "@/lib/address";

function fmtPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1); // drop US country code so "1 305…" doesn't shift the area code
  d = d.slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const input =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-[15px] text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-[var(--color-accent-bright)]";

// US states + DC + territories (code → name) for the claim address so each field maps
// to the right Shopify address field instead of a single free-text blob.
const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"],
  ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
  ["PR", "Puerto Rico"], ["GU", "Guam"], ["VI", "U.S. Virgin Islands"], ["AS", "American Samoa"], ["MP", "Northern Mariana Islands"],
];

export function ClaimShell({ token }: { token: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmAddr, setConfirmAddr] = useState(false); // true after the verifier couldn't match and the user chose to submit anyway
  const [done, setDone] = useState<{ ticketNumbers: string; cycle: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!isValidUSPhone(phone)) { setError("Please enter a real phone number."); return; }
    const addrErr = validateClaimAddress({ address1, city, state, zip });
    if (addrErr) { setError(addrErr); return; }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/free-ticket/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, phone, address1, city, state, zip, confirmAddress: confirmAddr }),
      });
      const j = await r.json();
      if (j?.ok) setDone(j.data);
      else if (j?.addressUnverified) { setError(j.error || "We couldn't verify that address."); setConfirmAddr(true); }
      else setError(j?.error || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
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
        <Logo height={56} markColor="var(--color-accent-bright)" letterColor="#ffffff" className="mx-auto" />

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
            <h1 className="mt-4 font-display text-2xl font-bold">You&apos;re in the drawing.</h1>
            <p className="mt-3 font-serif text-[15px] text-white/75">
              Your free entry for our first giveaway is confirmed.
            </p>
            {done.ticketNumbers && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-condensed text-[13px] font-bold tracking-[0.14em] text-white">
                <Ticket size={15} className="text-[var(--color-accent-bright)]" /> {done.ticketNumbers}
              </p>
            )}
            <p className="mt-5 font-serif text-[14px] text-white/60">
              We emailed your confirmation. Good luck, and thanks for funding the cause.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 text-left">
            <h1 className="text-center font-display text-2xl font-bold">Claim your free ticket 🎟️</h1>
            <p className="mt-3 text-center font-serif text-[15px] text-white/70">
              Confirm your details. We print your name on a physical ticket.
            </p>
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={input}
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
                <input
                  className={input}
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
              <input
                className={input}
                placeholder="Street address"
                value={address1}
                onChange={(e) => { setAddress1(e.target.value); setConfirmAddr(false); }}
                autoComplete="address-line1"
                required
              />
              <input
                className={input}
                placeholder="City"
                value={city}
                onChange={(e) => { setCity(e.target.value); setConfirmAddr(false); }}
                autoComplete="address-level2"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={`${input} appearance-none`}
                  value={state}
                  onChange={(e) => { setState(e.target.value); setConfirmAddr(false); }}
                  autoComplete="address-level1"
                  required
                >
                  <option value="" disabled>State</option>
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code} className="text-black">{name}</option>
                  ))}
                </select>
                <input
                  className={input}
                  placeholder="ZIP"
                  value={zip}
                  onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setConfirmAddr(false); }}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  required
                />
              </div>
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
            <p className="mt-3 text-center text-[10px] leading-snug text-white/40">
              By entering your phone number you agree to receive recurring automated marketing text messages from
              Generous Motors at the number provided. Consent is not a condition of entry. Msg &amp; data rates may apply.
              Reply STOP to opt out, HELP for help.
            </p>
            <p className="mt-3 text-center font-condensed text-[10px] uppercase tracking-[0.24em] text-white/40">
              One free entry · No purchase necessary
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
