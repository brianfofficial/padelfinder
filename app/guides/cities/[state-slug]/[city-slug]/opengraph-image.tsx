import { ImageResponse } from "next/og";
import { getCityGuide } from "@/lib/queries/cities";

export const alt = "PadelFinder City Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ "state-slug": string; "city-slug": string }>;
}) {
  const { "state-slug": stateSlug, "city-slug": citySlug } = await params;
  const city = await getCityGuide(citySlug, stateSlug);

  const cityName = city?.name ?? "City";
  const stateAbbr = city?.state_abbr ?? "";
  const facilityCount = city?.facility_count ?? 0;
  const year = new Date().getFullYear();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f6b3a",
          padding: 60,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#86efac",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          PadelFinder · City Guide
        </div>

        {/* Label */}
        <div
          style={{
            marginTop: 40,
            fontSize: 24,
            color: "#bbf7d0",
            fontWeight: 500,
            textTransform: "uppercase" as const,
            letterSpacing: 2,
            display: "flex",
          }}
        >
          Best Padel Courts in
        </div>

        {/* City name */}
        <div
          style={{
            marginTop: 8,
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          {cityName}
          {stateAbbr ? `, ${stateAbbr}` : ""}
        </div>

        {/* Year */}
        <div
          style={{
            marginTop: 12,
            fontSize: 32,
            color: "#bbf7d0",
            fontWeight: 600,
            display: "flex",
          }}
        >
          {year} Guide
        </div>

        {/* Bottom stats */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 40,
          }}
        >
          {facilityCount > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                }}
              >
                {facilityCount}
              </div>
              <div style={{ fontSize: 18, color: "#bbf7d0", display: "flex" }}>
                {facilityCount === 1 ? "facility" : "facilities"} ranked
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
