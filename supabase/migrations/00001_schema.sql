-- =============================================================================
-- PadelFinder Database Schema
-- Migration: 00001_schema.sql
-- Description: Complete schema with tables, indexes, triggers, RPC functions,
--              and Row-Level Security policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- states ----------------------------------------------------------------------
CREATE TABLE states (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    abbreviation     CHAR(2) NOT NULL UNIQUE,
    latitude         DOUBLE PRECISION NOT NULL,
    longitude        DOUBLE PRECISION NOT NULL,
    description      TEXT,
    meta_title       TEXT,
    meta_description TEXT,
    facility_count   INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

-- cities ----------------------------------------------------------------------
CREATE TABLE cities (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id         UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    slug             TEXT NOT NULL,
    state_slug       TEXT NOT NULL,
    state_name       TEXT NOT NULL,
    state_abbr       CHAR(2) NOT NULL,
    latitude         DOUBLE PRECISION NOT NULL,
    longitude        DOUBLE PRECISION NOT NULL,
    population       INTEGER,
    description      TEXT,
    meta_title       TEXT,
    meta_description TEXT,
    facility_count   INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (slug, state_slug)
);

-- facilities ------------------------------------------------------------------
CREATE TABLE facilities (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                  TEXT NOT NULL,
    name                  TEXT NOT NULL,
    description           TEXT,
    address               TEXT NOT NULL,
    city                  TEXT NOT NULL,
    city_slug             TEXT NOT NULL,
    state                 TEXT NOT NULL,
    state_slug            TEXT NOT NULL,
    state_abbr            CHAR(2) NOT NULL,
    zip_code              TEXT NOT NULL,
    latitude              DOUBLE PRECISION NOT NULL,
    longitude             DOUBLE PRECISION NOT NULL,
    location              GEOGRAPHY(POINT, 4326),
    phone                 TEXT,
    email                 TEXT,
    website               TEXT,
    total_courts          INTEGER NOT NULL DEFAULT 0,
    indoor_court_count    INTEGER NOT NULL DEFAULT 0,
    outdoor_court_count   INTEGER NOT NULL DEFAULT 0,
    surface_type          TEXT,

    -- amenity flags
    indoor_courts         BOOLEAN DEFAULT false,
    outdoor_courts        BOOLEAN DEFAULT false,
    panoramic_glass       BOOLEAN DEFAULT false,
    led_lighting          BOOLEAN DEFAULT false,
    pro_shop              BOOLEAN DEFAULT false,
    equipment_rental      BOOLEAN DEFAULT false,
    coaching              BOOLEAN DEFAULT false,
    tournaments           BOOLEAN DEFAULT false,
    leagues               BOOLEAN DEFAULT false,
    open_play             BOOLEAN DEFAULT false,
    locker_rooms          BOOLEAN DEFAULT false,
    parking               BOOLEAN DEFAULT false,
    food_beverage         BOOLEAN DEFAULT false,
    wheelchair_accessible BOOLEAN DEFAULT false,
    kids_programs         BOOLEAN DEFAULT false,

    -- pricing
    price_per_hour_cents  INTEGER,
    price_peak_cents      INTEGER,
    membership_available  BOOLEAN DEFAULT false,

    -- operational
    hours                 JSONB,
    images                TEXT[] DEFAULT '{}',

    -- ratings
    avg_rating            NUMERIC(3,2) DEFAULT 0,
    review_count          INTEGER DEFAULT 0,

    -- SEO
    meta_title            TEXT,
    meta_description      TEXT,

    -- status
    status                TEXT DEFAULT 'active'
                          CHECK (status IN ('active', 'pending', 'inactive')),
    is_featured           BOOLEAN DEFAULT false,

    -- full-text search
    search_vector         TSVECTOR GENERATED ALWAYS AS (
                              to_tsvector(
                                  'english',
                                  coalesce(name, '') || ' ' ||
                                  coalesce(description, '') || ' ' ||
                                  coalesce(city, '') || ' ' ||
                                  coalesce(state, '') || ' ' ||
                                  coalesce(address, '')
                              )
                          ) STORED,

    created_at            TIMESTAMPTZ DEFAULT now(),
    updated_at            TIMESTAMPTZ DEFAULT now(),

    UNIQUE (slug, state_slug)
);

-- reviews ---------------------------------------------------------------------
CREATE TABLE reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id   UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    author_name   TEXT NOT NULL,
    comment       TEXT,
    skill_level   TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- submissions -----------------------------------------------------------------
CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name   TEXT NOT NULL,
    address         TEXT NOT NULL,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    zip_code        TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    total_courts    INTEGER,
    description     TEXT,
    submitter_name  TEXT NOT NULL,
    submitter_email TEXT NOT NULL,
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- subscribers -----------------------------------------------------------------
CREATE TABLE subscribers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- Full-text search
CREATE INDEX idx_facilities_search_vector   ON facilities USING GIN  (search_vector);

-- Geospatial
CREATE INDEX idx_facilities_location        ON facilities USING GIST (location);

-- B-tree lookups
CREATE INDEX idx_facilities_state_slug      ON facilities (state_slug);
CREATE INDEX idx_facilities_city_state_slug ON facilities (city_slug, state_slug);
CREATE INDEX idx_facilities_status          ON facilities (status);
CREATE INDEX idx_facilities_is_featured     ON facilities (is_featured);
CREATE INDEX idx_facilities_avg_rating      ON facilities (avg_rating DESC);

CREATE INDEX idx_cities_state_id            ON cities (state_id);
CREATE INDEX idx_cities_state_slug          ON cities (state_slug);

CREATE INDEX idx_reviews_facility_id        ON reviews (facility_id);

-- ---------------------------------------------------------------------------
-- 4. Trigger Functions
-- ---------------------------------------------------------------------------

-- 4a. Generic updated_at timestamp ------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4b. Auto-generate geography location from lat/lng -------------------------
CREATE OR REPLACE FUNCTION update_facility_location()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT')
       OR (NEW.latitude  IS DISTINCT FROM OLD.latitude)
       OR (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4c. Maintain facility_count on states & cities ----------------------------
CREATE OR REPLACE FUNCTION update_facility_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle DELETE or UPDATE-away: decrement old state/city counts
    IF (TG_OP = 'DELETE') OR (
        TG_OP = 'UPDATE' AND (
            OLD.state_slug IS DISTINCT FROM NEW.state_slug OR
            OLD.city_slug  IS DISTINCT FROM NEW.city_slug
        )
    ) THEN
        UPDATE states
           SET facility_count = GREATEST(facility_count - 1, 0)
         WHERE slug = OLD.state_slug;

        UPDATE cities
           SET facility_count = GREATEST(facility_count - 1, 0)
         WHERE slug = OLD.city_slug
           AND state_slug = OLD.state_slug;
    END IF;

    -- Handle INSERT or UPDATE-into: increment new state/city counts
    IF (TG_OP = 'INSERT') OR (
        TG_OP = 'UPDATE' AND (
            OLD.state_slug IS DISTINCT FROM NEW.state_slug OR
            OLD.city_slug  IS DISTINCT FROM NEW.city_slug
        )
    ) THEN
        UPDATE states
           SET facility_count = facility_count + 1
         WHERE slug = NEW.state_slug;

        UPDATE cities
           SET facility_count = facility_count + 1
         WHERE slug = NEW.city_slug
           AND state_slug = NEW.state_slug;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4d. Maintain avg_rating & review_count on facilities ----------------------
CREATE OR REPLACE FUNCTION update_facility_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_facility_id UUID;
BEGIN
    -- Determine which facility to recalculate
    IF TG_OP = 'DELETE' THEN
        target_facility_id := OLD.facility_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.facility_id IS DISTINCT FROM NEW.facility_id THEN
        -- Facility changed: recalculate both old and new
        UPDATE facilities
           SET avg_rating    = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE facility_id = OLD.facility_id AND status = 'approved'), 0),
               review_count  = (SELECT COUNT(*) FROM reviews WHERE facility_id = OLD.facility_id AND status = 'approved')
         WHERE id = OLD.facility_id;
        target_facility_id := NEW.facility_id;
    ELSE
        target_facility_id := COALESCE(NEW.facility_id, OLD.facility_id);
    END IF;

    UPDATE facilities
       SET avg_rating   = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE facility_id = target_facility_id AND status = 'approved'), 0),
           review_count = (SELECT COUNT(*) FROM reviews WHERE facility_id = target_facility_id AND status = 'approved')
     WHERE id = target_facility_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 5. Apply Triggers
-- ---------------------------------------------------------------------------

-- updated_at triggers
CREATE TRIGGER trg_states_updated_at
    BEFORE UPDATE ON states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Facility location trigger (BEFORE so it can modify NEW)
CREATE TRIGGER trg_facility_location
    BEFORE INSERT OR UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_facility_location();

-- Facility count trigger (AFTER so the row is committed)
CREATE TRIGGER trg_facility_counts
    AFTER INSERT OR UPDATE OR DELETE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_facility_counts();

-- Review rating trigger
CREATE TRIGGER trg_facility_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_facility_rating();

-- ---------------------------------------------------------------------------
-- 6. RPC Functions
-- ---------------------------------------------------------------------------

-- 6a. nearby_facilities — find facilities within a radius -------------------
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

-- 6b. search_facilities — full-text search ----------------------------------
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
        f.is_featured,
        f.images,
        ts_rank_cd(f.search_vector, websearch_to_tsquery('english', search_query)) AS rank
    FROM facilities f
    WHERE f.status = 'active'
      AND f.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 20;
$$;

-- 6c. recalculate_facility_counts — full recount safety function ------------
CREATE OR REPLACE FUNCTION recalculate_facility_counts()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Reset all counts to zero
    UPDATE states SET facility_count = 0;
    UPDATE cities SET facility_count = 0;

    -- Recount states
    UPDATE states s
       SET facility_count = sub.cnt
      FROM (
          SELECT state_slug, COUNT(*) AS cnt
            FROM facilities
           WHERE status = 'active'
           GROUP BY state_slug
      ) sub
     WHERE s.slug = sub.state_slug;

    -- Recount cities
    UPDATE cities c
       SET facility_count = sub.cnt
      FROM (
          SELECT city_slug, state_slug, COUNT(*) AS cnt
            FROM facilities
           WHERE status = 'active'
           GROUP BY city_slug, state_slug
      ) sub
     WHERE c.slug = sub.city_slug
       AND c.state_slug = sub.state_slug;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Row-Level Security
-- ---------------------------------------------------------------------------

-- Enable RLS on every table
ALTER TABLE states      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- states: public read
CREATE POLICY "states_select" ON states
    FOR SELECT TO anon, authenticated
    USING (true);

-- cities: public read
CREATE POLICY "cities_select" ON cities
    FOR SELECT TO anon, authenticated
    USING (true);

-- facilities: public read (active only)
CREATE POLICY "facilities_select" ON facilities
    FOR SELECT TO anon, authenticated
    USING (status = 'active');

-- reviews: public read (approved only), public insert
CREATE POLICY "reviews_select" ON reviews
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

CREATE POLICY "reviews_insert" ON reviews
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- submissions: public insert only
CREATE POLICY "submissions_insert" ON submissions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- subscribers: public insert only
CREATE POLICY "subscribers_insert" ON subscribers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
