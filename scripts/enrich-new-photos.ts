/**
 * Fetch photos for new facilities that don't have images yet.
 * Uses the same SerpAPI Google Image Search approach as enrich-facilities.ts.
 *
 * Usage:
 *   npx tsx scripts/enrich-new-photos.ts
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serpApiKey = process.env.SERPAPI_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!serpApiKey) {
  console.error("Missing SERPAPI_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const PHOTO_BUCKET = "facility-photos";
const MAX_PHOTOS = 5;
const SEARCH_DELAY_MS = 1200;
const PHOTO_DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === PHOTO_BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(PHOTO_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error && !error.message.includes("already exists")) {
      console.error("Failed to create bucket:", error.message);
      process.exit(1);
    }
  }
}

async function fetchPhotos(dataId: string): Promise<string[]> {
  const params = new URLSearchParams({
    engine: "google_maps_photos",
    data_id: dataId,
    api_key: serpApiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const photos = data.photos ?? [];
  return photos
    .slice(0, MAX_PHOTOS)
    .map((p: { image?: string }) => p.image)
    .filter(Boolean);
}

async function searchForPhotos(name: string, city: string, state: string): Promise<string[]> {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: `${name} ${city} ${state}`,
    api_key: serpApiKey,
    type: "search",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const results = data.local_results ?? [];
  if (results.length === 0) return [];

  const match = results[0];
  if (!match.data_id) return [];

  await sleep(SEARCH_DELAY_MS);
  return fetchPhotos(match.data_id);
}

async function downloadPhoto(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

async function main() {
  await ensureBucket();

  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, slug, name, city, state, images")
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("Failed to fetch facilities:", error.message);
    process.exit(1);
  }

  // Filter to only facilities without images
  const noPhotos = facilities.filter(
    (f) => !f.images || f.images.length === 0,
  );

  console.log(
    `Found ${noPhotos.length} facilities without photos (of ${facilities.length} total).\n`,
  );

  let enriched = 0;
  let photosUploaded = 0;

  for (let i = 0; i < noPhotos.length; i++) {
    const f = noPhotos[i];
    console.log(`[${i + 1}/${noPhotos.length}] ${f.name}`);

    const photoSrcs = await searchForPhotos(f.name, f.city, f.state);
    console.log(`  Found ${photoSrcs.length} photos.`);

    if (photoSrcs.length === 0) {
      await sleep(SEARCH_DELAY_MS);
      continue;
    }

    const imageUrls: string[] = [];

    for (let j = 0; j < photoSrcs.length; j++) {
      const photoData = await downloadPhoto(photoSrcs[j]);
      if (!photoData) {
        console.log(`  Photo ${j + 1}: download failed.`);
        continue;
      }

      const storagePath = `${f.slug}/${j}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, photoData, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.log(`  Photo ${j + 1}: upload failed — ${uploadError.message}`);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
        imageUrls.push(publicUrl);
        photosUploaded++;
      }
      await sleep(PHOTO_DELAY_MS);
    }

    if (imageUrls.length > 0) {
      const { error: updateError } = await supabase
        .from("facilities")
        .update({ images: imageUrls })
        .eq("id", f.id);

      if (updateError) {
        console.log(`  DB update failed: ${updateError.message}`);
      } else {
        enriched++;
        console.log(`  Saved ${imageUrls.length} photos.`);
      }
    }

    await sleep(SEARCH_DELAY_MS);
  }

  console.log("\n========================================");
  console.log(`Enriched:     ${enriched}`);
  console.log(`Photos saved: ${photosUploaded}`);
  console.log(`Total:        ${noPhotos.length}`);
  console.log("========================================");
}

main().catch(console.error);
