const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { getCityPage, hotelsFor } = require('../lib/city-pages');
const { openSearchDatabase, search } = require('../lib/search-db');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

const DESTINATION = {
  city: 'Durham',
  query: 'durham',
  url: 'durham.html',
  hotels: ['Radisson Blu Durham', 'Hotel Indigo Durham', 'Durham Marriott Royal County']
};

test('Durham is a listing page and searchable', () => {
  const catalog = loadCatalog();
  const db = openSearchDatabase();

  const city = catalog.cities.find((item) => item.city === DESTINATION.city);
  assert.ok(city, DESTINATION.city);
  assert.equal(city.country, 'Northeast England');
  assert.equal(city.url, DESTINATION.url);

  const hotels = catalog.hotels.filter((item) => item.city === DESTINATION.city);
  assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), DESTINATION.hotels);
  hotels.forEach((hotel) => {
    assert.notEqual(hotel.url, DESTINATION.url);
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true, hotel.url);
    const hotelHtml = fs.readFileSync(path.join(root, hotel.url), 'utf8');
    assert.match(hotelHtml, /class="hotel-detail"/);
    assert.match(hotelHtml, /site-preferences\.js/);
    assert.match(hotelHtml, /language-switcher|class="site-nav"/);
    assert.equal(hotel.country, 'Northeast England');
  });

  const html = fs.readFileSync(path.join(root, DESTINATION.url), 'utf8');
  const page = getCityPage(DESTINATION.url);
  assert.ok(page, DESTINATION.url);
  assert.equal(html, page.html);
  assert.equal(page.city_name, DESTINATION.city);
  assert.equal(page.country, 'Northeast England');
  assert.match(html, /name=["']viewport["']/);
  assert.match(html, /data-city="Durham"/);
  assert.match(html, /site-preferences\.js/);

  const stored = hotelsFor(DESTINATION.url);
  assert.equal(stored.length, DESTINATION.hotels.length);
  DESTINATION.hotels.forEach((name) => {
    assert.ok(stored.some((hotel) => hotel.name === name), name);
    assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  const found = search(db, DESTINATION.query);
  assert.ok(found.cities.some((item) => item.name === DESTINATION.city), DESTINATION.query);
  DESTINATION.hotels.forEach((name) => {
    assert.ok(found.hotels.some((hotel) => hotel.name === name), name);
  });
});
