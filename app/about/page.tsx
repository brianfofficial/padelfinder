import type { Metadata } from "next";
import { MapPin, Search, Star, Users } from "lucide-react";
import { SITE_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description:
    "PadelFinder is the most comprehensive directory of padel courts in the United States. Our mission is to make padel accessible to everyone.",
};

const STATS = [
  { icon: MapPin, label: "Courts Listed", value: "400+" },
  { icon: Search, label: "States Covered", value: "50" },
  { icon: Star, label: "Player Reviews", value: "Growing" },
  { icon: Users, label: "Monthly Visitors", value: "Growing" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
        About PadelFinder
      </h1>

      <div className="mt-8 space-y-6 text-gray-600">
        <p className="text-lg">
          PadelFinder is the most comprehensive directory of padel courts in
          the United States. We&apos;re on a mission to make padel accessible
          to everyone by helping players find courts, compare facilities, and
          connect with the growing padel community.
        </p>

        <p>
          Padel is the fastest-growing racquet sport in the world, and it&apos;s
          experiencing explosive growth in the US. From roughly 180 courts in
          2020 to over 400 today, new facilities are opening monthly across
          the country. But finding accurate, up-to-date information about where
          to play has been a challenge — until now.
        </p>

        <p>
          We created PadelFinder to be the go-to resource for padel players at
          every level. Whether you&apos;re a complete beginner looking for your
          first lesson or an advanced player searching for competitive leagues,
          our directory helps you find exactly what you need.
        </p>

        <h2 className="font-display text-xl font-bold text-gray-900">
          What We Offer
        </h2>

        <ul className="space-y-2">
          <li>Detailed facility profiles with court counts, amenities, hours, and pricing</li>
          <li>Verified player reviews and ratings</li>
          <li>City and state guides for padel across the US</li>
          <li>Educational content for players of all levels</li>
          <li>Tools for facility owners to reach more players</li>
        </ul>

        <h2 className="font-display text-xl font-bold text-gray-900">
          Get Involved
        </h2>

        <p>
          PadelFinder is a community-driven project. You can help by{" "}
          <a href="/submit" className="text-navy-600 hover:text-navy-700 underline">
            submitting courts
          </a>{" "}
          we may have missed, leaving reviews at facilities you&apos;ve visited,
          and sharing PadelFinder with your padel friends.
        </p>

        <p>
          Are you a facility owner?{" "}
          <a href="/advertise" className="text-navy-600 hover:text-navy-700 underline">
            Learn about featured listings
          </a>{" "}
          to boost your visibility and attract more players.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <stat.icon className="mx-auto h-8 w-8 text-navy-600" />
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
