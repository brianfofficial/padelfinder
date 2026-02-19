/**
 * Scrape Google Maps "About" tab for facility attributes.
 * Extracts: amenities, accessibility, service options, etc.
 * Also extracts text from the main info panel for court details.
 *
 * Requires Chrome with remote debugging on port 9222.
 *
 * Output: scripts/data/scraped-about.json
 *
 * Usage:
 *   npx tsx scripts/scrape-about-cdp.ts [--limit N] [--reset]
 */

import { chromium, type Page, type BrowserContext } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const CDP_URL = "http://127.0.0.1:9222";
const OUTPUT_PATH = resolve(__dirname, "data/scraped-about.json");
const PROGRESS_PATH = resolve(__dirname, "data/about-progress.json");
const NAV_WAIT_MS = 4000;

// ─── Types ───────────────────────────────────────────────────────────

interface AboutDetails {
  placeId: string;
  facilityName: string;
  description: string | null;
  aboutAttributes: string[];   // raw attribute texts from About tab
  totalCourts: number | null;
  indoorCourts: number | null;
  outdoorCourts: number | null;
  surfaceType: string | null;
}

interface Progress {
  completed: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProgress(): Progress {
  if (existsSync(PROGRESS_PATH)) return JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"));
  return { completed: [] };
}

function saveProgress(progress: Progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadExistingResults(): AboutDetails[] {
  if (existsSync(OUTPUT_PATH)) return JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
  return [];
}

function saveResults(results: AboutDetails[]) {
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
}

// ─── Extraction ──────────────────────────────────────────────────────

function extractCourtsFromText(text: string): {
  total: number | null;
  indoor: number | null;
  outdoor: number | null;
  surface: string | null;
} {
  let total: number | null = null;
  let indoor: number | null = null;
  let outdoor: number | null = null;
  let surface: string | null = null;

  // Court count patterns
  const courtMatch = text.match(/(\d+)\s*(?:padel\s+)?courts?\b/i);
  if (courtMatch) total = parseInt(courtMatch[1]);

  const indoorMatch = text.match(/(\d+)\s*indoor\s*(?:padel\s+)?courts?/i);
  if (indoorMatch) indoor = parseInt(indoorMatch[1]);

  const outdoorMatch = text.match(/(\d+)\s*outdoor\s*(?:padel\s+)?courts?/i);
  if (outdoorMatch) outdoor = parseInt(outdoorMatch[1]);

  // "indoor" / "outdoor" mentions
  if (indoor === null && outdoor === null) {
    if (/\bindoor\b/i.test(text) && !/\boutdoor\b/i.test(text)) {
      indoor = total;
      outdoor = 0;
    } else if (/\boutdoor\b/i.test(text) && !/\bindoor\b/i.test(text)) {
      outdoor = total;
      indoor = 0;
    }
  }

  // Surface type
  if (/artificial\s*(?:grass|turf)/i.test(text)) surface = "Artificial Grass";
  else if (/synthetic\s*turf/i.test(text)) surface = "Synthetic Turf";
  else if (/panoramic/i.test(text)) surface = "Glass Court";

  return { total, indoor, outdoor, surface };
}

async function scrapeAboutForPlace(
  page: Page,
  placeId: string,
  facilityName: string,
): Promise<AboutDetails | null> {
  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}&hl=en`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch {
    return null;
  }

  await sleep(NAV_WAIT_MS);

  // Get the description/editorial summary from the overview
  const description = await page.evaluate(() => {
    // Editorial summary
    const summary =
      document.querySelector(".PYvSYb, .WeS02d, [data-attrid='kc:/location/location:description']")?.textContent?.trim() ||
      null;
    return summary;
  });

  // Click About tab
  try {
    const aboutTab = page.locator('[role="tab"]').filter({ hasText: /About/i });
    if (await aboutTab.first().isVisible({ timeout: 2000 })) {
      await aboutTab.first().click();
      await sleep(2000);
    }
  } catch {
    // About tab might not exist
  }

  // Extract attributes from About page
  const aboutData = await page.evaluate(() => {
    const attributes: string[] = [];

    // About tab content - attributes listed in sections
    const aboutSections = document.querySelectorAll(".iP2t7d, .LTs0Rc, .CK16pd");
    for (const section of Array.from(aboutSections)) {
      const items = section.querySelectorAll("li, .hpLkke, span");
      for (const item of Array.from(items)) {
        const text = item.textContent?.trim();
        if (text && text.length > 2 && text.length < 200) {
          attributes.push(text);
        }
      }
    }

    // Also get any text visible in the side panel
    const panelText = document.querySelector('.m6QErb, [role="main"]')?.textContent?.trim() || "";

    return { attributes, panelText };
  });

  // Also extract from the overview page
  const overviewData = await page.evaluate(() => {
    // Get all text from the info section
    const infoSection = document.querySelector(".m6QErb.WNBkOb");
    return infoSection?.textContent?.trim() || "";
  });

  const combinedText = `${description || ""} ${aboutData.panelText} ${overviewData} ${aboutData.attributes.join(" ")}`;
  const courtInfo = extractCourtsFromText(combinedText);

  return {
    placeId,
    facilityName,
    description,
    aboutAttributes: [...new Set(aboutData.attributes)],
    totalCourts: courtInfo.total,
    indoorCourts: courtInfo.indoor,
    outdoorCourts: courtInfo.outdoor,
    surfaceType: courtInfo.surface,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let limit = 0;
  let resetProgress = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1]);
    if (args[i] === "--reset") resetProgress = true;
  }

  // Fetch facilities that need court data
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, google_place_id, total_courts, surface_type, description")
    .eq("status", "active")
    .not("google_place_id", "is", null)
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  // Focus on facilities missing court info
  const needsData = facilities.filter(
    (f) => !f.total_courts || !f.surface_type || !f.description,
  );

  console.log(`Total facilities with place_id: ${facilities.length}`);
  console.log(`Needing court/description data: ${needsData.length}`);

  const progress = resetProgress ? { completed: [] } : loadProgress();
  const results = resetProgress ? [] : loadExistingResults();
  const existingPlaceIds = new Set(results.map((r) => r.placeId));

  let toScrape = needsData.filter(
    (f) => !progress.completed.includes(f.google_place_id) && !existingPlaceIds.has(f.google_place_id),
  );
  if (limit > 0) toScrape = toScrape.slice(0, limit);

  console.log(`Already scraped: ${progress.completed.length}`);
  console.log(`Remaining: ${toScrape.length}`);

  if (toScrape.length === 0) {
    console.log("Nothing to scrape!");
    return;
  }

  // Connect to Chrome via CDP
  console.log(`\nConnecting to Chrome at ${CDP_URL}...`);
  let browserCtx: BrowserContext;
  try {
    const b = await chromium.connectOverCDP(CDP_URL);
    browserCtx = b.contexts()[0];
  } catch {
    console.error("Failed to connect to Chrome. Start with --remote-debugging-port=9222");
    process.exit(1);
  }

  // Reuse existing page
  const existingPages = browserCtx.pages();
  let page = existingPages.find((p) => p.url().includes("google.com/maps"));
  if (!page) page = existingPages.find((p) => !p.url().startsWith("chrome://") && !p.url().startsWith("about:"));
  if (!page) page = existingPages[0];
  if (!page) {
    console.error("No usable tab found.");
    process.exit(1);
  }

  console.log(`Using tab: ${page.url().slice(0, 80)}`);
  console.log("\nStarting About scraping...\n");

  let withCourts = 0;
  let withSurface = 0;
  let withDescription = 0;

  for (let i = 0; i < toScrape.length; i++) {
    const facility = toScrape[i];
    console.log(`[${i + 1}/${toScrape.length}] ${facility.name}`);

    const about = await scrapeAboutForPlace(page, facility.google_place_id, facility.name);

    if (about) {
      const idx = results.findIndex((r) => r.placeId === about.placeId);
      if (idx >= 0) results[idx] = about;
      else results.push(about);

      const parts = [];
      if (about.totalCourts) { parts.push(`${about.totalCourts} courts`); withCourts++; }
      if (about.surfaceType) { parts.push(about.surfaceType); withSurface++; }
      if (about.description) { parts.push("desc"); withDescription++; }
      if (about.aboutAttributes.length > 0) parts.push(`${about.aboutAttributes.length} attrs`);

      console.log(`    ${parts.length > 0 ? parts.join(", ") : "minimal data"}`);
    } else {
      console.log("    failed");
    }

    progress.completed.push(facility.google_place_id);
    saveProgress(progress);
    saveResults(results);

    await sleep(2000 + Math.random() * 2000);
  }

  console.log("\n========================================");
  console.log(`Scraped:          ${toScrape.length}`);
  console.log(`With courts:      ${withCourts}`);
  console.log(`With surface:     ${withSurface}`);
  console.log(`With description: ${withDescription}`);
  console.log(`Output:           ${OUTPUT_PATH}`);
  console.log("========================================");
}

main().catch(console.error);
