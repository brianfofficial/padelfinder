"use client";

import { useState, useMemo } from "react";
import { Star, ExternalLink } from "lucide-react";
import ReviewCard from "@/components/facility/ReviewCard";
import RatingStars from "@/components/facility/RatingStars";
import type { Review } from "@/lib/types/facility";
import type { ReviewStats } from "@/lib/queries/reviews";
import type { ReviewSort } from "@/lib/queries/reviews";

const INITIAL_VISIBLE = 4;

interface ReviewsSectionProps {
  reviews: Review[];
  stats: ReviewStats;
  googlePlaceId?: string | null;
  facilityName: string;
}

function DistributionBar({
  star,
  count,
  maxCount,
}: {
  star: number;
  count: number;
  maxCount: number;
}) {
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right text-gray-600">{star}</span>
      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs text-gray-500">{count}</span>
    </div>
  );
}

export default function ReviewsSection({
  reviews,
  stats,
  googlePlaceId,
  facilityName,
}: ReviewsSectionProps) {
  const [sort, setSort] = useState<ReviewSort>("relevant");
  const [showAll, setShowAll] = useState(false);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sort) {
      case "relevant":
        return sorted.sort(
          (a, b) =>
            b.helpful_count - a.helpful_count ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sort]);

  const visibleReviews = showAll
    ? sortedReviews
    : sortedReviews.slice(0, INITIAL_VISIBLE);

  const maxDistribution = Math.max(
    ...Object.values(stats.distribution),
    1,
  );

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Reviews</h2>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <Star className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            No reviews yet. Be the first to leave a review!
          </p>
          {googlePlaceId && (
            <a
              href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy-800"
            >
              Write a review on Google
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </section>
    );
  }

  const googleReviewCount = reviews.filter((r) => r.source === "google").length;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        Reviews{" "}
        <span className="text-base font-normal text-gray-500">
          ({reviews.length})
        </span>
      </h2>

      {/* Rating summary + distribution */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row">
        {/* Left: big rating */}
        <div className="flex flex-col items-center justify-center sm:min-w-[140px]">
          <span className="text-4xl font-bold text-gray-900">
            {stats.avgRating.toFixed(1)}
          </span>
          <RatingStars rating={stats.avgRating} size="md" />
          <p className="mt-1 text-xs text-gray-500">
            Based on {stats.totalReviews}{" "}
            {googleReviewCount > 0 ? "Google " : ""}
            {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Right: distribution bars */}
        <div className="flex-1 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <DistributionBar
              key={star}
              star={star}
              count={stats.distribution[star]}
              maxCount={maxDistribution}
            />
          ))}
        </div>
      </div>

      {/* Sort + Write review */}
      <div className="mb-4 flex items-center justify-between">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as ReviewSort)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm"
        >
          <option value="relevant">Most relevant</option>
          <option value="newest">Newest</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>

        {googlePlaceId && (
          <a
            href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Write a review
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Show all toggle */}
      {sortedReviews.length > INITIAL_VISIBLE && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          Show all {sortedReviews.length} reviews
        </button>
      )}
    </section>
  );
}
