"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AMENITY_CONFIG, type AmenityKey } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A-Z" },
  { value: "courts", label: "Most Courts" },
] as const;

const QUICK_FILTERS: AmenityKey[] = [
  "indoor_courts",
  "outdoor_courts",
  "coaching",
  "equipment_rental",
  "open_play",
  "tournaments",
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "rating";
  const activeAmenities = searchParams.getAll("amenity");

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // reset pagination on filter change

      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  function toggleAmenity(amenity: AmenityKey) {
    const next = activeAmenities.includes(amenity)
      ? activeAmenities.filter((a) => a !== amenity)
      : [...activeAmenities, amenity];
    updateParams({ amenity: next.length > 0 ? next : null });
  }

  return (
    <div className="space-y-3">
      {/* Sort + filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Sort by:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateParams({ sort: opt.value })}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                currentSort === opt.value
                  ? "bg-navy-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amenity quick filters */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_FILTERS.map((amenity) => (
          <button
            key={amenity}
            type="button"
            onClick={() => toggleAmenity(amenity)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              activeAmenities.includes(amenity)
                ? "border-padel-600 bg-padel-50 text-padel-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {AMENITY_CONFIG[amenity].label}
          </button>
        ))}
      </div>
    </div>
  );
}
