import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MapPin, ArrowRight } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import JsonLd from "@/components/seo/JsonLd";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: `Padel Guides — Learn to Play & Find Courts | ${SITE_NAME}`,
  description:
    "Everything you need to know about padel. Learn how to play, understand the rules, find the right equipment, and discover the best courts in your city.",
  alternates: {
    canonical: `${BASE_URL}/guides`,
  },
};

const EDUCATIONAL_GUIDES = [
  {
    href: "/guides/how-to-play-padel",
    title: "How to Play Padel",
    description:
      "Scoring, serving, wall play, and tips for first-timers. Everything you need to get on court.",
  },
  {
    href: "/guides/padel-equipment",
    title: "Padel Equipment Guide",
    description:
      "Rackets, balls, shoes, and clothing. What you need and how much it costs.",
  },
];

const BLOG_POSTS = [
  {
    href: "/blog/what-is-padel",
    title: "What is Padel?",
    description:
      "An introduction to the fastest-growing racket sport in the world.",
  },
  {
    href: "/blog/padel-vs-pickleball",
    title: "Padel vs Pickleball",
    description:
      "How do these two booming sports compare? A side-by-side breakdown.",
  },
  {
    href: "/blog/padel-rules",
    title: "Padel Rules Explained",
    description:
      "Complete guide to padel rules, scoring, and court dimensions.",
  },
];

export default function GuidesHubPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
  ];

  const pageUrl = `${BASE_URL}/guides`;

  return (
    <>
      <JsonLd
        data={
          collectionPageSchema(
            "Padel Guides",
            "Everything you need to know about padel — rules, equipment, how to play, and city guides.",
            pageUrl
          ) as unknown as Record<string, unknown>
        }
      />
      <JsonLd
        data={
          breadcrumbSchema(
            breadcrumbs.map((b) => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
          ) as unknown as Record<string, unknown>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <BreadcrumbNav items={breadcrumbs} />

        <section className="mt-6">
          <h1 className="font-display text-3xl font-extrabold text-gray-900 md:text-4xl">
            Padel Guides
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Everything you need to know about padel — from your first game to finding the best courts near you.
          </p>
        </section>

        {/* Educational Guides */}
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <BookOpen className="h-5 w-5 text-padel-600" />
            Getting Started
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {EDUCATIONAL_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-padel-700 transition-colors">
                  {guide.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {guide.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-padel-600 group-hover:text-padel-700">
                  Read guide
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog Posts */}
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <BookOpen className="h-5 w-5 text-navy-600" />
            Learn About Padel
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.href}
                href={post.href}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-navy-700 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {post.description}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-600 group-hover:text-navy-700">
                  Read article
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* City Guides */}
        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <MapPin className="h-5 w-5 text-padel-600" />
            City Guides
          </h2>
          <p className="text-gray-600">
            In-depth guides to the best padel courts in cities across the US.
          </p>
          <Link
            href="/guides/cities"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-padel-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-padel-700"
          >
            Browse City Guides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Find Courts CTA */}
        <section className="mt-16 rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-10 text-center text-white md:px-12">
          <h2 className="font-display text-2xl font-bold">
            Ready to Play?
          </h2>
          <p className="mt-2 text-navy-200">
            Find padel courts near you with our comprehensive directory.
          </p>
          <Link
            href="/courts"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-padel-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-padel-600"
          >
            Find Courts Near You
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
