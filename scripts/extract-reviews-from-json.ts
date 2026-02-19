/**
 * Extract reviews from JSON scraper output (NDJSON format).
 * The scraper was run with -extra-reviews -json flags.
 *
 * Usage:
 *   npx tsx scripts/extract-reviews-from-json.ts
 *
 * Input:  scripts/data/scraper-reviews-raw.json (NDJSON)
 * Output: scripts/data/scraper-reviews.json (ReviewGroup[])
 *         scripts/data/review-counts-update.json
 *
 * Also updates google_review_count and google_rating on facilities in Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// -- Types --

interface ScraperReview {
  name: string;
  profile_picture?: string;
  rating: number;
  description: string;
  images?: string[];
  when: string;
}

interface ScraperEntry {
  title: string;
  category: string;
  categories?: string[];
  place_id: string;
  cid?: string;
  review_count: number;
  review_rating: number;
  reviews_per_rating?: Record<string, number>;
  user_reviews?: ScraperReview[];
  user_reviews_extended?: ScraperReview[];
  [key: string]: unknown;
}

interface ReviewGroup {
  placeId: string;
  facilityName: string;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    publishedAt: string;
    ownerResponse: string | null;
    ownerResponseDate: string | null;
    helpfulCount: number;
    reviewId: string;
  }>;
}

interface CountsUpdate {
  placeId: string;
  facilityName: string;
  googleReviewCount: number;
  googleRating: number;
  reviewsPerRating: Record<string, number>;
}

// -- Helpers --

function isPadel(entry: ScraperEntry): boolean {
  const cats = Array.isArray(entry.categories)
    ? entry.categories.join(" ")
    : "";
  const searchText =
    `${entry.title} ${entry.category} ${cats}`.toLowerCase();
  if (!searchText.includes("padel")) return false;
  if (
    searchText.includes("paddle board") ||
    searchText.includes("paddleboard")
  )
    return false;
  if (searchText.includes("paddle tennis") && !searchText.includes("padel"))
    return false;
  return true;
}

function generateReviewId(
  author: string,
  rating: number,
  text: string,
): string {
  const hash = createHash("sha256")
    .update(`${author}|${rating}|${text}`)
    .digest("hex");
  return hash.substring(0, 16);
}

function relativeToISODate(when: string): string {
  if (!when) return new Date().toISOString();

  const now = new Date();
  const lower = when.toLowerCase().trim();

  // Parse "N unit(s) ago"
  const match = lower.match(
    /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/,
  );
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    const d = new Date(now);
    switch (unit) {
      case "second":
        d.setSeconds(d.getSeconds() - amount);
        break;
      case "minute":
        d.setMinutes(d.getMinutes() - amount);
        break;
      case "hour":
        d.setHours(d.getHours() - amount);
        break;
      case "day":
        d.setDate(d.getDate() - amount);
        break;
      case "week":
        d.setDate(d.getDate() - amount * 7);
        break;
      case "month":
        d.setMonth(d.getMonth() - amount);
        break;
      case "year":
        d.setFullYear(d.getFullYear() - amount);
        break;
    }
    return d.toISOString();
  }

  // Handle "a month ago", "a year ago", "an hour ago"
  const singleMatch = lower.match(
    /^an?\s+(second|minute|hour|day|week|month|year)\s+ago$/,
  );
  if (singleMatch) {
    const unit = singleMatch[1];
    const d = new Date(now);
    switch (unit) {
      case "second":
        d.setSeconds(d.getSeconds() - 1);
        break;
      case "minute":
        d.setMinutes(d.getMinutes() - 1);
        break;
      case "hour":
        d.setHours(d.getHours() - 1);
        break;
      case "day":
        d.setDate(d.getDate() - 1);
        break;
      case "week":
        d.setDate(d.getDate() - 7);
        break;
      case "month":
        d.setMonth(d.getMonth() - 1);
        break;
      case "year":
        d.setFullYear(d.getFullYear() - 1);
        break;
    }
    return d.toISOString();
  }

  // Fallback: return now
  return now.toISOString();
}

// -- Main --

async function main() {
  const inputPath = resolve(__dirname, "data/scraper-reviews-raw.json");
  const raw = readFileSync(inputPath, "utf-8");

  // Parse NDJSON (one JSON object per line)
  const entries: ScraperEntry[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch {
      // Skip malformed lines
    }
  }

  console.log(`Parsed ${entries.length} total entries from NDJSON.`);

  // Filter padel-only
  const padelEntries = entries.filter(isPadel);
  console.log(`Filtered to ${padelEntries.length} padel-related results.`);

  // Deduplicate by place_id
  const seenPlaceIds = new Set<string>();
  const uniqueEntries: ScraperEntry[] = [];
  for (const entry of padelEntries) {
    if (entry.place_id && seenPlaceIds.has(entry.place_id)) continue;
    if (entry.place_id) seenPlaceIds.add(entry.place_id);
    uniqueEntries.push(entry);
  }
  console.log(`After dedup: ${uniqueEntries.length} unique facilities.`);

  const reviewGroups: ReviewGroup[] = [];
  const countsUpdates: CountsUpdate[] = [];
  let totalReviews = 0;

  for (const entry of uniqueEntries) {
    // Merge user_reviews + user_reviews_extended, deduplicate
    const allReviews: ScraperReview[] = [
      ...(entry.user_reviews ?? []),
      ...(entry.user_reviews_extended ?? []),
    ];

    // Deduplicate reviews by author + rating + text
    const seenReviewKeys = new Set<string>();
    const uniqueReviews: ScraperReview[] = [];
    for (const r of allReviews) {
      const key = `${r.name}|${r.rating}|${r.description}`;
      if (seenReviewKeys.has(key)) continue;
      seenReviewKeys.add(key);
      uniqueReviews.push(r);
    }

    if (uniqueReviews.length > 0) {
      const reviews = uniqueReviews
        .map((r) => ({
          author: r.name || "Google User",
          rating: Math.min(5, Math.max(1, Math.round(r.rating))),
          text: r.description || "",
          publishedAt: relativeToISODate(r.when),
          ownerResponse: null as string | null,
          ownerResponseDate: null as string | null,
          helpfulCount: 0,
          reviewId: generateReviewId(
            r.name || "",
            r.rating,
            r.description || "",
          ),
        }))
        .filter((r) => r.rating >= 1 && r.rating <= 5);

      if (reviews.length > 0) {
        reviewGroups.push({
          placeId: entry.place_id,
          facilityName: entry.title,
          reviews,
        });
        totalReviews += reviews.length;
      }
    }

    // Collect review count data for facility updates
    if (entry.review_count > 0 || entry.review_rating > 0) {
      countsUpdates.push({
        placeId: entry.place_id,
        facilityName: entry.title,
        googleReviewCount: entry.review_count || 0,
        googleRating: entry.review_rating || 0,
        reviewsPerRating: entry.reviews_per_rating ?? {},
      });
    }
  }

  console.log(`\nExtraction results:`);
  console.log(`  Facilities with reviews: ${reviewGroups.length}`);
  console.log(`  Total reviews extracted: ${totalReviews}`);
  console.log(`  Facilities with count data: ${countsUpdates.length}`);

  // Write output files
  const dataDir = resolve(__dirname, "data");
  writeFileSync(
    resolve(dataDir, "scraper-reviews.json"),
    JSON.stringify(reviewGroups, null, 2),
  );
  writeFileSync(
    resolve(dataDir, "review-counts-update.json"),
    JSON.stringify(countsUpdates, null, 2),
  );

  console.log("\nFiles written:");
  console.log("  scripts/data/scraper-reviews.json");
  console.log("  scripts/data/review-counts-update.json");

  // Update google_review_count and google_rating on facilities
  console.log("\nUpdating Google review counts on facilities...");
  let updated = 0;
  let notFound = 0;

  for (const cu of countsUpdates) {
    const { error } = await supabase
      .from("facilities")
      .update({
        google_review_count: cu.googleReviewCount,
        google_rating: cu.googleRating,
      })
      .eq("google_place_id", cu.placeId);

    if (error) {
      console.log(`  Error updating ${cu.facilityName}: ${error.message}`);
    } else {
      updated++;
    }
  }

  // Check how many actually matched (update doesn't error on 0 rows)
  console.log(`  Updated: ${updated} facilities`);
  console.log("Done.");
}

main().catch(console.error);
