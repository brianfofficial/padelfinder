/**
 * Enrich facilities with Google Maps data via SerpAPI.
 * Fetches ratings, review counts, and photos.
 *
 * Usage:
 *   npx tsx scripts/enrich-facilities.ts
 *
 * Expects in .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SERPAPI_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

// Load .env.local
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

interface SerpLocalResult {
  place_id: string;
  data_id?: string;
  title: string;
  rating?: number;
  reviews?: number;
  reviews_original?: string;
  thumbnail?: string;
  photos_link?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  address?: string;
}

/** Run a single Google Maps search */
async function doSearch(
  query: string,
): Promise<SerpLocalResult[] | null> {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: query,
    api_key: serpApiKey,
    type: "search",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`  SerpAPI error (${res.status}): ${text.slice(0, 200)}`);
    return null;
  }

  const data = await res.json();
  return (data.local_results ?? []) as SerpLocalResult[];
}

/** Search Google Maps via SerpAPI for a facility */
async function searchPlace(
  name: string,
  city: string,
  state: string,
  address: string,
): Promise<{
  placeId: string;
  dataId: string | null;
  rating: number | null;
  reviewCount: number;
} | null> {
  // Strategy 1: Just the facility name (most already include location)
  let results = await doSearch(name);

  // Strategy 2: Name + city (if no results)
  if (!results || results.length === 0) {
    await sleep(SEARCH_DELAY_MS);
    console.log("  Retry: name + city...");
    results = await doSearch(`${name} ${city}`);
  }

  if (!results || results.length === 0) return null;

  // Find best match — prefer name overlap
  const nameWords = name.toLowerCase().split(/\s+/);
  const match =
    results.find((r) => {
      const title = r.title.toLowerCase();
      // At least 2 words from facility name appear in result title
      const matchCount = nameWords.filter((w) => title.includes(w)).length;
      return matchCount >= 2;
    }) ?? results[0];

  // Parse review count
  let reviewCount = match.reviews ?? 0;
  if (!reviewCount && match.reviews_original) {
    const m = match.reviews_original.match(/(\d[\d,]*)/);
    if (m) reviewCount = parseInt(m[1].replace(/,/g, ""), 10);
  }

  return {
    placeId: match.place_id,
    dataId: match.data_id ?? null,
    rating: match.rating ?? null,
    reviewCount,
  };
}

/** Fetch photos for a place using data_id */
async function fetchPhotos(
  dataId: string,
): Promise<string[]> {
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

/** Download a photo from a URL */
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
    console.log(`Created storage bucket: ${PHOTO_BUCKET}`);
  }
}

async function main() {
  await ensureBucket();

  // Fetch facilities that haven't been enriched yet
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, slug, name, city, state, address, google_place_id")
    .is("google_place_id", null)
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("Failed to fetch facilities:", error.message);
    process.exit(1);
  }

  console.log(
    `Found ${facilities.length} facilities to enrich.\n`,
  );

  let enriched = 0;
  let unmatched = 0;
  let photosUploaded = 0;

  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    console.log(
      `[${i + 1}/${facilities.length}] ${f.name} (${f.city}, ${f.state})`,
    );

    // Search via SerpAPI
    const place = await searchPlace(f.name, f.city, f.state, f.address);

    if (!place) {
      console.log("  No match — skipping.");
      unmatched++;
      await sleep(SEARCH_DELAY_MS);
      continue;
    }

    console.log(
      `  Match: ${place.placeId} | rating: ${place.rating} | reviews: ${place.reviewCount}`,
    );

    // Try to get photos if we have a data_id
    const imageUrls: string[] = [];
    if (place.dataId) {
      const photoSrcs = await fetchPhotos(place.dataId);
      console.log(`  Found ${photoSrcs.length} photos.`);

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
    }

    // Update facility record
    const { error: updateError } = await supabase
      .from("facilities")
      .update({
        google_place_id: place.placeId,
        google_rating: place.rating,
        google_review_count: place.reviewCount,
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
      })
      .eq("id", f.id);

    if (updateError) {
      console.log(`  DB update failed: ${updateError.message}`);
    } else {
      enriched++;
      console.log(
        `  Saved: ${imageUrls.length} photos, rating ${place.rating}.`,
      );
    }

    await sleep(SEARCH_DELAY_MS);
  }

  console.log("\n========================================");
  console.log(`Enriched:     ${enriched}`);
  console.log(`Unmatched:    ${unmatched}`);
  console.log(`Photos saved: ${photosUploaded}`);
  console.log(`Total:        ${facilities.length}`);
  console.log("========================================");
}

main().catch(console.error);
