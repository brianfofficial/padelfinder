-- =============================================================================
-- PadelFinder — Seed: 85+ Cities across padel-heavy markets
-- Migration: 00003_seed_cities.sql
-- =============================================================================

INSERT INTO cities (state_id, name, slug, state_slug, state_name, state_abbr, latitude, longitude, population, description, meta_title, meta_description)
VALUES

-- =============================================================================
-- FLORIDA (9 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Miami', 'miami', 'florida', 'Florida', 'FL',
    25.7617, -80.1918, 442241,
    'Miami is the epicenter of padel in the United States, with a large Latin American community driving demand and world-class facilities throughout the metro area.',
    'Padel Courts in Miami, FL | PadelFinder',
    'Find padel courts in Miami, Florida. Explore the largest concentration of padel facilities in the US with courts across Miami-Dade County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Fort Lauderdale', 'fort-lauderdale', 'florida', 'Florida', 'FL',
    26.1224, -80.1373, 182760,
    'Fort Lauderdale''s growing padel scene benefits from South Florida''s strong Latin American influence and year-round sunshine for outdoor play.',
    'Padel Courts in Fort Lauderdale, FL | PadelFinder',
    'Find padel courts in Fort Lauderdale, Florida. Browse top-rated padel facilities in Broward County and the greater Fort Lauderdale area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Boca Raton', 'boca-raton', 'florida', 'Florida', 'FL',
    26.3683, -80.1289, 97422,
    'Boca Raton is a premier padel destination in South Florida, with upscale country clubs and dedicated padel facilities serving an enthusiastic player community.',
    'Padel Courts in Boca Raton, FL | PadelFinder',
    'Find padel courts in Boca Raton, Florida. Discover premium padel facilities and clubs in Palm Beach County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Naples', 'naples', 'florida', 'Florida', 'FL',
    26.1420, -81.7948, 19537,
    'Naples'' affluent sports community has embraced padel with enthusiasm, featuring top-tier facilities along the Gulf Coast.',
    'Padel Courts in Naples, FL | PadelFinder',
    'Find padel courts in Naples, Florida. Explore padel facilities and clubs in Collier County and Southwest Florida.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Tampa', 'tampa', 'florida', 'Florida', 'FL',
    27.9506, -82.4572, 384959,
    'Tampa''s vibrant sports culture and growing population are driving padel expansion on Florida''s Gulf Coast with new courts opening regularly.',
    'Padel Courts in Tampa, FL | PadelFinder',
    'Find padel courts in Tampa, Florida. Browse padel facilities in Tampa Bay and the greater Hillsborough County area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Orlando', 'orlando', 'florida', 'Florida', 'FL',
    28.5383, -81.3792, 307573,
    'Orlando''s booming population and active lifestyle community are making it a fast-growing market for padel in Central Florida.',
    'Padel Courts in Orlando, FL | PadelFinder',
    'Find padel courts in Orlando, Florida. Discover padel facilities in Orange County and the greater Orlando metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Jacksonville', 'jacksonville', 'florida', 'Florida', 'FL',
    30.3322, -81.6557, 949611,
    'Jacksonville''s large population and expanding sports infrastructure are bringing padel to northeast Florida with new court construction.',
    'Padel Courts in Jacksonville, FL | PadelFinder',
    'Find padel courts in Jacksonville, Florida. Browse padel facilities in Duval County and northeast Florida.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Sarasota', 'sarasota', 'florida', 'Florida', 'FL',
    27.3364, -82.5307, 57738,
    'Sarasota''s active retiree community and sports culture make it a natural fit for padel along the Gulf Coast.',
    'Padel Courts in Sarasota, FL | PadelFinder',
    'Find padel courts in Sarasota, Florida. Explore padel facilities in Sarasota County and the Suncoast region.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'West Palm Beach', 'west-palm-beach', 'florida', 'Florida', 'FL',
    26.7153, -80.0534, 117415,
    'West Palm Beach and the surrounding Palm Beach County area feature premium padel facilities catering to South Florida''s passionate player base.',
    'Padel Courts in West Palm Beach, FL | PadelFinder',
    'Find padel courts in West Palm Beach, Florida. Discover padel clubs and facilities in Palm Beach County.'
),

-- =============================================================================
-- TEXAS (6 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Houston', 'houston', 'texas', 'Texas', 'TX',
    29.7604, -95.3698, 2304580,
    'Houston''s diverse population and strong Latin American community have made it one of the largest padel markets in Texas with multiple premier facilities.',
    'Padel Courts in Houston, TX | PadelFinder',
    'Find padel courts in Houston, Texas. Browse top-rated padel facilities across Harris County and the greater Houston metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Dallas', 'dallas', 'texas', 'Texas', 'TX',
    32.7767, -96.7970, 1304379,
    'Dallas'' thriving sports scene includes a rapidly expanding padel community with facilities in upscale neighborhoods and athletic clubs.',
    'Padel Courts in Dallas, TX | PadelFinder',
    'Find padel courts in Dallas, Texas. Explore padel facilities in Dallas County and the DFW metroplex.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Austin', 'austin', 'texas', 'Texas', 'TX',
    30.2672, -97.7431, 961855,
    'Austin''s active and health-conscious population has embraced padel, with courts popping up across the capital city and its fast-growing suburbs.',
    'Padel Courts in Austin, TX | PadelFinder',
    'Find padel courts in Austin, Texas. Discover padel facilities in Travis County and the greater Austin area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'San Antonio', 'san-antonio', 'texas', 'Texas', 'TX',
    29.4241, -98.4936, 1434625,
    'San Antonio''s deep Hispanic heritage and warm climate create a thriving environment for padel with strong community participation.',
    'Padel Courts in San Antonio, TX | PadelFinder',
    'Find padel courts in San Antonio, Texas. Browse padel facilities in Bexar County and the greater San Antonio area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Fort Worth', 'fort-worth', 'texas', 'Texas', 'TX',
    32.7555, -97.3308, 918915,
    'Fort Worth''s growing sports community is adding padel to its repertoire, with new courts complementing the DFW metroplex''s expanding padel scene.',
    'Padel Courts in Fort Worth, TX | PadelFinder',
    'Find padel courts in Fort Worth, Texas. Explore padel facilities in Tarrant County and the western DFW area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'El Paso', 'el-paso', 'texas', 'Texas', 'TX',
    31.7619, -106.4850, 678815,
    'El Paso''s border location and strong Mexican cultural ties make it a natural market for padel, with growing interest in the sport along the Rio Grande.',
    'Padel Courts in El Paso, TX | PadelFinder',
    'Find padel courts in El Paso, Texas. Discover padel facilities in El Paso County and the Sun City.'
),

-- =============================================================================
-- CALIFORNIA (7 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Los Angeles', 'los-angeles', 'california', 'California', 'CA',
    34.0522, -118.2437, 3898747,
    'Los Angeles is a major padel hub on the West Coast, with courts across the city and celebrity-backed clubs driving mainstream awareness of the sport.',
    'Padel Courts in Los Angeles, CA | PadelFinder',
    'Find padel courts in Los Angeles, California. Browse premier padel facilities across LA County and the greater Los Angeles area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'San Diego', 'san-diego', 'california', 'California', 'CA',
    32.7157, -117.1611, 1386932,
    'San Diego''s perfect year-round climate and proximity to Mexico make it one of California''s fastest-growing padel markets with outdoor courts galore.',
    'Padel Courts in San Diego, CA | PadelFinder',
    'Find padel courts in San Diego, California. Discover padel facilities throughout San Diego County and the border region.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'San Francisco', 'san-francisco', 'california', 'California', 'CA',
    37.7749, -122.4194, 873965,
    'San Francisco''s tech-forward community is adopting padel rapidly, with facilities in the city and surrounding Bay Area attracting competitive players.',
    'Padel Courts in San Francisco, CA | PadelFinder',
    'Find padel courts in San Francisco, California. Explore padel facilities in the city and the greater Bay Area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'San Jose', 'san-jose', 'california', 'California', 'CA',
    37.3382, -121.8863, 1013240,
    'San Jose and Silicon Valley''s international workforce has brought padel enthusiasm to the South Bay, with new clubs catering to the area''s diverse population.',
    'Padel Courts in San Jose, CA | PadelFinder',
    'Find padel courts in San Jose, California. Browse padel facilities in Santa Clara County and Silicon Valley.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Irvine', 'irvine', 'california', 'California', 'CA',
    33.6846, -117.8265, 307670,
    'Irvine''s planned community layout and affluent demographics make it a prime location for premium padel facilities in Orange County.',
    'Padel Courts in Irvine, CA | PadelFinder',
    'Find padel courts in Irvine, California. Discover padel facilities in Orange County and the greater Irvine area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Sacramento', 'sacramento', 'california', 'California', 'CA',
    38.5816, -121.4944, 524943,
    'Sacramento''s growing sports scene is embracing padel, with new facilities serving the California capital and its expanding suburban communities.',
    'Padel Courts in Sacramento, CA | PadelFinder',
    'Find padel courts in Sacramento, California. Browse padel facilities in Sacramento County and the greater capital region.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Long Beach', 'long-beach', 'california', 'California', 'CA',
    33.7701, -118.1937, 466742,
    'Long Beach''s active waterfront community and diverse population are driving padel interest in the South Bay area of Los Angeles County.',
    'Padel Courts in Long Beach, CA | PadelFinder',
    'Find padel courts in Long Beach, California. Explore padel facilities in the South Bay and greater Long Beach area.'
),

-- =============================================================================
-- NEW YORK (4 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NY'),
    'New York City', 'new-york-city', 'new-york', 'New York', 'NY',
    40.7128, -74.0060, 8336817,
    'New York City is a trendsetting market for padel in the Northeast, with clubs in Manhattan and rooftop courts making the sport accessible in the heart of the city.',
    'Padel Courts in New York City, NY | PadelFinder',
    'Find padel courts in New York City. Browse premier padel facilities across Manhattan, Queens, and the five boroughs.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NY'),
    'Brooklyn', 'brooklyn', 'new-york', 'New York', 'NY',
    40.6782, -73.9442, 2736074,
    'Brooklyn''s vibrant sports and fitness culture has made it a hotspot for padel, with warehouse conversions and dedicated clubs serving the borough''s active residents.',
    'Padel Courts in Brooklyn, NY | PadelFinder',
    'Find padel courts in Brooklyn, New York. Discover padel facilities and clubs across Brooklyn''s diverse neighborhoods.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NY'),
    'Long Island', 'long-island', 'new-york', 'New York', 'NY',
    40.7891, -73.1350, 2826598,
    'Long Island''s affluent communities and strong racquet sports tradition have fueled padel growth across Nassau and Suffolk counties.',
    'Padel Courts on Long Island, NY | PadelFinder',
    'Find padel courts on Long Island, New York. Browse padel facilities in Nassau County, Suffolk County, and the Hamptons.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NY'),
    'White Plains', 'white-plains', 'new-york', 'New York', 'NY',
    41.0340, -73.7629, 58109,
    'White Plains and Westchester County are home to upscale padel clubs that serve the suburban New York City market with premium court facilities.',
    'Padel Courts in White Plains, NY | PadelFinder',
    'Find padel courts in White Plains, New York. Explore padel facilities in Westchester County and the lower Hudson Valley.'
),

-- =============================================================================
-- ILLINOIS (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'IL'),
    'Chicago', 'chicago', 'illinois', 'Illinois', 'IL',
    41.8781, -87.6298, 2693976,
    'Chicago is the Midwest capital of padel, with indoor facilities throughout the city and suburbs providing year-round play for a rapidly growing community.',
    'Padel Courts in Chicago, IL | PadelFinder',
    'Find padel courts in Chicago, Illinois. Browse indoor and outdoor padel facilities across Chicagoland.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'IL'),
    'Naperville', 'naperville', 'illinois', 'Illinois', 'IL',
    41.7508, -88.1535, 149540,
    'Naperville''s family-oriented community and strong sports infrastructure make it a growing hub for padel in the western Chicago suburbs.',
    'Padel Courts in Naperville, IL | PadelFinder',
    'Find padel courts in Naperville, Illinois. Discover padel facilities in DuPage County and the western suburbs of Chicago.'
),

-- =============================================================================
-- ARIZONA (3 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'AZ'),
    'Scottsdale', 'scottsdale', 'arizona', 'Arizona', 'AZ',
    33.4942, -111.9261, 241361,
    'Scottsdale is Arizona''s premier padel destination, with luxury resort courts and dedicated clubs making it a year-round haven for the sport.',
    'Padel Courts in Scottsdale, AZ | PadelFinder',
    'Find padel courts in Scottsdale, Arizona. Explore premier padel facilities and resort courts in the Valley of the Sun.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'AZ'),
    'Phoenix', 'phoenix', 'arizona', 'Arizona', 'AZ',
    33.4484, -112.0740, 1608139,
    'Phoenix''s massive metro area and over 300 days of sunshine per year provide ideal conditions for padel, with courts spread across the Valley.',
    'Padel Courts in Phoenix, AZ | PadelFinder',
    'Find padel courts in Phoenix, Arizona. Browse padel facilities across Maricopa County and the greater Phoenix metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'AZ'),
    'Tucson', 'tucson', 'arizona', 'Arizona', 'AZ',
    32.2226, -110.9747, 542629,
    'Tucson''s warm desert climate and university-town energy are attracting padel enthusiasts, with facilities serving the growing Southern Arizona market.',
    'Padel Courts in Tucson, AZ | PadelFinder',
    'Find padel courts in Tucson, Arizona. Discover padel facilities in Pima County and Southern Arizona.'
),

-- =============================================================================
-- NEVADA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NV'),
    'Las Vegas', 'las-vegas', 'nevada', 'Nevada', 'NV',
    36.1699, -115.1398, 641903,
    'Las Vegas brings its signature entertainment flair to padel, with resort-style courts and premier facilities making the city a destination for players and tournaments.',
    'Padel Courts in Las Vegas, NV | PadelFinder',
    'Find padel courts in Las Vegas, Nevada. Browse world-class padel facilities on the Strip and across Clark County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NV'),
    'Henderson', 'henderson', 'nevada', 'Nevada', 'NV',
    36.0395, -114.9817, 320189,
    'Henderson''s master-planned communities and family-friendly atmosphere are making it a growing padel market in the Las Vegas valley.',
    'Padel Courts in Henderson, NV | PadelFinder',
    'Find padel courts in Henderson, Nevada. Explore padel facilities in Henderson and the southeast Las Vegas valley.'
),

-- =============================================================================
-- COLORADO (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CO'),
    'Denver', 'denver', 'colorado', 'Colorado', 'CO',
    39.7392, -104.9903, 715522,
    'Denver''s athletic culture and mile-high altitude create a unique padel experience, with indoor and outdoor courts drawing players from across the Front Range.',
    'Padel Courts in Denver, CO | PadelFinder',
    'Find padel courts in Denver, Colorado. Browse padel facilities in the Mile High City and across the Denver metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CO'),
    'Boulder', 'boulder', 'colorado', 'Colorado', 'CO',
    40.0150, -105.2705, 105673,
    'Boulder''s health-conscious and outdoor-loving community has quickly adopted padel, with courts set against the stunning Flatirons backdrop.',
    'Padel Courts in Boulder, CO | PadelFinder',
    'Find padel courts in Boulder, Colorado. Discover padel facilities in Boulder County with breathtaking mountain views.'
),

-- =============================================================================
-- WASHINGTON (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'WA'),
    'Seattle', 'seattle', 'washington', 'Washington', 'WA',
    47.6062, -122.3321, 737015,
    'Seattle''s tech-savvy population and vibrant sports scene are driving padel growth, with indoor facilities providing reliable play despite Pacific Northwest weather.',
    'Padel Courts in Seattle, WA | PadelFinder',
    'Find padel courts in Seattle, Washington. Browse indoor padel facilities in King County and the greater Seattle area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'WA'),
    'Bellevue', 'bellevue', 'washington', 'Washington', 'WA',
    47.6101, -122.2015, 151854,
    'Bellevue''s affluent Eastside community and international population are fueling demand for padel facilities across the Seattle suburb.',
    'Padel Courts in Bellevue, WA | PadelFinder',
    'Find padel courts in Bellevue, Washington. Explore padel facilities on the Eastside and in greater King County.'
),

-- =============================================================================
-- GEORGIA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'GA'),
    'Atlanta', 'atlanta', 'georgia', 'Georgia', 'GA',
    33.7490, -84.3880, 498715,
    'Atlanta is the Southeast''s padel leader outside Florida, with upscale facilities in Buckhead and Midtown attracting a competitive and social player community.',
    'Padel Courts in Atlanta, GA | PadelFinder',
    'Find padel courts in Atlanta, Georgia. Browse premier padel facilities in Buckhead, Midtown, and across metro Atlanta.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'GA'),
    'Buckhead', 'buckhead', 'georgia', 'Georgia', 'GA',
    33.8384, -84.3797, 80120,
    'Buckhead''s luxury lifestyle and athletic club culture make it Atlanta''s premier neighborhood for padel with high-end facilities and coaching.',
    'Padel Courts in Buckhead, GA | PadelFinder',
    'Find padel courts in Buckhead, Atlanta. Discover premium padel facilities and clubs in Atlanta''s most upscale neighborhood.'
),

-- =============================================================================
-- NEW JERSEY (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Jersey City', 'jersey-city', 'new-jersey', 'New Jersey', 'NJ',
    40.7178, -74.0431, 292449,
    'Jersey City''s waterfront development and proximity to Manhattan have made it a natural extension of the New York metro padel scene.',
    'Padel Courts in Jersey City, NJ | PadelFinder',
    'Find padel courts in Jersey City, New Jersey. Browse padel facilities in Hudson County and the NYC metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NJ'),
    'Hoboken', 'hoboken', 'new-jersey', 'New Jersey', 'NJ',
    40.7440, -74.0324, 60419,
    'Hoboken''s young professional population and compact urban layout create strong demand for padel as a social sport along the Hudson River waterfront.',
    'Padel Courts in Hoboken, NJ | PadelFinder',
    'Find padel courts in Hoboken, New Jersey. Explore padel facilities in the Mile Square City and Hudson County.'
),

-- =============================================================================
-- CONNECTICUT (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CT'),
    'Greenwich', 'greenwich', 'connecticut', 'Connecticut', 'CT',
    41.0262, -73.6282, 63518,
    'Greenwich''s wealth and country club culture have made it a early adopter of padel in New England, with premium court facilities serving Fairfield County.',
    'Padel Courts in Greenwich, CT | PadelFinder',
    'Find padel courts in Greenwich, Connecticut. Discover premium padel facilities and private clubs in Fairfield County.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'CT'),
    'Stamford', 'stamford', 'connecticut', 'Connecticut', 'CT',
    41.0534, -73.5387, 135470,
    'Stamford''s dynamic mix of corporate headquarters and residential communities has created a thriving padel scene in lower Fairfield County.',
    'Padel Courts in Stamford, CT | PadelFinder',
    'Find padel courts in Stamford, Connecticut. Browse padel facilities in Stamford and the lower Fairfield County area.'
),

-- =============================================================================
-- MASSACHUSETTS (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MA'),
    'Boston', 'boston', 'massachusetts', 'Massachusetts', 'MA',
    42.3601, -71.0589, 675647,
    'Boston''s competitive sports culture and university community are driving padel growth, with indoor facilities offering year-round play across the metro area.',
    'Padel Courts in Boston, MA | PadelFinder',
    'Find padel courts in Boston, Massachusetts. Browse padel facilities in Suffolk County and the greater Boston area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'MA'),
    'Cambridge', 'cambridge', 'massachusetts', 'Massachusetts', 'MA',
    42.3736, -71.1097, 118403,
    'Cambridge''s academic community and innovative spirit have embraced padel, with facilities near Harvard and MIT attracting international players.',
    'Padel Courts in Cambridge, MA | PadelFinder',
    'Find padel courts in Cambridge, Massachusetts. Discover padel facilities near Harvard, MIT, and across Middlesex County.'
),

-- =============================================================================
-- PENNSYLVANIA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'PA'),
    'Philadelphia', 'philadelphia', 'pennsylvania', 'Pennsylvania', 'PA',
    39.9526, -75.1652, 1603797,
    'Philadelphia''s passionate sports community is bringing padel to the City of Brotherly Love, with courts opening in Center City and the surrounding suburbs.',
    'Padel Courts in Philadelphia, PA | PadelFinder',
    'Find padel courts in Philadelphia, Pennsylvania. Browse padel facilities in Philly and the greater Delaware Valley.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'PA'),
    'Pittsburgh', 'pittsburgh', 'pennsylvania', 'Pennsylvania', 'PA',
    40.4406, -79.9959, 302971,
    'Pittsburgh''s revitalized sports scene is embracing padel, with new facilities in the Steel City serving a growing community of players.',
    'Padel Courts in Pittsburgh, PA | PadelFinder',
    'Find padel courts in Pittsburgh, Pennsylvania. Explore padel facilities in Allegheny County and western Pennsylvania.'
),

-- =============================================================================
-- VIRGINIA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'VA'),
    'Arlington', 'arlington', 'virginia', 'Virginia', 'VA',
    38.8816, -77.0910, 238643,
    'Arlington''s active professional community and proximity to Washington D.C. have made it a top padel market in the mid-Atlantic with premier facilities.',
    'Padel Courts in Arlington, VA | PadelFinder',
    'Find padel courts in Arlington, Virginia. Browse padel facilities in Arlington County and the greater D.C. metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'VA'),
    'McLean', 'mclean', 'virginia', 'Virginia', 'VA',
    38.9339, -77.1773, 48115,
    'McLean''s affluent community and diplomatic presence have attracted high-end padel facilities serving Northern Virginia''s international players.',
    'Padel Courts in McLean, VA | PadelFinder',
    'Find padel courts in McLean, Virginia. Discover premier padel facilities in Fairfax County and Northern Virginia.'
),

-- =============================================================================
-- MARYLAND (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MD'),
    'Bethesda', 'bethesda', 'maryland', 'Maryland', 'MD',
    38.9847, -77.0947, 68056,
    'Bethesda''s educated, active community and proximity to D.C. make it a prime market for padel in Montgomery County with growing club options.',
    'Padel Courts in Bethesda, MD | PadelFinder',
    'Find padel courts in Bethesda, Maryland. Browse padel facilities in Montgomery County and the greater D.C. metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'MD'),
    'Baltimore', 'baltimore', 'maryland', 'Maryland', 'MD',
    39.2904, -76.6122, 585708,
    'Baltimore''s sports heritage and growing fitness community are embracing padel, with new facilities emerging in the Charm City and its suburbs.',
    'Padel Courts in Baltimore, MD | PadelFinder',
    'Find padel courts in Baltimore, Maryland. Explore padel facilities in Baltimore City and the surrounding counties.'
),

-- =============================================================================
-- TENNESSEE (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'TN'),
    'Nashville', 'nashville', 'tennessee', 'Tennessee', 'TN',
    36.1627, -86.7816, 689447,
    'Nashville''s explosive growth and active social scene are fueling padel demand, with new courts opening to serve Music City''s fitness-focused residents.',
    'Padel Courts in Nashville, TN | PadelFinder',
    'Find padel courts in Nashville, Tennessee. Browse padel facilities in Davidson County and the greater Nashville area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TN'),
    'Memphis', 'memphis', 'tennessee', 'Tennessee', 'TN',
    35.1495, -90.0490, 633104,
    'Memphis is building its padel community with new facilities that complement the city''s deep-rooted love of sports and outdoor recreation.',
    'Padel Courts in Memphis, TN | PadelFinder',
    'Find padel courts in Memphis, Tennessee. Discover padel facilities in Shelby County and the greater Memphis area.'
),

-- =============================================================================
-- NORTH CAROLINA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NC'),
    'Charlotte', 'charlotte', 'north-carolina', 'North Carolina', 'NC',
    35.2271, -80.8431, 874579,
    'Charlotte''s rapid population growth and sports-loving culture are making the Queen City a rising padel market in the Carolinas.',
    'Padel Courts in Charlotte, NC | PadelFinder',
    'Find padel courts in Charlotte, North Carolina. Browse padel facilities in Mecklenburg County and the greater Charlotte area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'NC'),
    'Raleigh', 'raleigh', 'north-carolina', 'North Carolina', 'NC',
    35.7796, -78.6382, 467665,
    'Raleigh''s Research Triangle community brings an analytical enthusiasm to padel, with tech workers and academics driving demand for courts in the Triangle.',
    'Padel Courts in Raleigh, NC | PadelFinder',
    'Find padel courts in Raleigh, North Carolina. Explore padel facilities in Wake County and the Research Triangle.'
),

-- =============================================================================
-- OHIO (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'OH'),
    'Columbus', 'columbus', 'ohio', 'Ohio', 'OH',
    39.9612, -82.9988, 905748,
    'Columbus'' youthful energy and growing sports infrastructure are making it Ohio''s leading market for padel with facilities serving the capital city.',
    'Padel Courts in Columbus, OH | PadelFinder',
    'Find padel courts in Columbus, Ohio. Browse padel facilities in Franklin County and the greater Columbus area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'OH'),
    'Cleveland', 'cleveland', 'ohio', 'Ohio', 'OH',
    41.4993, -81.6944, 372624,
    'Cleveland''s passionate sports fans are adding padel to their rotation, with indoor facilities providing year-round play on the shores of Lake Erie.',
    'Padel Courts in Cleveland, OH | PadelFinder',
    'Find padel courts in Cleveland, Ohio. Discover padel facilities in Cuyahoga County and Northeast Ohio.'
),

-- =============================================================================
-- MICHIGAN (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MI'),
    'Detroit', 'detroit', 'michigan', 'Michigan', 'MI',
    42.3314, -83.0458, 639111,
    'Detroit''s sports renaissance includes padel, with new indoor facilities opening in the Motor City and its affluent northern suburbs.',
    'Padel Courts in Detroit, MI | PadelFinder',
    'Find padel courts in Detroit, Michigan. Browse padel facilities in Wayne County and the greater Detroit metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'MI'),
    'Ann Arbor', 'ann-arbor', 'michigan', 'Michigan', 'MI',
    42.2808, -83.7430, 123851,
    'Ann Arbor''s university community and active lifestyle have made it a natural market for padel in southeast Michigan.',
    'Padel Courts in Ann Arbor, MI | PadelFinder',
    'Find padel courts in Ann Arbor, Michigan. Discover padel facilities in Washtenaw County and the University of Michigan area.'
),

-- =============================================================================
-- MINNESOTA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MN'),
    'Minneapolis', 'minneapolis', 'minnesota', 'Minnesota', 'MN',
    44.9778, -93.2650, 429954,
    'Minneapolis'' active population and strong indoor sports culture make it an ideal market for padel in the Upper Midwest with year-round facilities.',
    'Padel Courts in Minneapolis, MN | PadelFinder',
    'Find padel courts in Minneapolis, Minnesota. Browse indoor padel facilities in Hennepin County and the Twin Cities metro.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'MN'),
    'St. Paul', 'st-paul', 'minnesota', 'Minnesota', 'MN',
    44.9537, -93.0900, 311527,
    'St. Paul complements Minneapolis in building the Twin Cities padel community, with facilities serving the capital city''s diverse neighborhoods.',
    'Padel Courts in St. Paul, MN | PadelFinder',
    'Find padel courts in St. Paul, Minnesota. Explore padel facilities in Ramsey County and the eastern Twin Cities.'
),

-- =============================================================================
-- MISSOURI (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'MO'),
    'Kansas City', 'kansas-city', 'missouri', 'Missouri', 'MO',
    39.0997, -94.5786, 508090,
    'Kansas City''s central location and sports-loving community are making it a growing padel market in the heartland with courts on both sides of the state line.',
    'Padel Courts in Kansas City, MO | PadelFinder',
    'Find padel courts in Kansas City, Missouri. Browse padel facilities in the KC metro area spanning Missouri and Kansas.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'MO'),
    'St. Louis', 'st-louis', 'missouri', 'Missouri', 'MO',
    38.6270, -90.1994, 301578,
    'St. Louis'' strong athletic tradition is embracing padel, with new facilities opening in the Gateway City and surrounding suburbs.',
    'Padel Courts in St. Louis, MO | PadelFinder',
    'Find padel courts in St. Louis, Missouri. Discover padel facilities in the St. Louis metro area and the Gateway to the West.'
),

-- =============================================================================
-- OREGON (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'OR'),
    'Portland', 'portland', 'oregon', 'Oregon', 'OR',
    45.5152, -122.6784, 652503,
    'Portland''s active outdoor culture and indie sports scene are driving padel adoption, with indoor facilities providing year-round play in the Rose City.',
    'Padel Courts in Portland, OR | PadelFinder',
    'Find padel courts in Portland, Oregon. Browse padel facilities in Multnomah County and the greater Portland area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'OR'),
    'Beaverton', 'beaverton', 'oregon', 'Oregon', 'OR',
    45.4871, -122.8037, 97514,
    'Beaverton''s suburban community and proximity to Nike headquarters bring a sports-focused energy to padel development in the Portland metro area.',
    'Padel Courts in Beaverton, OR | PadelFinder',
    'Find padel courts in Beaverton, Oregon. Explore padel facilities in Washington County and the western Portland suburbs.'
),

-- =============================================================================
-- UTAH (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'UT'),
    'Salt Lake City', 'salt-lake-city', 'utah', 'Utah', 'UT',
    40.7608, -111.8910, 199723,
    'Salt Lake City''s active outdoor culture and Olympic legacy are fueling padel growth, with courts nestled along the stunning Wasatch Front.',
    'Padel Courts in Salt Lake City, UT | PadelFinder',
    'Find padel courts in Salt Lake City, Utah. Browse padel facilities in Salt Lake County and along the Wasatch Front.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'UT'),
    'Park City', 'park-city', 'utah', 'Utah', 'UT',
    40.6461, -111.4980, 8376,
    'Park City''s resort community and athletic residents make it a unique padel destination, with mountain-town facilities attracting visitors year-round.',
    'Padel Courts in Park City, UT | PadelFinder',
    'Find padel courts in Park City, Utah. Discover padel facilities in Summit County and Utah''s premier mountain resort town.'
),

-- =============================================================================
-- HAWAII (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'HI'),
    'Honolulu', 'honolulu', 'hawaii', 'Hawaii', 'HI',
    21.3069, -157.8583, 350964,
    'Honolulu offers padel with an island twist, with outdoor courts set against tropical backdrops and ocean breezes creating an unmatched playing experience.',
    'Padel Courts in Honolulu, HI | PadelFinder',
    'Find padel courts in Honolulu, Hawaii. Explore padel facilities on Oahu and experience the sport in paradise.'
),

-- =============================================================================
-- SOUTH CAROLINA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'SC'),
    'Charleston', 'charleston', 'south-carolina', 'South Carolina', 'SC',
    32.7765, -79.9311, 150227,
    'Charleston''s warm climate and resort-town appeal are driving padel interest along the South Carolina coast with new court developments underway.',
    'Padel Courts in Charleston, SC | PadelFinder',
    'Find padel courts in Charleston, South Carolina. Browse padel facilities in the Lowcountry and greater Charleston area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'SC'),
    'Hilton Head Island', 'hilton-head-island', 'south-carolina', 'South Carolina', 'SC',
    32.2163, -80.7526, 40000,
    'Hilton Head Island''s resort lifestyle and strong racquet sports tradition make it a natural destination for padel in the Sea Islands.',
    'Padel Courts in Hilton Head Island, SC | PadelFinder',
    'Find padel courts in Hilton Head Island, South Carolina. Discover padel facilities in Beaufort County and the Lowcountry.'
),

-- =============================================================================
-- LOUISIANA (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'LA'),
    'New Orleans', 'new-orleans', 'louisiana', 'Louisiana', 'LA',
    29.9511, -90.0715, 383997,
    'New Orleans'' vibrant culture and active social scene are welcoming padel, with courts adding to the Crescent City''s legendary entertainment options.',
    'Padel Courts in New Orleans, LA | PadelFinder',
    'Find padel courts in New Orleans, Louisiana. Browse padel facilities in Orleans Parish and the greater New Orleans metro area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'LA'),
    'Baton Rouge', 'baton-rouge', 'louisiana', 'Louisiana', 'LA',
    30.4515, -91.1871, 227470,
    'Baton Rouge''s university community and growing sports infrastructure are supporting early padel development in Louisiana''s capital.',
    'Padel Courts in Baton Rouge, LA | PadelFinder',
    'Find padel courts in Baton Rouge, Louisiana. Explore padel facilities in East Baton Rouge Parish and central Louisiana.'
),

-- =============================================================================
-- INDIANA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'IN'),
    'Indianapolis', 'indianapolis', 'indiana', 'Indiana', 'IN',
    39.7684, -86.1581, 887642,
    'Indianapolis'' strong sports heritage and central location are making the Circle City an emerging padel market in the Midwest.',
    'Padel Courts in Indianapolis, IN | PadelFinder',
    'Find padel courts in Indianapolis, Indiana. Browse padel facilities in Marion County and the greater Indianapolis area.'
),

-- =============================================================================
-- WISCONSIN (2 cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'WI'),
    'Milwaukee', 'milwaukee', 'wisconsin', 'Wisconsin', 'WI',
    43.0389, -87.9065, 577222,
    'Milwaukee''s passionate sports fans are discovering padel, with indoor facilities providing year-round play along the shores of Lake Michigan.',
    'Padel Courts in Milwaukee, WI | PadelFinder',
    'Find padel courts in Milwaukee, Wisconsin. Browse padel facilities in Milwaukee County and the greater Milwaukee area.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'WI'),
    'Madison', 'madison', 'wisconsin', 'Wisconsin', 'WI',
    43.0731, -89.4012, 269840,
    'Madison''s university-driven fitness culture and active community make it a promising padel market in southern Wisconsin.',
    'Padel Courts in Madison, WI | PadelFinder',
    'Find padel courts in Madison, Wisconsin. Discover padel facilities in Dane County and the greater Madison area.'
),

-- =============================================================================
-- ALABAMA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'AL'),
    'Birmingham', 'birmingham', 'alabama', 'Alabama', 'AL',
    33.5186, -86.8104, 200733,
    'Birmingham''s revitalized sports scene is embracing padel, with the Magic City leading Alabama''s charge into the fastest-growing racquet sport.',
    'Padel Courts in Birmingham, AL | PadelFinder',
    'Find padel courts in Birmingham, Alabama. Browse padel facilities in Jefferson County and central Alabama.'
),

-- =============================================================================
-- OKLAHOMA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'OK'),
    'Oklahoma City', 'oklahoma-city', 'oklahoma', 'Oklahoma', 'OK',
    35.4676, -97.5164, 681054,
    'Oklahoma City''s expanding sports infrastructure is welcoming padel, with new court facilities being developed to meet growing demand.',
    'Padel Courts in Oklahoma City, OK | PadelFinder',
    'Find padel courts in Oklahoma City, Oklahoma. Explore padel facilities in Oklahoma County and the OKC metro area.'
),

-- =============================================================================
-- KENTUCKY (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'KY'),
    'Louisville', 'louisville', 'kentucky', 'Kentucky', 'KY',
    38.2527, -85.7585, 633045,
    'Louisville''s sports-loving community is adding padel to the Derby City''s roster, with facilities serving players across the greater Louisville area.',
    'Padel Courts in Louisville, KY | PadelFinder',
    'Find padel courts in Louisville, Kentucky. Browse padel facilities in Jefferson County and the greater Louisville area.'
),

-- =============================================================================
-- ADDITIONAL FLORIDA (2 more cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Coral Gables', 'coral-gables', 'florida', 'Florida', 'FL',
    25.7215, -80.2684, 49700,
    'Coral Gables'' Mediterranean-inspired architecture and affluent community create a perfect setting for padel in the heart of Miami-Dade County.',
    'Padel Courts in Coral Gables, FL | PadelFinder',
    'Find padel courts in Coral Gables, Florida. Discover premium padel facilities in the City Beautiful near downtown Miami.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'FL'),
    'Delray Beach', 'delray-beach', 'florida', 'Florida', 'FL',
    26.4615, -80.0728, 69451,
    'Delray Beach''s active beach community and vibrant downtown make it a natural fit for padel in southern Palm Beach County.',
    'Padel Courts in Delray Beach, FL | PadelFinder',
    'Find padel courts in Delray Beach, Florida. Browse padel facilities in southern Palm Beach County and the greater Delray Beach area.'
),

-- =============================================================================
-- ADDITIONAL TEXAS (2 more cities)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'Plano', 'plano', 'texas', 'Texas', 'TX',
    33.0198, -96.6989, 285494,
    'Plano''s family-oriented community and corporate headquarters presence make it a growing padel market in the northern DFW metroplex.',
    'Padel Courts in Plano, TX | PadelFinder',
    'Find padel courts in Plano, Texas. Explore padel facilities in Collin County and the northern Dallas suburbs.'
),
(
    (SELECT id FROM states WHERE abbreviation = 'TX'),
    'The Woodlands', 'the-woodlands', 'texas', 'Texas', 'TX',
    30.1658, -95.4613, 114436,
    'The Woodlands'' master-planned community and affluent demographics are driving padel investment in the northern Houston suburbs.',
    'Padel Courts in The Woodlands, TX | PadelFinder',
    'Find padel courts in The Woodlands, Texas. Discover padel facilities in Montgomery County and the greater north Houston area.'
),

-- =============================================================================
-- ADDITIONAL CALIFORNIA (1 more city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'CA'),
    'Santa Monica', 'santa-monica', 'california', 'California', 'CA',
    34.0195, -118.4912, 93076,
    'Santa Monica''s beach culture and health-conscious community have embraced padel, with coastal facilities offering play steps from the Pacific Ocean.',
    'Padel Courts in Santa Monica, CA | PadelFinder',
    'Find padel courts in Santa Monica, California. Browse padel facilities on the Westside of Los Angeles near the beach.'
),

-- =============================================================================
-- NEW MEXICO (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NM'),
    'Albuquerque', 'albuquerque', 'new-mexico', 'New Mexico', 'NM',
    35.0844, -106.6504, 564559,
    'Albuquerque''s warm climate and outdoor lifestyle are fostering padel interest in the Land of Enchantment''s largest city.',
    'Padel Courts in Albuquerque, NM | PadelFinder',
    'Find padel courts in Albuquerque, New Mexico. Explore padel facilities in Bernalillo County and central New Mexico.'
),

-- =============================================================================
-- IOWA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'IA'),
    'Des Moines', 'des-moines', 'iowa', 'Iowa', 'IA',
    41.5868, -93.6250, 214133,
    'Des Moines'' growing sports scene and central location are making Iowa''s capital an emerging padel market in the heartland.',
    'Padel Courts in Des Moines, IA | PadelFinder',
    'Find padel courts in Des Moines, Iowa. Browse padel facilities in Polk County and the greater Des Moines metro area.'
),

-- =============================================================================
-- NEBRASKA (1 city)
-- =============================================================================
(
    (SELECT id FROM states WHERE abbreviation = 'NE'),
    'Omaha', 'omaha', 'nebraska', 'Nebraska', 'NE',
    41.2565, -95.9345, 486051,
    'Omaha''s active community and growing sports infrastructure are introducing padel to the Great Plains with new court development.',
    'Padel Courts in Omaha, NE | PadelFinder',
    'Find padel courts in Omaha, Nebraska. Discover padel facilities in Douglas County and the greater Omaha area.'
);
