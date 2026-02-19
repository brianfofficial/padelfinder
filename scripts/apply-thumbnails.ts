/**
 * Quick one-off: set scraper thumbnails as images for new facilities that lack photos.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const newFacilities = JSON.parse(
    readFileSync(resolve(__dirname, "data/new-facilities.json"), "utf-8"),
  );

  let updated = 0;

  for (const entry of newFacilities) {
    const { scraperData } = entry;
    const thumb = scraperData.thumbnail;
    if (!thumb || thumb === "null") continue;

    const slug = slugify(scraperData.title);
    const { data: facility } = await supabase
      .from("facilities")
      .select("id, images")
      .eq("slug", slug)
      .single();

    if (!facility) continue;
    if (facility.images && facility.images.length > 0) continue;

    const { error } = await supabase
      .from("facilities")
      .update({ images: [thumb] })
      .eq("id", facility.id);

    if (!error) updated++;
  }

  console.log(`Updated ${updated} facilities with thumbnail images.`);
}

main().catch(console.error);
