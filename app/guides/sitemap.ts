import type { MetadataRoute } from "next";
import { createStaticClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/utils/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createStaticClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("slug, state_slug, guide_generated_at")
    .not("guide_intro", "is", null);

  if (!cities) return [];

  return cities.map((city) => ({
    url: `${BASE_URL}/guides/cities/${city.state_slug}/${city.slug}`,
    lastModified: city.guide_generated_at
      ? new Date(city.guide_generated_at)
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
