import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import BreadcrumbNav from "@/components/seo/BreadcrumbNav";
import FacilityGrid from "@/components/facility/FacilityGrid";
import FAQSection from "@/components/ui/FAQSection";
import JsonLd from "@/components/seo/JsonLd";
import { getStateBySlug, getAllStateSlugs } from "@/lib/queries/states";
import { getCitiesByState } from "@/lib/queries/cities";
import { getFacilitiesByState } from "@/lib/queries/facilities";
import { stateMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { BASE_URL, SITE_NAME } from "@/lib/utils/constants";
import { formatNumber, pluralize } from "@/lib/utils/format";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ "state-slug": string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllStateSlugs();
  return slugs.map((s) => ({ "state-slug": s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "state-slug": stateSlug } = await params;
  const state = await getStateBySlug(stateSlug);
  if (!state) return {};
  return stateMetadata(state);
}

export default async function StateDetailPage({ params }: PageProps) {
  const { "state-slug": stateSlug } = await params;

  const state = await getStateBySlug(stateSlug);
  if (!state) notFound();

  const [cities, facilitiesResult] = await Promise.all([
    getCitiesByState(stateSlug),
    getFacilitiesByState(stateSlug),
  ]);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "States", href: "/states" },
    { label: state.name, href: `/states/${state.slug}` },
  ];

  const pageUrl = `${BASE_URL}/states/${state.slug}`;

  return (
    <>
      <JsonLd
        data={
          collectionPageSchema(
            `Padel Courts in ${state.name}`,
            `Discover ${state.facility_count} padel ${pluralize(state.facility_count, "court")} in ${state.name}.`,
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

        {/* State Hero */}
        <section className="mt-6 rounded-xl bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-12 text-center text-white md:px-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Padel Courts in {state.name}
          </h1>
          {state.description && (
            <p className="mx-auto mt-3 max-w-2xl text-navy-200">
              {state.description}
            </p>
          )}
          <p className="mt-4 text-lg font-semibold text-padel-400">
            {formatNumber(state.facility_count)}{" "}
            {pluralize(state.facility_count, "Facility", "Facilities")}
          </p>
        </section>

        {/* Cities Section */}
        {cities.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Cities in {state.name}
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/states/${state.slug}/${city.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 group-hover:text-navy-700 transition-colors">
                      {city.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(city.facility_count)}{" "}
                      {pluralize(city.facility_count, "court")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Facilities */}
        <section className="mt-12">
          <p className="mb-2 text-sm text-gray-500">
            Showing {formatNumber(facilitiesResult.data.length)} padel {pluralize(facilitiesResult.data.length, "court")} across {formatNumber(cities.length)} {pluralize(cities.length, "city", "cities")} in {state.name}
          </p>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            All Courts in {state.name}
          </h2>
          <FacilityGrid facilities={facilitiesResult.data} />
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
        </section>

        {/* FAQ */}
        <section className="mt-16 mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Padel in {state.name} - FAQ
          </h2>
          <FAQSection
            items={[
              {
                question: `How many padel courts are in ${state.name}?`,
                answer: `There are currently ${formatNumber(state.facility_count)} padel ${pluralize(state.facility_count, "facility", "facilities")} listed in ${state.name} on ${SITE_NAME}. New courts are being added regularly as padel continues to grow across the state.`,
              },
              {
                question: `What cities in ${state.name} have padel courts?`,
                answer:
                  cities.length > 0
                    ? `Padel courts in ${state.name} can be found in ${cities.slice(0, 5).map((c) => c.name).join(", ")}${cities.length > 5 ? `, and ${cities.length - 5} more ${pluralize(cities.length - 5, "city", "cities")}` : ""}. Browse the cities section above to find courts near you.`
                    : `We are actively adding padel facilities in ${state.name}. Check back soon or submit a facility you know about.`,
              },
              {
                question: `Are there indoor padel courts in ${state.name}?`,
                answer: `Many facilities in ${state.name} offer indoor courts for year-round play. Check individual facility listings to see whether they have indoor or outdoor courts, along with other amenities.`,
              },
              {
                question: "Can beginners play padel?",
                answer:
                  "Yes! Padel is one of the most beginner-friendly racquet sports. The smaller court, underhand serve, and walls that keep the ball in play make it easy to enjoy rallies right away. Many facilities offer coaching and beginner programs.",
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
