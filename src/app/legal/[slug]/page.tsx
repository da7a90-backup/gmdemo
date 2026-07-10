import Link from "next/link";
import { notFound } from "next/navigation";
import { Label } from "@/components/sticker";
import { ArrowRight } from "lucide-react";

const PAGES: Record<string, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: "We collect only what running a charitable drawing requires: your contact details, entries, and payment confirmations (payments themselves are processed by Shopify — we never see card numbers). We do not sell personal data. SMS and email lists are opt-in with one-step removal.",
  },
  terms: {
    title: "Terms of Service",
    body: "Use of this site and participation in any drawing is governed by the cycle's Official Rules, Florida law (Fla. Stat. § 849.0935), and these terms. Entries are non-transferable. Chargebacks on completed entries void those entries.",
  },
  play: {
    title: "Responsible Play",
    body: "Our draws are entertainment that funds charity — not a way to make money. Set a budget and keep it. Free mail-in entry is always available with identical odds (see the Official Rules). If play stops being fun, take a break: help is available at 1-800-GAMBLER.",
  },
  accessibility: {
    title: "Accessibility",
    body: "We aim for WCAG 2.1 AA across the site: semantic markup, keyboard operability, visible focus, and contrast-checked palettes. Found a barrier? Tell us via the contact page and we will fix it in the next release.",
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return notFound();

  return (
    <main className="bg-paper text-ink relative overflow-hidden grain">
      <div className="mx-auto max-w-2xl px-5 py-16">
        <Label tone="ink" variant="outline">Legal · demo placeholder</Label>
        <h1 className="mt-4 hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
          {page.title}<span className="accent-serif">.</span>
        </h1>
        <p className="mt-6 text-[16px] text-ink-2 leading-relaxed font-serif">{page.body}</p>
        <p className="mt-4 text-[14px] text-ink-3 font-serif italic">
          Full counsel-reviewed language ships with production; this page reserves the route and structure.
        </p>
        <Link
          href="/rules"
          className="mt-8 inline-flex h-11 items-center gap-2 bg-paper-3 border border-ink/10 px-5 text-ink font-condensed uppercase tracking-[0.22em] text-[11px] hover:bg-ink hover:text-paper transition-colors rounded-full"
        >
          Read the Official Rules <ArrowRight size={13} />
        </Link>
      </div>
    </main>
  );
}
