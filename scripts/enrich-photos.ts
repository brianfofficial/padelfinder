/**
 * Enrich facilities with photos via Google Image Search (SerpAPI).
 * For facilities that weren't found on Google Maps, this finds photos
 * from news articles, social media, and facility websites.
 *
 * Usage:
 *   npx tsx scripts/enrich-photos.ts
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serpApiKey = process.env.SERPAPI_KEY!;

if (!supabaseUrl || !serviceKey || !serpApiKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const PHOTO_BUCKET = "facility-photos";
const MAX_PHOTOS = 3; // Conservative to save storage
const DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Search Google Images via SerpAPI */
async function searchImages(
  name: string,
  city: string,
  state: string,
): Promise<string[]> {
  const query = `${name} ${city} ${state} padel courts`;
  const params = new URLSearchParams({
    engine: "google_images",
    q: query,
    api_key: serpApiKey,
    num: "10",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  const images = data.images_results ?? [];

  // Filter for good quality images — prefer facility photos, skip tiny ones
  return images
    .filter((img: { original?: string; original_width?: number }) => {
      const url = img.original ?? "";
      const width = img.original_width ?? 0;
      // Skip low-res, SVGs, and generic stock photo sites
      if (width < 400) return false;
      if (url.includes("svg")) return false;
      if (url.includes("shutterstock")) return false;
      if (url.includes("gettyimages")) return false;
      if (url.includes("istockphoto")) return false;
      return true;
    })
    .slice(0, MAX_PHOTOS)
    .map((img: { original: string }) => img.original);
}

/** Download a photo */
async function downloadPhoto(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 5000) return null; // Skip tiny images
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

async function main() {
  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === PHOTO_BUCKET)) {
    await supabase.storage.createBucket(PHOTO_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });
  }

  // Get facilities with no photos
  const { data: facilities, error } = await supabase
    .from("facilities")
    .select("id, slug, name, city, state, images")
    .eq("status", "active")
    .order("name");

  if (error || !facilities) {
    console.error("Failed to fetch:", error?.message);
    process.exit(1);
  }

  // Filter to only those with empty images
  const needPhotos = facilities.filter(
    (f) => !f.images || f.images.length === 0,
  );

  console.log(
    `${needPhotos.length} facilities need photos (of ${facilities.length} total).\n`,
  );

  let enriched = 0;
  let totalPhotos = 0;

  for (let i = 0; i < needPhotos.length; i++) {
    const f = needPhotos[i];
    console.log(
      `[${i + 1}/${needPhotos.length}] ${f.name} (${f.city}, ${f.state})`,
    );

    const imageUrls = await searchImages(f.name, f.city, f.state);
    if (imageUrls.length === 0) {
      console.log("  No images found.");
      await sleep(DELAY_MS);
      continue;
    }

    console.log(`  Found ${imageUrls.length} candidate images.`);

    const uploadedUrls: string[] = [];

    for (let j = 0; j < imageUrls.length; j++) {
      const photoData = await downloadPhoto(imageUrls[j]);
      if (!photoData) {
        console.log(`  Image ${j + 1}: download failed.`);
        continue;
      }

      const ext = imageUrls[j].includes(".png") ? "png" : "jpg";
      const storagePath = `${f.slug}/${j}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(storagePath, photoData, {
          contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
          upsert: true,
        });

      if (uploadError) {
        console.log(`  Image ${j + 1}: upload error — ${uploadError.message}`);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
        uploadedUrls.push(publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      const { error: updateError } = await supabase
        .from("facilities")
        .update({ images: uploadedUrls })
        .eq("id", f.id);

      if (updateError) {
        console.log(`  DB update failed: ${updateError.message}`);
      } else {
        enriched++;
        totalPhotos += uploadedUrls.length;
        console.log(`  Saved ${uploadedUrls.length} photos.`);
      }
    }

    await sleep(DELAY_MS);
  }

  console.log("\n========================================");
  console.log(`Facilities with new photos: ${enriched}`);
  console.log(`Total photos uploaded:      ${totalPhotos}`);
  console.log(`Still missing:              ${needPhotos.length - enriched}`);
  console.log("========================================");
}

main().catch(console.error);
