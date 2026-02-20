/**
 * Apply pricing research to Supabase facilities.
 * Compiled from 6 parallel research agents (Feb 2026).
 *
 * Updates: price_per_hour_cents, price_peak_cents.
 * Also deactivates non-facility entries discovered during research.
 *
 * Usage:
 *   npx tsx scripts/apply-pricing-research.ts [--dry-run] [--overwrite]
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

const dryRun = process.argv.includes("--dry-run");
const overwrite = process.argv.includes("--overwrite");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Non-facility entries to deactivate ───────────────────────────────
const DEACTIVATE_NAMES = [
  "Golden Padel",       // Travel/community group for 50+ padel players, not a facility
  "HiPadel",            // Investment/consulting company, not a facility
  "Padel Gurus",        // Coaching/promo service, not a fixed facility
  "pickleball lab",     // Pickleball-only venue, no padel courts
];

// ─── Pricing data ────────────────────────────────────────────────────
// All prices are PER COURT PER HOUR in cents.
// Per-person prices have been multiplied by 4 (standard doubles).

interface PricingUpdate {
  price_per_hour_cents: number;
  price_peak_cents?: number;
  notes?: string;
}

const PRICING_DATA = new Map<string, PricingUpdate>([
  // Batch 1
  ["Bay Padel - Sunnyvale", {
    price_per_hour_cents: 11200,
    price_peak_cents: 14000,
    notes: "$28/person off-peak, $35/person peak × 4",
  }],
  ["Brisas NYC at CityView", {
    price_per_hour_cents: 12000,
    price_peak_cents: 16000,
    notes: "$30/person off-peak, $40/person peak × 4 (member rates, $275/mo membership)",
  }],

  // Batch 2
  ["Cube Padel Chicago", {
    price_per_hour_cents: 6500,
    notes: "$65/hr per court confirmed",
  }],
  ["Cube Padel Houston", {
    price_per_hour_cents: 6500,
    notes: "$65/hr per court confirmed",
  }],
  ["Houston Padel Indoor", {
    price_per_hour_cents: 3000,
    price_peak_cents: 4000,
    notes: "$20-$40/hr range from directories, estimated $30/$40",
  }],
  ["Northwood Padel", {
    price_per_hour_cents: 6000,
    notes: "$60/hr per court confirmed on website",
  }],

  // Batch 3
  ["Olympus Padel", {
    price_per_hour_cents: 8000,
    notes: "Free 10am-4pm, $80/court/hr peak (7-10am, 4-9pm). Storing peak as standard.",
  }],
  ["Padel Alley", {
    price_per_hour_cents: 2000,
    price_peak_cents: 4000,
    notes: "$20-$40/court/hr range confirmed",
  }],
  ["Padel California", {
    price_per_hour_cents: 6400,
    notes: "$24/person non-member for 90 min = $96/court/90min = $64/court/hr",
  }],

  // Batch 4
  ["Padel Up", {
    price_per_hour_cents: 8000,
    price_peak_cents: 12000,
    notes: "$20/person off-peak, $30/person peak × 4 (Sterling, VA)",
  }],
  ["Padel Up - Century City", {
    price_per_hour_cents: 12000,
    notes: "$30/person × 4 = $120/court/hr",
  }],
  ["Padel Up - Culver City", {
    price_per_hour_cents: 8000,
    price_peak_cents: 16000,
    notes: "$20/person off-peak, $40/person peak × 4",
  }],
  ["Padeland", {
    price_per_hour_cents: 13000,
    price_peak_cents: 21000,
    notes: "$130/court off-peak est, $195-210/court peak (Brooklyn, NY)",
  }],
  ["PADELphia", {
    price_per_hour_cents: 13333,
    notes: "$50/person non-member for 90 min = $200/court/90min ≈ $133/court/hr",
  }],
  ["Palm Beach Padel", {
    price_per_hour_cents: 10000,
    notes: "$150/court per 1.5hr = $100/court/hr",
  }],

  // Batch 5
  ["Rad Padel", {
    price_per_hour_cents: 3600,
    price_peak_cents: 8400,
    notes: "Padel California parent brand rates: $36-$84/court/hr",
  }],
  ["Reserve Padel UES", {
    price_per_hour_cents: 20000,
    price_peak_cents: 30000,
    notes: "Same brand as Reserve Padel NYC: $50-$75/person × 4",
  }],
  ["RGV Padel Club", {
    price_per_hour_cents: 2000,
    notes: "Member rate $5/person × 4 = $20/court. Non-member rate unknown.",
  }],

  // Batch 6
  ["U-Padel Club", {
    price_per_hour_cents: 2300,
    price_peak_cents: 2800,
    notes: "$23/hr off-peak, $28/hr peak per court",
  }],
  ["U-Padel Woodlands", {
    price_per_hour_cents: 2000,
    price_peak_cents: 2800,
    notes: "$20/hr standard, $28/hr peak per court",
  }],
]);

// ─── Matching logic ──────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function shouldDeactivate(facilityName: string): boolean {
  const normName = normalize(facilityName);
  return DEACTIVATE_NAMES.some((d) => normalize(d) === normName);
}

/**
 * Match a DB facility name to a PRICING_DATA key.
 * 1. Exact normalized match
 * 2. DB name starts with research key (prefix match, min 6 chars)
 */
function findMatch(facilityName: string, researchKeys: string[]): string | null {
  const normName = normalize(facilityName);

  // 1. Exact match
  for (const key of researchKeys) {
    if (normalize(key) === normName) return key;
  }

  // 2. Prefix match (longer keys first to prefer specificity)
  const sortedKeys = [...researchKeys].sort(
    (a, b) => normalize(b).length - normalize(a).length,
  );
  for (const key of sortedKeys) {
    const normKey = normalize(key);
    if (normKey.length >= 6 && normName.startsWith(normKey)) return key;
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | ${overwrite ? "OVERWRITE" : "fill-gaps-only"}\n`);

  // Fetch all active facilities missing pricing
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, price_per_hour_cents, price_peak_cents, status")
    .eq("status", "active")
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  console.log(`Active facilities: ${facilities.length}\n`);

  const researchKeys = [...PRICING_DATA.keys()];
  let updated = 0;
  let deactivated = 0;
  let skipped = 0;
  let errors = 0;
  const unmatchedKeys = new Set(researchKeys);

  for (const f of facilities) {
    // Check deactivation first
    if (shouldDeactivate(f.name)) {
      console.log(`  [DEACTIVATE] ${f.name}`);
      if (!dryRun) {
        const { error: e } = await supabase
          .from("facilities")
          .update({ status: "inactive" })
          .eq("id", f.id);
        if (e) {
          console.log(`    Error: ${e.message}`);
          errors++;
        } else {
          deactivated++;
        }
      } else {
        deactivated++;
      }
      continue;
    }

    // Try to match pricing data
    const matchKey = findMatch(f.name, researchKeys);
    if (!matchKey) {
      skipped++;
      continue;
    }

    unmatchedKeys.delete(matchKey);
    const research = PRICING_DATA.get(matchKey)!;
    const payload: Record<string, unknown> = {};

    // Price per hour
    if (research.price_per_hour_cents) {
      if (!f.price_per_hour_cents || overwrite) {
        payload.price_per_hour_cents = research.price_per_hour_cents;
      }
    }

    // Peak price
    if (research.price_peak_cents) {
      if (!f.price_peak_cents || overwrite) {
        payload.price_peak_cents = research.price_peak_cents;
      }
    }

    if (Object.keys(payload).length === 0) {
      skipped++;
      continue;
    }

    const fields = Object.entries(payload)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`  [UPDATE] ${f.name} ← ${fields}`);
    if (research.notes) console.log(`           (${research.notes})`);

    if (!dryRun) {
      const { error: e } = await supabase
        .from("facilities")
        .update(payload)
        .eq("id", f.id);
      if (e) {
        console.log(`    Error: ${e.message}`);
        errors++;
      } else {
        updated++;
      }
      await sleep(50);
    } else {
      updated++;
    }
  }

  // Report unmatched keys
  if (unmatchedKeys.size > 0) {
    console.log(`\n  Unmatched research keys:`);
    for (const key of unmatchedKeys) {
      console.log(`    - "${key}"`);
    }
  }

  console.log("\n========================================");
  console.log(`Updated:      ${updated}`);
  console.log(`Deactivated:  ${deactivated}`);
  console.log(`Skipped:      ${skipped}`);
  console.log(`Errors:       ${errors}`);
  console.log(`Unmatched:    ${unmatchedKeys.size}`);
  console.log("========================================");
}

main().catch(console.error);
