'use strict';

const { loadStaticCatalog } = require('./search-db');
const placesWithoutPages = require('./places-without-pages');
const {
  normalizeHero,
  searchText,
  foldMapEntries,
  foldWalkSql
} = require('./text-fold');

function sqlText(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlNullable(value) {
  const text = String(value || '').trim();
  return text ? sqlText(text) : 'NULL';
}

function sqlNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error('Expected a numeric price, got ' + value);
  }
  return String(number);
}

function schemaSql() {
  return `
PRAGMA foreign_keys = ON;

CREATE TABLE cities (
  id            INTEGER PRIMARY KEY,
  name          TEXT    NOT NULL,
  country       TEXT    NOT NULL,
  page_url      TEXT    UNIQUE,
  description   TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL UNIQUE,
  name_key      TEXT    NOT NULL,
  search_text   TEXT    NOT NULL
);

CREATE TABLE hotels (
  id            INTEGER PRIMARY KEY,
  city_id       INTEGER NOT NULL REFERENCES cities(id),
  name          TEXT    NOT NULL,
  page_url      TEXT,
  image_url     TEXT,
  price_label   TEXT    NOT NULL,
  price_eth     REAL    NOT NULL CHECK (price_eth >= 0),
  description   TEXT    NOT NULL,
  sort_order    INTEGER NOT NULL UNIQUE,
  name_key      TEXT    NOT NULL,
  label_key     TEXT    NOT NULL,
  search_text   TEXT    NOT NULL,
  UNIQUE (city_id, name)
);

CREATE INDEX hotels_city_id ON hotels (city_id);
CREATE INDEX hotels_name_key ON hotels (name_key);
CREATE INDEX cities_name_key ON cities (name_key);

-- One row per character that folding changes. SQLite lower() is ASCII-only
-- and there is no unaccent, so queries walk this table with replace().
CREATE TABLE fold_map (
  src TEXT PRIMARY KEY,
  dst TEXT NOT NULL
);
`.trim();
}

function foldMapSql() {
  const rows = foldMapEntries().map(([src, dst]) => '  (' + sqlText(src) + ', ' + sqlText(dst) + ')');
  return 'INSERT INTO fold_map (src, dst) VALUES\n' + rows.join(',\n') + ';';
}

function cityRows(catalog, extras) {
  const rows = [];
  const seen = new Set();
  function add(city) {
    const name = city.name;
    if (!name || seen.has(name)) {
      return;
    }
    seen.add(name);
    rows.push({
      id: rows.length + 1,
      name: name,
      country: city.country,
      pageUrl: city.url || city.page_url,
      description: city.description || '',
      nameKey: normalizeHero(name),
      searchText: searchText({
        type: 'city',
        name: name,
        city: city.city || name,
        country: city.country,
        description: city.description,
        price: city.price
      })
    });
  }
  (catalog.cities || []).forEach(add);
  (extras.cities || []).forEach(add);
  return rows;
}

function hotelRows(cities, catalog, extras) {
  const cityIds = new Map(cities.map((city) => [city.name, city.id]));
  const rows = [];
  function add(hotel) {
    const cityId = cityIds.get(hotel.city);
    if (!cityId) {
      throw new Error('Hotel ' + hotel.name + ' is missing city ' + hotel.city);
    }
    rows.push({
      id: rows.length + 1,
      cityId: cityId,
      name: hotel.name,
      city: hotel.city,
      country: hotel.country,
      pageUrl: hotel.url || hotel.page_url,
      image: hotel.image || hotel.image_url,
      price: hotel.price,
      priceEth: hotel.priceEth,
      description: hotel.description || '',
      nameKey: normalizeHero(hotel.name),
      labelKey: normalizeHero(hotel.name + ' — ' + hotel.city),
      searchText: searchText({
        type: 'hotel',
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        description: hotel.description,
        price: hotel.price
      })
    });
  }
  (catalog.hotels || []).forEach(add);
  (extras.hotels || []).forEach(add);
  return rows;
}

function insertCities(cities) {
  const values = cities.map((city) => '  (' + [
    city.id,
    sqlText(city.name),
    sqlText(city.country),
    sqlNullable(city.pageUrl),
    sqlText(city.description),
    city.id,
    sqlText(city.nameKey),
    sqlText(city.searchText)
  ].join(', ') + ')');
  return 'INSERT INTO cities (id, name, country, page_url, description, sort_order, name_key, search_text) VALUES\n'
    + values.join(',\n') + ';';
}

function insertHotels(hotels) {
  const values = hotels.map((hotel) => '  (' + [
    hotel.id,
    hotel.cityId,
    sqlText(hotel.name),
    sqlNullable(hotel.pageUrl),
    sqlNullable(hotel.image),
    sqlText(hotel.price),
    sqlNumber(hotel.priceEth),
    sqlText(hotel.description),
    hotel.id,
    sqlText(hotel.nameKey),
    sqlText(hotel.labelKey),
    sqlText(hotel.searchText)
  ].join(', ') + ')');
  return 'INSERT INTO hotels (\n'
    + '  id, city_id, name, page_url, image_url, price_label, price_eth, description,\n'
    + '  sort_order, name_key, label_key, search_text\n'
    + ') VALUES\n'
    + values.join(',\n') + ';';
}

function queryFooter() {
  const folded = foldWalkSql("coalesce((SELECT value FROM fold_input LIMIT 1), '')").trim();
  return `
-- ---------------------------------------------------------------------------
-- Fold a raw query inside SQL. The caller does not normalize first.
-- Put the typed text in fold_input, then read raw_query_tokens.
-- Em dash and en dash become spaces, matching the homepage label separator.
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE fold_input (
  value TEXT
);

CREATE TEMP VIEW folded_value AS
${folded};

CREATE TEMP VIEW folded_key AS
WITH RECURSIVE
base AS (
  SELECT trim(folded) AS value FROM folded_value
),
squeeze(n, value) AS (
  SELECT 0, value FROM base
  UNION ALL
  SELECT n + 1, replace(value, '  ', ' ')
  FROM squeeze
  WHERE instr(value, '  ') > 0 AND n < 40
)
SELECT value AS key FROM squeeze ORDER BY n DESC LIMIT 1;

CREATE TEMP TABLE query_tokens (
  position INTEGER PRIMARY KEY,
  token    TEXT NOT NULL
);

CREATE TEMP VIEW raw_query_tokens AS
WITH RECURSIVE
prepared AS (
  SELECT trim(replace(replace(folded, '—', ' '), '–', ' ')) AS s
  FROM folded_value
),
parts(position, token, rest) AS (
  SELECT
    1,
    substr(trim(s) || ' ', 1, instr(trim(s) || ' ', ' ') - 1),
    ltrim(substr(trim(s) || ' ', instr(trim(s) || ' ', ' ') + 1))
  FROM prepared
  WHERE trim(s) <> ''
  UNION ALL
  SELECT
    position + 1,
    substr(rest || ' ', 1, instr(rest || ' ', ' ') - 1),
    ltrim(substr(rest || ' ', instr(rest || ' ', ' ') + 1))
  FROM parts
  WHERE rest <> ''
)
SELECT position, token FROM parts WHERE token <> '';

-- Worked example: typed "Royal Aarhus". Folding yields royal and aarhus.
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Royal Aarhus');
DELETE FROM query_tokens;
INSERT INTO query_tokens (position, token)
SELECT position, token FROM raw_query_tokens;

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

SELECT
  'hotel'        AS type,
  h.name         AS name,
  c.name         AS city,
  c.country      AS country,
  h.page_url     AS url,
  c.page_url     AS cityUrl,
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

-- Worked example: typed "Nida". The city and hotel have no HTML page.
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Nida');
DELETE FROM query_tokens;
INSERT INTO query_tokens (position, token)
SELECT position, token FROM raw_query_tokens;

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

SELECT
  'hotel'        AS type,
  h.name         AS name,
  c.name         AS city,
  c.country      AS country,
  h.page_url     AS url,
  c.page_url     AS cityUrl,
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

-- Homepage destination. Typed "Reykjavík"; folded_key is reykjavik.
-- Priority matches hero-search.js findDestination(), first hit in catalog order:
--   1. city name equals the needle
--   2. hotel name, or "name — city", equals the needle
--   3. city name starts with the needle, or the needle starts with the city name
--   4. hotel name contains the needle
DELETE FROM fold_input;
INSERT INTO fold_input (value) VALUES ('Reykjavík');

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
  WHERE c.name_key = (SELECT key FROM folded_key)

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
  WHERE h.name_key = (SELECT key FROM folded_key)
     OR h.label_key = (SELECT key FROM folded_key)

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
  WHERE instr(c.name_key, (SELECT key FROM folded_key)) = 1
     OR (
       c.name_key <> ''
       AND instr((SELECT key FROM folded_key), c.name_key) = 1
     )

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
  WHERE instr(h.name_key, (SELECT key FROM folded_key)) > 0
)
ORDER BY priority, sort_order
LIMIT 1;
`.trim();
}

function renderHotelSearchSql(catalog, extras) {
  const sourceCatalog = catalog || loadStaticCatalog();
  const sourceExtras = extras || placesWithoutPages;
  const cities = cityRows(sourceCatalog, sourceExtras);
  const hotels = hotelRows(cities, sourceCatalog, sourceExtras);
  return [
    '-- Hotel search schema, catalog, and queries for Boreal Horizons.',
    '--',
    '-- Dialect: SQLite 3.',
    '-- Companion notes: docs/sql/hotel-search.md',
    '--',
    '-- This file is the search database. lib/search-db.js loads it, the same',
    '-- way lib/city-pages.js loads city-pages.sql. It lists every catalog city',
    '-- and hotel, plus places that have no HTML page.',
    '--',
    '-- search_text, name_key, and label_key are already folded. A raw query is',
    '-- folded with fold_map below, so sqlite3 can search without JavaScript.',
    '-- Regenerated from assets/search-catalog.js and lib/places-without-pages.js',
    '-- by lib/search-sql.js.',
    '',
    schemaSql(),
    '',
    foldMapSql(),
    '',
    'BEGIN;',
    insertCities(cities),
    '',
    insertHotels(hotels),
    'COMMIT;',
    '',
    queryFooter(),
    ''
  ].join('\n');
}

module.exports = {
  renderHotelSearchSql,
  cityRows,
  hotelRows
};
