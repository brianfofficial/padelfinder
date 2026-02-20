import { NextRequest, NextResponse } from "next/server";
import { createStaticClient, isSupabaseConfigured } from "@/lib/supabase/server";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateBadgeSvg(name: string, rating: number): string {
  const displayName = name.length > 28 ? name.slice(0, 26) + "..." : name;
  const stars = rating > 0 ? `${rating.toFixed(1)} ★` : "";
  const width = 220;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60" viewBox="0 0 ${width} 60">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="100%" stop-color="#152b47"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="60" rx="8" fill="url(#bg)"/>
  <rect x="1" y="1" width="${width - 2}" height="58" rx="7" fill="none" stroke="#2d5a8e" stroke-width="1"/>
  <text x="12" y="22" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#ffffff">${escapeXml(displayName)}</text>
  ${stars ? `<text x="12" y="38" font-family="system-ui,sans-serif" font-size="11" fill="#fbbf24">${stars}</text>` : ""}
  <text x="12" y="52" font-family="system-ui,sans-serif" font-size="9" fill="#93b4d4">Listed on PadelFinder</text>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = createStaticClient();

  const { data: facility, error } = await supabase
    .from("facilities")
    .select("name, avg_rating, google_rating")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !facility) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const rating = facility.google_rating ?? facility.avg_rating ?? 0;
  const svg = generateBadgeSvg(facility.name, rating);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
