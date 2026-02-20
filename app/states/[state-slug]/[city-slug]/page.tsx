import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, BookOpen } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import FacilityGrid from "@/components/facility/FacilityGrid";
import FAQSection from "@/components/ui/FAQSection";
import JsonLd from "@/components/seo/JsonLd";
import { FilterBar } from "@/components/search/FilterBar";
import { Pagination } from "@/components/layout/Pagination";
import { getCityBySlug, getAllCitySlugs, getCitiesByState } from "@/lib/queries/cities";
import { getStateBySlug } from "@/lib/queries/states";
import { getFacilitiesByCity } from "@/lib/queries/facilities";
import { cityMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";
import { formatNumber, pluralize } from "@/lib/utils/format";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "state-slug": string; "city-slug": string }>;
  searchParams: Promise<{ page?: string; sort?: string; amenity?: string | string[]; bestFor?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCitySlugs();
  return slugs.map((s) => ({
    "state-slug": s.stateSlug,
    "city-slug": s.citySlug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "state-slug": stateSlug, "city-slug": citySlug } = await params;
  const city = await getCityBySlug(citySlug, stateSlug);
  if (!city) return {};
  return cityMetadata(city);
}

export default async function CityDetailPage({ params, searchParams }: PageProps) {
  const { "state-slug": stateSlug, "city-slug": citySlug } = await params;
  const sp = await searchParams;
  const pageParam = sp.page;
  const sort = sp.sort;
  const bestFor = sp.bestFor;
  const amenityParam = sp.amenity;
  const amenities = amenityParam
    ? Array.isArray(amenityParam)
      ? amenityParam
      : [amenityParam]
    : [];

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [city, state] = await Promise.all([
    getCityBySlug(citySlug, stateSlug),
    getStateBySlug(stateSlug),
  ]);

  if (!city || !state) notFound();

  const [facilitiesResult, allCitiesInState] = await Promise.all([
    getFacilitiesByCity(citySlug, stateSlug, { page: currentPage, sort, amenities, bestFor }),
    getCitiesByState(stateSlug),
  ]);

  // Nearby cities = other cities in the same state, excluding this one
  const nearbyCities = allCitiesInState
    .filter((c) => c.slug !== city.slug && c.facility_count > 0)
    .slice(0, 6);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "States", href: "/states" },
    { label: state.name, href: `/states/${state.slug}` },
    { label: city.name, href: `/states/${state.slug}/${city.slug}` },
  ];

  const pageUrl = `${BASE_URL}/states/${state.slug}/${city.slug}`;
  const basePath = `/states/${state.slug}/${city.slug}`;

  return (
    <>
      <JsonLd
        data={
          collectionPageSchema(
            `Padel Courts in ${city.name}, ${city.state_abbr}`,
            `Find ${city.facility_count} padel ${pluralize(city.facility_count, "court")} in ${city.name}, ${city.state_name}.`,
            pageUrl,
          ) as unknown as Record<string, unknown>
        }
      />
      <JsonLd
        data={
          breadcrumbSchema(
            breadcrumbs.map((b) => ({ name: b.label, url: `${BASE_URL}${b.href}` })),
          ) as unknown as Record<string, unknown>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <BreadcrumbNav items={breadcrumbs} />

        {/* City Hero */}
        <section className="mt-6 rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-12 text-center text-white md:px-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Padel Courts in {city.name}, {city.state_abbr}
          </h1>
          <p className="mt-3 text-navy-200">
            Discover padel facilities in {city.name}, {city.state_name}
          </p>
          <p className="mt-4 text-lg font-semibold text-padel-400">
            {formatNumber(city.facility_count)}{" "}
            {pluralize(city.facility_count, "Facility", "Facilities")}
          </p>
        </section>

        {/* City Guide Banner */}
        {city.guide_intro && (
          <section className="mt-6 rounded-xl border border-padel-200 bg-padel-50 px-5 py-4">
            <Link
              href={`/guides/cities/${stateSlug}/${citySlug}`}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-padel-100 text-padel-700 group-hover:bg-padel-600 group-hover:text-white transition-colors">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-padel-700 transition-colors">
                  Read our {city.name} Padel Guide
                </p>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {city.guide_intro}
                </p>
              </div>
            </Link>
          </section>
        )}

        {/* Filters */}
        <div className="mt-8">
          <FilterBar />
        </div>

        {/* Facility Grid */}
        <section className="mt-4">
          <FacilityGrid facilities={facilitiesResult.data} />
        </section>

        {/* Pagination */}
        {facilitiesResult.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={facilitiesResult.totalPages}
              basePath={basePath}
            />
          </div>
        )}

        {/* Submit CTA */}
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
          <p className="text-gray-600 font-medium">
            Don&apos;t see your court?
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Help us grow the directory by submitting facilities we may have missed.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-navy-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Submit a Court
          </Link>
        </div>

        {/* Nearby Cities */}
        {nearbyCities.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Nearby Cities with Padel Courts
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {nearbyCities.map((nearby) => (
                <Link
                  key={nearby.id}
                  href={`/states/${state.slug}/${nearby.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 group-hover:text-navy-700 transition-colors">
                      {nearby.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(nearby.facility_count)}{" "}
                      {pluralize(nearby.facility_count, "court")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-16 mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Padel in {city.name} - FAQ
          </h2>
          <FAQSection
            items={[
              {
                question: `How many padel courts are in ${city.name}, ${city.state_abbr}?`,
                answer: `There are currently ${formatNumber(city.facility_count)} padel ${pluralize(city.facility_count, "facility", "facilities")} listed in ${city.name}, ${city.state_name} on ${SITE_NAME}. New courts are being added as padel continues to grow in the area.`,
              },
              {
                question: `What amenities do padel courts in ${city.name} offer?`,
                answer: `Padel facilities in ${city.name} vary in their amenities. Common offerings include indoor and outdoor courts, equipment rental, coaching, pro shops, and locker rooms. Check each facility listing for specific amenity details.`,
              },
              {
                question: `How much does it cost to play padel in ${city.name}?`,
                answer: `Court rental prices vary by facility. Check individual listings for current pricing, which typically ranges from $20 to $60 per hour. Many facilities offer memberships and lesson packages for additional value.`,
              },
              {
                question: `Are there padel leagues or tournaments in ${city.name}?`,
                answer: `Several padel facilities in ${city.name} offer leagues and tournaments for various skill levels. Browse the facility listings above and look for the "Leagues" and "Tournaments" amenity badges to find competitive play options.`,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
