"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Code, Trash2, PenLine, Plus, ExternalLink, Search } from "lucide-react";
import { slugify, type Article, type ArticleTag } from "@/lib/blog-store";
import { adminGet, adminSend } from "@/lib/admin-api";
import { renderMarkdown } from "@/lib/markdown";
import { niceDate } from "@/lib/format";
import { Label } from "@/components/sticker";

const TAGS: ArticleTag[] = ["Behind the draw", "Cycle update", "Partner spotlight", "Winner stories"];

type Draft = {
  id?: string;
  title: string;
  slug: string;
  author: string;
  tag: ArticleTag;
  excerpt: string;
  body: string;
  format: "markdown" | "html";
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
};

const EMPTY: Draft = {
  title: "", slug: "", author: "Kevin S.", tag: "Cycle update", excerpt: "",
  body: "", format: "markdown", seoTitle: "", seoDescription: "", ogImage: "",
};

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = () => adminGet<Article[]>("/api/admin/articles").then(setArticles).catch((e) => setErr(String(e.message)));
  useEffect(() => { load(); }, []);

  if (!articles) return null;

  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = async (published: boolean) => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setErr(null);
    try {
      await adminSend("/api/admin/articles", "POST", {
        id: draft.id,
        slug: draft.slug || slugify(draft.title),
        title: draft.title.trim(),
        author: draft.author.trim() || "Generous Motors",
        tag: draft.tag,
        excerpt: draft.excerpt.trim(),
        body: draft.body,
        format: draft.format,
        published,
        dateISO: new Date().toISOString(),
        seo: {
          title: draft.seoTitle.trim() || undefined,
          description: draft.seoDescription.trim() || undefined,
          ogImage: draft.ogImage.trim() || undefined,
        },
      });
      setDraft(EMPTY);
      setSlugTouched(false);
      setPreview(false);
      load();
    } catch (e) { setErr(String((e as Error).message)); }
  };

  const remove = async (id: string) => {
    setErr(null);
    try { await adminSend(`/api/admin/articles?id=${id}`, "DELETE"); load(); }
    catch (e) { setErr(String((e as Error).message)); }
  };

  const edit = (a: Article) => {
    setDraft({
      id: a.id, title: a.title, slug: a.slug, author: a.author, tag: a.tag,
      excerpt: a.excerpt, body: a.body, format: a.format,
      seoTitle: a.seo.title ?? "", seoDescription: a.seo.description ?? "", ogImage: a.seo.ogImage ?? "",
    });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const input = "mt-1.5 w-full h-11 border border-ink/10 bg-paper-3 rounded-lg px-3 text-[15px] text-ink outline-none focus:border-accent";
  const serpTitle = draft.seoTitle || draft.title || "Post title";
  const serpDesc = draft.seoDescription || draft.excerpt || "Meta description preview…";

  return (
    <main>
      <h1 className="hero-headline" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
        Field notes <span className="accent-serif">editor.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] text-ink-2 font-serif">
        Write in Markdown or raw HTML, set the SEO fields, and publish — articles appear on the public
        blog immediately. Stored in Shopify metaobjects (type &ldquo;article&rdquo;) — editable here or in Shopify admin.
      </p>
      {err && <p className="mt-4 text-[13px] text-red-600 font-condensed">⚠ {err}</p>}

      {/* Editor */}
      <div className="mt-7 border border-ink/10 bg-paper-4 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-5 py-3 bg-paper-3 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-bold text-ink flex items-center gap-2">
            <PenLine size={15} className="text-brass-deep" />
            {draft.id ? "Edit article" : "New article"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set("format")(draft.format === "markdown" ? "html" : "markdown")}
              className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-4 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors"
            >
              <Code size={11} /> {draft.format === "markdown" ? "Markdown" : "Raw HTML"}
            </button>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              aria-pressed={preview}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dateline transition-colors border ${
                preview ? "bg-ink text-brass border-ink" : "border-ink/10 bg-paper-4 on-paper hover:bg-ink hover:text-paper"
              }`}
            >
              <Eye size={11} /> Preview
            </button>
          </div>
        </div>

        <div className="p-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block lg:col-span-2"><span className="dateline on-paper">Title</span>
              <input required value={draft.title}
                onChange={(e) => {
                  set("title")(e.target.value);
                  if (!slugTouched) set("slug")(slugify(e.target.value));
                }}
                placeholder="Cycle 13: the next build" className={input} /></label>
            <label className="block"><span className="dateline on-paper">Author</span>
              <input value={draft.author} onChange={(e) => set("author")(e.target.value)} className={input} /></label>
            <label className="block"><span className="dateline on-paper">Section</span>
              <select value={draft.tag} onChange={(e) => set("tag")(e.target.value as ArticleTag)} className={input}>
                {TAGS.map((t) => <option key={t}>{t}</option>)}
              </select></label>
          </div>

          <label className="block"><span className="dateline on-paper">Excerpt (listing card + default meta description)</span>
            <input value={draft.excerpt} onChange={(e) => set("excerpt")(e.target.value)} className={input} /></label>

          {!preview ? (
            <label className="block"><span className="dateline on-paper">Body — {draft.format === "markdown" ? "Markdown (## heading, **bold**, [link](url), - list)" : "raw HTML"}</span>
              <textarea
                rows={12}
                value={draft.body}
                onChange={(e) => set("body")(e.target.value)}
                placeholder={draft.format === "markdown" ? "## The drum gets bigger\n\nEvery entry still gets printed…" : "<h2>The drum gets bigger</h2>\n<p>Every entry still gets printed…</p>"}
                className="mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 py-3 text-[14px] text-ink outline-none focus:border-accent leading-relaxed font-mono"
              /></label>
          ) : (
            <div>
              <span className="dateline on-paper">Preview</span>
              <div
                className="mt-1.5 border border-brass bg-paper-3 rounded-lg px-5 py-4 blog-body"
                dangerouslySetInnerHTML={{
                  __html: draft.format === "markdown" ? renderMarkdown(draft.body) : draft.body,
                }}
              />
            </div>
          )}

          {/* SEO */}
          <div className="border border-ink/10 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-paper-3 border-b border-ink/10 flex items-center gap-2">
              <Search size={13} className="text-ink-3" />
              <p className="font-condensed uppercase tracking-[0.18em] text-[11px] font-semibold text-ink">SEO</p>
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="dateline on-paper">SEO title (defaults to title)</span>
                <input value={draft.seoTitle} onChange={(e) => set("seoTitle")(e.target.value)} maxLength={70}
                  placeholder="≤ 60 characters" className={input} /></label>
              <label className="block"><span className="dateline on-paper">OG image URL</span>
                <input value={draft.ogImage} onChange={(e) => set("ogImage")(e.target.value)}
                  placeholder="https://…/cover.jpg" className={input} /></label>
              <label className="block sm:col-span-2">
                <span className="flex items-center justify-between">
                  <span className="dateline on-paper">Meta description</span>
                  <span className={`dateline ${draft.seoDescription.length > 160 ? "text-brass-deep" : "on-paper"}`}>{draft.seoDescription.length}/160</span>
                </span>
                <textarea rows={2} value={draft.seoDescription} onChange={(e) => set("seoDescription")(e.target.value)}
                  className="mt-1.5 w-full border border-ink/10 bg-paper-3 rounded-lg px-3 py-2.5 text-[14px] text-ink outline-none focus:border-accent" /></label>
              {/* SERP preview */}
              <div className="sm:col-span-2 border border-ink/10 bg-paper-4 rounded-lg px-4 py-3">
                <p className="text-[12px] text-charity">generousmotors.org › blog › {draft.slug || "post-slug"}</p>
                <p className="text-[17px] text-navy leading-snug mt-0.5">{serpTitle}</p>
                <p className="text-[13px] text-ink-2 mt-0.5 line-clamp-2">{serpDesc}</p>
              </div>
              <label className="block sm:col-span-2"><span className="dateline on-paper">Slug</span>
                <input value={draft.slug}
                  onChange={(e) => { setSlugTouched(true); set("slug")(slugify(e.target.value)); }}
                  className={`${input} numeral`} /></label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save(true)}
              className="inline-flex items-center gap-2 bg-ink text-brass px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] font-bold hover:bg-accent hover:text-paper-3 transition-colors">
              <Plus size={13} /> Publish
            </button>
            <button type="button" onClick={() => save(false)}
              className="inline-flex items-center gap-2 border border-ink/10 bg-paper-3 px-5 py-2.5 rounded-full font-condensed uppercase tracking-[0.22em] text-[11px] text-ink hover:bg-ink hover:text-paper transition-colors">
              Save draft
            </button>
            {draft.id && (
              <button type="button" onClick={() => { setDraft(EMPTY); setSlugTouched(false); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 dateline on-paper underline underline-offset-4 hover:text-ink">
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Article list */}
      <div className="mt-8">
        <p className="section-eyebrow on-paper section-eyebrow-rule">Your articles</p>
        <ul className="mt-3 border border-ink/10 bg-paper-4 rounded-xl overflow-hidden divide-y divide-ink/10">
          {articles.map((a) => (
            <li key={a.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Label tone={a.published ? "charity" : "brass"} variant="solid" size="sm">
                    {a.published ? "Published" : "Draft"}
                  </Label>
                  <Label tone="ink" variant="outline" size="sm">{a.tag}</Label>
                </div>
                <p className="mt-1.5 font-display font-bold text-ink leading-tight">{a.title}</p>
                <p className="dateline on-paper mt-0.5">/blog/{a.slug} · {niceDate(a.dateISO)} · {a.format}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.published && (
                  <Link href={`/blog/${a.slug}`} className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                    <ExternalLink size={11} /> View
                  </Link>
                )}
                <button type="button" onClick={() => edit(a)}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                  <PenLine size={11} /> Edit
                </button>
                <button type="button" onClick={() => remove(a.id)} aria-label={`Delete ${a.title}`}
                  className="inline-flex items-center gap-1.5 border border-ink/10 bg-paper-3 px-3 py-1.5 rounded-full dateline on-paper hover:bg-ink hover:text-paper transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            </li>
          ))}
          {articles.length === 0 && (
            <li className="px-5 py-8 text-center text-ink-3 font-serif italic">No articles yet — write the first one above.</li>
          )}
        </ul>
      </div>
    </main>
  );
}
