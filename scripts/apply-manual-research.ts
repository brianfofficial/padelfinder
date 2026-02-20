/**
 * Apply manually-researched facility data to Supabase.
 * Compiled from web research across 6 parallel agents.
 *
 * Updates: total_courts, indoor/outdoor counts & booleans,
 * surface_type, price_per_hour_cents, price_peak_cents.
 *
 * Also deactivates non-facility entries (manufacturers, retailers, etc.).
 *
 * Usage:
 *   npx tsx scripts/apply-manual-research.ts [--dry-run] [--overwrite]
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
// Deactivation uses exact (case-insensitive) name matching to avoid false positives.
const DEACTIVATE_NAMES = [
  "Absolute Padel",
  "Koa Padel",
  "Padel Padel",
  "Mondo Padel",
  "Marcos del Pilar - PADEL USA",
  "United States Padel Association",
  "Apex Padel Club",
  "Pagoda Paddle",
  "Pr Events",
  "Turf and Courts",
  "Padel Courts",              // Platform tennis (Farmington), not padel
];

// ─── Researched data ──────────────────────────────────────────────────
// All prices are PER COURT PER HOUR in cents.
// Per-person prices have been multiplied by 4 (standard doubles).

interface FacilityUpdate {
  total_courts?: number;
  indoor_courts?: boolean;
  outdoor_courts?: boolean;
  indoor_court_count?: number;
  outdoor_court_count?: number;
  surface_type?: string;
  price_per_hour_cents?: number;
  price_peak_cents?: number;
}

const RESEARCH_DATA: Record<string, FacilityUpdate> = {
  // ── Batch 1 ──
  "ACCESS PADEL": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Bay Padel - Dogpatch": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6000, price_peak_cents: 8000, // $15/$20 per person × 4
  },
  "Bay Padel - Sunnyvale": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Bay Padel - Treasure Island": {
    total_courts: 6, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 4, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4000, price_peak_cents: 6000, // $10/$15 per person × 4
  },
  "BMorePadel": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Brisas NYC at CityView Racquet Club": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "BullDog - Padel Unleashed": {
    total_courts: 6, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 6,
    surface_type: "Artificial Grass",
  },
  "Casa de Padel HTX": {
    surface_type: "Artificial Grass",
  },
  "Charlotte Padel Club": {
    total_courts: 6, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 6,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 10000, price_peak_cents: 10000, // $25/person × 4
  },
  "Club Padel Newtown": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "Club Pickle & Padel": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6500, price_peak_cents: 6500,
  },
  "Conquer Padel Jax Beach": {
    total_courts: 7, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 7, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Cube Padel Chicago": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Cube Padel Houston": {
    total_courts: 5, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 5, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },

  // ── Batch 2 ──
  "Epic Padel": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5500,
  },
  "Glassbox Padel Club": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6000, price_peak_cents: 8000,
  },
  "Golden Padel": {
    total_courts: 1, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 1,
    surface_type: "Artificial Grass",
  },
  "Golden Point Padel Club": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5500,
  },
  "HiPadel": {
    total_courts: 1, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 1,
    surface_type: "Artificial Grass",
  },
  "Houston Padel Indoor": {
    total_courts: 5, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 5, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "iPadel Houston": {
    total_courts: 2, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4500,
  },
  "La Casa del Padel": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4800, price_peak_cents: 5400,
  },
  "Legacy Padel": {
    surface_type: "Artificial Grass",
  },
  "Let's Go Pickleball & Padel": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Mink Padel": {
    total_courts: 2, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
  },

  // ── Batch 3 ──
  "NorthPoint Padel": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 8000, price_peak_cents: 10000, // $20/$25 per person × 4
  },
  "Northwood Padel": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Olympus Padel": {
    surface_type: "Artificial Grass",
  },
  "Open Padel Club": {
    total_courts: 5, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 5, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Padel + Pickle": {
    total_courts: 6, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 6, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 8000, price_peak_cents: 8000,
  },
  "Padel 956": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4500, price_peak_cents: 4500,
  },
  "Padel Alley": {
    total_courts: 8, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 8,
    surface_type: "Artificial Grass",
  },
  "Padel AZ": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 7000, price_peak_cents: 7000,
  },
  "PADEL CLUB AUSTIN": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "Padel Club El Paso": {
    total_courts: 3, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 3,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 3300, price_peak_cents: 3300,
  },
  "Padel Country Club Katy": {
    total_courts: 5, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 1, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "Padel Country Club Memorial": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Padel Gurus": {
    surface_type: "Artificial Grass",
  },
  "PADEL LIFE & SOCCER": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 8000, price_peak_cents: 8000,
  },

  // ── Batch 4 ──
  "Padel MKE": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5000, price_peak_cents: 8000, // $12.50/$20 per person × 4
  },
  "Padel Plant": {
    total_courts: 5, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 3, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6000, price_peak_cents: 8000,
  },
  "Padel Plus": {
    surface_type: "Artificial Grass",
  },
  "Padel Up": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Padel Up - Century City": {
    total_courts: 2, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
  },
  "Padel Up - Culver City": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Padel World Play": {
    total_courts: 5, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 1, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "Padel X Boca Raton": {
    total_courts: 8, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 8, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Padel X Miami": {
    total_courts: 10, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 10,
    surface_type: "Artificial Grass",
  },
  "Padeland": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "PADELphia": {
    total_courts: 3, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 3, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Palm Beach Padel": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "PATL": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6000, price_peak_cents: 6000,
  },
  "Proximo Padel": {
    total_courts: 7, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 7, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },

  // ── Batch 5 ──
  "Pulse Padel Hub": {
    total_courts: 10, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 4, outdoor_court_count: 6,
    surface_type: "Artificial Grass",
  },
  "Pura Padel": {
    total_courts: 4, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 2, outdoor_court_count: 2,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5500,
  },
  "Reserve Padel NYC": {
    total_courts: 3, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 3,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 20000, price_peak_cents: 30000, // $50-$75/person × 4
  },
  "RGV Padel Club": {
    total_courts: 7, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 7,
    surface_type: "Artificial Grass",
  },
  "Serve & Smash": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 14000, price_peak_cents: 18000, // $35/$45 per person × 4
  },
  "Slice Padel": {
    surface_type: "Artificial Grass",
  },
  "SMART PADEL HOUSE": {
    total_courts: 1, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 1, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Smash Padel": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "Sunset Padel": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "TEMPO Padel": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4000, price_peak_cents: 6000,
  },
  "The King of Padel": {
    total_courts: 6, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 6, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "The ONE Padel Club": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "U-Padel Club": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "U-Padel Woodlands": {
    total_courts: 7, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 7, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "West43 Padel": {
    surface_type: "Artificial Grass",
  },

  // ── Batch 6 ──
  "Woodlands Padel": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6500,
  },
  "Zmash Padel": {
    total_courts: 8, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 8, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 6000,
  },
  "Austin Padel Center": {
    total_courts: 9, indoor_courts: true, outdoor_courts: true,
    indoor_court_count: 6, outdoor_court_count: 3,
    surface_type: "Artificial Grass",
  },
  "North Park Paddle Courts": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4500,
  },
  "Regency Padel": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "Reserve Padel UES": {
    total_courts: 2, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 2, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },

  // ── Batch 6 corrections to existing data ──
  "Matt's Pickle": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false, // 4 padel courts (not 10 — 6 are pickleball)
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4500,
  },
  "Mesa Padel": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 3000, price_peak_cents: 6000, // $7.50/$15 per person × 4
  },
  "Padel California": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "Padel Quattro": {
    total_courts: 5, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 5,
    surface_type: "Artificial Grass",
  },
  "Padel Square": {
    total_courts: 6, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 6, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Racket Social Club": {
    total_courts: 4, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 4, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Viva Flourtown": {
    total_courts: 5, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 5, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5000, price_peak_cents: 7000,
  },
  "VIVA Padel": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true, // 4 padel courts (not 5)
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 5000, price_peak_cents: 7000,
  },
  "Woodlands W-Padel": {
    total_courts: 3, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 3,
    surface_type: "Artificial Grass",
  },
  "Padel United": {
    total_courts: 7, indoor_courts: true, outdoor_courts: false, // 7 courts (not 2)
    indoor_court_count: 7, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
  },
  "Park Padel": {
    total_courts: 6, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 6,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 10000, price_peak_cents: 16000, // $25/$40 per person × 4
  },
  "Racket Social Club Alpharetta": {
    total_courts: 4, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 4,
    surface_type: "Artificial Grass",
  },
  "Pick and Padel": {
    total_courts: 3, indoor_courts: false, outdoor_courts: true,
    indoor_court_count: 0, outdoor_court_count: 3,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 3400, // $8.50/person × 4
  },
  "Padel Pals": {
    total_courts: 7, indoor_courts: true, outdoor_courts: false,
    indoor_court_count: 7, outdoor_court_count: 0,
    surface_type: "Artificial Grass",
    price_per_hour_cents: 4000,
  },
};

// ─── Matching ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findMatch(
  facilityName: string,
  researchKeys: string[],
): string | null {
  const normName = normalize(facilityName);

  // 1. Exact normalized match
  for (const key of researchKeys) {
    if (normalize(key) === normName) return key;
  }

  // 2. DB name starts with research key (key is prefix of name)
  //    Sorted by key length descending so longer/more-specific keys match first
  const sortedKeys = [...researchKeys].sort(
    (a, b) => normalize(b).length - normalize(a).length,
  );
  for (const key of sortedKeys) {
    const normKey = normalize(key);
    if (normKey.length >= 6 && normName.startsWith(normKey)) return key;
  }

  return null;
}

function shouldDeactivate(facilityName: string): boolean {
  // Exact case-insensitive match to avoid false positives
  const normName = normalize(facilityName);
  return DEACTIVATE_NAMES.some((d) => normalize(d) === normName);
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | ${overwrite ? "OVERWRITE" : "fill-gaps-only"}\n`);

  // Fetch all active facilities
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, total_courts, surface_type, indoor_courts, outdoor_courts, indoor_court_count, outdoor_court_count, price_per_hour_cents, price_peak_cents, status")
    .eq("status", "active")
    .order("name");

  if (error || !facilities) {
    console.error("Error:", error?.message);
    process.exit(1);
  }

  console.log(`Active facilities: ${facilities.length}\n`);

  const researchKeys = Object.keys(RESEARCH_DATA);
  const matchedKeys = new Set<string>();

  let updated = 0;
  let deactivated = 0;
  let skipped = 0;
  let errors = 0;

  let courtsAdded = 0;
  let surfaceAdded = 0;
  let pricingAdded = 0;

  for (const f of facilities) {
    // Check if this should be deactivated
    if (shouldDeactivate(f.name)) {
      console.log(`  [DEACTIVATE] ${f.name}`);
      if (!dryRun) {
        const { error: deactError } = await supabase
          .from("facilities")
          .update({ status: "inactive" })
          .eq("id", f.id);
        if (deactError) {
          console.log(`    Error: ${deactError.message}`);
          errors++;
        } else {
          deactivated++;
        }
        await sleep(50);
      } else {
        deactivated++;
      }
      continue;
    }

    // Find matching research data
    const matchKey = findMatch(f.name, researchKeys);
    if (!matchKey) {
      skipped++;
      continue;
    }
    matchedKeys.add(matchKey);

    const research = RESEARCH_DATA[matchKey];
    const payload: Record<string, unknown> = {};

    // Courts
    if (research.total_courts != null) {
      if (!f.total_courts || overwrite) {
        payload.total_courts = research.total_courts;
        courtsAdded++;
      }
      // Always set indoor/outdoor details if we have court data
      if (research.indoor_court_count != null && (!f.indoor_court_count || overwrite)) {
        payload.indoor_court_count = research.indoor_court_count;
        if (research.indoor_courts != null) payload.indoor_courts = research.indoor_courts;
      }
      if (research.outdoor_court_count != null && (!f.outdoor_court_count || overwrite)) {
        payload.outdoor_court_count = research.outdoor_court_count;
        if (research.outdoor_courts != null) payload.outdoor_courts = research.outdoor_courts;
      }
    }

    // Surface
    if (research.surface_type) {
      if (!f.surface_type || overwrite) {
        payload.surface_type = research.surface_type;
        surfaceAdded++;
      }
    }

    // Pricing
    if (research.price_per_hour_cents) {
      if (!f.price_per_hour_cents || overwrite) {
        payload.price_per_hour_cents = research.price_per_hour_cents;
        if (research.price_peak_cents) {
          payload.price_peak_cents = research.price_peak_cents;
        }
        pricingAdded++;
      }
    }

    if (Object.keys(payload).length === 0) {
      skipped++;
      continue;
    }

    const fields = Object.keys(payload).join(", ");
    console.log(`  [UPDATE] ${f.name}: ${fields}`);

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from("facilities")
        .update(payload)
        .eq("id", f.id);

      if (updateError) {
        console.log(`    Error: ${updateError.message}`);
        errors++;
      } else {
        updated++;
      }
      await sleep(50);
    } else {
      updated++;
    }
  }

  // Report unmatched research keys
  const unmatched = researchKeys.filter((k) => !matchedKeys.has(k));
  if (unmatched.length > 0) {
    console.log(`\n  Unmatched research keys (${unmatched.length}):`);
    for (const k of unmatched) {
      console.log(`    - "${k}"`);
    }
  }

  console.log("\n========================================");
  console.log(`Updated:         ${updated}`);
  console.log(`Deactivated:     ${deactivated}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Errors:          ${errors}`);
  console.log(`Courts added:    ${courtsAdded}`);
  console.log(`Surface added:   ${surfaceAdded}`);
  console.log(`Pricing added:   ${pricingAdded}`);
  console.log("========================================");

  if (dryRun) {
    console.log("\n(Dry run — no changes were made. Remove --dry-run to apply.)");
  }
}

main().catch(console.error);
