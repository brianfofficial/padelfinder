/**
 * Audit all active facilities and report data completeness.
 * Identifies junk entries and catalogs gaps.
 *
 * Usage:
 *   npx tsx scripts/audit-facilities.ts
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// Patterns that indicate junk/non-facility entries
const JUNK_PATTERNS = [
  /^Court \d+$/i,
  /^Padel Court \d+$/i,
  /^padel en\s/i,
  /court construction/i,
  /^Padel PIckleball$/i,
  /^Padel Pickleball$/i,
  /^padel court$/i,
  /^tennis court$/i,
  /construction company/i,
  /contractor/i,
  /equipment|shop|store|retail/i,
  /^Court$/i,
];

function isJunk(name: string): boolean {
  return JUNK_PATTERNS.some((p) => p.test(name.trim()));
}

async function main() {
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error || !facilities) {
    console.error("Error fetching:", error?.message);
    process.exit(1);
  }

  console.log(`Total active facilities: ${facilities.length}\n`);

  // Identify junk entries
  const junkEntries = facilities.filter((f) => isJunk(f.name));
  const validEntries = facilities.filter((f) => !isJunk(f.name));

  // Also flag entries without google_place_id AND without a real address
  const suspicious = validEntries.filter(
    (f) =>
      !f.google_place_id &&
      (!f.address || f.address.length < 10) &&
      (!f.city || f.city.length < 2),
  );

  console.log("=== JUNK ENTRIES (auto-detected) ===");
  for (const j of junkEntries) {
    console.log(`  [${j.id}] "${j.name}" - ${j.city}, ${j.state}`);
  }
  console.log(`  Total junk: ${junkEntries.length}\n`);

  console.log("=== SUSPICIOUS ENTRIES (no place_id, minimal address) ===");
  for (const s of suspicious) {
    console.log(
      `  [${s.id}] "${s.name}" - city: "${s.city}", state: "${s.state}", addr: "${s.address}"`,
    );
  }
  console.log(`  Total suspicious: ${suspicious.length}\n`);

  // Data completeness audit on valid entries
  const fields = [
    { name: "google_place_id", check: (f: Record<string, unknown>) => !!f.google_place_id },
    { name: "google_rating", check: (f: Record<string, unknown>) => f.google_rating != null && f.google_rating !== 0 },
    { name: "google_review_count", check: (f: Record<string, unknown>) => f.google_review_count != null && Number(f.google_review_count) > 0 },
    { name: "website", check: (f: Record<string, unknown>) => !!f.website },
    { name: "phone", check: (f: Record<string, unknown>) => !!f.phone },
    { name: "address", check: (f: Record<string, unknown>) => !!f.address && String(f.address).length > 5 },
    { name: "description", check: (f: Record<string, unknown>) => !!f.description && String(f.description).length > 10 },
    { name: "hours", check: (f: Record<string, unknown>) => f.hours != null && typeof f.hours === "object" && Object.keys(f.hours as object).length > 0 },
    { name: "total_courts", check: (f: Record<string, unknown>) => f.total_courts != null && Number(f.total_courts) > 0 },
    { name: "surface_type", check: (f: Record<string, unknown>) => !!f.surface_type },
    { name: "indoor_courts", check: (f: Record<string, unknown>) => f.indoor_courts != null && Number(f.indoor_courts) >= 0 },
    { name: "outdoor_courts", check: (f: Record<string, unknown>) => f.outdoor_courts != null && Number(f.outdoor_courts) >= 0 },
    { name: "price_per_hour_cents", check: (f: Record<string, unknown>) => f.price_per_hour_cents != null && Number(f.price_per_hour_cents) > 0 },
    { name: "images", check: (f: Record<string, unknown>) => Array.isArray(f.images) && (f.images as unknown[]).length > 0 },
    { name: "latitude", check: (f: Record<string, unknown>) => f.latitude != null },
    { name: "longitude", check: (f: Record<string, unknown>) => f.longitude != null },
  ];

  console.log("=== DATA COMPLETENESS (valid entries only) ===");
  for (const field of fields) {
    const filled = validEntries.filter(field.check).length;
    const pct = ((filled / validEntries.length) * 100).toFixed(0);
    const bar = "█".repeat(Math.round(filled / validEntries.length * 20)).padEnd(20, "░");
    console.log(`  ${field.name.padEnd(24)} ${bar} ${filled}/${validEntries.length} (${pct}%)`);
  }

  // List all facility names for manual review
  console.log("\n=== ALL VALID FACILITIES ===");
  for (const f of validEntries) {
    const missing: string[] = [];
    if (!f.hours || Object.keys(f.hours).length === 0) missing.push("hours");
    if (!f.total_courts) missing.push("courts");
    if (!f.surface_type) missing.push("surface");
    if (!f.website) missing.push("website");
    if (!f.phone) missing.push("phone");
    if (!f.price_per_hour_cents) missing.push("pricing");
    if (!f.google_place_id) missing.push("place_id");

    const status = missing.length === 0 ? "✓ COMPLETE" : `missing: ${missing.join(", ")}`;
    console.log(`  ${f.name.padEnd(50)} ${status}`);
  }

  // Write audit data for downstream scripts
  const auditData = {
    junk: junkEntries.map((f) => ({ id: f.id, name: f.name, city: f.city, state: f.state })),
    suspicious: suspicious.map((f) => ({ id: f.id, name: f.name, city: f.city, state: f.state, address: f.address })),
    validWithPlaceId: validEntries
      .filter((f) => f.google_place_id)
      .map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        google_place_id: f.google_place_id,
        website: f.website,
        phone: f.phone,
        hasHours: !!(f.hours && Object.keys(f.hours).length > 0),
        hasCourts: !!f.total_courts,
        hasSurface: !!f.surface_type,
        hasPricing: !!f.price_per_hour_cents,
      })),
    validWithoutPlaceId: validEntries
      .filter((f) => !f.google_place_id)
      .map((f) => ({ id: f.id, name: f.name, city: f.city, state: f.state, website: f.website })),
    stats: {
      total: facilities.length,
      junk: junkEntries.length,
      suspicious: suspicious.length,
      valid: validEntries.length,
      withPlaceId: validEntries.filter((f) => f.google_place_id).length,
    },
  };

  writeFileSync(
    resolve(__dirname, "data/audit-results.json"),
    JSON.stringify(auditData, null, 2),
  );
  console.log("\nAudit data written to scripts/data/audit-results.json");
}

main().catch(console.error);
