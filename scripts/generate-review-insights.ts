/**
 * Generate AI-powered review insights for facilities using Claude API.
 *
 * For each facility with 3+ reviews, calls Claude to produce:
 *   - review_summary: 2-3 sentence overview
 *   - review_pros: top positive themes
 *   - review_cons: top negative themes
 *   - best_for_tags: who this facility is best for
 *   - standout_quote: most representative review excerpt
 *
 * Also computes owner_response_rate locally.
 *
 * Usage:
 *   npx tsx scripts/generate-review-insights.ts [--force] [--limit N]
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

const BEST_FOR_OPTIONS = [
  "Beginners",
  "Intermediate Players",
  "Competitive Players",
  "Families",
  "Kids",
  "Social Groups",
  "Date Night",
  "Corporate Events",
  "Fitness Enthusiasts",
  "Tourists",
] as const;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

interface ReviewRow {
  text: string | null;
  comment: string | null;
  rating: number;
  author_name: string;
  owner_response: string | null;
}

interface InsightResponse {
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  standoutQuote: string;
}

async function callClaude(
  facilityName: string,
  reviews: ReviewRow[]
): Promise<InsightResponse> {
  const reviewTexts = reviews
    .map((r) => {
      const text = r.text || r.comment || "";
      return `- ${r.rating}/5 by ${r.author_name}: "${text.slice(0, 300)}"`;
    })
    .join("\n");

  const prompt = `You are analyzing Google reviews for a padel facility called "${facilityName}".

Here are ${reviews.length} reviews:
${reviewTexts}

Based on these reviews, provide a JSON response with:
1. "summary": A 2-3 sentence overview of what players think about this facility. Be specific and mention the facility name.
2. "pros": An array of 2-4 positive themes (short phrases, 3-6 words each).
3. "cons": An array of 0-3 negative themes (short phrases, 3-6 words each). Empty array if no negatives.
4. "bestFor": An array of 2-4 tags from this list ONLY: ${BEST_FOR_OPTIONS.join(", ")}
5. "standoutQuote": The most representative or compelling quote from the reviews (verbatim, max 150 chars).

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
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";

  // Parse JSON from response, stripping any markdown fences
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function main() {
  // Get facilities with 3+ reviews
  const { data: facilities, error: fErr } = await supabase
    .from("facilities")
    .select("id, name, slug, review_summary, review_count")
    .eq("status", "active")
    .gte("review_count", 3)
    .order("review_count", { ascending: false });

  if (fErr || !facilities) {
    console.error("Error fetching facilities:", fErr?.message);
    process.exit(1);
  }

  const toProcess = force
    ? facilities
    : facilities.filter((f) => !f.review_summary);

  const batch = toProcess.slice(0, limit);

  console.log(
    `Found ${facilities.length} facilities with 3+ reviews.`
  );
  console.log(
    `Processing ${batch.length} (${force ? "--force" : "skipping already summarized"}).\n`
  );

  let processed = 0;
  let errors = 0;

  for (const facility of batch) {
    console.log(
      `[${processed + 1}/${batch.length}] ${facility.name} (${facility.review_count} reviews)`
    );

    // Fetch reviews for this facility
    const { data: reviews } = await supabase
      .from("reviews")
      .select("text, comment, rating, author_name, owner_response")
      .eq("facility_id", facility.id)
      .eq("status", "approved")
      .order("helpful_count", { ascending: false })
      .limit(20);

    if (!reviews || reviews.length < 3) {
      console.log("  Skipping — insufficient reviews.");
      continue;
    }

    // Compute owner_response_rate locally
    const withResponse = reviews.filter((r) => r.owner_response).length;
    const ownerResponseRate = Math.round((withResponse / reviews.length) * 10000) / 100;

    try {
      const insights = await callClaude(facility.name, reviews);

      // Validate best_for_tags against allowed list
      const validTags = insights.bestFor.filter((t) =>
        BEST_FOR_OPTIONS.includes(t as (typeof BEST_FOR_OPTIONS)[number])
      );

      const { error: updateErr } = await supabase
        .from("facilities")
        .update({
          review_summary: insights.summary,
          review_pros: insights.pros,
          review_cons: insights.cons,
          best_for_tags: validTags,
          standout_quote: insights.standoutQuote?.slice(0, 150),
          owner_response_rate: ownerResponseRate,
        })
        .eq("id", facility.id);

      if (updateErr) {
        console.log(`  DB update error: ${updateErr.message}`);
        errors++;
      } else {
        console.log(`  Done — ${validTags.length} tags, ${insights.pros.length} pros, ${insights.cons.length} cons`);
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
