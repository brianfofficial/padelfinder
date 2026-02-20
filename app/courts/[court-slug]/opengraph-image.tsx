import { ImageResponse } from "next/og";
import { getFacilityBySlug } from "@/lib/queries/facilities";

export const alt = "PadelFinder Facility";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ "court-slug": string }>;
}) {
  const { "court-slug": slug } = await params;
  const facility = await getFacilityBySlug(slug);

  if (!facility) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f2440",
            color: "white",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          PadelFinder
        </div>
      ),
      { ...size }
    );
  }

  const rating = facility.google_rating ?? facility.avg_rating ?? 0;
  const reviewCount = facility.google_review_count || facility.review_count || 0;
  const courtType = [
    facility.indoor_courts && "Indoor",
    facility.outdoor_courts && "Outdoor",
  ]
    .filter(Boolean)
    .join(" & ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f2440",
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
            color: "#60a5fa",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          PadelFinder
        </div>

        {/* Facility name */}
        <div
          style={{
            marginTop: 40,
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          {facility.name.length > 35
            ? facility.name.slice(0, 33) + "..."
            : facility.name}
        </div>

        {/* Location */}
        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            color: "#94a3b8",
            display: "flex",
          }}
        >
          {facility.city}, {facility.state_abbr}
        </div>

        {/* Stats row */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 40,
          }}
        >
          {/* Rating */}
          {rating > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {rating.toFixed(1)} ★
              </div>
              <div style={{ fontSize: 18, color: "#94a3b8", display: "flex" }}>
                {reviewCount > 0 ? `${reviewCount} reviews` : "rating"}
              </div>
            </div>
          )}

          {/* Courts */}
          {facility.total_courts > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                }}
              >
                {facility.total_courts}
              </div>
              <div style={{ fontSize: 18, color: "#94a3b8", display: "flex" }}>
                {facility.total_courts === 1 ? "court" : "courts"}
                {courtType ? ` · ${courtType}` : ""}
              </div>
            </div>
          )}

          {/* Price */}
          {facility.price_per_hour_cents && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                }}
              >
                ${(facility.price_per_hour_cents / 100).toFixed(0)}
              </div>
              <div style={{ fontSize: 18, color: "#94a3b8", display: "flex" }}>
                per hour
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
