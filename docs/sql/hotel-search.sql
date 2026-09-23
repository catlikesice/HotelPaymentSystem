-- Hotel search schema and queries for Boreal Horizons.
--
-- Dialect: SQLite 3.
-- Companion notes: docs/sql/hotel-search.md
--
-- This file matches the browser catalog search in assets/search.js and
-- assets/hero-search.js. It does not create bookings, availability, or
-- price-tier filters.
--
-- The INSERT rows are a worked example (Aarhus, Reykjavík, Riga, Tórshavn,
-- Tromsø). The live list is assets/search-catalog.js (55 cities, 146 hotels).
-- Load that catalog with the same columns and the same search_text rules.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per destination page (aarhus.html, reykjavík.html, ...).
CREATE TABLE cities (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  country       TEXT    NOT NULL,
  -- Public page, including the .html suffix, as SEARCH_CATALOG cities[].url.
  page_url      TEXT    NOT NULL UNIQUE,
  description   TEXT    NOT NULL,
  -- Catalog order. Results keep this order, same as Array.filter on the catalog.
  sort_order    INTEGER NOT NULL UNIQUE,
  -- hero-search.js normalize(name): lowercase, ø→o, strip diacritics, collapse space.
  name_key      TEXT    NOT NULL,
  -- search.js haystack: normalize(name + city + country + description + price + type).
  -- Cities have no price, so the joined source has an empty price slot (two spaces
  -- before the word "city"). See docs/sql/hotel-search.md.
  search_text   TEXT    NOT NULL
);

-- One row per hotel card. page_url is the city page for most hotels, and a
-- dedicated page for a few (for example grand-hotel-kempinski-riga.html).
CREATE TABLE hotels (
  id            INTEGER PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id),
  name          TEXT    NOT NULL,
  page_url      TEXT    NOT NULL,
  image_url     TEXT,
  -- Display string from the catalog, e.g. "0.08 ETH / night".
  -- Search matches this text, not a reformatted number.
  price_label   TEXT    NOT NULL,
  -- Numeric nightly rate in ETH. Returned as priceEth. Not a search filter.
  price_eth     REAL    NOT NULL CHECK (price_eth >= 0),
  description   TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL UNIQUE,
  name_key      TEXT    NOT NULL,
  -- hero-search.js normalize(name + " — " + city), em dash U+2014.
  label_key     TEXT    NOT NULL,
  search_text   TEXT    NOT NULL,
  UNIQUE (city_id, name)
);

CREATE INDEX hotels_city_id ON hotels (city_id);
CREATE INDEX hotels_name_key ON hotels (name_key);
CREATE INDEX cities_name_key ON cities (name_key);

-- ---------------------------------------------------------------------------
-- Example rows
-- search_text / name_key / label_key are precomputed in application code.
-- Do not lowercase them again in SQL: ø and diacritics are already folded.
-- ---------------------------------------------------------------------------

INSERT INTO cities (id, name, country, page_url, description, sort_order, name_key, search_text) VALUES
  (1, 'Aarhus', 'Denmark', 'aarhus.html',
   'Browse hotels in Aarhus, Denmark.', 1, 'aarhus',
   'aarhus aarhus denmark browse hotels in aarhus, denmark.  city'),
  (2, 'Reykjavík', 'Iceland', 'reykjavík.html',
   'Browse hotels in Reykjavík, Iceland.', 2, 'reykjavik',
   'reykjavik reykjavik iceland browse hotels in reykjavik, iceland.  city'),
  (3, 'Riga', 'Latvia', 'riga.html',
   'Browse hotels in Riga, Latvia.', 3, 'riga',
   'riga riga latvia browse hotels in riga, latvia.  city'),
  (4, 'Tórshavn', 'Faroe Islands', 'tórshavn.html',
   'Browse hotels in Tórshavn, Faroe Islands.', 4, 'torshavn',
   'torshavn torshavn faroe islands browse hotels in torshavn, faroe islands.  city'),
  (5, 'Tromsø', 'Norway', 'tromso.html',
   'Browse hotels in Tromsø, Norway.', 5, 'tromso',
   'tromso tromso norway browse hotels in tromso, norway.  city');

INSERT INTO hotels (
  id, city_id, name, page_url, image_url, price_label, price_eth, description,
  sort_order, name_key, label_key, search_text
) VALUES
  (1, 1, 'Hotel Royal Aarhus', 'aarhus.html',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
   '0.08 ETH / night', 0.08,
   'Luxury hotel in the heart of Aarhus, featuring elegant rooms, gourmet restaurant, and spa services.',
   1, 'hotel royal aarhus', 'hotel royal aarhus — aarhus',
   'hotel royal aarhus aarhus denmark luxury hotel in the heart of aarhus, featuring elegant rooms, gourmet restaurant, and spa services. 0.08 eth / night hotel'),
  (2, 3, 'Grand Hotel Kempinski', 'grand-hotel-kempinski-riga.html',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
   '0.09 ETH / night', 0.09,
   'Luxury stay in the heart of Riga with elegant rooms and spa facilities.',
   2, 'grand hotel kempinski', 'grand hotel kempinski — riga',
   'grand hotel kempinski riga latvia luxury stay in the heart of riga with elegant rooms and spa facilities. 0.09 eth / night hotel'),
  (3, 4, 'Hotel Føroyar', 'tórshavn.html',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
   '0.10 ETH / night', 0.10,
   'Hillside hotel above the capital, with grass-roof rooms and wide views over Tórshavn and Nólsoy.',
   3, 'hotel foroyar', 'hotel foroyar — torshavn',
   'hotel foroyar torshavn faroe islands hillside hotel above the capital, with grass-roof rooms and wide views over torshavn and nolsoy. 0.10 eth / night hotel'),
  (4, 5, 'Clarion Hotel The Edge', 'tromso.html',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
   '0.10 ETH / night', 0.10,
   'Waterfront hotel on the Tromsø Sound with harbour views and a short hop to the Arctic Cathedral.',
   4, 'clarion hotel the edge', 'clarion hotel the edge — tromso',
   'clarion hotel the edge tromso norway waterfront hotel on the tromso sound with harbour views and a short hop to the arctic cathedral. 0.10 eth / night hotel');

-- ---------------------------------------------------------------------------
-- Results page: GET /api/search?q=...
--
-- The route normalizes q with the search.js rules, splits on whitespace, and
-- inserts one row per token. Every token must occur as a substring.
-- instr() is used instead of LIKE so "%" and "_" in a query are literals.
--
-- If query_tokens is empty, this statement matches every row. The route must
-- not run it for a blank q. Return { "cities": [], "hotels": [] } instead.
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE query_tokens (
  position INTEGER PRIMARY KEY,
  token    TEXT NOT NULL
);

-- Worked example: q = "royal aarhus" (already normalized).
INSERT INTO query_tokens (position, token) VALUES
  (1, 'royal'),
  (2, 'aarhus');

-- Cities. Column names are the SEARCH_CATALOG / JSON keys.
SELECT
  'city'       AS type,
  c.name       AS name,
  c.name       AS city,
  c.country    AS country,
  c.page_url   AS url,
  c.description AS description
FROM cities AS c
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(c.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY c.sort_order;

-- Hotels.
SELECT
  'hotel'        AS type,
  h.name         AS name,
  c.name         AS city,
  c.country      AS country,
  h.page_url     AS url,
  h.image_url    AS image,
  h.price_label  AS price,
  h.price_eth    AS priceEth,
  h.description  AS description
FROM hotels AS h
JOIN cities AS c ON c.id = h.city_id
WHERE (
  SELECT COUNT(*)
  FROM query_tokens AS t
  WHERE instr(h.search_text, t.token) > 0
) = (SELECT COUNT(*) FROM query_tokens)
ORDER BY h.sort_order;

-- ---------------------------------------------------------------------------
-- Homepage destination: hero-search.js findDestination()
--
-- :needle is the hero-normalized destination (lowercase, ø→o, no diacritics,
-- collapsed whitespace). Blank input returns no row; do not query.
--
-- Priority matches the JavaScript branches, first hit in catalog order:
--   1. city name equals the needle
--   2. hotel name, or "name — city", equals the needle
--   3. city name starts with the needle, or the needle starts with the city name
--   4. hotel name contains the needle
-- ---------------------------------------------------------------------------

-- Worked example: needle = "reykjavik" (typed without the accent).
-- Replace the literal to try another destination.
SELECT kind, city_id, hotel_id, name, page_url
FROM (
  SELECT
    1 AS priority,
    'city' AS kind,
    c.id AS city_id,
    NULL AS hotel_id,
    c.name AS name,
    c.page_url AS page_url,
    c.sort_order AS sort_order
  FROM cities AS c
  WHERE c.name_key = 'reykjavik'

  UNION ALL

  SELECT
    2,
    'hotel',
    h.city_id,
    h.id,
    h.name,
    h.page_url,
    h.sort_order
  FROM hotels AS h
  WHERE h.name_key = 'reykjavik'
     OR h.label_key = 'reykjavik'

  UNION ALL

  SELECT
    3,
    'city',
    c.id,
    NULL,
    c.name,
    c.page_url,
    c.sort_order
  FROM cities AS c
  WHERE instr(c.name_key, 'reykjavik') = 1
     OR (c.name_key <> '' AND instr('reykjavik', c.name_key) = 1)

  UNION ALL

  SELECT
    4,
    'hotel',
    h.city_id,
    h.id,
    h.name,
    h.page_url,
    h.sort_order
  FROM hotels AS h
  WHERE instr(h.name_key, 'reykjavik') > 0
)
ORDER BY priority, sort_order
LIMIT 1;
