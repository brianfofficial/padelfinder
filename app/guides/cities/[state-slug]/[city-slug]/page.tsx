import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import FacilityGrid from "@/components/facility/FacilityGrid";
import FAQSection from "@/components/ui/FAQSection";
import JsonLd from "@/components/seo/JsonLd";
import { getCityGuide, getCityGuideSlugs } from "@/lib/queries/cities";
import { getFacilitiesByCity } from "@/lib/queries/facilities";
import { cityGuideMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";
import { formatNumber, pluralize } from "@/lib/utils/format";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "state-slug": string; "city-slug": string }>;
}

export async function generateStaticParams() {
  const slugs = await getCityGuideSlugs();
  return slugs.map((s) => ({
    "state-slug": s.stateSlug,
    "city-slug": s.citySlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "state-slug": stateSlug, "city-slug": citySlug } = await params;
  const city = await getCityGuide(citySlug, stateSlug);
  if (!city) return {};
  return cityGuideMetadata(city);
}

export default async function CityGuidePage({ params }: PageProps) {
  const { "state-slug": stateSlug, "city-slug": citySlug } = await params;

  const city = await getCityGuide(citySlug, stateSlug);
  if (!city) notFound();

  const facilitiesResult = await getFacilitiesByCity(citySlug, stateSlug, {
    page: 1,
    sort: "rating",
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Guides", href: "/guides" },
    { label: "City Guides", href: "/guides/cities" },
    { label: city.name, href: `/guides/cities/${stateSlug}/${citySlug}` },
  ];

  const pageUrl = `${BASE_URL}/guides/cities/${stateSlug}/${citySlug}`;
  const year = new Date().getFullYear();

  return (
    <>
      <JsonLd
        data={
          articleSchema({
            title: `Best Padel Courts in ${city.name}, ${city.state_abbr} (${year})`,
            description: `Discover the ${city.facility_count} best padel courts in ${city.name}, ${city.state_name}.`,
            slug: `guides/cities/${stateSlug}/${citySlug}`,
            publishedAt: city.guide_generated_at ?? city.created_at,
          }) as unknown as Record<string, unknown>
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

        {/* Hero */}
        <section className="mt-6 rounded-xl bg-gradient-to-r from-padel-700 to-padel-900 px-6 py-12 text-center text-white md:px-12 md:py-16">
          <p className="text-sm font-medium uppercase tracking-wider text-padel-200">
            City Guide
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Best Padel Courts in {city.name}, {city.state_abbr}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-2 text-padel-200">
            <MapPin className="h-4 w-4" />
            <span>
              {formatNumber(city.facility_count)}{" "}
              {pluralize(city.facility_count, "Facility", "Facilities")} in {city.name}, {city.state_name}
            </span>
          </div>
        </section>

        {/* Guide Intro */}
        {city.guide_intro && (
          <section className="mt-8 mx-auto max-w-3xl">
            <p className="text-lg text-gray-700 leading-relaxed">
              {city.guide_intro}
            </p>
          </section>
        )}

        {/* Facility Rankings */}
        <section className="mt-10">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Top-Rated Padel Courts in {city.name}
          </h2>
          <FacilityGrid facilities={facilitiesResult.data} />
        </section>

        {/* Guide Body */}
        {city.guide_body && (
          <section className="mt-12 mx-auto max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Playing Padel in {city.name}
            </h2>
            {city.guide_body.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mt-4 text-gray-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        )}

        {/* FAQ */}
        <section className="mt-16 mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Padel in {city.name} — FAQ
          </h2>
          <FAQSection
            items={[
              {
                question: `How many padel courts are in ${city.name}, ${city.state_abbr}?`,
                answer: `There are currently ${formatNumber(city.facility_count)} padel ${pluralize(city.facility_count, "facility", "facilities")} listed in ${city.name}, ${city.state_name} on ${SITE_NAME}. Our directory is regularly updated as new courts open.`,
              },
              {
                question: `What is the best padel facility in ${city.name}?`,
                answer: `Check our ranked list above — we sort facilities by player rating so you can easily find the top-rated courts in ${city.name}. Each listing includes reviews, pricing, and amenity details.`,
              },
              {
                question: `How much does it cost to play padel in ${city.name}?`,
                answer: `Court rental prices in ${city.name} typically range from $20 to $60 per hour. Many facilities offer memberships and lesson packages. Check individual listings for current pricing.`,
              },
              {
                question: `Are there beginner-friendly padel courts in ${city.name}?`,
                answer: `Yes! Most padel facilities in ${city.name} welcome beginners and offer coaching, equipment rental, and open play sessions. Look for facilities tagged as "Best for Beginners" in our listings.`,
              },
            ]}
          />
        </section>

        {/* Email Capture */}
        <section className="mt-12 rounded-xl border border-padel-200 bg-padel-50 px-6 py-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Want to know when new courts open in {city.name}?
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Join our newsletter and be the first to know about new padel facilities and events.
          </p>
          <Link
            href="/#subscribe"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-padel-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-padel-700"
          >
            Subscribe for Updates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Link to Directory */}
        <section className="mt-8 text-center">
          <Link
            href={`/states/${stateSlug}/${citySlug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
          >
            View all {city.name} courts in our directory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
