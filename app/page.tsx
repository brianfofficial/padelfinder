import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, TrendingUp, Building2 } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import FacilityGrid from "@/components/facility/FacilityGrid";
import StatsBar from "@/components/ui/StatsBar";
import FAQSection from "@/components/ui/FAQSection";
import JsonLd from "@/components/seo/JsonLd";
import { getFeaturedFacilities, getRecentFacilities, getFacilityCount } from "@/lib/queries/facilities";
import { getStatesWithFacilities } from "@/lib/queries/states";
import { getFeaturedCities } from "@/lib/queries/cities";
import { homeMetadata } from "@/lib/seo/metadata";
import { websiteSchema, organizationSchema } from "@/lib/seo/schemas";
import { formatNumber } from "@/lib/utils/format";
import { SITE_NAME } from "@/lib/utils/constants";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata();
}

export default async function HomePage() {
  const [featuredFacilities, recentFacilities, featuredCities, totalFacilities, statesWithFacilities] =
    await Promise.all([
      getFeaturedFacilities(6),
      getRecentFacilities(6),
      getFeaturedCities(8),
      getFacilityCount(),
      getStatesWithFacilities(),
    ]);

  const totalStates = statesWithFacilities.length;
  const totalCities = featuredCities.length;

  return (
    <>
      <JsonLd data={websiteSchema() as unknown as Record<string, unknown>} />
      <JsonLd data={organizationSchema() as unknown as Record<string, unknown>} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            Find Padel Courts Near You
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-200">
            The most comprehensive directory of padel facilities in the United
            States. Discover courts, compare amenities, and start playing today.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar size="lg" placeholder="Search courts, cities, or states..." />
          </div>
          <div className="mt-10">
            <StatsBar
              stats={[
                { label: "Total Courts", value: formatNumber(totalFacilities) },
                { label: "States", value: formatNumber(totalStates) },
                { label: "Cities", value: formatNumber(totalCities) },
              ]}
              className="text-white [&_span]:text-white [&_span:last-child]:text-navy-200 divide-navy-600"
            />
            <p className="mt-4 text-sm text-navy-300">
              Trusted by {formatNumber(totalFacilities)}+ padel facilities across {formatNumber(totalStates)} states
            </p>
          </div>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Popular Padel Cities
          </h2>
          <p className="mt-2 text-gray-600">
            Explore padel courts in top cities across the country
          </p>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {featuredCities.map((city) => (
            <Link
              key={city.id}
              href={`/states/${city.state_slug}/${city.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 group-hover:text-navy-700 transition-colors">
                  {city.name}
                </p>
                <p className="text-sm text-gray-500">
                  {city.state_abbr} &middot; {city.facility_count}{" "}
                  {city.facility_count === 1 ? "court" : "courts"}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/states"
            className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
          >
            View all states
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Featured Facilities */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Featured Padel Courts
            </h2>
            <p className="mt-2 text-gray-600">
              Top-rated padel facilities handpicked for you
            </p>
          </div>
          <FacilityGrid facilities={featuredFacilities} />
          <div className="mt-8 text-center">
            <Link
              href="/courts"
              className="inline-flex items-center gap-1 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
            >
              Browse all courts
              <Building2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Added */}
      {recentFacilities.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Recently Added
            </h2>
            <p className="mt-2 text-gray-600">
              The newest padel facilities in our directory
            </p>
          </div>
          <FacilityGrid facilities={recentFacilities} />
        </section>
      )}

      {/* About Padel */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
          What is Padel?
        </h2>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Padel is the fastest-growing racquet sport in the world. A mix of
          tennis and squash, padel is played on an enclosed court roughly a
          third the size of a tennis court. The glass walls keep the ball in
          play, making rallies longer and the game more social and accessible
          for players of all ages and skill levels.
        </p>
        <p className="mt-4 text-gray-600 leading-relaxed">
          {SITE_NAME} helps you discover padel facilities across the United
          States. Whether you are a beginner looking for your first game or an
          advanced player searching for tournament-grade courts, our directory
          makes it easy to find, compare, and visit padel courts near you.
        </p>
      </section>

      {/* Join the Community */}
      <section className="bg-navy-900 py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Join the Padel Community
          </h2>
          <p className="mt-3 text-navy-200">
            Get notified when new courts open near you and stay up to date with the US padel scene.
          </p>
          <form
            action="/api/subscribe"
            method="POST"
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
              className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 text-white placeholder:text-navy-400 focus:border-padel-500 focus:outline-none focus:ring-1 focus:ring-padel-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-padel-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-padel-700"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-xs text-navy-400">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Frequently Asked Questions
        </h2>
        <FAQSection
          items={[
            {
              question: "What is padel and how is it different from tennis?",
              answer:
                "Padel is a racquet sport played on a smaller, enclosed court with glass walls. Unlike tennis, padel uses a solid, perforated paddle instead of a strung racquet, the ball can be played off the walls (similar to squash), and the game is always played in doubles. The underhand serve and smaller court make it easier to pick up for beginners.",
            },
            {
              question: "Do I need my own equipment to play padel?",
              answer:
                "Not necessarily. Many padel facilities offer equipment rental including paddles and balls. However, if you plan to play regularly, investing in your own paddle is recommended. Check individual facility listings on PadelFinder to see which locations offer equipment rental.",
            },
            {
              question: "How much does it cost to play padel?",
              answer:
                "Court rental prices vary by location, typically ranging from $20 to $60 per hour for a court that accommodates four players. Many facilities also offer memberships, lesson packages, and open play sessions at reduced rates. Check each facility's pricing details on their PadelFinder listing.",
            },
            {
              question: "Is padel suitable for beginners?",
              answer:
                "Absolutely! Padel is one of the most beginner-friendly racquet sports. The smaller court, underhand serve, and ability to play the ball off the walls make it easy to enjoy rallies from your very first game. Many facilities listed on PadelFinder also offer coaching and beginner clinics.",
            },
            {
              question: "How do I find padel courts near me?",
              answer:
                "Use the search bar at the top of this page to search by city, state, or facility name. You can also browse by state or city to discover all available courts in your area. Each listing includes details on amenities, hours, pricing, and reviews.",
            },
          ]}
        />
      </section>
    </>
  );
}
