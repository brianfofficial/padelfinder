import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [facilitiesRes, citiesRes, statesRes] = await Promise.all([
    supabase
      .from("facilities")
      .select("slug, name, city, state_abbr")
      .eq("status", "active")
      .ilike("name", pattern)
      .limit(4),
    supabase
      .from("cities")
      .select("slug, name, state_slug, state_abbr")
      .ilike("name", pattern)
      .limit(3),
    supabase
      .from("states")
      .select("slug, name")
      .ilike("name", pattern)
      .limit(2),
  ]);

  const results = [
    ...(facilitiesRes.data || []).map((f) => ({
      type: "facility" as const,
      name: f.name,
      slug: f.slug,
      extra: `${f.city}, ${f.state_abbr}`,
      url: `/courts/${f.slug}`,
    })),
    ...(citiesRes.data || []).map((c) => ({
      type: "city" as const,
      name: c.name,
      slug: c.slug,
      extra: c.state_abbr,
      url: `/states/${c.state_slug}/${c.slug}`,
    })),
    ...(statesRes.data || []).map((s) => ({
      type: "state" as const,
      name: s.name,
      slug: s.slug,
      url: `/states/${s.slug}`,
    })),
  ];

  return NextResponse.json(results.slice(0, 8));
}
