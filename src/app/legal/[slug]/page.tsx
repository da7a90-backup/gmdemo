import Link from "next/link";
import { notFound } from "next/navigation";
import { Label } from "@/components/sticker";
import { ArrowRight } from "lucide-react";
import { DEFAULT_LEGAL, legalBySlug } from "@/lib/legal-data";
import { getLegalDoc } from "@/lib/server/content-lists";

// Rendered per-request so Kevin's Shopify edits to the legal docs show up.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return DEFAULT_LEGAL.map((d) => ({ slug: d.slug }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Shopify first, code default as fallback; unknown slug → 404.
  const page = (await getLegalDoc(slug)) ?? legalBySlug(slug);
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
