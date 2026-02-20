import { createClient, createStaticClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import type { Facility } from "@/lib/types/facility";
import { DEMO_FACILITIES, DEMO_FACILITY_COUNT } from "@/lib/demo-data";

export async function getFacilityBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return DEMO_FACILITIES.find((f) => f.slug === slug) ?? null;
  }
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) {
    return null;
  }

  return data as Facility;
}

export async function getFacilitiesByCity(
  citySlug: string,
  stateSlug: string,
  options?: { page?: number; sort?: string; amenities?: string[]; bestFor?: string }
) {
  const page = options?.page ?? 1;

  if (!isSupabaseConfigured()) {
    const matching = DEMO_FACILITIES.filter((f) => f.city_slug === citySlug && f.state_slug === stateSlug);
    return { data: matching, count: matching.length, page, totalPages: 1 };
  }

  const sort = options?.sort ?? "rating";
  const amenities = options?.amenities ?? [];

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("facilities")
    .select("*", { count: "exact" })
    .eq("city_slug", citySlug)
    .eq("state_slug", stateSlug)
    .eq("status", "active");

  // Apply amenity filters — each is a boolean column that must be true
  for (const amenity of amenities) {
    query = query.eq(amenity, true);
  }

  // Apply best-for filter
  if (options?.bestFor) {
    query = query.contains("best_for_tags", [options.bestFor]);
  }

  // Apply sort
  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "courts":
      query = query.order("total_courts", { ascending: false });
      break;
    case "rating":
    default:
      query = query.order("avg_rating", { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { data: [], count: 0, page, totalPages: 0 };
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Facility[],
    count: total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}

export async function getFacilitiesByState(
  stateSlug: string,
  options?: { page?: number; limit?: number }
) {
  const limit = options?.limit ?? ITEMS_PER_PAGE;
  const page = options?.page ?? 1;

  if (!isSupabaseConfigured()) {
    const matching = DEMO_FACILITIES.filter((f) => f.state_slug === stateSlug);
    return { data: matching, count: matching.length, page, totalPages: 1 };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  const { data, count, error } = await supabase
    .from("facilities")
    .select("*", { count: "exact" })
    .eq("state_slug", stateSlug)
    .eq("status", "active")
    .order("avg_rating", { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], count: 0, page, totalPages: 0 };
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Facility[],
    count: total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFeaturedFacilities(limit: number = 12) {
  if (!isSupabaseConfigured()) return DEMO_FACILITIES.slice(0, limit);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("avg_rating", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as Facility[];
}

export async function getRecentFacilities(limit: number = 12) {
  if (!isSupabaseConfigured()) return DEMO_FACILITIES.slice(0, limit);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as Facility[];
}

export async function getNearbyFacilities(
  lat: number,
  lng: number,
  radiusMiles: number = 25,
  limit: number = 20
) {
  if (!isSupabaseConfigured()) return DEMO_FACILITIES.slice(0, Math.min(4, limit));
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("nearby_facilities", {
    lat,
    lng,
    radius_miles: radiusMiles,
  });

  if (error) {
    return [];
  }

  return ((data ?? []) as Facility[]).slice(0, limit);
}

export async function getAllFacilitySlugs() {
  if (!isSupabaseConfigured()) return DEMO_FACILITIES.map((f) => ({ slug: f.slug }));
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("facilities")
    .select("slug")
    .eq("status", "active");

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function getFacilityCount() {
  if (!isSupabaseConfigured()) return DEMO_FACILITY_COUNT;
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    return 0;
  }

  return count ?? 0;
}
