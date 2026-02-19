/**
 * Verify facility websites are live using HTTP HEAD requests.
 * Updates the website_live boolean for all facilities with website URLs.
 *
 * Usage:
 *   npx tsx scripts/verify-websites.ts
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkWebsite(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "PadelFinder-Bot/1.0 (website verification)",
      },
    });

    clearTimeout(timeout);
    return response.ok || response.status === 405; // 405 = HEAD not allowed but site exists
  } catch {
    // Try GET as fallback (some servers don't support HEAD)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "PadelFinder-Bot/1.0 (website verification)",
        },
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function main() {
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, name, website")
    .not("website", "is", null)
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("Failed to fetch facilities:", error.message);
    process.exit(1);
  }

  console.log(`Checking ${facilities.length} facility websites.\n`);

  let live = 0;
  let down = 0;
  let updateErrors = 0;

  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    console.log(`[${i + 1}/${facilities.length}] ${f.name}`);

    const isLive = await checkWebsite(f.website);
    console.log(`  ${f.website} — ${isLive ? "LIVE" : "DOWN"}`);

    const { error: updateError } = await supabase
      .from("facilities")
      .update({ website_live: isLive })
      .eq("id", f.id);

    if (updateError) {
      console.log(`  Update error: ${updateError.message}`);
      updateErrors++;
    } else {
      isLive ? live++ : down++;
    }

    await sleep(200);
  }

  console.log("\n========================================");
  console.log(`Live:    ${live}`);
  console.log(`Down:    ${down}`);
  console.log(`Errors:  ${updateErrors}`);
  console.log(`Total:   ${facilities.length}`);
  console.log("========================================");
}

main().catch(console.error);
