'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DatabaseSync } = require('node:sqlite');
const placesWithoutPages = require('./places-without-pages');

function normalizeResults(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeHero(text) {
  return normalizeResults(text).replace(/\s+/g, ' ').trim();
}

function searchText(item) {
  return normalizeResults([
    item.name,
    item.city,
    item.country,
    item.description,
    item.price,
    item.type
  ].join(' '));
}

function tokensFor(query) {
  const normalized = normalizeResults(String(query || '').trim())
    .replace(/[—–]/g, ' ');
  if (!normalized.trim()) {
    return [];
  }
  return normalized.split(/\s+/).filter(Boolean);
}

function loadStaticCatalog() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG || { cities: [], hotels: [] };
}

function createSchema(db) {
  db.exec(`
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
  `);
}

function blankToNull(url) {
  const value = String(url || '').trim();
  return value || null;
}

function seed(db, catalog, extras) {
  const insertCity = db.prepare(`
    INSERT INTO cities
      (id, name, country, page_url, description, sort_order, name_key, search_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHotel = db.prepare(`
    INSERT INTO hotels (
      id, city_id, name, page_url, image_url, price_label, price_eth, description,
      sort_order, name_key, label_key, search_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const cityIds = new Map();
  let cityOrder = 0;
  let nextCityId = 0;

  function addCity(city) {
    const name = city.name;
    if (!name || cityIds.has(name)) {
      return;
    }
    nextCityId += 1;
    cityOrder += 1;
    insertCity.run(
      nextCityId,
      name,
      city.country,
      blankToNull(city.url || city.page_url),
      city.description || '',
      cityOrder,
      normalizeHero(name),
      searchText({
        type: 'city',
        name: name,
        city: city.city || name,
        country: city.country,
        description: city.description,
        price: city.price
      })
    );
    cityIds.set(name, nextCityId);
  }

  (catalog.cities || []).forEach(addCity);
  (extras.cities || []).forEach(addCity);

  let hotelOrder = 0;
  let nextHotelId = 0;

  function addHotel(hotel) {
    const cityId = cityIds.get(hotel.city);
    if (!cityId) {
      throw new Error('Hotel ' + hotel.name + ' is missing city ' + hotel.city);
    }
    nextHotelId += 1;
    hotelOrder += 1;
    insertHotel.run(
      nextHotelId,
      cityId,
      hotel.name,
      blankToNull(hotel.url || hotel.page_url),
      hotel.image || hotel.image_url || null,
      hotel.price,
      Number(hotel.priceEth),
      hotel.description || '',
      hotelOrder,
      normalizeHero(hotel.name),
      normalizeHero(hotel.name + ' — ' + hotel.city),
      searchText({
        type: 'hotel',
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        description: hotel.description,
        price: hotel.price
      })
    );
  }

  (catalog.hotels || []).forEach(addHotel);
  (extras.hotels || []).forEach(addHotel);
}

function tokenClause(column, tokens) {
  return {
    sql: tokens.map(() => 'instr(' + column + ', ?) > 0').join(' AND '),
    params: tokens.slice()
  };
}

function plain(row) {
  return Object.assign({}, row);
}

function search(db, query) {
  const tokens = tokensFor(query);
  if (!tokens.length) {
    return { cities: [], hotels: [] };
  }

  const cityWhere = tokenClause('c.search_text', tokens);
  const hotelWhere = tokenClause('h.search_text', tokens);
  const cities = db.prepare(`
    SELECT
      'city' AS type,
      c.name AS name,
      c.name AS city,
      c.country AS country,
      c.page_url AS url,
      c.description AS description
    FROM cities AS c
    WHERE ${cityWhere.sql}
    ORDER BY c.sort_order
  `).all(...cityWhere.params).map(plain);

  const hotels = db.prepare(`
    SELECT
      'hotel' AS type,
      h.name AS name,
      c.name AS city,
      c.country AS country,
      h.page_url AS url,
      c.page_url AS cityUrl,
      h.image_url AS image,
      h.price_label AS price,
      h.price_eth AS priceEth,
      h.description AS description
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    WHERE ${hotelWhere.sql}
    ORDER BY h.sort_order
  `).all(...hotelWhere.params).map(plain);

  return { cities, hotels };
}

function destinationLabels(db) {
  const cities = db.prepare('SELECT name FROM cities ORDER BY sort_order').all();
  const hotels = db.prepare(`
    SELECT h.name AS name, c.name AS city
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    ORDER BY h.sort_order
  `).all();
  const labels = [];
  cities.forEach((row) => labels.push(row.name));
  hotels.forEach((row) => labels.push(row.name + ' — ' + row.city));
  labels.sort((a, b) => a.localeCompare(b));
  return labels;
}

function openSearchDatabase(options) {
  const db = new DatabaseSync((options && options.filename) || ':memory:');
  createSchema(db);
  seed(
    db,
    (options && options.catalog) || loadStaticCatalog(),
    (options && options.extras) || placesWithoutPages
  );
  return db;
}

let shared = null;

function getSearchDatabase() {
  if (!shared) {
    shared = openSearchDatabase();
  }
  return shared;
}

module.exports = {
  normalizeResults,
  normalizeHero,
  searchText,
  tokensFor,
  loadStaticCatalog,
  openSearchDatabase,
  getSearchDatabase,
  search,
  destinationLabels
};
