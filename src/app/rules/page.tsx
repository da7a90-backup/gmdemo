import type { Metadata } from "next";
import Link from "next/link";
import { activeDraw } from "@/lib/mock-data";
import { usd } from "@/lib/format";
import { Label } from "@/components/sticker";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Official Rules — Generous Motors",
  description:
    "Official rules for the Generous Motors charitable drawing, conducted in accordance with Fla. Stat. § 849.0935. No purchase or contribution necessary.",
};

const drawWhen = new Date(activeDraw.drawDateISO).toLocaleString("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function RulesPage() {
  const v = activeDraw.vehicle;
  return (
    <main className="bg-paper text-ink">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-ink/10 grain">
        <div className="mx-auto max-w-3xl px-5 pt-14 pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Label tone="ink" variant="outline">Cycle №{String(activeDraw.cycle).padStart(2, "0")}</Label>
            <Label tone="brass" variant="outline">Fla. Stat. § 849.0935</Label>
          </div>
          <h1 className="mt-5 hero-headline" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
            Official <span className="accent-serif">Rules.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-2 font-serif">
            These rules govern the conduct and operation of the Generous Motors drawing by chance for
            cycle {activeDraw.cycle}. They are disclosed in accordance with Florida Statute § 849.0935
            (charitable, nonprofit organizations; drawings by chance).
          </p>
          <div className="mt-6 border border-ink/10 bg-paper-4 rounded-xl p-5 font-condensed uppercase tracking-[0.12em] text-[14px] text-ink font-bold">
            No purchase or contribution is necessary to enter or to win. A purchase or contribution
            will not improve your chances of winning.
          </div>
        </div>
      </section>

      {/* RULES BODY */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <ol className="space-y-9">
          <Rule n={1} title="Sponsor & operator">
            The drawing is operated by <strong>Generous Motors Foundation, Inc.</strong>, a Florida
            not-for-profit corporation recognized by the IRS as a 501(c)(3) charitable organization,
            with its principal place of business at 2900 NW 2nd Avenue, Miami, Florida 33127
            (&ldquo;Generous Motors&rdquo;).
          </Rule>
          <Rule n={2} title="Eligibility">
            Open to legal residents of the 50 United States and the District of Columbia who are 18
            years of age or older at the time of entry. Employees, directors, and officers of Generous
            Motors, and members of their immediate households, are not eligible. Void where prohibited
            by law.
          </Rule>
          <Rule n={3} title="How to enter">
            (a) <em>Ticket entry:</em> purchase raffle tickets on the Tickets page or through a
            membership; each ticket equals one entry into the cycle&apos;s drawing. (b) <em>Free
            alternate method of entry:</em> hand-print your full name, mailing address, phone number,
            email, and date of birth on a 3&Prime;×5&Prime; card and mail it in a stamped envelope to
            &ldquo;Cycle {activeDraw.cycle} Free Entry, Generous Motors Foundation, Inc., 2900 NW 2nd
            Avenue, Miami, FL 33127.&rdquo; One free entry per outer envelope. Free entries have equal
            odds and are printed onto identical paper tickets and placed in the same drum as all other
            entries.
          </Rule>
          <Rule n={4} title="The drawing — date, hour, and place">
            The cycle {activeDraw.cycle} winner will be selected on <strong>{drawWhen} (ET)</strong>,
            streamed live on Facebook Live and archived to YouTube, from the Generous Motors garage in
            Miami, Florida. Every entry is printed onto a physical paper ticket and drawn by hand from
            a rotating drum on camera. No winner is predetermined and the selection is not rigged in
            any way.
          </Rule>
          <Rule n={5} title="Prize & source of prize funds">
            One (1) grand prize: a {v.year} {v.make} {v.model} ({v.trim}), approximate retail value
            {" "}{usd(v.valueUSD)}, or the disclosed cash equivalent at the winner&apos;s election at
            claim time. Prizes are purchased with proceeds from ticket sales for the cycle and, where
            needed, the general funds of Generous Motors Foundation, Inc. All federal, state, and
            local taxes are the winner&apos;s sole responsibility; an IRS Form 1099 will be issued.
          </Rule>
          <Rule n={6} title="Odds & entry cap">
            Odds of winning depend on the total number of entries received. Entries for cycle
            {" "}{activeDraw.cycle} are capped at {activeDraw.ticketsCap.toLocaleString("en-US")}.
          </Rule>
          <Rule n={7} title="Winner notification & claim">
            The winner is announced on the live stream and contacted by phone and email within 24
            hours. Vehicle delivery, registration, and title transfer are arranged within
            approximately 30 days of verification. If a winner cannot be reached within 14 days or is
            ineligible, a replacement winner is drawn from the same drum on a recorded stream.
          </Rule>
          <Rule n={8} title="Charity commitment">
            10% of the cycle&apos;s gross proceeds — calculated before any expense — is paid to the
            cycle&apos;s named partner charity ({activeDraw.charity.name} for cycle
            {" "}{activeDraw.cycle}). The wire receipt is published on the blog within seven business
            days of the cycle close.
          </Rule>
          <Rule n={9} title="Governing law">
            The drawing is conducted in accordance with Section 849.0935, Florida Statutes. These
            rules are governed by the laws of the State of Florida. By entering, entrants agree to be
            bound by these Official Rules and the decisions of Generous Motors, which are final.
          </Rule>
        </ol>

        <div className="mt-12 border border-ink/10 bg-paper-4 rounded-xl p-5 flex items-start gap-3">
          <ShieldCheck size={18} className="text-charity shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink-2 font-serif">
            Questions about these rules? Write to support@generousmotors.org. For eligibility and
            entry questions, see the{" "}
            <Link href="/tickets#faq" className="underline underline-offset-2 text-accent">FAQ</Link>.
          </p>
        </div>

        <Link
          href="/tickets"
          className="mt-8 inline-flex h-12 items-center gap-2 bg-brass text-ink px-6 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[12px] font-bold hover:bg-ink hover:text-paper-3 transition-colors rounded-full"
        >
          Back to tickets <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  );
}

function Rule({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="font-condensed numeral text-3xl font-semibold text-brass-deep shrink-0 leading-none">
        №{String(n).padStart(2, "0")}
      </span>
      <div>
        <h2 className="font-display font-bold text-xl text-ink leading-tight">{title}</h2>
        <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}
