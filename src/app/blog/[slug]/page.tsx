import { BlogPostClient } from "./post-client";

// Articles are admin-managed (Shopify metaobjects) and fetched client-side; render on demand.
export async function generateStaticParams() {
  return [];
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
