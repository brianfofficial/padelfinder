import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { SITE_NAME } from "@/lib/utils/constants";

// Import blog post metadata
import { metadata as whatIsPadel } from "@/content/blog/what-is-padel.mdx";
import { metadata as padelVsPickleball } from "@/content/blog/padel-vs-pickleball.mdx";
import { metadata as padelRules } from "@/content/blog/padel-rules.mdx";

const posts = [whatIsPadel, padelVsPickleball, padelRules].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
);

export const metadata: Metadata = {
  title: `Blog | ${SITE_NAME}`,
  description:
    "Articles about padel — rules, tips, comparisons, and guides to help you find and enjoy padel courts across the United States.",
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
        Padel Blog
      </h1>
      <p className="mt-2 text-lg text-gray-600">
        Guides, tips, and everything you need to know about padel in the US.
      </p>

      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-xl border border-gray-200 p-6 transition-colors hover:border-navy-300 hover:bg-navy-50/30"
          >
            <Link href={`/blog/${post.slug}`}>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 group-hover:text-navy-700">
                {post.title}
              </h2>
              <p className="mt-2 text-gray-600">{post.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-600 group-hover:text-navy-700">
                Read more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
