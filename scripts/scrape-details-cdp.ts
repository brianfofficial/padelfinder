/**
 * Scrape Google Maps facility details via Chrome DevTools Protocol (CDP).
 * Extracts: hours, website, phone, address from Google Maps place pages.
 *
 * Requires Chrome running with remote debugging:
 *   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *     --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-debug-profile"
 *
 * Output: scripts/data/scraped-details.json
 *
 * Usage:
 *   npx tsx scripts/scrape-details-cdp.ts [--limit N] [--offset N] [--place-id ChIJ...]
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
const OUTPUT_PATH = resolve(__dirname, "data/scraped-details.json");
const PROGRESS_PATH = resolve(__dirname, "data/details-progress.json");
const NAV_WAIT_MS = 4000;

// ─── Types ───────────────────────────────────────────────────────────

interface FacilityDetails {
  placeId: string;
  facilityName: string;
  hours: Record<string, string> | null; // { "Monday": "7 AM–10 PM", ... }
  website: string | null;
  phone: string | null;
  address: string | null;
  priceLevel: string | null; // "$", "$$", "$$$"
  category: string | null;
  isTemporarilyClosed: boolean;
  isPermanentlyClosed: boolean;
}

interface Progress {
  completed: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProgress(): Progress {
  if (existsSync(PROGRESS_PATH)) {
    return JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"));
  }
  return { completed: [] };
}

function saveProgress(progress: Progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function loadExistingResults(): FacilityDetails[] {
  if (existsSync(OUTPUT_PATH)) {
    return JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
  }
  return [];
}

function saveResults(results: FacilityDetails[]) {
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
}

// ─── Scraping Logic ──────────────────────────────────────────────────

async function extractDetailsFromPage(page: Page): Promise<Partial<FacilityDetails>> {
  return await page.evaluate(() => {
    const result: Record<string, unknown> = {};

    // ── Hours ──
    // Google Maps shows hours in multiple places. Try the info section first.
    const hoursMap: Record<string, string> = {};

    // Method 1: Hours table (expanded view)
    const hoursTable = document.querySelector(".t39EBf.GUrTXd, table.eK4R0e, .OqCZI");
    if (hoursTable) {
      const rows = hoursTable.querySelectorAll("tr, .y0skZc");
      for (const row of Array.from(rows)) {
        const day = row.querySelector("td:first-child, .ylH6lf")?.textContent?.trim();
        const time = row.querySelector("td:last-child, .mxowUb")?.textContent?.trim();
        if (day && time) {
          hoursMap[day] = time;
        }
      }
    }

    // Method 2: Collapsed hours (click to expand)
    if (Object.keys(hoursMap).length === 0) {
      // Try aria-label on hours section
      const hoursLabel = document.querySelector('[data-item-id="oh"], [aria-label*="hours"], .o0Svhf');
      if (hoursLabel) {
        const ariaLabel = hoursLabel.getAttribute("aria-label") || "";
        // Parse "Monday, 7 AM to 10 PM; Tuesday, 7 AM to 10 PM; ..."
        if (ariaLabel.includes(";") || ariaLabel.includes(",")) {
          const parts = ariaLabel.split(";").map(s => s.trim()).filter(Boolean);
          for (const part of parts) {
            // "Hours: Monday, 7 AM to 10 PM" or "Monday, 7 AM to 10 PM"
            const cleaned = part.replace(/^Hours:\s*/i, "");
            const commaIdx = cleaned.indexOf(",");
            if (commaIdx > 0) {
              const day = cleaned.slice(0, commaIdx).trim();
              const time = cleaned.slice(commaIdx + 1).trim();
              if (day && time) hoursMap[day] = time;
            }
          }
        }
      }
    }

    // Method 3: Look for individual day entries in the side panel
    if (Object.keys(hoursMap).length === 0) {
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      for (const day of dayNames) {
        // Try various selectors
        const els = document.querySelectorAll(`[aria-label*="${day}"]`);
        for (const el of Array.from(els)) {
          const label = el.getAttribute("aria-label") || "";
          // "Monday, 7 AM to 10 PM" or "Monday 7:00 AM – 10:00 PM"
          const match = label.match(new RegExp(`${day}[,\\s]+(.+)`, "i"));
          if (match) {
            hoursMap[day] = match[1].trim();
            break;
          }
        }
      }
    }

    result.hours = Object.keys(hoursMap).length > 0 ? hoursMap : null;

    // ── Website ──
    const websiteEl =
      document.querySelector('[data-item-id="authority"] a') ||
      document.querySelector('a[data-item-id="authority"]') ||
      document.querySelector('a[aria-label*="website" i]') ||
      document.querySelector('a[aria-label*="Website" i]') ||
      document.querySelector('.rogA2c [data-tooltip*="website" i]');
    if (websiteEl) {
      result.website = (websiteEl as HTMLAnchorElement).href || websiteEl.textContent?.trim() || null;
    } else {
      // Try looking for any link with the domain icon
      const links = document.querySelectorAll('a[href]');
      for (const link of Array.from(links)) {
        const ariaLabel = link.getAttribute("aria-label") || "";
        if (ariaLabel.toLowerCase().includes("website") || ariaLabel.toLowerCase().includes("web:")) {
          result.website = (link as HTMLAnchorElement).href;
          break;
        }
      }
    }

    // ── Phone ──
    const phoneEl =
      document.querySelector('[data-item-id^="phone:"] .Io6YTe') ||
      document.querySelector('[data-item-id^="phone:"]') ||
      document.querySelector('[aria-label*="Phone"]') ||
      document.querySelector('button[data-tooltip*="phone" i]');
    if (phoneEl) {
      const ariaLabel = phoneEl.getAttribute("aria-label") || "";
      const phoneMatch = ariaLabel.match(/Phone:\s*(.+)/i) || ariaLabel.match(/([\d\s()+-]+)/);
      if (phoneMatch) {
        result.phone = phoneMatch[1].trim();
      } else {
        const phoneText = phoneEl.textContent?.trim();
        if (phoneText && /[\d-()+ ]{7,}/.test(phoneText)) {
          result.phone = phoneText;
        }
      }
    }
    if (!result.phone) {
      // Scan for phone pattern in aria-labels
      const allEls = document.querySelectorAll('[data-item-id^="phone:"]');
      for (const el of Array.from(allEls)) {
        const text = el.textContent?.trim() || "";
        if (/[\d-()+ ]{7,}/.test(text)) {
          result.phone = text;
          break;
        }
      }
    }

    // ── Address ──
    const addressEl =
      document.querySelector('[data-item-id="address"] .Io6YTe') ||
      document.querySelector('[data-item-id="address"]') ||
      document.querySelector('button[aria-label*="Address"]');
    if (addressEl) {
      const ariaLabel = addressEl.getAttribute("aria-label") || "";
      const addrMatch = ariaLabel.match(/Address:\s*(.+)/i);
      result.address = addrMatch ? addrMatch[1].trim() : addressEl.textContent?.trim() || null;
    }

    // ── Price Level ──
    const priceEl = document.querySelector('[aria-label*="Price"]');
    if (priceEl) {
      result.priceLevel = priceEl.textContent?.trim() || null;
    }

    // ── Category ──
    const categoryEl = document.querySelector('.DkEaL, button[jsaction*="category"]');
    result.category = categoryEl?.textContent?.trim() || null;

    // ── Status ──
    const statusText = document.body.innerText;
    result.isTemporarilyClosed = /temporarily closed/i.test(statusText);
    result.isPermanentlyClosed = /permanently closed/i.test(statusText);

    return result;
  });
}

async function scrapeDetailsForPlace(
  page: Page,
  placeId: string,
  facilityName: string,
): Promise<FacilityDetails | null> {
  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}&hl=en`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e) {
    console.log(`    Navigation error: ${e}`);
    return null;
  }

  await sleep(NAV_WAIT_MS);

  // Try to expand hours if collapsed
  try {
    // Click on hours section to expand it
    const hoursButton = page.locator('[data-item-id="oh"], [aria-label*="hours" i], .o0Svhf').first();
    if (await hoursButton.isVisible({ timeout: 2000 })) {
      await hoursButton.click();
      await sleep(1500);
    }
  } catch {
    // Hours button not found or not clickable, that's OK
  }

  const details = await extractDetailsFromPage(page);

  return {
    placeId,
    facilityName,
    hours: (details.hours as Record<string, string>) || null,
    website: (details.website as string) || null,
    phone: (details.phone as string) || null,
    address: (details.address as string) || null,
    priceLevel: (details.priceLevel as string) || null,
    category: (details.category as string) || null,
    isTemporarilyClosed: !!details.isTemporarilyClosed,
    isPermanentlyClosed: !!details.isPermanentlyClosed,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let limit = 0;
  let offset = 0;
  let singlePlaceId = "";
  let resetProgress = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1]);
    if (args[i] === "--offset" && args[i + 1]) offset = parseInt(args[i + 1]);
    if (args[i] === "--place-id" && args[i + 1]) singlePlaceId = args[i + 1];
    if (args[i] === "--reset") resetProgress = true;
  }

  // Fetch facilities
  console.log("Fetching facilities from Supabase...");
  let query = supabase
    .from("facilities")
    .select("id, name, slug, google_place_id, website, phone, hours, total_courts, surface_type, price_per_hour_cents")
    .eq("status", "active")
    .not("google_place_id", "is", null)
    .order("name");

  if (singlePlaceId) {
    query = query.eq("google_place_id", singlePlaceId);
  }

  const { data: facilities, error } = await query;
  if (error || !facilities) {
    console.error("Failed to fetch:", error);
    process.exit(1);
  }

  console.log(`Found ${facilities.length} facilities with google_place_id`);

  // Apply offset/limit
  let toScrape = facilities;
  if (offset > 0) toScrape = toScrape.slice(offset);
  if (limit > 0) toScrape = toScrape.slice(0, limit);

  // Load progress
  const progress = resetProgress ? { completed: [] } : loadProgress();
  const results = resetProgress ? [] : loadExistingResults();
  const existingPlaceIds = new Set(results.map((r) => r.placeId));

  const remaining = toScrape.filter(
    (f) =>
      !progress.completed.includes(f.google_place_id) &&
      !existingPlaceIds.has(f.google_place_id),
  );

  console.log(`Already scraped: ${progress.completed.length}`);
  console.log(`Remaining: ${remaining.length}`);

  if (remaining.length === 0) {
    console.log("Nothing to scrape!");
    return;
  }

  // Connect to Chrome via CDP
  console.log(`\nConnecting to Chrome at ${CDP_URL}...`);
  let browserCtx: BrowserContext;
  try {
    const b = await chromium.connectOverCDP(CDP_URL);
    const contexts = b.contexts();
    if (contexts.length === 0) {
      console.error("No browser contexts.");
      process.exit(1);
    }
    browserCtx = contexts[0];
  } catch {
    console.error(`Failed to connect to Chrome at ${CDP_URL}.`);
    console.error("Start Chrome with: --remote-debugging-port=9222");
    process.exit(1);
  }

  // Reuse existing page (CDP gotcha: new pages don't inherit session cookies)
  const existingPages = browserCtx.pages();
  let page = existingPages.find((p) => p.url().includes("google.com/maps"));
  if (!page) page = existingPages.find((p) => !p.url().startsWith("chrome://") && !p.url().startsWith("about:"));
  if (!page) page = existingPages[0];
  if (!page) {
    console.error("No usable tab found.");
    process.exit(1);
  }

  console.log(`Using tab: ${page.url().slice(0, 80)}`);
  console.log("\nStarting detail scraping...\n");

  let withHours = 0;
  let withWebsite = 0;
  let withPhone = 0;

  for (let i = 0; i < remaining.length; i++) {
    const facility = remaining[i];
    console.log(`[${i + 1}/${remaining.length}] ${facility.name}`);

    const details = await scrapeDetailsForPlace(
      page,
      facility.google_place_id,
      facility.name,
    );

    if (details) {
      // Replace or add
      const idx = results.findIndex((r) => r.placeId === details.placeId);
      if (idx >= 0) results[idx] = details;
      else results.push(details);

      const parts = [];
      if (details.hours) { parts.push(`hours:${Object.keys(details.hours).length}d`); withHours++; }
      if (details.website) { parts.push("web"); withWebsite++; }
      if (details.phone) { parts.push("phone"); withPhone++; }
      if (details.isTemporarilyClosed) parts.push("TEMP-CLOSED");
      if (details.isPermanentlyClosed) parts.push("PERM-CLOSED");

      console.log(`    ${parts.length > 0 ? parts.join(", ") : "no details found"}`);
    } else {
      console.log("    failed");
    }

    progress.completed.push(facility.google_place_id);
    saveProgress(progress);
    saveResults(results);

    // Random delay (2-4s)
    await sleep(2000 + Math.random() * 2000);
  }

  console.log("\n========================================");
  console.log(`Facilities scraped: ${remaining.length}`);
  console.log(`With hours:         ${withHours}`);
  console.log(`With website:       ${withWebsite}`);
  console.log(`With phone:         ${withPhone}`);
  console.log(`Output:             ${OUTPUT_PATH}`);
  console.log("========================================");
}

main().catch(console.error);
