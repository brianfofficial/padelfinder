/**
 * Geocoding utility using OpenStreetMap Nominatim (free, no API key).
 * Rate limit: 1 request per second. See https://operations.osmfoundation.org/policies/nominatim/
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: number;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
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

  const data: NominatimResult[] = await res.json();
  if (data.length === 0) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

/**
 * Batch geocode with rate limiting (1 req/sec for Nominatim).
 */
export async function batchGeocode(
  addresses: string[],
): Promise<(GeocodeResult | null)[]> {
  const results: (GeocodeResult | null)[] = [];
  for (const addr of addresses) {
    results.push(await geocodeAddress(addr));
    await sleep(1100);
  }
  return results;
}
