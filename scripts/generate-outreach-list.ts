/**
 * Generate a CSV of facilities suitable for outreach (badge embed + claim listing).
 * Prioritizes facilities with websites and high ratings.
 *
 * Usage:
 *   npx tsx scripts/generate-outreach-list.ts
 *
 * Output: scripts/outreach/outreach-list.csv
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("name, slug, city, state_abbr, avg_rating, google_rating, review_count, google_review_count, website, email, phone, website_live, verification_status")
    .eq("status", "active")
    .order("google_rating", { ascending: false, nullsFirst: false });

  if (error || !facilities) {
    console.error("Error fetching facilities:", error?.message);
    process.exit(1);
  }

  // Prioritize: has website, high rating, not already claimed
  const prioritized = facilities
    .filter((f) => f.website)
    .sort((a, b) => {
      const ratingA = a.google_rating ?? a.avg_rating ?? 0;
      const ratingB = b.google_rating ?? b.avg_rating ?? 0;
      return ratingB - ratingA;
    });

  // Build CSV
  const header = "Name,Slug,City,State,Rating,Reviews,Website,Email,Phone,Badge URL,Listing URL,Status";
  const rows = prioritized.map((f) => {
    const rating = f.google_rating ?? f.avg_rating ?? 0;
    const reviews = f.google_review_count || f.review_count || 0;
    const badgeUrl = `https://padelfinder.com/badge/${f.slug}`;
    const listingUrl = `https://padelfinder.com/courts/${f.slug}`;

    return [
      `"${f.name.replace(/"/g, '""')}"`,
      f.slug,
      `"${f.city}"`,
      f.state_abbr,
      rating.toFixed(1),
      reviews,
      f.website ?? "",
      f.email ?? "",
      f.phone ?? "",
      badgeUrl,
      listingUrl,
      f.verification_status ?? "unverified",
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const outPath = resolve(__dirname, "outreach/outreach-list.csv");
  writeFileSync(outPath, csv);

  console.log(`Generated outreach list: ${outPath}`);
  console.log(`  Total facilities with websites: ${prioritized.length}`);
  console.log(`  Top 10 by rating:`);
  prioritized.slice(0, 10).forEach((f, i) => {
    const rating = f.google_rating ?? f.avg_rating ?? 0;
    console.log(`    ${i + 1}. ${f.name} (${rating.toFixed(1)}) — ${f.city}, ${f.state_abbr}`);
  });
}

main().catch(console.error);
