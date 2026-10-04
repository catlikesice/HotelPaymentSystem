'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getCityPage, hotelsFor, listCityPages } = require('./city-pages');
const { getSearchDatabase } = require('./search-db');

const SQL_FILE = path.join(__dirname, '..', 'docs', 'sql', 'hotel-addons.sql');

// Same GBP amounts as the Esbjerg rows: £18, £16, £28, and £22.
const BREAKFAST_ETH = 0.008289473684210525;
const LATE_CHECKOUT_ETH = 0.00736842105263158;
const WALKING_TOUR_ETH = 0.012894736842105264;
const STATION_TRANSFER_ETH = 0.01013157894736842;

let database;
let stayCatalog;

function db() {
  if (!database) {
    database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(SQL_FILE, 'utf8'));
    ensureCoverage(database);
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

function foldName(value) {
  return clean(value, 180)
    .toLowerCase()
    .replace(/[\u2019\u2018\u02bc']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function nameMatches(left, right) {
  const a = foldName(left);
  const b = foldName(right);
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  return a.startsWith(b + ' ') || b.startsWith(a + ' ');
}

function slug(value) {
  return foldName(value).replace(/ /g, '-').replace(/-+/g, '-').slice(0, 80);
}

function stayCatalogRows() {
  if (stayCatalog) {
    return stayCatalog;
  }
  const seen = new Map();

  function add(name, city, country, pageUrl, preferListed) {
    const hotelName = clean(name, 160);
    const cityName = clean(city, 80);
    if (!hotelName || !cityName) {
      return;
    }
    const key = foldName(cityName) + '\n' + foldName(hotelName);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, {
        name: hotelName,
        city: cityName,
        country: clean(country, 80),
        pageUrl: clean(pageUrl, 180)
      });
      return;
    }
    if (preferListed) {
      existing.name = hotelName;
      if (country) {
        existing.country = clean(country, 80);
      }
      if (pageUrl) {
        existing.pageUrl = clean(pageUrl, 180);
      }
    }
  }

  getSearchDatabase().prepare(`
    SELECT h.name AS name, c.name AS city, c.country AS country, c.page_url AS page_url
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
  `).all().forEach((row) => add(row.name, row.city, row.country, row.page_url, false));

  listCityPages().forEach((page) => {
    hotelsFor(page.page_url).forEach((hotel) => {
      add(hotel.name, page.city_name, page.country, page.page_url, true);
    });
  });

  stayCatalog = Array.from(seen.values());
  return stayCatalog;
}

function catalogNames(cityName) {
  const city = foldName(cityName);
  return stayCatalogRows()
    .filter((row) => foldName(row.city) === city)
    .map((row) => row.name);
}

function alignToCatalog(hotelName, names) {
  const requested = clean(hotelName, 160);
  if (!requested) {
    return '';
  }
  const exact = names.find((name) => foldName(name) === foldName(requested));
  if (exact) {
    return exact;
  }
  const matches = names.filter((name) => nameMatches(requested, name));
  if (matches.length === 1) {
    return matches[0];
  }
  return requested;
}

function insertAddon(database, row) {
  database.prepare(`
    INSERT OR IGNORE INTO hotel_addons (
      id, addon_id, scope, hotel_name, city_name, country, page_url,
      category, label, description, detail_line, price_eth, billing, icon, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    row.addonId,
    row.scope,
    row.hotelName,
    row.city,
    row.country || '',
    row.pageUrl || '',
    row.category,
    row.label,
    row.description,
    row.detailLine,
    row.priceEth,
    row.billing,
    row.icon,
    row.sortOrder
  );
}

function insertStayPair(database, stay) {
  const citySlug = slug(stay.city);
  const hotelSlug = slug(stay.name);
  insertAddon(database, {
    id: citySlug + ':' + hotelSlug + ':breakfast',
    addonId: 'breakfast',
    scope: 'hotel',
    hotelName: stay.name,
    city: stay.city,
    country: stay.country,
    pageUrl: stay.pageUrl,
    category: 'stay',
    label: 'Breakfast for two',
    description: 'Hot breakfast for two each morning of the stay.',
    detailLine: 'Served each morning',
    priceEth: BREAKFAST_ETH,
    billing: 'per-night',
    icon: 'utensils',
    sortOrder: 10
  });
  insertAddon(database, {
    id: citySlug + ':' + hotelSlug + ':late-checkout',
    addonId: 'late-checkout',
    scope: 'hotel',
    hotelName: stay.name,
    city: stay.city,
    country: stay.country,
    pageUrl: stay.pageUrl,
    category: 'stay',
    label: 'Late checkout',
    description: 'Keep the room until 15:00 on departure day.',
    detailLine: 'Until 15:00',
    priceEth: LATE_CHECKOUT_ETH,
    billing: 'per-stay',
    icon: 'hotel',
    sortOrder: 20
  });
}

function stayRowsForCity(database, cityName) {
  return database.prepare(`
    SELECT hotel_name
    FROM hotel_addons
    WHERE city_name = ? COLLATE NOCASE
      AND scope = 'hotel'
      AND category = 'stay'
  `).all(cityName);
}

function hotelHasStay(database, cityName, hotelName) {
  return stayRowsForCity(database, cityName).some((row) => nameMatches(hotelName, row.hotel_name));
}

function cityHasCategory(database, cityName, category) {
  return Boolean(database.prepare(`
    SELECT 1 AS ok
    FROM hotel_addons
    WHERE city_name = ? COLLATE NOCASE
      AND scope = 'city'
      AND category = ?
    LIMIT 1
  `).get(cityName, category));
}

function ensureCoverage(database) {
  const stays = stayCatalogRows();
  const cities = new Map();
  stays.forEach((stay) => {
    cities.set(foldName(stay.city), stay);
    if (hotelHasStay(database, stay.city, stay.name)) {
      return;
    }
    insertStayPair(database, stay);
  });
  cities.forEach((stay) => {
    if (!cityHasCategory(database, stay.city, 'experience')) {
      insertAddon(database, {
        id: slug(stay.city) + ':city:walking-tour',
        addonId: 'walking-tour',
        scope: 'city',
        hotelName: '',
        city: stay.city,
        country: stay.country,
        pageUrl: stay.pageUrl,
        category: 'experience',
        label: stay.city + ' walking tour',
        description: 'Guided walk through ' + stay.city + ' with a local guide.',
        detailLine: '2 hours · English-language guide',
        priceEth: WALKING_TOUR_ETH,
        billing: 'per-stay',
        icon: 'walk',
        sortOrder: 100
      });
    }
    if (!cityHasCategory(database, stay.city, 'transport')) {
      insertAddon(database, {
        id: slug(stay.city) + ':city:station-transfer',
        addonId: 'station-transfer',
        scope: 'city',
        hotelName: '',
        city: stay.city,
        country: stay.country,
        pageUrl: stay.pageUrl,
        category: 'transport',
        label: stay.city + ' station transfer',
        description: 'Private car between ' + stay.city + ' station and the hotel.',
        detailLine: 'One way · private car',
        priceEth: STATION_TRANSFER_ETH,
        billing: 'per-stay',
        icon: 'bus',
        sortOrder: 200
      });
    }
  });
}

function hotelFromOwnPage(page) {
  const file = clean(page, 180);
  if (!file || file === 'index.html' || file === 'search.html' || file === 'trip.html' || file === 'checkout.html') {
    return null;
  }
  const rows = getSearchDatabase().prepare(`
    SELECT
      h.name AS name,
      c.name AS city,
      c.country AS country,
      c.page_url AS city_url,
      h.page_url AS page_url
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
    WHERE h.page_url = ?
  `).all(file);
  const dedicated = rows.filter((row) => row.page_url && row.page_url !== row.city_url);
  if (dedicated.length !== 1) {
    return null;
  }
  return {
    name: dedicated[0].name,
    city: dedicated[0].city,
    country: dedicated[0].country || '',
    pageUrl: dedicated[0].city_url || ''
  };
}

function addonsForCity(cityName, hotelName) {
  const city = clean(cityName, 80);
  const hotel = clean(hotelName, 160);
  if (!city) {
    return [];
  }
  const names = catalogNames(city);
  return db().prepare(`
    SELECT
      addon_id, scope, hotel_name, city_name, country, page_url, category,
      label, description, detail_line, price_eth, billing, icon
    FROM hotel_addons
    WHERE city_name = ? COLLATE NOCASE
    ORDER BY sort_order, label
  `).all(city).map(publicAddon).map((addon) => {
    if (addon.scope !== 'hotel' || !addon.hotelName) {
      return addon;
    }
    return Object.assign({}, addon, { hotelName: alignToCatalog(addon.hotelName, names) });
  }).filter((addon) => {
    if (!hotel || addon.scope === 'city') {
      return true;
    }
    return nameMatches(hotel, addon.hotelName);
  });
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
  return alignToCatalog(hotelName, catalogNames(cityName));
}

function listAddons(query) {
  const resolved = resolveCity(query);
  if (resolved instanceof Error) {
    throw resolved;
  }
  if (!resolved) {
    throw fail(400, 'Choose a hotel or a city to see add-ons.');
  }
  const requested = clean(query && query.hotel, 160);
  let hotelName = canonicalHotelName(resolved.city, requested);
  const fromPage = hotelFromOwnPage(query && query.page);
  if (fromPage && foldName(fromPage.city) === foldName(resolved.city)) {
    const requestedMatchesPage = !requested || nameMatches(requested, fromPage.name);
    const requestedMatchesOther = Boolean(requested) && catalogNames(resolved.city).some((name) => {
      return nameMatches(requested, name) && foldName(name) !== foldName(fromPage.name);
    });
    if (requestedMatchesPage || !requestedMatchesOther) {
      hotelName = fromPage.name;
    }
  }
  if (hotelName && !hotelHasStay(db(), resolved.city, hotelName)) {
    insertStayPair(db(), {
      name: hotelName,
      city: resolved.city,
      country: resolved.country,
      pageUrl: resolved.pageUrl
    });
  }
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
