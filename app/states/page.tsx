import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getStates } from "@/lib/queries/states";
import { SITE_NAME } from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Padel Courts by State | ${SITE_NAME}`,
    description:
      "Browse padel courts in every US state. Find facilities, compare amenities, and discover places to play padel near you.",
    alternates: {
      canonical: "/states",
    },
  };
}

export default async function StatesPage() {
  const states = await getStates();

  // Sort states with facilities first, then alphabetically within each group
  const sorted = [...states].sort((a, b) => {
    if (a.facility_count > 0 && b.facility_count === 0) return -1;
    if (a.facility_count === 0 && b.facility_count > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          Padel Courts by State
        </h1>
        <p className="mt-3 text-gray-600">
          Explore padel facilities across the United States. Select a state to
          view available courts.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sorted.map((state) => {
          const hasFacilities = state.facility_count > 0;

          return (
            <Link
              key={state.id}
              href={`/states/${state.slug}`}
              className={`group flex items-center gap-3 rounded-xl border p-4 transition-shadow ${
                hasFacilities
                  ? "border-gray-200 bg-white shadow-sm hover:shadow-md"
                  : "border-gray-100 bg-gray-50 opacity-75 hover:opacity-100"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  hasFacilities
                    ? "bg-navy-100 text-navy-700 group-hover:bg-navy-700 group-hover:text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-semibold transition-colors ${
                    hasFacilities
                      ? "text-gray-900 group-hover:text-navy-700"
                      : "text-gray-600"
                  }`}
                >
                  {state.name}
                </p>
                <p className="text-sm text-gray-500">
                  {hasFacilities
                    ? `${formatNumber(state.facility_count)} ${state.facility_count === 1 ? "court" : "courts"}`
                    : "Coming soon"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
