/**
 * Process raw Google Maps scraper CSV output.
 * Parses CSV, filters padel-only results, matches against existing facilities,
 * and produces intermediate JSON files for the next scripts.
 *
 * Usage:
 *   npx tsx scripts/process-scraper-data.ts
 *
 * Input:  scripts/data/scraper-raw.csv
 * Output: scripts/data/matched-updates.json
 *         scripts/data/new-facilities.json
 *         scripts/data/scraper-reviews.json
 */

import { createClient } from "@supabase/supabase-js";
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

interface ScraperRow {
  title: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  review_rating: string;
  review_count: string;
  latitude: string;
  longitude: string;
  place_id: string;
  cid: string;
  status: string;
  descriptions: string;
  reviews_per_rating: string;
  user_reviews: string;
  [key: string]: string;
}

interface MatchedUpdate {
  facilityId: string;
  facilityName: string;
  scraperData: ScraperRow;
}

interface NewFacility {
  scraperData: ScraperRow;
}

interface ScraperReview {
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

/** Simple CSV parser that handles quoted fields */
function parseCSV(content: string): ScraperRow[] {
  const lines = content.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: ScraperRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row as unknown as ScraperRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());

  return fields;
}

function isPadel(row: ScraperRow): boolean {
  const searchText = `${row.title} ${row.category} ${row.categories}`.toLowerCase();
  // Must contain "padel" but not be a paddle board or paddleboard place
  if (!searchText.includes("padel")) return false;
  if (searchText.includes("paddle board") || searchText.includes("paddleboard")) return false;
  if (searchText.includes("paddle tennis") && !searchText.includes("padel")) return false;
  return true;
}

function normalizeForMatch(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function nameSimilarity(a: string, b: string): number {
  const wordsA = normalizeForMatch(a).split(" ");
  const wordsB = normalizeForMatch(b).split(" ");
  const matches = wordsA.filter((w) => wordsB.includes(w)).length;
  return matches / Math.max(wordsA.length, wordsB.length);
}

function parseReviews(raw: string): ScraperReview["reviews"] {
  if (!raw || raw === "[]") return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((r: Record<string, unknown>) => ({
      author: String(r.name ?? r.author ?? "Anonymous"),
      rating: Number(r.rating ?? 0),
      text: String(r.text ?? r.snippet ?? ""),
      publishedAt: String(r.published_at ?? r.date ?? r.time ?? ""),
      ownerResponse: r.owner_response ? String(r.owner_response) : null,
      ownerResponseDate: r.owner_response_date ? String(r.owner_response_date) : null,
      helpfulCount: Number(r.likes ?? r.helpful_count ?? 0),
      reviewId: String(r.review_id ?? r.id ?? `${r.name}-${r.rating}-${Date.now()}`),
    }));
  } catch {
    return [];
  }
}

async function main() {
  // Read scraper output
  const csvPath = resolve(__dirname, "data/scraper-raw.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const allRows = parseCSV(csvContent);
  console.log(`Parsed ${allRows.length} total rows from CSV.`);

  // Filter to padel-only
  const padelRows = allRows.filter(isPadel);
  console.log(`Filtered to ${padelRows.length} padel-related results.`);

  // Deduplicate by place_id
  const seenPlaceIds = new Set<string>();
  const uniqueRows: ScraperRow[] = [];
  for (const row of padelRows) {
    if (row.place_id && seenPlaceIds.has(row.place_id)) continue;
    if (row.place_id) seenPlaceIds.add(row.place_id);
    uniqueRows.push(row);
  }
  console.log(`After dedup: ${uniqueRows.length} unique facilities.`);

  // Fetch existing facilities
  const { data: existing, error } = await supabase
    .from("facilities")
    .select("id, name, slug, city, state, zip_code, google_place_id")
    .eq("status", "active");

  if (error) {
    console.error("Failed to fetch existing facilities:", error.message);
    process.exit(1);
  }

  console.log(`Found ${existing.length} existing facilities in DB.`);

  const matchedUpdates: MatchedUpdate[] = [];
  const newFacilities: NewFacility[] = [];
  const allReviews: ScraperReview[] = [];

  for (const row of uniqueRows) {
    // Try matching by google_place_id first
    let match = existing.find(
      (f) => f.google_place_id && f.google_place_id === row.place_id,
    );

    // Then by name similarity + same city/state
    if (!match) {
      const rowCity = (row.address ?? "").toLowerCase();
      match = existing.find((f) => {
        const sim = nameSimilarity(f.name, row.title);
        const sameArea = rowCity.includes(f.city.toLowerCase());
        return sim >= 0.5 && sameArea;
      });
    }

    // Then by zip + partial name
    if (!match) {
      const zipMatch = (row.address ?? "").match(/\b(\d{5})\b/);
      if (zipMatch) {
        match = existing.find((f) => {
          return f.zip_code === zipMatch[1] && nameSimilarity(f.name, row.title) >= 0.3;
        });
      }
    }

    if (match) {
      matchedUpdates.push({
        facilityId: match.id,
        facilityName: match.name,
        scraperData: row,
      });
    } else {
      newFacilities.push({ scraperData: row });
    }

    // Extract reviews regardless
    const reviews = parseReviews(row.user_reviews);
    if (reviews.length > 0) {
      allReviews.push({
        placeId: row.place_id,
        facilityName: row.title,
        reviews,
      });
    }
  }

  console.log(`\nResults:`);
  console.log(`  Matched existing: ${matchedUpdates.length}`);
  console.log(`  New discoveries:  ${newFacilities.length}`);
  console.log(`  Facilities with reviews: ${allReviews.length}`);
  console.log(`  Total reviews: ${allReviews.reduce((s, r) => s + r.reviews.length, 0)}`);

  // Write outputs
  const dataDir = resolve(__dirname, "data");
  writeFileSync(
    resolve(dataDir, "matched-updates.json"),
    JSON.stringify(matchedUpdates, null, 2),
  );
  writeFileSync(
    resolve(dataDir, "new-facilities.json"),
    JSON.stringify(newFacilities, null, 2),
  );
  writeFileSync(
    resolve(dataDir, "scraper-reviews.json"),
    JSON.stringify(allReviews, null, 2),
  );

  console.log("\nFiles written:");
  console.log("  scripts/data/matched-updates.json");
  console.log("  scripts/data/new-facilities.json");
  console.log("  scripts/data/scraper-reviews.json");
}

main().catch(console.error);
