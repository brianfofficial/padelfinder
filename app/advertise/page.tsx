import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, TrendingUp, Eye, Users, Mail } from "lucide-react";
import { SITE_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: `Advertise Your Facility | ${SITE_NAME}`,
  description:
    "Get your padel facility featured on PadelFinder. Reach thousands of players looking for courts near them.",
};

const BENEFITS = [
  {
    icon: Eye,
    title: "Premium Visibility",
    description: "Your facility appears at the top of city and state listings with a Featured badge.",
  },
  {
    icon: TrendingUp,
    title: "Boost Bookings",
    description: "Players actively searching for courts are ready to book. Convert searches into visits.",
  },
  {
    icon: Users,
    title: "Reach Active Players",
    description: "Our audience is 100% padel players and enthusiasts looking for their next game.",
  },
];

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
          Get More Players to Your Facility
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Feature your padel facility on PadelFinder and connect with
          thousands of players actively searching for courts near them.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
              <benefit.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {benefit.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div className="mt-16 rounded-2xl bg-navy-50 p-8">
        <h2 className="text-center font-display text-2xl font-bold text-navy-900">
          Featured Listing Includes
        </h2>
        <ul className="mt-6 space-y-3">
          {[
            "Featured badge on your facility card",
            "Priority placement in city and state listings",
            "Enhanced facility profile with photos and detailed amenities",
            "Direct link to your booking system",
            "Monthly performance analytics",
            "Priority support and profile updates",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-padel-600" />
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Ready to grow your business?
        </h2>
        <p className="mt-2 text-gray-600">
          Contact us to learn about featured listing packages.
        </p>
        <Link
          href="mailto:hello@padelfinder.com"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy-700 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-navy-800"
        >
          <Mail className="h-5 w-5" />
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
