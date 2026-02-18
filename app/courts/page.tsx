import type { Metadata } from "next";
import { SearchBar } from "@/components/search/SearchBar";
import FacilityGrid from "@/components/facility/FacilityGrid";
import { Pagination } from "@/components/layout/Pagination";
import { getRecentFacilities, getFacilityCount } from "@/lib/queries/facilities";
import { searchFacilities } from "@/lib/queries/search";
import { SITE_NAME, ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Browse All Padel Courts | ${SITE_NAME}`,
    description:
      "Browse and search the complete directory of padel courts in the United States. Filter by location, amenities, and more.",
    alternates: {
      canonical: "/courts",
    },
  };
}

export default async function CourtsPage({ searchParams }: PageProps) {
  const { page: pageParam, q, sort } = await searchParams;

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalFacilities = await getFacilityCount();

  let facilities;
  let totalPages = 1;
  let displayCount = totalFacilities;

  if (q && q.trim().length >= 2) {
    // Search mode: use search query
    const searchResults = await searchFacilities(q);
    displayCount = searchResults.length;
    totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    facilities = searchResults.slice(from, to);
  } else {
    // Browse mode: show recent facilities paginated
    // For simplicity, fetch a large batch; in production this would use a dedicated paginated query
    const allFacilities = await getRecentFacilities(500);
    displayCount = allFacilities.length;
    totalPages = Math.ceil(allFacilities.length / ITEMS_PER_PAGE);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    facilities = allFacilities.slice(from, to);
  }

  // Build search params for pagination links (preserve q and sort)
  const paginationSearchParams: Record<string, string> = {};
  if (q) paginationSearchParams.q = q;
  if (sort) paginationSearchParams.sort = sort;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          Browse All Padel Courts
        </h1>
        <p className="mt-3 text-gray-600">
          {formatNumber(totalFacilities)} padel facilities across the United States
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="mx-auto mb-8 max-w-xl">
        <SearchBar
          size="lg"
          placeholder="Search by name, city, or state..."
        />
      </div>

      {/* Results info */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {q ? (
            <>
              {formatNumber(displayCount)} {displayCount === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
            </>
          ) : (
            <>Showing {formatNumber(displayCount)} facilities</>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Facility Grid */}
      <FacilityGrid facilities={facilities} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/courts"
            searchParams={paginationSearchParams}
          />
        </div>
      )}
    </div>
  );
}
