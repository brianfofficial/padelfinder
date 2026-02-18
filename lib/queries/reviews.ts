import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types/facility";

export async function getReviewsByFacility(facilityId: string) {
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

  return (data ?? []) as Review[];
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
