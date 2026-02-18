import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { City } from "@/lib/types/facility";
import { DEMO_CITIES } from "@/lib/demo-data";

export async function getCitiesByState(stateSlug: string) {
  if (!isSupabaseConfigured()) return DEMO_CITIES.filter((c) => c.state_slug === stateSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("state_slug", stateSlug)
    .order("facility_count", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as City[];
}

export async function getCityBySlug(citySlug: string, stateSlug: string) {
  if (!isSupabaseConfigured()) return DEMO_CITIES.find((c) => c.slug === citySlug && c.state_slug === stateSlug) ?? null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", citySlug)
    .eq("state_slug", stateSlug)
    .single();

  if (error) {
    return null;
  }

  return data as City;
}

export async function getCitiesWithFacilities() {
  if (!isSupabaseConfigured()) return DEMO_CITIES.filter((c) => c.facility_count > 0);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .gt("facility_count", 0)
    .order("facility_count", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as City[];
}

export async function getAllCitySlugs() {
  if (!isSupabaseConfigured()) return DEMO_CITIES.map((c) => ({ citySlug: c.slug, stateSlug: c.state_slug }));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("slug, state_slug");

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({
    citySlug: row.slug,
    stateSlug: row.state_slug,
  }));
}

export async function getFeaturedCities(limit: number = 12) {
  if (!isSupabaseConfigured()) return DEMO_CITIES.slice(0, limit);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .gt("facility_count", 0)
    .order("facility_count", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as City[];
}
