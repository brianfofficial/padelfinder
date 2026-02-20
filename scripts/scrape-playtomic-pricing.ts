/**
 * Scrape court rental pricing from Playtomic availability API.
 * Uses the public API at api.playtomic.io to get time slot prices.
 *
 * Checks both a weekday and weekend day to capture off-peak/peak rates.
 * Extracts 60-min slot prices per court and computes min/max.
 *
 * Usage:
 *   npx tsx scripts/scrape-playtomic-pricing.ts [--apply] [--overwrite]
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const shouldApply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");

const OUTPUT_PATH = resolve(__dirname, "data/playtomic-pricing.json");

// ─── Playtomic facility mapping ─────────────────────────────────────
// facility DB name → Playtomic tenant ID

interface PlaytomicFacility {
  dbName: string;
  tenantId: string;
  slug: string;
}

const FACILITIES: PlaytomicFacility[] = [
  { dbName: "ACCESS PADEL", tenantId: "8b8cef31-4196-40f6-8ed3-724457fc1a9e", slug: "access-padel-club" },
  { dbName: "BMorePadel", tenantId: "c155acf8-d110-4c06-9f6a-92ddc112217d", slug: "bmorepadel" },
  { dbName: "Padel Country Club Katy", tenantId: "b3c7e173-5563-49e0-b2b2-024fff5e66fd", slug: "padel-country-club" },
  { dbName: "Padel Country Club Memorial", tenantId: "fe031b37-1ae9-47be-b286-6a24f14ca4f6", slug: "padel-country-club-memorial" },
  { dbName: "Padel World Play", tenantId: "c74c50c5-0572-4823-b974-586cffa6a1e3", slug: "padel-world-play" },
  { dbName: "Padel X Boca Raton", tenantId: "d38c03d8-45ea-4447-95f6-bfa909f91df6", slug: "padel-x-boca-raton" },
  { dbName: "Pulse Padel Hub", tenantId: "5a61b0b8-a890-4003-a707-465778c4531b", slug: "pulse-padel-hub" },
  { dbName: "Regency Padel", tenantId: "233180b0-2551-4d98-8e9e-401a08fc1c89", slug: "regency-padel" },
  { dbName: "SMART PADEL HOUSE", tenantId: "8e3ec27a-bbe8-447e-9e3c-5581ac78b938", slug: "smart-padel-house" },
  { dbName: "Terra Padel", tenantId: "344b3903-5fdd-44f3-92d3-ed062f5d7441", slug: "terra-padel-usa" },
  { dbName: "Padel Quattro", tenantId: "e9f9275b-e448-40bf-bdae-00556765f954", slug: "padel-quattro" },
  { dbName: "The ONE Padel Club", tenantId: "e0845c7c-d581-49a6-b463-eecf6609c514", slug: "the-one-padel-club-tx" },
  { dbName: "Slice Padel", tenantId: "2d8dff4c-1310-454e-bab5-bd6ee1606655", slug: "slice-padel-club" },
  // Already have pricing but re-check for accuracy:
  { dbName: "Open Padel Club by Lasaigues", tenantId: "c2a14e38-3af7-4fd2-9fb3-67ebf4926502", slug: "open-padel-by-lasaigues" },
  { dbName: "PADEL CLUB AUSTIN (PCATX)", tenantId: "c9bf304f-451c-4a88-968b-bb42828122fe", slug: "padel-club-austin" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getNextWeekday(): string {
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const day = d.getDay();
    if (day >= 1 && day <= 5) return d.toISOString().split("T")[0];
  }
  return new Date(now.getTime() + 86400000).toISOString().split("T")[0];
}

function getNextWeekend(): string {
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const day = d.getDay();
    if (day === 0 || day === 6) return d.toISOString().split("T")[0];
  }
  return new Date(now.getTime() + 6 * 86400000).toISOString().split("T")[0];
}

interface SlotPrice {
  startTime: string;
  duration: number;
  priceCents: number;
}

async function fetchPricing(tenantId: string, date: string): Promise<SlotPrice[]> {
  const url = `https://api.playtomic.io/v1/availability?tenant_id=${tenantId}&sport_id=PADEL&local_start_min=${date}T00:00:00&local_start_max=${date}T23:59:59`;

  const resp = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  });

  if (!resp.ok) return [];

  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("json")) return [];

  const data = await resp.json();
  if (!Array.isArray(data)) return [];

  const prices: SlotPrice[] = [];
  for (const resource of data) {
    if (!resource.slots || !Array.isArray(resource.slots)) continue;
    for (const slot of resource.slots) {
      if (!slot.price) continue;
      const priceStr = slot.price.split(" ")[0];
      const priceCents = Math.round(parseFloat(priceStr) * 100);
      if (isNaN(priceCents) || priceCents <= 0) continue;
      prices.push({
        startTime: slot.start_time,
        duration: slot.duration,
        priceCents,
      });
    }
  }

  return prices;
}

interface PricingResult {
  dbName: string;
  tenantId: string;
  slug: string;
  weekdayDate: string;
  weekendDate: string;
  weekdaySlots: number;
  weekendSlots: number;
  // 60-min slot prices
  minPrice60: number | null;
  maxPrice60: number | null;
  // 90-min slot prices (converted to per-hour)
  minPrice90: number | null;
  maxPrice90: number | null;
  // Final recommended values
  pricePerHourCents: number | null;
  pricePeakCents: number | null;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const weekday = getNextWeekday();
  const weekend = getNextWeekend();

  console.log(`Weekday: ${weekday}`);
  console.log(`Weekend: ${weekend}`);
  console.log(`Facilities: ${FACILITIES.length}`);
  console.log(`Mode: ${shouldApply ? "APPLY" : "scrape-only"} | ${overwrite ? "OVERWRITE" : "fill-gaps"}\n`);

  const results: PricingResult[] = [];

  for (let i = 0; i < FACILITIES.length; i++) {
    const f = FACILITIES[i];
    console.log(`[${i + 1}/${FACILITIES.length}] ${f.dbName}`);

    // Fetch weekday and weekend pricing
    const [weekdayPrices, weekendPrices] = await Promise.all([
      fetchPricing(f.tenantId, weekday),
      fetchPricing(f.tenantId, weekend),
    ]);

    // Combine all prices
    const allPrices = [...weekdayPrices, ...weekendPrices];

    // Separate 60-min and 90-min slots
    const prices60 = allPrices.filter((p) => p.duration === 60).map((p) => p.priceCents);
    const prices90 = allPrices.filter((p) => p.duration === 90).map((p) => p.priceCents);

    // Also accept 120-min slots
    const prices120 = allPrices.filter((p) => p.duration === 120).map((p) => p.priceCents);

    prices60.sort((a, b) => a - b);
    prices90.sort((a, b) => a - b);
    prices120.sort((a, b) => a - b);

    // Convert 90-min to per-hour (÷ 1.5)
    const prices90PerHour = prices90.map((p) => Math.round(p / 1.5));
    const prices120PerHour = prices120.map((p) => Math.round(p / 2));

    // Merge all per-hour prices
    const allPerHour = [...prices60, ...prices90PerHour, ...prices120PerHour].sort((a, b) => a - b);

    const minPrice = allPerHour.length > 0 ? allPerHour[0] : null;
    const maxPrice = allPerHour.length > 0 ? allPerHour[allPerHour.length - 1] : null;

    // Recommended values: min as off-peak, max as peak (only if meaningfully different)
    const pricePerHourCents = minPrice;
    const pricePeakCents = maxPrice && minPrice && maxPrice > minPrice * 1.15 ? maxPrice : null;

    const result: PricingResult = {
      dbName: f.dbName,
      tenantId: f.tenantId,
      slug: f.slug,
      weekdayDate: weekday,
      weekendDate: weekend,
      weekdaySlots: weekdayPrices.length,
      weekendSlots: weekendPrices.length,
      minPrice60: prices60.length > 0 ? prices60[0] : null,
      maxPrice60: prices60.length > 0 ? prices60[prices60.length - 1] : null,
      minPrice90: prices90.length > 0 ? prices90[0] : null,
      maxPrice90: prices90.length > 0 ? prices90[prices90.length - 1] : null,
      pricePerHourCents,
      pricePeakCents,
    };

    results.push(result);

    if (allPerHour.length > 0) {
      const range = pricePeakCents
        ? `$${(pricePerHourCents! / 100).toFixed(0)}-$${(pricePeakCents / 100).toFixed(0)}/hr`
        : `$${(pricePerHourCents! / 100).toFixed(0)}/hr`;
      console.log(`    ${range} (${allPerHour.length} slots across ${prices60.length > 0 ? "60" : ""}${prices90.length > 0 ? "/90" : ""}${prices120.length > 0 ? "/120" : ""}min)`);
    } else {
      console.log("    no slots available (closed/members-only/no availability)");
    }

    await sleep(500);
  }

  // Save raw results
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${OUTPUT_PATH}`);

  // Apply to DB if requested
  if (shouldApply) {
    console.log("\n─── Applying to Supabase ───\n");

    let applied = 0;
    let skipped = 0;

    for (const r of results) {
      if (!r.pricePerHourCents) {
        console.log(`  SKIP ${r.dbName} — no pricing data`);
        skipped++;
        continue;
      }

      // Find facility by name
      const { data: facilities } = await supabase
        .from("facilities")
        .select("id, name, price_per_hour_cents, price_peak_cents")
        .eq("status", "active")
        .ilike("name", r.dbName);

      if (!facilities || facilities.length === 0) {
        console.log(`  SKIP ${r.dbName} — not found in DB`);
        skipped++;
        continue;
      }

      const f = facilities[0];
      const payload: Record<string, unknown> = {};

      if (!f.price_per_hour_cents || overwrite) {
        payload.price_per_hour_cents = r.pricePerHourCents;
      }
      if (r.pricePeakCents && (!f.price_peak_cents || overwrite)) {
        payload.price_peak_cents = r.pricePeakCents;
      }

      if (Object.keys(payload).length === 0) {
        console.log(`  SKIP ${r.dbName} — already has pricing`);
        skipped++;
        continue;
      }

      const { error } = await supabase
        .from("facilities")
        .update(payload)
        .eq("id", f.id);

      if (error) {
        console.log(`  ERROR ${r.dbName}: ${error.message}`);
      } else {
        const fields = Object.entries(payload)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ");
        console.log(`  UPDATE ${r.dbName} → ${fields}`);
        applied++;
      }

      await sleep(50);
    }

    console.log(`\nApplied: ${applied} | Skipped: ${skipped}`);
  }

  // Summary
  const withPricing = results.filter((r) => r.pricePerHourCents != null);
  const noPricing = results.filter((r) => r.pricePerHourCents == null);

  console.log("\n========================================");
  console.log(`Total scraped:    ${results.length}`);
  console.log(`With pricing:     ${withPricing.length}`);
  console.log(`No data:          ${noPricing.length}`);
  if (noPricing.length > 0) {
    console.log(`  No data:        ${noPricing.map((r) => r.dbName).join(", ")}`);
  }
  console.log("========================================");
}

main().catch(console.error);
