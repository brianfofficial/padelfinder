import type { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/utils/constants";

export async function generateSitemaps() {
  const supabase = createStaticClient();
  const { count } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const total = count || 0;
  const perSitemap = 5000;
  const numSitemaps = Math.max(1, Math.ceil(total / perSitemap));

  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();
  const perSitemap = 5000;
  const start = id * perSitemap;

  const { data } = await supabase
    .from("facilities")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .range(start, start + perSitemap - 1);

  return (data || []).map((f) => ({
    url: `${BASE_URL}/courts/${f.slug}`,
    lastModified: new Date(f.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
