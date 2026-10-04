'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getCityPage, hotelsFor } = require('./city-pages');
const { getSearchDatabase } = require('./search-db');

const SQL_FILE = path.join(__dirname, '..', 'docs', 'sql', 'hotel-addons.sql');

let database;

function db() {
  if (!database) {
    database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(SQL_FILE, 'utf8'));
  }
  return database;
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function clean(value, max) {
  const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  if (!max || text.length <= max) {
    return text;
  }
  return text.slice(0, max);
}

function nightlyEth(row) {
  const direct = Number(row.price_eth != null ? row.price_eth : row.priceEth);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }
  const label = String(row.price_label || row.price || '');
  const match = label.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return 0;
  }
  const parsed = parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function usableDescription(text) {
  const value = clean(text, 280);
  if (!value || /^back to booking$/i.test(value)) {
    return '';
  }
  return value;
}

function cityFromPage(page) {
  if (!page) {
    return null;
  }
  const stored = getCityPage(page);
  if (!stored) {
    return null;
  }
  return {
    city: stored.city_name,
    country: stored.country || '',
    pageUrl: stored.page_url
  };
}

function cityFromName(name) {
  const city = clean(name, 80);
  if (!city) {
    return null;
  }
  const row = getSearchDatabase().prepare(`
    SELECT name, country, page_url
    FROM cities
    WHERE name = ? COLLATE NOCASE
  `).get(city);
  if (!row) {
    return null;
  }
  return {
    city: row.name,
    country: row.country || '',
    pageUrl: row.page_url || ''
  };
}

function cityFromHotelPage(page) {
  const file = clean(page, 180);
  if (!file) {
    return null;
  }
  const row = getSearchDatabase().prepare(`
    SELECT c.name AS city, c.country AS country, c.page_url AS page_url
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    WHERE h.page_url = ?
    ORDER BY h.sort_order
    LIMIT 1
  `).get(file);
  if (!row) {
    return null;
  }
  return {
    city: row.city,
    country: row.country || '',
    pageUrl: row.page_url || ''
  };
}

function hotelsFromSearch(cityName) {
  return getSearchDatabase().prepare(`
    SELECT
      h.name AS name,
      c.name AS city,
      c.country AS country,
      h.page_url AS page_url,
      c.page_url AS city_url,
      h.image_url AS image_url,
      h.price_label AS price_label,
      h.price_eth AS price_eth,
      h.description AS description
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    WHERE c.name = ?
    ORDER BY h.sort_order
  `).all(cityName);
}

function hotelsNamed(hotelName) {
  return getSearchDatabase().prepare(`
    SELECT
      h.name AS name,
      c.name AS city,
      c.country AS country,
      h.page_url AS page_url,
      c.page_url AS city_url
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    WHERE h.name = ? COLLATE NOCASE
    ORDER BY h.sort_order
  `).all(hotelName);
}

function ownPage(pageUrl, cityUrl) {
  const page = clean(pageUrl, 180);
  const cityPage = clean(cityUrl, 180);
  if (!page || page === cityPage || page === 'index.html' || page === 'search.html') {
    return '';
  }
  return page;
}

function mergeHotels(city, pageHotels, searchHotels) {
  const byName = new Map();
  const order = [];

  function add(row, preferListed) {
    const name = clean(row.name, 160);
    if (!name) {
      return;
    }
    const nightly = nightlyEth(row);
    const description = usableDescription(row.description);
    const existing = byName.get(name);
    if (!existing) {
      order.push(name);
      byName.set(name, {
        name,
        city: city.city,
        country: city.country || row.country || '',
        chain: clean(row.chain_name, 120),
        image: row.image_url || '',
        description,
        priceEth: nightly,
        priceLabel: clean(row.price_label || row.price, 80),
        pageUrl: city.pageUrl || row.city_url || '',
        ownPage: ownPage(row.book_url || row.page_url, city.pageUrl || row.city_url)
      });
      return;
    }
    if (preferListed || !existing.chain) {
      const chain = clean(row.chain_name, 120);
      if (chain) {
        existing.chain = chain;
      }
    }
    if ((preferListed || !existing.image) && row.image_url) {
      existing.image = row.image_url;
    }
    if ((preferListed || !existing.description) && description) {
      existing.description = description;
    }
    if (nightly > 0 && (preferListed || !(existing.priceEth > 0))) {
      existing.priceEth = nightly;
    }
    const label = clean(row.price_label || row.price, 80);
    if (label && (preferListed || !existing.priceLabel)) {
      existing.priceLabel = label;
    }
    const dedicated = ownPage(row.book_url || row.page_url, city.pageUrl || row.city_url);
    if (dedicated && (preferListed || !existing.ownPage)) {
      existing.ownPage = dedicated;
    }
  }

  pageHotels.forEach((row) => add(row, true));
  searchHotels.forEach((row) => add(row, false));
  return order.map((name) => byName.get(name));
}

function publicHotel(hotel) {
  return {
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    chain: hotel.chain || '',
    image: hotel.image || '',
    description: hotel.description || '',
    priceEth: hotel.priceEth || 0,
    priceLabel: hotel.priceLabel || '',
    pageUrl: hotel.pageUrl || '',
    ownPage: hotel.ownPage || ''
  };
}

function publicAddon(row) {
  return {
    id: row.addon_id,
    scope: row.scope,
    hotelName: row.hotel_name || '',
    city: row.city_name,
    country: row.country || '',
    pageUrl: row.page_url || '',
    category: row.category,
    label: row.label,
    description: row.description || '',
    detailLine: row.detail_line || '',
    priceEth: row.price_eth,
    billing: row.billing,
    icon: row.icon || ''
  };
}

function addonsForCity(cityName, hotelName) {
  const city = clean(cityName, 80);
  const hotel = clean(hotelName, 160);
  if (!city) {
    return [];
  }
  return db().prepare(`
    SELECT
      addon_id, scope, hotel_name, city_name, country, page_url, category,
      label, description, detail_line, price_eth, billing, icon
    FROM hotel_addons
    WHERE city_name = ? COLLATE NOCASE
      AND (
        scope = 'city'
        OR (
          scope = 'hotel'
          AND (? = '' OR hotel_name = ? COLLATE NOCASE)
        )
      )
    ORDER BY sort_order, label
  `).all(city, hotel, hotel).map(publicAddon);
}

function resolveCity(query) {
  const requestedPage = clean(query && query.page, 180);
  const requestedCity = clean(query && query.city, 80);
  const requestedHotel = clean(query && query.hotel, 160);
  return cityFromPage(requestedPage)
    || cityFromName(requestedCity)
    || cityFromHotelPage(requestedPage)
    || (function () {
      if (!requestedHotel) {
        return null;
      }
      const matches = hotelsNamed(requestedHotel);
      if (matches.length !== 1) {
        return matches.length > 1 ? fail(400, 'More than one hotel uses that name. Include the city.') : null;
      }
      return {
        city: matches[0].city,
        country: matches[0].country || '',
        pageUrl: matches[0].city_url || ''
      };
    })();
}

function canonicalHotelName(cityName, hotelName) {
  const requested = clean(hotelName, 160);
  if (!requested) {
    return '';
  }
  const match = hotelsFromSearch(cityName).find((hotel) => hotel.name.toLowerCase() === requested.toLowerCase());
  return match ? match.name : requested;
}

function listAddons(query) {
  const resolved = resolveCity(query);
  if (resolved instanceof Error) {
    throw resolved;
  }
  if (!resolved) {
    throw fail(400, 'Choose a hotel or a city to see add-ons.');
  }
  const hotelName = canonicalHotelName(resolved.city, query && query.hotel);
  return {
    hotel: hotelName,
    city: resolved.city,
    country: resolved.country,
    pageUrl: resolved.pageUrl || '',
    addons: addonsForCity(resolved.city, hotelName)
  };
}

function tripOffer(query) {
  const resolved = resolveCity(query);
  if (resolved instanceof Error) {
    throw resolved;
  }
  if (!resolved) {
    throw fail(404, 'Choose a hotel to build a trip.');
  }
  const pageHotels = resolved.pageUrl ? hotelsFor(resolved.pageUrl) : [];
  const hotels = mergeHotels(resolved, pageHotels, hotelsFromSearch(resolved.city)).map(publicHotel);
  const requested = clean(query && query.hotel, 160).toLowerCase();
  const selected = hotels.find((hotel) => hotel.name.toLowerCase() === requested) || hotels[0] || null;
  return {
    city: resolved.city,
    country: resolved.country,
    pageUrl: resolved.pageUrl || '',
    selectedHotel: selected ? selected.name : '',
    hotels,
    addons: addonsForCity(resolved.city, '')
  };
}

module.exports = {
  SQL_FILE,
  listAddons,
  tripOffer,
  addonsForCity
};
