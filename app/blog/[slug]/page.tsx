import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import JsonLd from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { blogMetadata } from "@/lib/seo/metadata";

// Import all blog posts and their metadata
import WhatIsPadel, { metadata as whatIsPadelMeta } from "@/content/blog/what-is-padel.mdx";
import PadelVsPickleball, { metadata as padelVsPickleballMeta } from "@/content/blog/padel-vs-pickleball.mdx";
import PadelRules, { metadata as padelRulesMeta } from "@/content/blog/padel-rules.mdx";

const POSTS: Record<string, { Component: React.ComponentType; meta: typeof whatIsPadelMeta }> = {
  "what-is-padel": { Component: WhatIsPadel, meta: whatIsPadelMeta },
  "padel-vs-pickleball": { Component: PadelVsPickleball, meta: padelVsPickleballMeta },
  "padel-rules": { Component: PadelRules, meta: padelRulesMeta },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) return {};
  return blogMetadata(post.meta);
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const { Component, meta } = post;

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: meta.title, href: `/blog/${slug}` },
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <BreadcrumbNav items={crumbs} />

      <div className="prose prose-lg prose-gray mt-6 max-w-none prose-headings:font-display prose-a:text-navy-600 hover:prose-a:text-navy-700">
        <Component />
      </div>

      <JsonLd data={articleSchema(meta)} />
      <JsonLd
        data={breadcrumbSchema(
          crumbs.map((c) => ({ name: c.label, url: c.href }))
        )}
      />
    </article>
  );
}
