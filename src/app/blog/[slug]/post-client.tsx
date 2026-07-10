"use client";
import Link from "next/link";
import { useMergedPosts } from "@/lib/blog-store";
import { renderMarkdown } from "@/lib/markdown";
import { niceDate } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/sticker";

export function BlogPostClient({ slug }: { slug: string }) {
  const posts = useMergedPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="bg-paper-3 text-ink">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <p className="font-serif italic text-ink-2">That field note doesn&apos;t exist (or isn&apos;t published yet).</p>
          <Link href="/blog" className="mt-4 inline-flex items-center gap-1 font-condensed uppercase tracking-[0.22em] text-[11px] text-accent">
            <ArrowLeft size={12} /> All field notes
          </Link>
        </div>
      </div>
    );
  }

  const html = post.custom
    ? post.custom.format === "markdown"
      ? renderMarkdown(post.custom.body)
      : post.custom.body
    : null;

  return (
    <div className="bg-paper-3 text-ink">
      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 font-condensed uppercase tracking-[0.22em] text-[11px] text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={12} /> All field notes
        </Link>

        <div className="mt-10 flex items-center gap-3 flex-wrap">
          <Label tone="accent" variant="outline">{post.tag}</Label>
          <p className="dateline">
            {niceDate(post.date)} · by {post.author}
          </p>
        </div>

        <h1 className="mt-6 hero-headline" style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}>
          {post.title}
        </h1>

        {html ? (
          <div className="mt-10 blog-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="mt-10 text-ink-2 leading-relaxed text-lg font-serif dropcap">
            <p>{post.body}</p>
          </div>
        )}
      </article>
    </div>
  );
}
