/**
 * Validates required environment variables and logs warnings for missing ones.
 * Does NOT throw — only warns in development.
 */
export function validateEnv() {
  if (process.env.NODE_ENV === "production") return;

  const recommended = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Database connection"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Database auth"],
    ["NEXT_PUBLIC_MAPBOX_TOKEN", "Map display"],
    ["NEXT_PUBLIC_SITE_URL", "Canonical URLs"],
  ] as const;

  for (const [key, purpose] of recommended) {
    if (!process.env[key]) {
      console.warn(`⚠ Missing env var ${key} (${purpose}) — using fallback`);
    }
  }
}
