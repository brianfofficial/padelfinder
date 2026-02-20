/**
 * Generate AI-powered city guide content using Claude API.
 *
 * For each city with 2+ facilities, calls Claude to produce:
 *   - guide_intro: 2-3 sentences about padel in that city
 *   - guide_body: 2-3 paragraphs covering what makes the city notable
 *
 * Usage:
 *   npx tsx scripts/generate-city-guides.ts [--force] [--limit N]
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!anthropicKey) {
  console.error("Missing ANTHROPIC_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

interface FacilityRow {
  name: string;
  avg_rating: number;
  total_courts: number;
  price_per_hour_cents: number | null;
  best_for_tags: string[] | null;
  indoor_courts: boolean;
  outdoor_courts: boolean;
}

interface GuideResponse {
  intro: string;
  body: string;
}

async function callClaude(
  cityName: string,
  stateAbbr: string,
  facilities: FacilityRow[]
): Promise<GuideResponse> {
  const facilityList = facilities
    .map((f) => {
      const parts = [`${f.name}: ${f.avg_rating.toFixed(1)}/5 rating`];
      if (f.total_courts > 0) parts.push(`${f.total_courts} courts`);
      if (f.price_per_hour_cents) parts.push(`$${(f.price_per_hour_cents / 100).toFixed(0)}/hr`);
      const types = [f.indoor_courts && "indoor", f.outdoor_courts && "outdoor"].filter(Boolean);
      if (types.length > 0) parts.push(types.join(" & "));
      if (f.best_for_tags && f.best_for_tags.length > 0) parts.push(`best for: ${f.best_for_tags.join(", ")}`);
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");

  const prompt = `You are writing a city guide for padel courts in ${cityName}, ${stateAbbr} for the PadelFinder directory.

Here are the ${facilities.length} facilities in ${cityName}:
${facilityList}

Provide a JSON response with:
1. "intro": 2-3 sentences about padel in ${cityName}. Mention the number of facilities (${facilities.length}), the top-rated venue by name, and the price range if available. Be specific and enthusiastic but not over-the-top.
2. "body": 2-3 paragraphs covering what makes ${cityName} notable for padel, tips for visitors (e.g. whether indoor or outdoor dominates, beginner-friendliness), and why players should check it out. Reference specific facility names where relevant.

Write in a helpful, informative tone aimed at someone searching "best padel courts in ${cityName}". Do NOT use markdown formatting in the text.

Respond with ONLY valid JSON, no markdown fences.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function main() {
  // Get cities with 2+ facilities
  const { data: cities, error: cErr } = await supabase
    .from("cities")
    .select("id, name, slug, state_slug, state_abbr, facility_count, guide_intro")
    .gte("facility_count", 2)
    .order("facility_count", { ascending: false });

  if (cErr || !cities) {
    console.error("Error fetching cities:", cErr?.message);
    process.exit(1);
  }

  const toProcess = force
    ? cities
    : cities.filter((c) => !c.guide_intro);

  const batch = toProcess.slice(0, limit);

  console.log(`Found ${cities.length} cities with 2+ facilities.`);
  console.log(`Processing ${batch.length} (${force ? "--force" : "skipping already generated"}).\n`);

  let processed = 0;
  let errors = 0;

  for (const city of batch) {
    console.log(
      `[${processed + 1}/${batch.length}] ${city.name}, ${city.state_abbr} (${city.facility_count} facilities)`
    );

    // Fetch facilities for this city
    const { data: facilities } = await supabase
      .from("facilities")
      .select("name, avg_rating, total_courts, price_per_hour_cents, best_for_tags, indoor_courts, outdoor_courts")
      .eq("city_slug", city.slug)
      .eq("state_slug", city.state_slug)
      .eq("status", "active")
      .order("avg_rating", { ascending: false });

    if (!facilities || facilities.length < 2) {
      console.log("  Skipping — insufficient facilities.");
      continue;
    }

    try {
      const guide = await callClaude(city.name, city.state_abbr, facilities);

      const { error: updateErr } = await supabase
        .from("cities")
        .update({
          guide_intro: guide.intro,
          guide_body: guide.body,
          guide_generated_at: new Date().toISOString(),
        })
        .eq("id", city.id);

      if (updateErr) {
        console.log(`  DB update error: ${updateErr.message}`);
        errors++;
      } else {
        console.log(`  Done — intro: ${guide.intro.slice(0, 80)}...`);
        processed++;
      }
    } catch (err) {
      console.log(`  Claude error: ${(err as Error).message}`);
      errors++;
    }

    await sleep(500);
  }

  console.log("\n========================================");
  console.log(`Processed: ${processed}`);
  console.log(`Errors:    ${errors}`);
  console.log("========================================");
}

main().catch(console.error);
