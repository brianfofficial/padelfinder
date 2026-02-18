-- =============================================================================
-- PadelFinder — Seed: 21 Missing Cities (facilities exist but no city row)
-- Migration: 00004_seed_missing_cities.sql
-- =============================================================================

INSERT INTO cities (state_id, name, slug, state_slug, state_name, state_abbr, latitude, longitude, population, description, meta_title, meta_description)
VALUES

-- =============================================================================
-- FLORIDA (6 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Aventura', 'aventura', 'florida', 'Florida', 'FL',
    25.9565, -80.1392, 40242,
    'Aventura is a vibrant South Florida city near the coast, home to premium padel clubs that cater to the area''s active and international community.',
    'Padel Courts in Aventura, FL | PadelFinder',
    'Find padel courts in Aventura, Florida. Discover top-rated padel facilities near Aventura Mall and the North Miami Beach area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Boynton Beach', 'boynton-beach', 'florida', 'Florida', 'FL',
    26.5254, -80.0662, 80380,
    'Boynton Beach offers excellent padel facilities in southern Palm Beach County, with indoor clubs providing climate-controlled play year-round.',
    'Padel Courts in Boynton Beach, FL | PadelFinder',
    'Find padel courts in Boynton Beach, Florida. Browse indoor and outdoor padel facilities in southern Palm Beach County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Doral', 'doral', 'florida', 'Florida', 'FL',
    25.8195, -80.3553, 78164,
    'Doral is a major padel hub in Miami-Dade County, featuring some of the largest indoor padel clubs in the United States with world-class facilities.',
    'Padel Courts in Doral, FL | PadelFinder',
    'Find padel courts in Doral, Florida. Explore the largest indoor padel facilities in the U.S. in Miami-Dade County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'North Miami', 'north-miami', 'florida', 'Florida', 'FL',
    25.8901, -80.1867, 62468,
    'North Miami''s diverse community and proximity to the coast make it a natural home for premium padel facilities in the greater Miami area.',
    'Padel Courts in North Miami, FL | PadelFinder',
    'Find padel courts in North Miami, Florida. Discover padel clubs and facilities in the North Miami-Dade area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'St. Petersburg', 'st-petersburg', 'florida', 'Florida', 'FL',
    27.7676, -82.6403, 258308,
    'St. Petersburg''s waterfront lifestyle and growing sports scene make it a rising padel destination on Tampa Bay''s western shore.',
    'Padel Courts in St. Petersburg, FL | PadelFinder',
    'Find padel courts in St. Petersburg, Florida. Browse padel facilities in Pinellas County and the Tampa Bay area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Zephyrhills', 'zephyrhills', 'florida', 'Florida', 'FL',
    28.2336, -82.1812, 16422,
    'Zephyrhills offers padel alongside tennis and wellness amenities in a relaxed Central Florida setting near Tampa.',
    'Padel Courts in Zephyrhills, FL | PadelFinder',
    'Find padel courts in Zephyrhills, Florida. Discover padel facilities in Pasco County near Tampa.'
),

-- =============================================================================
-- NEW JERSEY (4 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Cresskill', 'cresskill', 'new-jersey', 'New Jersey', 'NJ',
    40.9415, -73.9593, 8830,
    'Cresskill is home to the largest padel club in the Northeast, offering world-class indoor courts in Bergen County just minutes from New York City.',
    'Padel Courts in Cresskill, NJ | PadelFinder',
    'Find padel courts in Cresskill, New Jersey. Explore the Northeast''s largest padel facility in Bergen County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Monroe Township', 'monroe-township', 'new-jersey', 'New Jersey', 'NJ',
    40.3282, -74.4340, 48594,
    'Monroe Township offers indoor padel alongside multi-sport facilities in central New Jersey, serving the growing Middlesex County padel community.',
    'Padel Courts in Monroe Township, NJ | PadelFinder',
    'Find padel courts in Monroe Township, New Jersey. Browse padel facilities in Middlesex County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Morristown', 'morristown', 'new-jersey', 'New Jersey', 'NJ',
    40.7968, -74.4815, 19438,
    'Morristown''s vibrant town center and active community support premium padel facilities with indoor and outdoor courts in Morris County.',
    'Padel Courts in Morristown, NJ | PadelFinder',
    'Find padel courts in Morristown, New Jersey. Discover padel facilities in Morris County with year-round play.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Oakland', 'oakland', 'new-jersey', 'New Jersey', 'NJ',
    41.0132, -74.2357, 13189,
    'Oakland''s indoor padel club brings championship-level courts to northern New Jersey, led by elite coaching in a converted warehouse setting.',
    'Padel Courts in Oakland, NJ | PadelFinder',
    'Find padel courts in Oakland, New Jersey. Explore indoor padel facilities in Passaic County.'
),

-- =============================================================================
-- ARIZONA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'AZ'),
    'Mesa', 'mesa', 'arizona', 'Arizona', 'AZ',
    33.4152, -111.8315, 504258,
    'Mesa is home to Arizona''s first fully indoor padel club, offering climate-controlled play in the East Valley of the Phoenix metro area.',
    'Padel Courts in Mesa, AZ | PadelFinder',
    'Find padel courts in Mesa, Arizona. Discover indoor padel facilities in the East Valley and Maricopa County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'AZ'),
    'Tempe', 'tempe', 'arizona', 'Arizona', 'AZ',
    33.4255, -111.9400, 180587,
    'Tempe''s energetic university community and year-round sunshine make it an ideal location for premium indoor padel facilities near Arizona State University.',
    'Padel Courts in Tempe, AZ | PadelFinder',
    'Find padel courts in Tempe, Arizona. Browse padel facilities near ASU and the South Valley.'
),

-- =============================================================================
-- ILLINOIS (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'IL'),
    'Glenview', 'glenview', 'illinois', 'Illinois', 'IL',
    42.0698, -87.7878, 49250,
    'Glenview brings padel to Chicago''s affluent North Shore with premium indoor courts, wellness amenities, and a welcoming social atmosphere.',
    'Padel Courts in Glenview, IL | PadelFinder',
    'Find padel courts in Glenview, Illinois. Discover padel facilities on Chicago''s North Shore in Cook County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'IL'),
    'Mundelein', 'mundelein', 'illinois', 'Illinois', 'IL',
    42.2631, -88.0037, 31604,
    'Mundelein is home to Illinois'' first padel facility, pioneering the sport in the northern Chicago suburbs with indoor and outdoor courts.',
    'Padel Courts in Mundelein, IL | PadelFinder',
    'Find padel courts in Mundelein, Illinois. Explore the first padel facility in the northern Chicago suburbs.'
),

-- =============================================================================
-- CALIFORNIA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Carson', 'carson', 'california', 'California', 'CA',
    33.8317, -118.2620, 95513,
    'Carson''s Dignity Health Sports Park hosts padel courts alongside major soccer and sports venues in the South Bay area of Los Angeles.',
    'Padel Courts in Carson, CA | PadelFinder',
    'Find padel courts in Carson, California. Discover padel at the LA Galaxy sports complex in the South Bay.'
),

-- =============================================================================
-- COLORADO (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CO'),
    'Parker', 'parker', 'colorado', 'Colorado', 'CO',
    39.5186, -104.7614, 57706,
    'Parker is home to Colorado''s first padel courts, bringing the sport to the southern Denver suburbs with outdoor courts and certified coaching.',
    'Padel Courts in Parker, CO | PadelFinder',
    'Find padel courts in Parker, Colorado. Explore Colorado''s first padel facility in Douglas County.'
),

-- =============================================================================
-- CONNECTICUT (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CT'),
    'Norwalk', 'norwalk', 'connecticut', 'Connecticut', 'CT',
    41.1177, -73.4082, 91184,
    'Norwalk''s South Norwalk neighborhood features a major indoor sports club with padel courts, serving Fairfield County''s growing padel community.',
    'Padel Courts in Norwalk, CT | PadelFinder',
    'Find padel courts in Norwalk, Connecticut. Browse indoor padel facilities in Fairfield County.'
),

-- =============================================================================
-- GEORGIA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'GA'),
    'Alpharetta', 'alpharetta', 'georgia', 'Georgia', 'GA',
    34.0754, -84.2941, 65818,
    'Alpharetta''s premier racquet club brings padel to north metro Atlanta with outdoor courts and resort-style amenities on Lake Windward.',
    'Padel Courts in Alpharetta, GA | PadelFinder',
    'Find padel courts in Alpharetta, Georgia. Discover padel facilities in Fulton County north of Atlanta.'
),

-- =============================================================================
-- MASSACHUSETTS (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MA'),
    'Dedham', 'dedham', 'massachusetts', 'Massachusetts', 'MA',
    42.2418, -71.1662, 25330,
    'Dedham is home to Massachusetts'' first dedicated padel facility, offering premium indoor courts and expert coaching just outside Boston.',
    'Padel Courts in Dedham, MA | PadelFinder',
    'Find padel courts in Dedham, Massachusetts. Explore padel facilities in Norfolk County near Boston.'
),

-- =============================================================================
-- TEXAS (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Carrollton', 'carrollton', 'texas', 'Texas', 'TX',
    32.9537, -96.8903, 133434,
    'Carrollton hosts a growing padel club in the Dallas-Fort Worth metroplex, with indoor courts and planned expansion to serve the north Texas market.',
    'Padel Courts in Carrollton, TX | PadelFinder',
    'Find padel courts in Carrollton, Texas. Browse padel facilities in the DFW metroplex in Denton County.'
),

-- =============================================================================
-- UTAH (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'UT'),
    'Woods Cross', 'woods-cross', 'utah', 'Utah', 'UT',
    40.8716, -111.9174, 12197,
    'Woods Cross is home to Utah''s first dedicated indoor padel facility, serving the Salt Lake City metro area with year-round play along the Wasatch Front.',
    'Padel Courts in Woods Cross, UT | PadelFinder',
    'Find padel courts in Woods Cross, Utah. Discover indoor padel facilities near Salt Lake City.'
);
