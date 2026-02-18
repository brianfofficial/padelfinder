import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/utils/constants";

import { metadata as whatIsPadel } from "@/content/blog/what-is-padel.mdx";
import { metadata as padelVsPickleball } from "@/content/blog/padel-vs-pickleball.mdx";
import { metadata as padelRules } from "@/content/blog/padel-rules.mdx";

const posts = [whatIsPadel, padelVsPickleball, padelRules];

export default function sitemap(): MetadataRoute.Sitemap {
  return posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}
