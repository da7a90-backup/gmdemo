"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Minus, FileText, ArrowRight } from "lucide-react";
import { Copy } from "@/components/copy";
import { DEFAULT_FAQ, type FaqItem } from "@/lib/faq-data";

export function FAQAccordion() {
  const [items, setItems] = useState<FaqItem[]>(DEFAULT_FAQ);
  useEffect(() => {
    let alive = true;
    fetch("/api/faq")
      .then((r) => r.json())
      .then((j) => { if (alive && j.ok && (j.data as FaqItem[]).length) setItems(j.data as FaqItem[]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
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
        {items.map((item, i) => (
          <FAQItem key={i} q={item.question} a={item.answer} />
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
          href="/beta/rules"
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
