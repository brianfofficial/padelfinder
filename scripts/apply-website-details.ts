/**
 * Apply website-scraped details to Supabase.
 * Fills in: total_courts, surface_type, indoor_courts, outdoor_courts,
 * price_per_hour_cents, price_peak_cents where missing.
 *
 * Usage:
 *   npx tsx scripts/apply-website-details.ts [--overwrite]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const overwrite = process.argv.includes("--overwrite");

interface WebsiteDetails {
  facilityId: string;
  facilityName: string;
  website: string;
  totalCourts: number | null;
  indoorCourts: number | null;
  outdoorCourts: number | null;
  surfaceType: string | null;
  pricing: string | null;
  pricePerHourCents: number | null;
  pricePeakCents: number | null;
  amenities: string[];
  rawExcerpts: string[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const detailsPath = resolve(__dirname, "data/website-details.json");
  const details: WebsiteDetails[] = JSON.parse(readFileSync(detailsPath, "utf-8"));

  console.log(`Loaded ${details.length} website scrape results.`);
  console.log(`Mode: ${overwrite ? "OVERWRITE" : "fill-gaps-only"}\n`);

  // Build lookup
  const byId = new Map<string, WebsiteDetails>();
  for (const d of details) {
    byId.set(d.facilityId, d);
  }

  // Fetch facilities
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, total_courts, surface_type, indoor_courts, outdoor_courts, indoor_court_count, outdoor_court_count, price_per_hour_cents, price_peak_cents")
    .eq("status", "active")
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let courtsAdded = 0;
  let surfaceAdded = 0;
  let pricingAdded = 0;

  for (const f of facilities) {
    const scraped = byId.get(f.id);
    if (!scraped) {
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {};

    // Courts
    // DB schema: total_courts (int), indoor_court_count (int), outdoor_court_count (int),
    //            indoor_courts (bool), outdoor_courts (bool)
    if (scraped.totalCourts && scraped.totalCourts > 0 && scraped.totalCourts <= 50) {
      if (!f.total_courts || overwrite) {
        payload.total_courts = scraped.totalCourts;
        if (scraped.indoorCourts != null && scraped.indoorCourts > 0) {
          payload.indoor_court_count = scraped.indoorCourts;
          payload.indoor_courts = true;
        }
        if (scraped.outdoorCourts != null && scraped.outdoorCourts > 0) {
          payload.outdoor_court_count = scraped.outdoorCourts;
          payload.outdoor_courts = true;
        }
        courtsAdded++;
      }
    }

    // Surface
    if (scraped.surfaceType) {
      if (!f.surface_type || overwrite) {
        payload.surface_type = scraped.surfaceType;
        surfaceAdded++;
      }
    }

    // Pricing
    if (scraped.pricePerHourCents && scraped.pricePerHourCents > 0) {
      if (!f.price_per_hour_cents || overwrite) {
        payload.price_per_hour_cents = scraped.pricePerHourCents;
        if (scraped.pricePeakCents) {
          payload.price_peak_cents = scraped.pricePeakCents;
        }
        pricingAdded++;
      }
    }

    if (Object.keys(payload).length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("facilities")
      .update(payload)
      .eq("id", f.id);

    if (updateError) {
      console.log(`  Error updating ${f.name}: ${updateError.message}`);
      errors++;
    } else {
      console.log(`  ${f.name}: ${Object.keys(payload).join(", ")}`);
      updated++;
    }

    await sleep(50);
  }

  console.log("\n========================================");
  console.log(`Updated:         ${updated}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Courts added:    ${courtsAdded}`);
  console.log(`Surface added:   ${surfaceAdded}`);
  console.log(`Pricing added:   ${pricingAdded}`);
  console.log("========================================");
}

main().catch(console.error);
