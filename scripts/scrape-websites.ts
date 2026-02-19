/**
 * Scrape facility websites for court-specific details:
 * - Number of courts
 * - Surface type (artificial grass, concrete, etc.)
 * - Indoor/outdoor
 * - Pricing
 *
 * Uses simple HTTP fetch (no browser needed) with HTML parsing.
 *
 * Output: scripts/data/website-details.json
 *
 * Usage:
 *   npx tsx scripts/scrape-websites.ts [--limit N]
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const OUTPUT_PATH = resolve(__dirname, "data/website-details.json");

// ─── Types ───────────────────────────────────────────────────────────

interface WebsiteDetails {
  facilityId: string;
  facilityName: string;
  website: string;
  totalCourts: number | null;
  indoorCourts: number | null;
  outdoorCourts: number | null;
  surfaceType: string | null;
  pricing: string | null; // raw pricing text
  pricePerHourCents: number | null;
  pricePeakCents: number | null;
  amenities: string[];
  rawExcerpts: string[]; // text snippets that led to extraction
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    return html;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractContext(text: string, pattern: RegExp, windowSize = 100): string[] {
  const contexts: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");

  while ((match = re.exec(text)) !== null) {
    const start = Math.max(0, match.index - windowSize);
    const end = Math.min(text.length, match.index + match[0].length + windowSize);
    contexts.push(text.slice(start, end).trim());
  }

  return contexts;
}

function extractCourts(text: string): {
  total: number | null;
  indoor: number | null;
  outdoor: number | null;
  excerpts: string[];
} {
  const excerpts: string[] = [];
  let total: number | null = null;
  let indoor: number | null = null;
  let outdoor: number | null = null;

  // "X padel courts", "X courts"
  const courtPatterns = [
    /(\d+)\s*(?:padel\s+)?courts?/gi,
    /(\d+)\s*indoor\s*(?:padel\s+)?courts?/gi,
    /(\d+)\s*outdoor\s*(?:padel\s+)?courts?/gi,
  ];

  // Total courts
  const totalMatches = text.matchAll(courtPatterns[0]);
  for (const m of totalMatches) {
    const n = parseInt(m[1]);
    if (n > 0 && n <= 50) {
      if (total === null || n > total) total = n;
      excerpts.push(...extractContext(text, new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")));
    }
  }

  // Indoor courts
  const indoorMatches = text.matchAll(courtPatterns[1]);
  for (const m of indoorMatches) {
    const n = parseInt(m[1]);
    if (n > 0 && n <= 50) {
      indoor = n;
      excerpts.push(...extractContext(text, new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")));
    }
  }

  // Outdoor courts
  const outdoorMatches = text.matchAll(courtPatterns[2]);
  for (const m of outdoorMatches) {
    const n = parseInt(m[1]);
    if (n > 0 && n <= 50) {
      outdoor = n;
      excerpts.push(...extractContext(text, new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")));
    }
  }

  // "indoor" / "outdoor" mentions without numbers
  if (indoor === null && /indoor/i.test(text) && !/outdoor/i.test(text)) {
    indoor = total;
    outdoor = 0;
  }
  if (outdoor === null && /outdoor/i.test(text) && !/indoor/i.test(text)) {
    outdoor = total;
    indoor = 0;
  }

  return { total, indoor, outdoor, excerpts };
}

function extractSurface(text: string): { surface: string | null; excerpts: string[] } {
  const excerpts: string[] = [];
  const surfaces = [
    { pattern: /artificial\s*(?:grass|turf)/i, name: "Artificial Grass" },
    { pattern: /panoramic\s*glass/i, name: "Glass Court" },
    { pattern: /synthetic\s*turf/i, name: "Synthetic Turf" },
    { pattern: /artificial\s*turf/i, name: "Artificial Turf" },
    { pattern: /astroturf/i, name: "Artificial Turf" },
    { pattern: /concrete\s*(?:court|surface)?/i, name: "Concrete" },
    { pattern: /hard\s*court/i, name: "Hard Court" },
  ];

  for (const { pattern, name } of surfaces) {
    if (pattern.test(text)) {
      excerpts.push(...extractContext(text, pattern));
      return { surface: name, excerpts };
    }
  }

  return { surface: null, excerpts };
}

function extractPricing(text: string): {
  rawPricing: string | null;
  perHourCents: number | null;
  peakCents: number | null;
  excerpts: string[];
} {
  const excerpts: string[] = [];

  // "$XX/hour", "$XX per hour", "$XX/hr"
  const pricePatterns = [
    /\$(\d+(?:\.\d{2})?)\s*(?:\/|\s*per\s*)\s*(?:hour|hr|h)\b/gi,
    /\$(\d+(?:\.\d{2})?)\s*(?:\/|\s*per\s*)\s*(?:90|60)\s*min/gi,
    /(?:from|starting\s*at|as\s*low\s*as)\s*\$(\d+(?:\.\d{2})?)/gi,
    /court\s*rental[:\s]*\$(\d+(?:\.\d{2})?)/gi,
  ];

  const prices: number[] = [];

  for (const pattern of pricePatterns) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const price = parseFloat(m[1]);
      if (price > 0 && price < 500) {
        prices.push(price);
        excerpts.push(...extractContext(text, new RegExp(m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")));
      }
    }
  }

  if (prices.length === 0) return { rawPricing: null, perHourCents: null, peakCents: null, excerpts };

  // Sort prices - lowest is off-peak, highest is peak
  prices.sort((a, b) => a - b);
  const lowest = Math.round(prices[0] * 100);
  const highest = prices.length > 1 ? Math.round(prices[prices.length - 1] * 100) : null;

  return {
    rawPricing: prices.map((p) => `$${p}`).join(" - "),
    perHourCents: lowest,
    peakCents: highest !== lowest ? highest : null,
    excerpts,
  };
}

function extractAmenities(text: string): string[] {
  const amenities: string[] = [];
  const checks = [
    { pattern: /pro\s*shop/i, name: "Pro Shop" },
    { pattern: /locker\s*room/i, name: "Locker Rooms" },
    { pattern: /parking/i, name: "Parking" },
    { pattern: /restaurant|cafe|bar|food/i, name: "Food & Drink" },
    { pattern: /lesson|coach|instruction|clinic/i, name: "Lessons" },
    { pattern: /tournament|league/i, name: "Tournaments" },
    { pattern: /rental|rent(?:ing)?\s*(?:equipment|racket|paddle)/i, name: "Equipment Rental" },
    { pattern: /shower/i, name: "Showers" },
    { pattern: /wifi|wi-fi/i, name: "WiFi" },
    { pattern: /air[\s-]*condition/i, name: "Climate Controlled" },
    { pattern: /(?:member|membership)/i, name: "Memberships" },
  ];

  for (const { pattern, name } of checks) {
    if (pattern.test(text)) amenities.push(name);
  }

  return amenities;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let limit = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1]);
  }

  // Fetch facilities that need enrichment (have website, missing court details)
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, website, total_courts, surface_type, price_per_hour_cents")
    .eq("status", "active")
    .not("website", "is", null)
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${facilities.length} facilities with websites.`);

  // Load existing results
  let results: WebsiteDetails[] = [];
  if (existsSync(OUTPUT_PATH)) {
    results = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
  }
  const scrapedIds = new Set(results.map((r) => r.facilityId));

  let toProcess = facilities.filter((f) => !scrapedIds.has(f.id));
  if (limit > 0) toProcess = toProcess.slice(0, limit);

  console.log(`Already scraped: ${scrapedIds.size}`);
  console.log(`Remaining: ${toProcess.length}\n`);

  let withCourts = 0;
  let withSurface = 0;
  let withPricing = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const f = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${f.name}`);
    console.log(`  URL: ${f.website}`);

    const html = await fetchPage(f.website);
    if (!html) {
      console.log("  Failed to fetch");
      results.push({
        facilityId: f.id,
        facilityName: f.name,
        website: f.website,
        totalCourts: null,
        indoorCourts: null,
        outdoorCourts: null,
        surfaceType: null,
        pricing: null,
        pricePerHourCents: null,
        pricePeakCents: null,
        amenities: [],
        rawExcerpts: [],
      });
      await sleep(500);
      continue;
    }

    const text = stripHtml(html);

    // Extract data
    const courts = extractCourts(text);
    const surface = extractSurface(text);
    const pricing = extractPricing(text);
    const amenities = extractAmenities(text);

    const detail: WebsiteDetails = {
      facilityId: f.id,
      facilityName: f.name,
      website: f.website,
      totalCourts: courts.total,
      indoorCourts: courts.indoor,
      outdoorCourts: courts.outdoor,
      surfaceType: surface.surface,
      pricing: pricing.rawPricing,
      pricePerHourCents: pricing.perHourCents,
      pricePeakCents: pricing.peakCents,
      amenities,
      rawExcerpts: [...courts.excerpts, ...surface.excerpts, ...pricing.excerpts].slice(0, 5),
    };

    results.push(detail);

    const parts = [];
    if (detail.totalCourts) { parts.push(`${detail.totalCourts} courts`); withCourts++; }
    if (detail.surfaceType) { parts.push(detail.surfaceType); withSurface++; }
    if (detail.pricing) { parts.push(detail.pricing); withPricing++; }
    if (detail.amenities.length > 0) parts.push(`${detail.amenities.length} amenities`);

    console.log(`  ${parts.length > 0 ? parts.join(", ") : "no data extracted"}`);

    // Save after each
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    await sleep(1000);
  }

  console.log("\n========================================");
  console.log(`Websites scraped:   ${toProcess.length}`);
  console.log(`With court count:   ${withCourts}`);
  console.log(`With surface type:  ${withSurface}`);
  console.log(`With pricing:       ${withPricing}`);
  console.log(`Output:             ${OUTPUT_PATH}`);
  console.log("========================================");
}

main().catch(console.error);
