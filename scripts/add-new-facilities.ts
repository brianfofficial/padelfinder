/**
 * Insert new padel facilities discovered by the scraper.
 * Creates missing cities/states, inserts facilities, and recalculates counts.
 *
 * Usage:
 *   npx tsx scripts/add-new-facilities.ts
 *
 * Input:  scripts/data/new-facilities.json
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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

// US state abbreviation => full name mapping
const STATE_MAP: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

const ABBR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_MAP).map(([k, v]) => [v.toLowerCase(), k]),
);

interface ParsedAddress {
  city: string;
  stateAbbr: string;
  stateName: string;
  zipCode: string;
}

function parseAddress(address: string): ParsedAddress | null {
  // Try format: "123 Main St, City, STATE ZIP, Country"
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length < 3) return null;

  // Work backwards — last might be country, second-to-last is state + zip
  let stateZipPart = "";
  let cityPart = "";

  // Try to find state abbreviation in the parts
  for (let i = parts.length - 1; i >= 1; i--) {
    const match = parts[i].match(/\b([A-Z]{2})\s+(\d{5})/);
    if (match) {
      stateZipPart = parts[i];
      cityPart = parts[i - 1];
      break;
    }
  }

  if (!stateZipPart) {
    // Fallback: try second-to-last part
    const candidate = parts[parts.length - 2] ?? parts[parts.length - 1];
    const match = candidate.match(/\b([A-Z]{2})\b.*?(\d{5})/);
    if (match) {
      stateZipPart = candidate;
      cityPart = parts.length >= 3 ? parts[parts.length - 3] : parts[0];
    }
  }

  if (!stateZipPart || !cityPart) return null;

  const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/);
  const zipMatch = stateZipPart.match(/\b(\d{5})\b/);

  if (!stateMatch) return null;

  const stateAbbr = stateMatch[1];
  const stateName = STATE_MAP[stateAbbr];
  if (!stateName) return null;

  return {
    city: cityPart,
    stateAbbr,
    stateName,
    zipCode: zipMatch?.[1] ?? "",
  };
}

async function ensureState(
  name: string,
  abbr: string,
  lat: number,
  lng: number,
): Promise<string> {
  const slug = slugify(name);

  const { data: existing } = await supabase
    .from("states")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("states")
    .insert({
      name,
      slug,
      abbreviation: abbr,
      latitude: lat,
      longitude: lng,
      description: `Find padel courts and facilities in ${name}.`,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  Failed to create state ${name}: ${error.message}`);
    // Try to fetch again in case of race condition
    const { data: retry } = await supabase
      .from("states")
      .select("id")
      .eq("slug", slug)
      .single();
    return retry?.id ?? "";
  }

  console.log(`  Created state: ${name}`);
  return inserted.id;
}

async function ensureCity(
  name: string,
  stateId: string,
  stateSlug: string,
  stateName: string,
  stateAbbr: string,
  lat: number,
  lng: number,
): Promise<string> {
  const slug = slugify(name);

  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", slug)
    .eq("state_slug", stateSlug)
    .single();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from("cities")
    .insert({
      state_id: stateId,
      name,
      slug,
      state_slug: stateSlug,
      state_name: stateName,
      state_abbr: stateAbbr,
      latitude: lat,
      longitude: lng,
      description: `Find padel courts and facilities in ${name}, ${stateAbbr}.`,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  Failed to create city ${name}: ${error.message}`);
    const { data: retry } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", slug)
      .eq("state_slug", stateSlug)
      .single();
    return retry?.id ?? "";
  }

  console.log(`  Created city: ${name}, ${stateAbbr}`);
  return inserted.id;
}

async function main() {
  const filePath = resolve(__dirname, "data/new-facilities.json");
  const newFacilities = JSON.parse(readFileSync(filePath, "utf-8"));

  console.log(`Processing ${newFacilities.length} new facility discoveries.\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < newFacilities.length; i++) {
    const { scraperData } = newFacilities[i];
    console.log(`[${i + 1}/${newFacilities.length}] ${scraperData.title}`);

    // Parse address to extract city/state
    const parsed = parseAddress(scraperData.address);
    if (!parsed) {
      console.log(`  Skipping: could not parse address "${scraperData.address}"`);
      skipped++;
      continue;
    }

    const lat = parseFloat(scraperData.latitude);
    const lng = parseFloat(scraperData.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      console.log("  Skipping: invalid coordinates");
      skipped++;
      continue;
    }

    const stateSlug = slugify(parsed.stateName);

    // Ensure state and city exist
    const stateId = await ensureState(parsed.stateName, parsed.stateAbbr, lat, lng);
    if (!stateId) {
      console.log("  Skipping: could not create/find state");
      skipped++;
      continue;
    }

    await ensureCity(
      parsed.city,
      stateId,
      stateSlug,
      parsed.stateName,
      parsed.stateAbbr,
      lat,
      lng,
    );

    // Check for duplicate by place_id or name+city
    const facilitySlug = slugify(scraperData.title);
    const { data: existingSlug } = await supabase
      .from("facilities")
      .select("id")
      .eq("slug", facilitySlug)
      .single();

    if (existingSlug) {
      console.log(`  Skipping: slug "${facilitySlug}" already exists`);
      skipped++;
      continue;
    }

    // Insert facility
    const facilityData = {
      slug: facilitySlug,
      name: scraperData.title,
      description: scraperData.descriptions || null,
      address: scraperData.address.split(",")[0] ?? scraperData.address,
      city: parsed.city,
      city_slug: slugify(parsed.city),
      state: parsed.stateName,
      state_slug: stateSlug,
      state_abbr: parsed.stateAbbr,
      zip_code: parsed.zipCode,
      latitude: lat,
      longitude: lng,
      phone: scraperData.phone || null,
      email: null,
      website: scraperData.website || null,
      total_courts: 0,
      indoor_court_count: 0,
      outdoor_court_count: 0,
      surface_type: null,
      indoor_courts: false,
      outdoor_courts: false,
      panoramic_glass: false,
      led_lighting: false,
      pro_shop: false,
      equipment_rental: false,
      coaching: false,
      tournaments: false,
      leagues: false,
      open_play: false,
      locker_rooms: false,
      parking: false,
      food_beverage: false,
      wheelchair_accessible: false,
      kids_programs: false,
      price_per_hour_cents: null,
      price_peak_cents: null,
      membership_available: false,
      hours: null,
      images: [],
      google_place_id: scraperData.place_id || null,
      google_rating: scraperData.review_rating ? parseFloat(scraperData.review_rating) : null,
      google_review_count: scraperData.review_count ? parseInt(scraperData.review_count, 10) : 0,
      verified_at: new Date().toISOString(),
      verification_status: "verified",
      website_live: null,
      data_source: "google_maps_scraper",
      google_cid: scraperData.cid || null,
      rating_distribution: null,
      meta_title: null,
      meta_description: null,
      is_featured: false,
    };

    const { error } = await supabase.from("facilities").insert(facilityData);

    if (error) {
      console.log(`  Error: ${error.message}`);
      errors++;
    } else {
      console.log(`  Inserted: ${parsed.city}, ${parsed.stateAbbr}`);
      inserted++;
    }

    await sleep(100);
  }

  // Recalculate facility counts
  console.log("\nRecalculating facility counts...");
  const { error: rpcError } = await supabase.rpc("recalculate_facility_counts");
  if (rpcError) {
    console.error("Failed to recalculate counts:", rpcError.message);
  } else {
    console.log("Counts recalculated.");
  }

  console.log("\n========================================");
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Total:    ${newFacilities.length}`);
  console.log("========================================");
}

main().catch(console.error);
