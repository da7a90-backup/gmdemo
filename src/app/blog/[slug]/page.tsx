import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/mock-data";
import { niceDate } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/sticker";

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return notFound();

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

      <div className="mt-10 text-ink-2 leading-relaxed text-lg font-serif dropcap">
        <p>{post.body}</p>
      </div>
    </article>
    </div>
  );
}
