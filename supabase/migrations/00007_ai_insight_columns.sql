-- =============================================================================
-- Migration: 00007_ai_insight_columns.sql
-- Description: Add AI-generated review insight columns to facilities and
--              update RPC functions to include the new columns.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add AI insight columns to facilities
-- ---------------------------------------------------------------------------
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS review_summary      TEXT,
  ADD COLUMN IF NOT EXISTS review_pros         TEXT[],
  ADD COLUMN IF NOT EXISTS review_cons         TEXT[],
  ADD COLUMN IF NOT EXISTS best_for_tags       TEXT[],
  ADD COLUMN IF NOT EXISTS standout_quote      TEXT,
  ADD COLUMN IF NOT EXISTS owner_response_rate NUMERIC(5,2);

-- ---------------------------------------------------------------------------
-- 2. Drop & recreate nearby_facilities with new columns
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
    review_summary        TEXT,
    review_pros           TEXT[],
    review_cons           TEXT[],
    best_for_tags         TEXT[],
    standout_quote        TEXT,
    owner_response_rate   NUMERIC(5,2),
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
        f.review_summary,
        f.review_pros,
        f.review_cons,
        f.best_for_tags,
        f.standout_quote,
        f.owner_response_rate,
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
-- 3. Drop & recreate search_facilities with new columns
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
    review_summary        TEXT,
    review_pros           TEXT[],
    review_cons           TEXT[],
    best_for_tags         TEXT[],
    standout_quote        TEXT,
    owner_response_rate   NUMERIC(5,2),
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
        f.review_summary,
        f.review_pros,
        f.review_cons,
        f.best_for_tags,
        f.standout_quote,
        f.owner_response_rate,
        f.is_featured,
        f.images,
        ts_rank_cd(f.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM facilities f
    WHERE f.status = 'active'
      AND f.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 20;
$$;
