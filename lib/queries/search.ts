import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Facility } from "@/lib/types/facility";
import { DEMO_FACILITIES, DEMO_CITIES, DEMO_STATES } from "@/lib/demo-data";

export async function searchFacilities(query: string) {
  if (!isSupabaseConfigured()) {
    const q = query.toLowerCase();
    return DEMO_FACILITIES.filter((f) => f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q));
  }
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_facilities", {
    search_query: query,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as Facility[];
}

export interface AutocompleteResult {
  type: "facility" | "city" | "state";
  name: string;
  slug: string;
  /** Additional context, e.g. "Austin, TX" for a facility */
  subtitle: string | null;
  /** URL path for navigation */
  url: string;
}

export async function autocomplete(
  query: string
): Promise<AutocompleteResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    const q = query.toLowerCase();
    const results: AutocompleteResult[] = [];
    for (const f of DEMO_FACILITIES) {
      if (f.name.toLowerCase().includes(q)) {
        results.push({ type: "facility", name: f.name, slug: f.slug, subtitle: `${f.city}, ${f.state_abbr}`, url: `/courts/${f.slug}` });
      }
    }
    for (const c of DEMO_CITIES) {
      if (c.name.toLowerCase().includes(q)) {
        results.push({ type: "city", name: c.name, slug: c.slug, subtitle: c.state_name, url: `/states/${c.state_slug}/${c.slug}` });
      }
    }
    for (const s of DEMO_STATES) {
      if (s.name.toLowerCase().includes(q)) {
        results.push({ type: "state", name: s.name, slug: s.slug, subtitle: null, url: `/states/${s.slug}` });
      }
    }
    return results.slice(0, 8);
  }

  const pattern = `%${query}%`;
  const supabase = await createClient();

  // Run all three searches in parallel
  const [facilitiesResult, citiesResult, statesResult] = await Promise.all([
    supabase
      .from("facilities")
      .select("name, slug, city, state_abbr, state_slug, city_slug")
      .eq("status", "active")
      .ilike("name", pattern)
      .limit(4),
    supabase
      .from("cities")
      .select("name, slug, state_slug, state_name, state_abbr")
      .ilike("name", pattern)
      .gt("facility_count", 0)
      .limit(3),
    supabase
      .from("states")
      .select("name, slug")
      .ilike("name", pattern)
      .limit(2),
  ]);

  const results: AutocompleteResult[] = [];

  // Add facility results
  if (facilitiesResult.data) {
    for (const f of facilitiesResult.data) {
      results.push({
        type: "facility",
        name: f.name,
        slug: f.slug,
        subtitle: `${f.city}, ${f.state_abbr}`,
        url: `/courts/${f.state_slug}/${f.city_slug}/${f.slug}`,
      });
    }
  }

  // Add city results
  if (citiesResult.data) {
    for (const c of citiesResult.data) {
      results.push({
        type: "city",
        name: c.name,
        slug: c.slug,
        subtitle: c.state_name,
        url: `/courts/${c.state_slug}/${c.slug}`,
      });
    }
  }

  // Add state results
  if (statesResult.data) {
    for (const s of statesResult.data) {
      results.push({
        type: "state",
        name: s.name,
        slug: s.slug,
        subtitle: null,
        url: `/courts/${s.slug}`,
      });
    }
  }

  return results.slice(0, 8);
}
