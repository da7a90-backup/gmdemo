"use client";
import Link from "next/link";
import { useMergedPosts } from "@/lib/blog-store";
import { niceDate } from "@/lib/format";
import { ArrowRight } from "lucide-react";
import { Announce } from "@/components/marquee";
import { Label } from "@/components/sticker";
import { Copy, useCopy } from "@/components/copy";

export default function BlogPage() {
  const t = useCopy();
  const posts = useMergedPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="bg-paper-3 text-ink">
      <section className="relative border-b border-ink/10 overflow-hidden grain">
        <div className="mx-auto max-w-[1400px] px-5 py-20 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 relative">
            <p className="section-eyebrow section-eyebrow-rule"><Copy k="blog.eyebrow" /></p>
            <h1 className="mt-4 hero-headline">
              <Copy k="blog.h.lead" /> <span className="accent-serif"><Copy k="blog.h.accent" /></span>
            </h1>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-end justify-end gap-2">
            <Label tone="brass" variant="outline"><Copy k="blog.badge1" /></Label>
            <Label tone="ink" variant="outline"><Copy k="blog.badge2" /></Label>
          </div>
        </div>
      </section>

      <Announce
        label={t("blog.sections.label")}
        tone="paper"
        items={[t("blog.sections.i1"), t("blog.sections.i2"), t("blog.sections.i3"), t("blog.sections.i4")]}
      />

      <section className="mx-auto max-w-[1400px] px-5 py-16">
        {/* FEATURED */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group grid gap-10 lg:grid-cols-12 rounded-2xl border border-ink/10 bg-paper-3 p-8 hover:bg-paper-2"
        >
          <div
            className="lg:col-span-7 aspect-[5/3] rounded-xl overflow-hidden border border-ink/10 relative"
            style={{
              background:
                "linear-gradient(135deg, #0e0e0e 0%, #1f1812 60%, #8b2017 130%)",
            }}
          >
            <span className="absolute top-4 left-4">
              <Label tone="brass">{featured.tag}</Label>
            </span>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="dateline">
              {niceDate(featured.date)} · <Copy k="blog.by" /> {featured.author}
            </p>
            <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl text-ink leading-tight">{featured.title}</h2>
            <p className="mt-4 text-ink-2 font-serif italic text-lg">{featured.excerpt}</p>
            <span className="mt-7 inline-flex items-center gap-2 text-accent font-condensed uppercase tracking-[0.22em] text-[12px]">
              <Copy k="blog.readPost" /> <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </span>
          </div>
        </Link>

        <ul className="mt-12 grid rounded-2xl overflow-hidden border border-ink/10 bg-paper-3 sm:grid-cols-2 lg:grid-cols-3 divide-y divide-ink/10 lg:divide-y-0 lg:divide-x">
          {rest.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block bg-paper-3 hover:bg-paper-2 h-full"
              >
                <div
                  className="aspect-[16/9] relative border-b border-ink/10"
                  style={{
                    background:
                      "linear-gradient(135deg, #1f1f25 0%, #3a2218 60%, #5b3a1c 100%)",
                  }}
                >
                  <span className="absolute top-3 left-3">
                    <Label tone="brass" size="sm">{p.tag}</Label>
                  </span>
                </div>
                <div className="p-5">
                  <p className="dateline">{niceDate(p.date)} · <Copy k="blog.by" /> {p.author}</p>
                  <h3 className="mt-2 font-display font-bold text-xl text-ink leading-tight">{p.title}</h3>
                  <p className="mt-2 text-[14px] text-ink-2 italic font-serif">{p.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
