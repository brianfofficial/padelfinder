import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { State } from "@/lib/types/facility";
import { DEMO_STATES } from "@/lib/demo-data";

export async function getStates() {
  if (!isSupabaseConfigured()) return DEMO_STATES;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("states")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as State[];
}

export async function getStateBySlug(slug: string) {
  if (!isSupabaseConfigured()) return DEMO_STATES.find((s) => s.slug === slug) ?? null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("states")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    return null;
  }

  return data as State;
}

export async function getStatesWithFacilities() {
  if (!isSupabaseConfigured()) return DEMO_STATES.filter((s) => s.facility_count > 0);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("states")
    .select("*")
    .gt("facility_count", 0)
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []) as State[];
}

export async function getAllStateSlugs() {
  if (!isSupabaseConfigured()) return DEMO_STATES.map((s) => ({ slug: s.slug }));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("states")
    .select("slug");

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({ slug: row.slug }));
}
