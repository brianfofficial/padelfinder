/**
 * Import Google reviews from scraper data into the reviews table.
 * Auto-approves Google reviews and computes rating_distribution per facility.
 *
 * Usage:
 *   npx tsx scripts/import-reviews.ts
 *
 * Input:  scripts/data/scraper-reviews.json
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

interface ReviewEntry {
  author: string;
  rating: number;
  text: string;
  publishedAt: string;
  ownerResponse: string | null;
  ownerResponseDate: string | null;
  helpfulCount: number;
  reviewId: string;
}

interface ReviewGroup {
  placeId: string;
  facilityName: string;
  reviews: ReviewEntry[];
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

async function main() {
  const filePath = resolve(__dirname, "data/scraper-reviews.json");
  const reviewGroups: ReviewGroup[] = JSON.parse(readFileSync(filePath, "utf-8"));

  console.log(`Processing reviews for ${reviewGroups.length} facilities.\n`);

  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let facilitiesUpdated = 0;

  for (let i = 0; i < reviewGroups.length; i++) {
    const group = reviewGroups[i];
    console.log(`[${i + 1}/${reviewGroups.length}] ${group.facilityName} (${group.reviews.length} reviews)`);

    // Find the facility by place_id
    const { data: facility } = await supabase
      .from("facilities")
      .select("id")
      .eq("google_place_id", group.placeId)
      .single();

    if (!facility) {
      console.log("  Facility not found in DB — skipping.");
      totalSkipped += group.reviews.length;
      continue;
    }

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let imported = 0;

    for (const review of group.reviews) {
      if (!review.rating || review.rating < 1 || review.rating > 5) continue;

      const star = Math.min(5, Math.max(1, Math.round(review.rating)));
      distribution[String(star)]++;

      const publishedAt = parseDate(review.publishedAt);
      const ownerResponseDate = parseDate(review.ownerResponseDate ?? "");

      const { error } = await supabase.from("reviews").insert({
        facility_id: facility.id,
        rating: review.rating,
        author_name: review.author || "Google User",
        comment: null,
        skill_level: null,
        status: "approved",
        source: "google",
        source_review_id: review.reviewId,
        text: review.text || null,
        published_at: publishedAt,
        owner_response: review.ownerResponse,
        owner_response_date: ownerResponseDate,
        language: "en",
        helpful_count: review.helpfulCount || 0,
      });

      if (error) {
        // Likely duplicate — not a real error
        if (error.message.includes("duplicate") || error.code === "23505") {
          totalSkipped++;
        } else {
          console.log(`  Review error: ${error.message}`);
          totalErrors++;
        }
      } else {
        imported++;
        totalImported++;
      }
    }

    // Update rating_distribution on the facility
    const { error: distError } = await supabase
      .from("facilities")
      .update({ rating_distribution: distribution })
      .eq("id", facility.id);

    if (distError) {
      console.log(`  Distribution update error: ${distError.message}`);
    } else {
      facilitiesUpdated++;
    }

    console.log(`  Imported: ${imported}, Distribution updated`);
    await sleep(100);
  }

  console.log("\n========================================");
  console.log(`Reviews imported:      ${totalImported}`);
  console.log(`Reviews skipped/duped: ${totalSkipped}`);
  console.log(`Errors:                ${totalErrors}`);
  console.log(`Facilities updated:    ${facilitiesUpdated}`);
  console.log("========================================");
}

main().catch(console.error);
