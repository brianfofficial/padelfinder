/**
 * Refine coordinates for facilities in facilities.json using Nominatim.
 * Usage: npx tsx scripts/geocode-facilities.ts
 *
 * Only updates facilities whose coordinates look approximate (round numbers)
 * or are missing. Writes results back to facilities.json.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface Facility {
  name: string;
  address: string;
  city: string;
  state: string;
  state_abbr: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  [key: string]: unknown;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isApproximate(lat: number, lng: number): boolean {
  // Check if coordinates are round (likely approximate)
  const latStr = lat.toString();
  const lngStr = lng.toString();
  const latDecimals = latStr.includes(".") ? latStr.split(".")[1].length : 0;
  const lngDecimals = lngStr.includes(".") ? lngStr.split(".")[1].length : 0;
  return latDecimals <= 2 || lngDecimals <= 2 || lat === 0 || lng === 0;
}

async function geocode(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    q: address,
    format: "json",
    limit: "1",
    countrycodes: "us",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "PadelFinder/1.0 (hello@padelfinder.com)" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.length === 0) return null;

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function main() {
  const filePath = join(__dirname, "data", "facilities.json");
  const facilities: Facility[] = JSON.parse(readFileSync(filePath, "utf-8"));

  let updated = 0;
  for (const f of facilities) {
    if (!isApproximate(f.latitude, f.longitude)) continue;

    const fullAddress = `${f.address}, ${f.city}, ${f.state_abbr} ${f.zip_code}`;
    console.log(`Geocoding: ${f.name} (${fullAddress})`);

    const result = await geocode(fullAddress);
    if (result) {
      console.log(
        `  ${f.latitude},${f.longitude} → ${result.lat},${result.lng}`,
      );
      f.latitude = result.lat;
      f.longitude = result.lng;
      updated++;
    } else {
      console.log(`  No result found`);
    }

    await sleep(1100); // Nominatim rate limit
  }

  writeFileSync(filePath, JSON.stringify(facilities, null, 2) + "\n");
  console.log(`\nDone. Updated ${updated}/${facilities.length} facilities.`);
}

main().catch(console.error);
