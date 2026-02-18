import type { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import { BASE_URL } from "@/lib/utils/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient();

  const [{ data: states }, { data: cities }] = await Promise.all([
    supabase.from("states").select("slug, updated_at"),
    supabase.from("cities").select("slug, state_slug, updated_at"),
  ]);

  const stateEntries: MetadataRoute.Sitemap = (states || []).map((s) => ({
    url: `${BASE_URL}/states/${s.slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const cityEntries: MetadataRoute.Sitemap = (cities || []).map((c) => ({
    url: `${BASE_URL}/states/${c.state_slug}/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...stateEntries, ...cityEntries];
}
