import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import JsonLd from "@/components/seo/JsonLd";
import { getCitiesWithGuides } from "@/lib/queries/cities";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";
import { formatNumber, pluralize } from "@/lib/utils/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `City Guides — Best Padel Courts by City | ${SITE_NAME}`,
  description:
    "Expert city-by-city guides to the best padel courts in the United States. Find top-rated facilities, pricing, tips, and insider info for your city.",
  alternates: {
    canonical: `${BASE_URL}/guides/cities`,
  },
};

export default async function CityGuidesIndexPage() {
  const cities = await getCitiesWithGuides();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: "City Guides", href: "/guides/cities" },
  ];

  const pageUrl = `${BASE_URL}/guides/cities`;

  return (
    <>
      <JsonLd
        data={
          collectionPageSchema(
            "City Guides — Best Padel Courts by City",
            "Expert city-by-city guides to the best padel courts in the United States.",
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
            City Guides
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            In-depth guides to the best padel courts in cities across the United States.
            Find top-rated facilities, pricing info, and tips for every city.
          </p>
        </section>

        <section className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/guides/cities/${city.state_slug}/${city.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-padel-100 text-padel-700 transition-colors group-hover:bg-padel-600 group-hover:text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 group-hover:text-padel-700 transition-colors">
                    {city.name}, {city.state_abbr}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {formatNumber(city.facility_count)}{" "}
                    {pluralize(city.facility_count, "facility", "facilities")}
                  </p>
                  {city.guide_intro && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {city.guide_intro}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-padel-600 group-hover:text-padel-700">
                Read guide
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </section>

        {cities.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-gray-700">
              City guides coming soon
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;re working on in-depth guides for cities across the US.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
