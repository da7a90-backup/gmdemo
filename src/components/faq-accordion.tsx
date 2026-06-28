"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQ = [
  { q: "How do I enter?", a: "Pick a ticket tier on the Tickets page. Each tier comes with a set number of entries." },
  { q: "How do you pick the winner?", a: "Every entry is printed onto paper, dropped into our drum, and pulled on a livestream. The stream is fully transparent and archived in full." },
  { q: "How do I know the draw is fair?", a: "Three things: every entry is a physically printed paper ticket, the pull is on a livestream archived to YouTube forever, and our 990 is publicly filed (we are a 501(c)(3))." },
  { q: "What if I win — when do I get the car?", a: "We call you on the stream and arrange delivery, registration, and title transfer typically within 30 days." },
  { q: "Can I take the cash instead?", a: "Yes. Every prize has a cash equivalent disclosed in the cycle's Official Rules. You choose at claim time." },
  { q: "Where does the charity money go?", a: "10% of gross proceeds — calculated before any operating cost — goes directly to the cycle's named partner charity. Each cycle publishes a reconciliation PDF and signed receipt." },
  { q: "Can I cancel my membership?", a: "Yes, in 1 click from your account. Already-issued entries for the current cycle stay valid; no refunds for entries already in the drum." },
  { q: "Who can enter?", a: "Legal residents of the 50 United States and DC, age 18+. Void where prohibited. See Official Rules for full eligibility." },
  { q: "Where do I find the official rules?", a: "Linked in the footer of every page, and from every ticket-purchase confirmation email." },
  { q: "How are my data and payment kept safe?", a: "All payment is processed by Shopify with PCI-DSS Level 1 compliance. We don't store card numbers." },
  { q: "Who do I contact for support?", a: "support@generousmotors.org — typical response under 12 hours." },
];

export function FAQAccordion() {
  return (
    <section className="bg-paper-3 text-ink border-y border-rule" id="faq">
      <div className="mx-auto max-w-3xl px-5 py-24">
      <div className="border-b border-rule-soft pb-12">
        <p className="section-eyebrow section-eyebrow-rule">FAQ</p>
        <h2 className="mt-4 hero-headline" style={{ fontSize: "clamp(2.25rem,5vw,4rem)" }}>
          Plain answers. <span className="accent-serif">Obvious questions.</span>
        </h2>
      </div>
      <ul className="mt-10 border border-ink bg-paper-3 divide-y divide-ink">
        {FAQ.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} index={i} />
        ))}
      </ul>
      </div>
    </section>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="flex items-baseline gap-5 min-w-0">
          <span className="font-condensed numeral text-xl text-ink-3 leading-none shrink-0">№{String(index + 1).padStart(2, "0")}</span>
          <span className="font-display font-semibold text-lg text-ink truncate">{q}</span>
        </span>
        <span className={`inline-flex h-9 w-9 items-center justify-center border shrink-0 ${open ? "bg-ink border-ink text-paper" : "bg-paper-3 border-ink text-ink"} transition`}>
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      {open && (
        <p className="px-6 pb-6 pl-16 text-[15px] text-ink-2 leading-relaxed font-serif">{a}</p>
      )}
    </li>
  );
}
