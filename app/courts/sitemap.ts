import type { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/utils/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const { data } = await supabase
    .from("facilities")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  return (data || []).map((f) => ({
    url: `${BASE_URL}/courts/${f.slug}`,
    lastModified: new Date(f.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
