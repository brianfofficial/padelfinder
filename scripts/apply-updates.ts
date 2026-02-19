/**
 * Apply scraped data updates to existing facilities.
 * Updates google_place_id, google_cid, google_rating, google_review_count,
 * rating_distribution, and verification_status for matched facilities.
 *
 * Usage:
 *   npx tsx scripts/apply-updates.ts
 *
 * Input:  scripts/data/matched-updates.json
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

function parseRatingDistribution(raw: string): Record<string, number> | null {
  if (!raw) return null;
  try {
    // Format: "1:5,2:3,3:10,4:25,5:80" or JSON
    if (raw.startsWith("{")) return JSON.parse(raw);
    const result: Record<string, number> = {};
    for (const pair of raw.split(",")) {
      const [star, count] = pair.split(":");
      if (star && count) result[star.trim()] = parseInt(count.trim(), 10);
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

async function main() {
  const filePath = resolve(__dirname, "data/matched-updates.json");
  const updates = JSON.parse(readFileSync(filePath, "utf-8"));

  console.log(`Processing ${updates.length} matched facility updates.\n`);

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i++) {
    const { facilityId, facilityName, scraperData } = updates[i];
    console.log(`[${i + 1}/${updates.length}] ${facilityName}`);

    const updatePayload: Record<string, unknown> = {};

    // Google identifiers
    if (scraperData.place_id) {
      updatePayload.google_place_id = scraperData.place_id;
    }
    if (scraperData.cid) {
      updatePayload.google_cid = scraperData.cid;
    }

    // Ratings
    if (scraperData.review_rating) {
      updatePayload.google_rating = parseFloat(scraperData.review_rating);
    }
    if (scraperData.review_count) {
      updatePayload.google_review_count = parseInt(scraperData.review_count, 10);
    }

    // Rating distribution
    const dist = parseRatingDistribution(scraperData.reviews_per_rating);
    if (dist) {
      updatePayload.rating_distribution = dist;
    }

    // Verification
    updatePayload.verification_status = "verified";
    updatePayload.verified_at = new Date().toISOString();
    updatePayload.data_source = "google_maps_scraper";

    // Phone update if missing and scraper has one
    if (scraperData.phone) {
      // Only update if we don't have a phone already
      const { data: current } = await supabase
        .from("facilities")
        .select("phone")
        .eq("id", facilityId)
        .single();

      if (current && !current.phone) {
        updatePayload.phone = scraperData.phone;
      }
    }

    const { error } = await supabase
      .from("facilities")
      .update(updatePayload)
      .eq("id", facilityId);

    if (error) {
      console.log(`  Error: ${error.message}`);
      errors++;
    } else {
      console.log(`  Updated (place_id: ${scraperData.place_id})`);
      updated++;
    }

    await sleep(100);
  }

  console.log("\n========================================");
  console.log(`Updated:  ${updated}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Total:    ${updates.length}`);
  console.log("========================================");
}

main().catch(console.error);
