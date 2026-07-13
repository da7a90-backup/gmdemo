"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Minus, FileText, ArrowRight } from "lucide-react";
import { Copy } from "@/components/copy";

const FAQ = [
  { q: "How do I enter?", a: "Pick a ticket tier on the Tickets page. Each tier comes with a set number of entries." },
  { q: "How do you pick the winner?", a: "Every entry is printed onto paper, dropped into our drum, and pulled on a livestream. The stream is fully transparent and archived in full." },
  { q: "How do I know the draw is fair?", a: "Three things: every entry is a physically printed paper ticket, the pull is on a livestream archived to YouTube forever, and our 990 is publicly filed (we are a 501(c)(3))." },
  { q: "What if I win — when do I get the car?", a: "We call you on the stream and arrange delivery, registration, and title transfer typically within 30 days." },
  { q: "Can I take the cash instead?", a: "Yes. Every prize has a cash equivalent disclosed in the cycle's Official Rules. You choose at claim time." },
  { q: "Where does the charity money go?", a: "10% of every cycle goes directly to the cycle's named partner charity. Each cycle publishes a reconciliation PDF and signed receipt." },
  { q: "Can I cancel my membership?", a: "Yes, in 1 click from your account. Already-issued entries for the current cycle stay valid; no refunds for entries already in the drum." },
  { q: "Who can enter?", a: "Legal residents of the 50 United States and DC, age 18+. Void where prohibited. See Official Rules for full eligibility." },
  { q: "Where do I find the official rules?", a: "At generousmotors.org/rules — also linked below, in the footer of every page, and from every ticket-purchase confirmation email." },
  { q: "How are my data and payment kept safe?", a: "All payment is processed by Shopify with PCI-DSS Level 1 compliance. We don't store card numbers." },
  { q: "Who do I contact for support?", a: "support@generousmotors.org — typical response under 12 hours." },
];

export function FAQAccordion() {
  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="faq">
      <div className="mx-auto max-w-3xl px-5 py-24">
      <div className="border-b border-rule-soft pb-12">
        <p className="section-eyebrow section-eyebrow-rule"><Copy k="home.faq.eyebrow" /></p>
        <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4rem)" }}>
          <Copy k="home.faq.h.lead" /> <span className="accent-serif"><Copy k="home.faq.h.accent" /></span>
        </h2>
      </div>
      <ul className="mt-10 border border-ink/10 bg-paper-3 divide-y divide-ink/10 rounded-xl overflow-hidden">
        {FAQ.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </ul>

      {/* Official Rules — Fla. Stat. § 849.0935 requires the rules to be conspicuously disclosed */}
      <div className="mt-6 border border-ink/10 bg-paper-4 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <FileText size={18} className="text-brass-deep shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-bold text-ink leading-tight">The fine print is the point.</p>
            <p className="mt-1 text-[13px] text-ink-2 font-serif">
              Every cycle runs under published Official Rules — conducted per Fla. Stat. § 849.0935.
              No purchase or contribution necessary.
            </p>
          </div>
        </div>
        <Link
          href="/rules"
          className="inline-flex h-11 items-center gap-2 bg-ink text-paper-3 px-5 border border-ink/10 font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-brass hover:text-ink transition-colors rounded-full shrink-0"
        >
          Read the Official Rules <ArrowRight size={13} />
        </Link>
      </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="flex items-baseline min-w-0">
          <span className="font-display font-semibold text-lg text-ink truncate">{q}</span>
        </span>
        <span className={`inline-flex h-9 w-9 items-center justify-center border shrink-0 rounded-full ${open ? "bg-ink border-ink/10 text-paper" : "bg-paper-3 border-ink/10 text-ink"} transition`}>
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      {open && (
        <p className="px-6 pb-6 text-[15px] text-ink-2 leading-relaxed font-serif">{a}</p>
      )}
    </li>
  );
}
