/**
 * Apply scraped Google Maps details to Supabase facilities.
 * Updates: hours, website, phone, address where data is available.
 * Preserves manually-entered data — only fills gaps.
 *
 * Usage:
 *   npx tsx scripts/apply-details.ts [--overwrite]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const overwrite = process.argv.includes("--overwrite");

interface ScrapedDetails {
  placeId: string;
  facilityName: string;
  hours: Record<string, string> | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  priceLevel: string | null;
  category: string | null;
  isTemporarilyClosed: boolean;
  isPermanentlyClosed: boolean;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Normalize hours from Google Maps format to our DB format.
 * Google: { "Monday": "7 AM–11:30 PM", ... }
 * DB:     { "monday": { "open": "07:00", "close": "23:30" }, ... }
 */
function normalizeHours(
  raw: Record<string, string>,
): Record<string, { open: string; close: string }> {
  const result: Record<string, { open: string; close: string }> = {};

  for (const [day, timeStr] of Object.entries(raw)) {
    const dayKey = day.toLowerCase();

    // Handle "Closed"
    if (timeStr.toLowerCase().includes("closed")) {
      result[dayKey] = { open: "", close: "", closed: true };
      continue;
    }

    // Handle "Open 24 hours"
    if (timeStr.toLowerCase().includes("24 hours")) {
      result[dayKey] = { open: "00:00", close: "23:59" };
      continue;
    }

    // Parse "7 AM–11:30 PM" or "7:00 AM – 11:30 PM" or "7 AM to 10 PM"
    const match = timeStr.match(
      /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*(?:–|to|-|—)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i,
    );

    if (match) {
      const openHour = to24(parseInt(match[1]), match[2] ? parseInt(match[2]) : 0, match[3].toUpperCase());
      const closeHour = to24(parseInt(match[4]), match[5] ? parseInt(match[5]) : 0, match[6].toUpperCase());
      result[dayKey] = { open: openHour, close: closeHour };
    } else {
      // Store raw if we can't parse
      result[dayKey] = { open: timeStr, close: timeStr };
    }
  }

  return result;
}

function to24(hour: number, minute: number, ampm: string): string {
  let h = hour;
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function main() {
  const detailsPath = resolve(__dirname, "data/scraped-details.json");
  const details: ScrapedDetails[] = JSON.parse(readFileSync(detailsPath, "utf-8"));

  console.log(`Loaded ${details.length} scraped facility details.`);
  console.log(`Mode: ${overwrite ? "OVERWRITE" : "fill-gaps-only"}\n`);

  // Build placeId → details lookup
  const detailsByPlaceId = new Map<string, ScrapedDetails>();
  for (const d of details) {
    detailsByPlaceId.set(d.placeId, d);
  }

  // Fetch all active facilities
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, google_place_id, website, phone, hours, address")
    .eq("status", "active")
    .not("google_place_id", "is", null)
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let hoursAdded = 0;
  let websiteAdded = 0;
  let phoneAdded = 0;

  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    const scraped = detailsByPlaceId.get(f.google_place_id);

    if (!scraped) {
      skipped++;
      continue;
    }

    const payload: Record<string, unknown> = {};

    // Hours
    if (scraped.hours && Object.keys(scraped.hours).length > 0) {
      const hasExistingHours = f.hours && typeof f.hours === "object" && Object.keys(f.hours).length > 0;
      if (!hasExistingHours || overwrite) {
        payload.hours = normalizeHours(scraped.hours);
        hoursAdded++;
      }
    }

    // Website
    if (scraped.website) {
      if (!f.website || overwrite) {
        // Clean up Google redirect URLs
        let url = scraped.website;
        if (url.includes("google.com/url")) {
          try {
            const parsed = new URL(url);
            url = parsed.searchParams.get("q") || url;
          } catch {}
        }
        payload.website = url;
        websiteAdded++;
      }
    }

    // Phone
    if (scraped.phone) {
      if (!f.phone || overwrite) {
        payload.phone = scraped.phone;
        phoneAdded++;
      }
    }

    // Permanently closed → deactivate
    if (scraped.isPermanentlyClosed) {
      payload.status = "inactive";
      console.log(`  [!] ${f.name} — PERMANENTLY CLOSED, deactivating`);
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
      const fields = Object.keys(payload).join(", ");
      console.log(`  [${i + 1}/${facilities.length}] ${f.name}: ${fields}`);
      updated++;
    }

    await sleep(50);
  }

  console.log("\n========================================");
  console.log(`Updated:         ${updated}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Hours added:     ${hoursAdded}`);
  console.log(`Websites added:  ${websiteAdded}`);
  console.log(`Phones added:    ${phoneAdded}`);
  console.log("========================================");
}

main().catch(console.error);
