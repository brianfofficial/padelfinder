/**
 * Find padel facilities missing from PadelFinder by searching Google Maps via SerpAPI.
 * Cross-references results against existing facilities by google_place_id and slug.
 *
 * Outputs new discoveries to scripts/data/new-facilities.json for import via add-new-facilities.ts.
 *
 * Usage:
 *   npx tsx scripts/find-new-facilities.ts [--limit N]
 *
 * Expects in .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SERPAPI_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serpApiKey = process.env.SERPAPI_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!serpApiKey) {
  console.error("Missing SERPAPI_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// Search queries targeting cities/states where we might be missing facilities
const SEARCH_QUERIES = [
  // Major metros
  "padel courts Miami FL",
  "padel courts New York NY",
  "padel courts Los Angeles CA",
  "padel courts Houston TX",
  "padel courts Chicago IL",
  "padel courts Dallas TX",
  "padel courts Phoenix AZ",
  "padel courts San Diego CA",
  "padel courts San Francisco CA",
  "padel courts Austin TX",
  "padel courts Denver CO",
  "padel courts Atlanta GA",
  "padel courts Nashville TN",
  "padel courts Boston MA",
  "padel courts Orlando FL",
  "padel courts Las Vegas NV",
  // States with potential gaps
  "padel courts North Carolina",
  "padel courts Virginia",
  "padel courts Washington state",
  "padel courts Oregon",
  "padel courts Minnesota",
  "padel courts Michigan",
  "padel courts Maryland",
  "padel courts Utah",
  "padel courts Connecticut",
  "padel courts South Carolina",
  // Alternate search terms
  "padel tennis courts USA",
  "padel club near me United States",
];

interface SerpLocalResult {
  place_id?: string;
  data_id?: string;
  title: string;
  rating?: number;
  reviews?: number;
  reviews_original?: string;
  address?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  phone?: string;
  website?: string;
  thumbnail?: string;
  type?: string;
  description?: string;
}

interface NewFacilityDiscovery {
  scraperData: {
    title: string;
    address: string;
    latitude: string;
    longitude: string;
    phone: string;
    website: string;
    place_id: string;
    cid: string;
    review_rating: string;
    review_count: string;
    descriptions: string;
  };
  searchQuery: string;
}

async function searchGoogleMaps(query: string): Promise<SerpLocalResult[]> {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: query,
    api_key: serpApiKey,
    type: "search",
    num: "20",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`  SerpAPI error (${res.status}): ${text.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  return (data.local_results ?? []) as SerpLocalResult[];
}

function isPadelFacility(result: SerpLocalResult): boolean {
  const title = result.title.toLowerCase();
  const desc = (result.description ?? "").toLowerCase();
  const type = (result.type ?? "").toLowerCase();

  // Must contain "padel" somewhere
  const hasPadel =
    title.includes("padel") ||
    desc.includes("padel") ||
    type.includes("padel");

  // Exclude non-facility results
  const isExcluded =
    title.includes("supply") ||
    title.includes("store") ||
    title.includes("shop only") ||
    type.includes("sporting goods");

  return hasPadel && !isExcluded;
}

async function main() {
  // 1. Load all existing facilities' place_ids and slugs
  console.log("Loading existing facilities...");
  const { data: existing, error } = await supabase
    .from("facilities")
    .select("google_place_id, slug, name")
    .eq("status", "active");

  if (error) {
    console.error("Error loading facilities:", error.message);
    process.exit(1);
  }

  const existingPlaceIds = new Set(
    existing.filter((f) => f.google_place_id).map((f) => f.google_place_id)
  );
  const existingSlugs = new Set(existing.map((f) => f.slug));
  const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));

  console.log(`Loaded ${existing.length} existing facilities.`);
  console.log(`  ${existingPlaceIds.size} with place IDs`);
  console.log(`  ${existingSlugs.size} unique slugs\n`);

  // 2. Search and collect new facilities
  const discoveries: NewFacilityDiscovery[] = [];
  const seenPlaceIds = new Set<string>();

  const queriesToRun = SEARCH_QUERIES.slice(0, limit);

  for (let i = 0; i < queriesToRun.length; i++) {
    const query = queriesToRun[i];
    console.log(`[${i + 1}/${queriesToRun.length}] "${query}"`);

    const results = await searchGoogleMaps(query);
    console.log(`  ${results.length} results`);

    for (const r of results) {
      if (!isPadelFacility(r)) continue;
      if (!r.place_id) continue;

      // Skip if already in our database
      if (existingPlaceIds.has(r.place_id)) continue;

      // Skip if we already found this in another search
      if (seenPlaceIds.has(r.place_id)) continue;

      // Skip if slug would collide
      const slug = slugify(r.title);
      if (existingSlugs.has(slug)) continue;

      // Skip if name matches (case-insensitive)
      if (existingNames.has(r.title.toLowerCase())) continue;

      seenPlaceIds.add(r.place_id);

      const lat = r.gps_coordinates?.latitude ?? 0;
      const lng = r.gps_coordinates?.longitude ?? 0;

      discoveries.push({
        scraperData: {
          title: r.title,
          address: r.address ?? "",
          latitude: String(lat),
          longitude: String(lng),
          phone: r.phone ?? "",
          website: r.website ?? "",
          place_id: r.place_id,
          cid: r.data_id ?? "",
          review_rating: String(r.rating ?? ""),
          review_count: String(r.reviews ?? 0),
          descriptions: r.description ?? "",
        },
        searchQuery: query,
      });

      console.log(`  NEW: ${r.title} (${r.address?.split(",").slice(-2).join(",").trim()})`);
    }

    await sleep(1500); // Rate limit SerpAPI
  }

  // 3. Write discoveries to file
  const outPath = resolve(__dirname, "data/new-facilities.json");
  writeFileSync(outPath, JSON.stringify(discoveries, null, 2));

  console.log("\n========================================");
  console.log(`Total searches: ${queriesToRun.length}`);
  console.log(`New discoveries: ${discoveries.length}`);
  console.log(`Output: ${outPath}`);
  console.log("========================================");

  if (discoveries.length > 0) {
    console.log("\nNext steps:");
    console.log("  1. Review scripts/data/new-facilities.json");
    console.log("  2. Run: npx tsx scripts/add-new-facilities.ts");
    console.log("  3. Run: npx tsx scripts/enrich-facilities.ts");
  }
}

main().catch(console.error);
