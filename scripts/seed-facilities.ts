/**
 * Seed facilities from a JSON file into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-facilities.ts
 *
 * Expects:
 *   - scripts/data/facilities.json (array of facility objects)
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local (Node 20.12+)
process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface RawFacility {
  name: string;
  address: string;
  city: string;
  state: string;
  state_abbr: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  total_courts?: number;
  indoor_court_count?: number;
  outdoor_court_count?: number;
  surface_type?: string;
  description?: string;
  // Amenities
  indoor_courts?: boolean;
  outdoor_courts?: boolean;
  panoramic_glass?: boolean;
  led_lighting?: boolean;
  pro_shop?: boolean;
  equipment_rental?: boolean;
  coaching?: boolean;
  tournaments?: boolean;
  leagues?: boolean;
  open_play?: boolean;
  locker_rooms?: boolean;
  parking?: boolean;
  food_beverage?: boolean;
  wheelchair_accessible?: boolean;
  kids_programs?: boolean;
  // Pricing
  price_per_hour_cents?: number;
  price_peak_cents?: number;
  membership_available?: boolean;
  // Hours
  hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  // Images
  images?: string[];
  // Status
  is_featured?: boolean;
}

async function main() {
  const dataPath = resolve(__dirname, "data/facilities.json");
  let facilities: RawFacility[];

  try {
    const raw = readFileSync(dataPath, "utf-8");
    facilities = JSON.parse(raw);
  } catch {
    console.error(`Could not read ${dataPath}`);
    console.log("Create scripts/data/facilities.json with your facility data.");
    process.exit(1);
  }

  console.log(`Found ${facilities.length} facilities to seed.`);

  let inserted = 0;
  let errors = 0;

  for (const f of facilities) {
    const stateSlug = slugify(f.state);
    const citySlug = slugify(f.city);
    const slug = slugify(f.name);

    const { error } = await supabase.from("facilities").upsert(
      {
        slug,
        name: f.name,
        description: f.description || null,
        address: f.address,
        city: f.city,
        city_slug: citySlug,
        state: f.state,
        state_slug: stateSlug,
        state_abbr: f.state_abbr,
        zip_code: f.zip_code,
        latitude: f.latitude,
        longitude: f.longitude,
        phone: f.phone || null,
        email: f.email || null,
        website: f.website || null,
        total_courts: f.total_courts || 0,
        indoor_court_count: f.indoor_court_count || 0,
        outdoor_court_count: f.outdoor_court_count || 0,
        surface_type: f.surface_type || null,
        indoor_courts: f.indoor_courts || false,
        outdoor_courts: f.outdoor_courts || false,
        panoramic_glass: f.panoramic_glass || false,
        led_lighting: f.led_lighting || false,
        pro_shop: f.pro_shop || false,
        equipment_rental: f.equipment_rental || false,
        coaching: f.coaching || false,
        tournaments: f.tournaments || false,
        leagues: f.leagues || false,
        open_play: f.open_play || false,
        locker_rooms: f.locker_rooms || false,
        parking: f.parking || false,
        food_beverage: f.food_beverage || false,
        wheelchair_accessible: f.wheelchair_accessible || false,
        kids_programs: f.kids_programs || false,
        price_per_hour_cents: f.price_per_hour_cents || null,
        price_peak_cents: f.price_peak_cents || null,
        membership_available: f.membership_available || false,
        hours: f.hours || null,
        images: f.images || [],
        status: "active",
        is_featured: f.is_featured || false,
      },
      { onConflict: "slug,state_slug" }
    );

    if (error) {
      console.error(`Error inserting "${f.name}":`, error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${errors} errors.`);

  // Recalculate facility counts
  console.log("Recalculating facility counts...");
  const { error: rpcError } = await supabase.rpc("recalculate_facility_counts");
  if (rpcError) {
    console.error("Failed to recalculate counts:", rpcError.message);
  } else {
    console.log("Facility counts updated.");
  }
}

main().catch(console.error);
