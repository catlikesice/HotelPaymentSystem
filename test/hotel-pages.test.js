const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const places = require('../lib/places-without-pages');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

function assertHotelPage(hotel, cityUrl) {
  assert.ok(hotel.url, hotel.name + ' should have a page url');
  assert.notEqual(hotel.url, cityUrl || '', hotel.name + ' should not reuse the city page');
  const filePath = path.join(root, hotel.url);
  assert.equal(fs.existsSync(filePath), true, hotel.url + ' should exist for ' + hotel.name);
  const html = fs.readFileSync(filePath, 'utf8');
  assert.match(html, /<meta\s+name=["']viewport["']/i, hotel.url);
  assert.match(html, /class="hotel-detail"/, hotel.url);
  assert.match(html, /site-preferences\.js/, hotel.url + ' should load the shared navbar');
  assert.match(html, /language-switcher|class="site-nav"/, hotel.url + ' should include the navbar');
}

test('every catalog hotel has an HTML page with the navbar', () => {
  const catalog = loadCatalog();
  const cityUrls = new Map(catalog.cities.map((city) => [city.city, city.url]));
  assert.ok(catalog.hotels.length > 0);
  catalog.hotels.forEach((hotel) => {
    assertHotelPage(hotel, cityUrls.get(hotel.city));
  });
});

test('hotels in places without a city page still have their own HTML page', () => {
  places.hotels.forEach((hotel) => {
    assertHotelPage(hotel, null);
  });
});
