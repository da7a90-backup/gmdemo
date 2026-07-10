// Blog CMS store (demo) — admin-authored articles layered over the built-in
// field notes. Articles carry SEO fields and a markdown or raw-HTML body.
// Production: Shopify metaobjects (headless CMS), same shape.

import { useEffect, useState } from "react";
import { blogPosts, type BlogPost } from "@/lib/mock-data";

export type ArticleTag = BlogPost["tag"];

export type Article = {
  id: string;
  slug: string;
  title: string;
  author: string;
  tag: ArticleTag;
  excerpt: string;
  body: string;
  format: "markdown" | "html";
  published: boolean;
  dateISO: string;
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
};

const STORAGE_KEY = "gm:articles-v1";
export const BLOG_EVENT = "gm:articles-updated";

export function getArticles(): Article[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Article[]) : [];
  } catch {
    return [];
  }
}

function persist(list: Article[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(BLOG_EVENT));
}

export function upsertArticle(a: Omit<Article, "id"> & { id?: string }): Article {
  const list = getArticles();
  if (a.id) {
    const article = a as Article;
    persist(list.map((x) => (x.id === a.id ? article : x)));
    return article;
  }
  const article: Article = { ...a, id: `a-${Math.random().toString(36).slice(2, 8)}` };
  persist([article, ...list]);
  return article;
}

export function deleteArticle(id: string) {
  persist(getArticles().filter((a) => a.id !== id));
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

/** Published custom articles as BlogPost-shaped entries, newest first, ahead of built-ins. */
export type MergedPost = BlogPost & { custom?: Article };

export function getMergedPosts(): MergedPost[] {
  const custom: MergedPost[] = getArticles()
    .filter((a) => a.published)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      date: a.dateISO.slice(0, 10),
      author: a.author,
      excerpt: a.excerpt,
      body: a.body,
      tag: a.tag,
      custom: a,
    }));
  return [...custom, ...blogPosts];
}

export function useMergedPosts(): MergedPost[] {
  const [list, setList] = useState<MergedPost[]>(blogPosts);
  useEffect(() => {
    const load = () => setList(getMergedPosts());
    load();
    window.addEventListener(BLOG_EVENT, load);
    return () => window.removeEventListener(BLOG_EVENT, load);
  }, []);
  return list;
}
