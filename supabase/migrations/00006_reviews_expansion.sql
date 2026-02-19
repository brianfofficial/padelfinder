-- =============================================================================
-- Migration: 00006_reviews_expansion.sql
-- Description: Add Google review import fields, facility verification columns,
--              and update RPC functions to include new columns.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend reviews table with Google import fields
-- ---------------------------------------------------------------------------
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source           TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS source_review_id TEXT,
  ADD COLUMN IF NOT EXISTS text             TEXT,
  ADD COLUMN IF NOT EXISTS published_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_response   TEXT,
  ADD COLUMN IF NOT EXISTS owner_response_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS language         TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS helpful_count    INTEGER DEFAULT 0;

-- Prevent duplicate Google review imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_source_dedup
  ON reviews (source, source_review_id) WHERE source_review_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Extend facilities table with verification + metadata fields
-- ---------------------------------------------------------------------------
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS verified_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status  TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS website_live         BOOLEAN,
  ADD COLUMN IF NOT EXISTS data_source          TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS google_cid           TEXT,
  ADD COLUMN IF NOT EXISTS rating_distribution  JSONB;

-- ---------------------------------------------------------------------------
-- 3. Drop & recreate nearby_facilities with new columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS nearby_facilities(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);

CREATE OR REPLACE FUNCTION nearby_facilities(
    lat          DOUBLE PRECISION,
    lng          DOUBLE PRECISION,
    radius_miles INTEGER DEFAULT 25
)
RETURNS TABLE (
    id                    UUID,
    slug                  TEXT,
    name                  TEXT,
    description           TEXT,
    address               TEXT,
    city                  TEXT,
    city_slug             TEXT,
    state                 TEXT,
    state_slug            TEXT,
    state_abbr            CHAR(2),
    zip_code              TEXT,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    phone                 TEXT,
    email                 TEXT,
    website               TEXT,
    total_courts          INTEGER,
    indoor_court_count    INTEGER,
    outdoor_court_count   INTEGER,
    surface_type          TEXT,
    indoor_courts         BOOLEAN,
    outdoor_courts        BOOLEAN,
    panoramic_glass       BOOLEAN,
    led_lighting          BOOLEAN,
    pro_shop              BOOLEAN,
    equipment_rental      BOOLEAN,
    coaching              BOOLEAN,
    tournaments           BOOLEAN,
    leagues               BOOLEAN,
    open_play             BOOLEAN,
    locker_rooms          BOOLEAN,
    parking               BOOLEAN,
    food_beverage         BOOLEAN,
    wheelchair_accessible BOOLEAN,
    kids_programs         BOOLEAN,
    price_per_hour_cents  INTEGER,
    price_peak_cents      INTEGER,
    membership_available  BOOLEAN,
    hours                 JSONB,
    images                TEXT[],
    avg_rating            NUMERIC(3,2),
    review_count          INTEGER,
    google_place_id       TEXT,
    google_rating         NUMERIC(2,1),
    google_review_count   INTEGER,
    verified_at           TIMESTAMPTZ,
    verification_status   TEXT,
    website_live          BOOLEAN,
    data_source           TEXT,
    google_cid            TEXT,
    rating_distribution   JSONB,
    is_featured           BOOLEAN,
    distance_miles        DOUBLE PRECISION
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.id,
        f.slug,
        f.name,
        f.description,
        f.address,
        f.city,
        f.city_slug,
        f.state,
        f.state_slug,
        f.state_abbr,
        f.zip_code,
        f.latitude,
        f.longitude,
        f.phone,
        f.email,
        f.website,
        f.total_courts,
        f.indoor_court_count,
        f.outdoor_court_count,
        f.surface_type,
        f.indoor_courts,
        f.outdoor_courts,
        f.panoramic_glass,
        f.led_lighting,
        f.pro_shop,
        f.equipment_rental,
        f.coaching,
        f.tournaments,
        f.leagues,
        f.open_play,
        f.locker_rooms,
        f.parking,
        f.food_beverage,
        f.wheelchair_accessible,
        f.kids_programs,
        f.price_per_hour_cents,
        f.price_peak_cents,
        f.membership_available,
        f.hours,
        f.images,
        f.avg_rating,
        f.review_count,
        f.google_place_id,
        f.google_rating,
        f.google_review_count,
        f.verified_at,
        f.verification_status,
        f.website_live,
        f.data_source,
        f.google_cid,
        f.rating_distribution,
        f.is_featured,
        ST_Distance(
            f.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1609.34 AS distance_miles
    FROM facilities f
    WHERE f.status = 'active'
      AND ST_DWithin(
            f.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_miles * 1609.34
          )
    ORDER BY distance_miles;
$$;

-- ---------------------------------------------------------------------------
-- 4. Drop & recreate search_facilities with new columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS search_facilities(TEXT);

CREATE OR REPLACE FUNCTION search_facilities(search_query TEXT)
RETURNS TABLE (
    id                    UUID,
    slug                  TEXT,
    name                  TEXT,
    description           TEXT,
    address               TEXT,
    city                  TEXT,
    city_slug             TEXT,
    state                 TEXT,
    state_slug            TEXT,
    state_abbr            CHAR(2),
    zip_code              TEXT,
    latitude              DOUBLE PRECISION,
    longitude             DOUBLE PRECISION,
    phone                 TEXT,
    website               TEXT,
    total_courts          INTEGER,
    indoor_court_count    INTEGER,
    outdoor_court_count   INTEGER,
    avg_rating            NUMERIC(3,2),
    review_count          INTEGER,
    google_place_id       TEXT,
    google_rating         NUMERIC(2,1),
    google_review_count   INTEGER,
    verified_at           TIMESTAMPTZ,
    verification_status   TEXT,
    website_live          BOOLEAN,
    data_source           TEXT,
    google_cid            TEXT,
    rating_distribution   JSONB,
    is_featured           BOOLEAN,
    images                TEXT[],
    rank                  REAL
)
LANGUAGE sql STABLE
AS $$
    SELECT
        f.id,
        f.slug,
        f.name,
        f.description,
        f.address,
        f.city,
        f.city_slug,
        f.state,
        f.state_slug,
        f.state_abbr,
        f.zip_code,
        f.latitude,
        f.longitude,
        f.phone,
        f.website,
        f.total_courts,
        f.indoor_court_count,
        f.outdoor_court_count,
        f.avg_rating,
        f.review_count,
        f.google_place_id,
        f.google_rating,
        f.google_review_count,
        f.verified_at,
        f.verification_status,
        f.website_live,
        f.data_source,
        f.google_cid,
        f.rating_distribution,
        f.is_featured,
        f.images,
        ts_rank_cd(f.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM facilities f
    WHERE f.status = 'active'
      AND f.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 20;
$$;
