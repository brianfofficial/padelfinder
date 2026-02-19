import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types/facility";

export type ReviewSort = "relevant" | "newest" | "highest" | "lowest";

export async function getReviewsByFacility(
  facilityId: string,
  sort: ReviewSort = "relevant",
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("facility_id", facilityId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  const reviews = (data ?? []) as Review[];

  // Client-side sort since we need multi-column ordering
  switch (sort) {
    case "relevant":
      return reviews.sort(
        (a, b) => b.helpful_count - a.helpful_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "newest":
      return reviews.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "highest":
      return reviews.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return reviews.sort((a, b) => a.rating - b.rating);
    default:
      return reviews;
  }
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export async function getReviewStats(facilityId: string): Promise<ReviewStats> {
  const reviews = await getReviewsByFacility(facilityId);

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalRating = 0;

  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    distribution[rating]++;
    totalRating += review.rating;
  }

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews,
    distribution,
  };
}
