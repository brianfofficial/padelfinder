/**
 * Scrape Google Maps reviews via Chrome DevTools Protocol (CDP).
 *
 * Requires Chrome to be running with remote debugging:
 *   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *     --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-debug-profile"
 *
 * The script uses your signed-in Google session to access the full
 * Google Maps experience, including the Reviews tab.
 *
 * Output: scripts/data/scraper-reviews.json (ReviewGroup[] format)
 *
 * Usage:
 *   npx tsx scripts/scrape-reviews-cdp.ts [--limit N] [--offset N] [--place-id ChIJ...]
 */

import { chromium, type Page, type BrowserContext } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const CDP_URL = "http://127.0.0.1:9222";
const OUTPUT_PATH = resolve(__dirname, "data/scraper-reviews.json");
const PROGRESS_PATH = resolve(__dirname, "data/scrape-progress.json");
const MAX_REVIEWS_PER_FACILITY = 50;
const SCROLL_PAUSE_MS = 1500;
const NAV_WAIT_MS = 5000;

// ─── Types ───────────────────────────────────────────────────────────

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

interface Facility {
  id: string;
  name: string;
  google_place_id: string;
  google_rating: number;
  google_review_count: number;
}

interface Progress {
  completed: string[]; // place_ids already scraped
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateReviewId(author: string, rating: number, text: string): string {
  const input = `${author}|${rating}|${text.slice(0, 200)}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function relativeToISO(relative: string): string {
  const now = new Date();
  const text = relative.toLowerCase().trim();

  const match = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
  if (match) {
    const n = parseInt(match[1]);
    const unit = match[2];
    const d = new Date(now);
    switch (unit) {
      case "second": d.setSeconds(d.getSeconds() - n); break;
      case "minute": d.setMinutes(d.getMinutes() - n); break;
      case "hour": d.setHours(d.getHours() - n); break;
      case "day": d.setDate(d.getDate() - n); break;
      case "week": d.setDate(d.getDate() - n * 7); break;
      case "month": d.setMonth(d.getMonth() - n); break;
      case "year": d.setFullYear(d.getFullYear() - n); break;
    }
    return d.toISOString();
  }

  // "a week ago", "a month ago", etc.
  const singleMatch = text.match(/^a\s+(week|month|year)\s+ago$/);
  if (singleMatch) {
    const d = new Date(now);
    switch (singleMatch[1]) {
      case "week": d.setDate(d.getDate() - 7); break;
      case "month": d.setMonth(d.getMonth() - 1); break;
      case "year": d.setFullYear(d.getFullYear() - 1); break;
    }
    return d.toISOString();
  }

  return now.toISOString();
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

function loadExistingResults(): ReviewGroup[] {
  if (existsSync(OUTPUT_PATH)) {
    return JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
  }
  return [];
}

function saveResults(results: ReviewGroup[]) {
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
}

// ─── Scraping Logic ──────────────────────────────────────────────────

async function extractReviewsFromPage(page: Page): Promise<ReviewEntry[]> {
  // Expand all truncated review texts first
  await page.evaluate(() => {
    document.querySelectorAll(".w8nwRe, button[aria-expanded='false']").forEach((btn) => {
      try { (btn as HTMLElement).click(); } catch {}
    });
  });
  await sleep(800);

  const rawReviews = await page.evaluate(() => {
    const results: Array<{
      author: string;
      rating: number;
      text: string;
      when: string;
      ownerResponse: string | null;
    }> = [];

    // Try multiple review container selectors
    let reviewEls = document.querySelectorAll(".jftiEf");
    if (reviewEls.length === 0) reviewEls = document.querySelectorAll("div[data-review-id]");
    if (reviewEls.length === 0) reviewEls = document.querySelectorAll(".bwb7ce");

    for (const el of Array.from(reviewEls)) {
      // Author
      const author =
        el.querySelector(".d4r55")?.textContent?.trim() ||
        el.querySelector(".WNxzHc")?.textContent?.trim() ||
        "";

      // Rating
      let rating = 0;
      const ratingEl =
        el.querySelector(".kvMYJc") ||
        el.querySelector('[role="img"][aria-label*="star"]');
      if (ratingEl) {
        const label = ratingEl.getAttribute("aria-label") || "";
        const m = label.match(/(\d+)/);
        if (m) rating = parseInt(m[1]);
      }

      // Text (after expanding "More")
      const text =
        el.querySelector(".wiI7pd")?.textContent?.trim() ||
        el.querySelector(".MyEned span")?.textContent?.trim() ||
        "";

      // Relative time
      const when =
        el.querySelector(".rsqaWe")?.textContent?.trim() ||
        el.querySelector(".DU9Pgb")?.textContent?.trim() ||
        "";

      // Owner response
      let ownerResponse: string | null = null;
      const responseEl = el.querySelector(".CDe7pd");
      if (responseEl) {
        ownerResponse = responseEl.textContent?.trim() || null;
      }

      if (author && rating > 0) {
        results.push({ author, rating, text, when, ownerResponse });
      }
    }

    return results;
  });

  return rawReviews.map((r) => ({
    author: r.author,
    rating: r.rating,
    text: r.text,
    publishedAt: relativeToISO(r.when),
    ownerResponse: r.ownerResponse,
    ownerResponseDate: null,
    helpfulCount: 0,
    reviewId: generateReviewId(r.author, r.rating, r.text),
  }));
}

async function scrapeReviewsForPlace(
  page: Page,
  placeId: string,
  facilityName: string,
): Promise<ReviewGroup | null> {
  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}&hl=en`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e) {
    console.log(`    Navigation error: ${e}`);
    return null;
  }

  await sleep(NAV_WAIT_MS);

  // Check if we have the Reviews tab
  const tabs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="tab"]')).map((t) =>
      t.textContent?.trim(),
    ),
  );

  if (!tabs.some((t) => t?.toLowerCase().includes("review"))) {
    // Check if limited view
    const limited = await page.evaluate(() =>
      document.body.innerText.includes("limited view"),
    );
    if (limited) {
      console.log("    Limited view - need Google sign-in! Aborting.");
      process.exit(1);
    }
    console.log(`    No Reviews tab. Tabs: ${tabs.join(", ")}`);
    return null;
  }

  // Click Reviews tab
  const reviewTab = page.locator('[role="tab"]').filter({ hasText: /Reviews/i });
  await reviewTab.first().click();
  await sleep(3000);

  // Scroll to load more reviews
  let lastCount = 0;
  let stuckRounds = 0;

  for (let scroll = 0; scroll < 30; scroll++) {
    const currentCount = await page.evaluate(() =>
      document.querySelectorAll(".jftiEf, div[data-review-id], .bwb7ce").length,
    );

    if (currentCount >= MAX_REVIEWS_PER_FACILITY) break;

    if (currentCount === lastCount) {
      stuckRounds++;
      if (stuckRounds >= 3) break;
    } else {
      stuckRounds = 0;
    }
    lastCount = currentCount;

    // Scroll the reviews panel
    await page.evaluate(() => {
      const containers = [
        ".m6QErb.DxyBCb.kA9KIf.dS8AEf",
        ".m6QErb.DxyBCb.kA9KIf",
        ".DxyBCb.kA9KIf",
        ".m6QErb",
        'div[role="feed"]',
      ];
      for (const sel of containers) {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollBy(0, 1000);
          return;
        }
      }
    });

    await sleep(SCROLL_PAUSE_MS);
  }

  // Extract all reviews
  const reviews = await extractReviewsFromPage(page);

  return {
    placeId,
    facilityName,
    reviews,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  let limit = 0;
  let offset = 0;
  let singlePlaceId = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1]);
    if (args[i] === "--offset" && args[i + 1]) offset = parseInt(args[i + 1]);
    if (args[i] === "--place-id" && args[i + 1]) singlePlaceId = args[i + 1];
  }

  // Fetch facilities from Supabase
  console.log("Fetching facilities from Supabase...");
  let query = supabase
    .from("facilities")
    .select("id, name, google_place_id, google_rating, google_review_count")
    .eq("status", "active")
    .not("google_place_id", "is", null)
    .order("name");

  if (singlePlaceId) {
    query = query.eq("google_place_id", singlePlaceId);
  }

  const { data: facilities, error } = await query;
  if (error || !facilities) {
    console.error("Failed to fetch facilities:", error);
    process.exit(1);
  }

  console.log(`Found ${facilities.length} facilities with google_place_id`);

  // Apply offset/limit
  let toScrape = facilities as Facility[];
  if (offset > 0) toScrape = toScrape.slice(offset);
  if (limit > 0) toScrape = toScrape.slice(0, limit);

  // Load progress (resume from where we left off)
  const progress = loadProgress();
  const results = loadExistingResults();
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
  let browser: BrowserContext;
  try {
    const b = await chromium.connectOverCDP(CDP_URL);
    const contexts = b.contexts();
    if (contexts.length === 0) {
      console.error("No browser contexts found. Make sure Chrome is open.");
      process.exit(1);
    }
    browser = contexts[0];
  } catch (e) {
    console.error(`\nFailed to connect to Chrome at ${CDP_URL}.`);
    console.error("\nPlease start Chrome with remote debugging:");
    console.error(
      '  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\',
    );
    console.error('    --remote-debugging-port=9222 \\');
    console.error(`    --user-data-dir="$HOME/chrome-debug-profile"`);
    console.error("\nThen sign into Google and re-run this script.");
    process.exit(1);
  }

  // IMPORTANT: Reuse an existing page instead of creating a new one.
  // New pages via CDP don't inherit the Chrome session cookies.
  // We need to find an existing Maps page or a regular tab to navigate.
  const existingPages = browser.pages();
  let page = existingPages.find((p) => p.url().includes("google.com/maps"));
  if (!page) {
    // Use any existing tab (not about:blank or chrome://)
    page = existingPages.find(
      (p) => !p.url().startsWith("chrome://") && !p.url().startsWith("about:"),
    );
  }
  if (!page) {
    page = existingPages[0]; // fallback to first tab
  }
  if (!page) {
    console.error("No usable tab found in Chrome. Open at least one tab.");
    process.exit(1);
  }

  console.log(`Using existing tab: ${page.url().slice(0, 80)}`);

  // Quick check: are we signed in?
  console.log("Checking Google sign-in...");
  if (!page.url().includes("google.com/maps")) {
    await page.goto("https://www.google.com/maps", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await sleep(3000);
  }

  const signedIn = await page.evaluate(() => {
    const avatar = document.querySelector(
      'img[aria-label*="Account"], a[aria-label*="Account"], .gb_A, a[href*="SignOutOptions"]',
    );
    const limited = document.body.innerText.includes("limited view");
    return { hasAvatar: !!avatar, limited };
  });

  if (signedIn.limited) {
    console.error("\nGoogle Maps shows 'limited view'. You need to sign into Google.");
    console.error("Open Chrome, go to google.com, and sign into your Google account.");
    process.exit(1);
  }

  console.log(`Sign-in check: avatar=${signedIn.hasAvatar}, limited=${signedIn.limited}`);
  console.log("\nStarting review scraping...\n");

  let totalReviews = 0;

  for (let i = 0; i < remaining.length; i++) {
    const facility = remaining[i];
    console.log(
      `[${i + 1}/${remaining.length}] ${facility.name} (${facility.google_place_id})`,
    );

    const result = await scrapeReviewsForPlace(
      page,
      facility.google_place_id,
      facility.name,
    );

    if (result && result.reviews.length > 0) {
      // Remove existing entry for this place if re-scraping
      const idx = results.findIndex((r) => r.placeId === result.placeId);
      if (idx >= 0) results[idx] = result;
      else results.push(result);

      totalReviews += result.reviews.length;
      console.log(`    ${result.reviews.length} reviews scraped`);
    } else {
      console.log(`    0 reviews`);
    }

    // Save progress after each facility
    progress.completed.push(facility.google_place_id);
    saveProgress(progress);
    saveResults(results);

    // Random delay between facilities (2-5s)
    const delay = 2000 + Math.random() * 3000;
    await sleep(delay);
  }

  // Don't close the reused tab

  // Final summary
  console.log("\n========================================");
  console.log(`Facilities scraped:  ${remaining.length}`);
  console.log(`Total reviews:       ${totalReviews}`);
  console.log(`Output file:         ${OUTPUT_PATH}`);
  console.log("========================================");
  console.log("\nNext: run `npx tsx scripts/import-reviews.ts` to import into Supabase.");
}

main().catch(console.error);
