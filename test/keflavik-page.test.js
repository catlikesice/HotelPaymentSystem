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

const HOTELS = [
  'Hótel Berg',
  'Guesthouse 1x6',
  'Courtyard by Marriott Reykjavik Keflavik Airport'
];

test('Keflavík is on the HTML city list and in search', () => {
  const catalog = loadCatalog();
  const city = catalog.cities.find((item) => item.city === 'Keflavík');
  assert.ok(city);
  assert.equal(city.country, 'Iceland');
  assert.equal(city.url, 'keflavík.html');

  const hotels = catalog.hotels.filter((item) => item.city === 'Keflavík');
  assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), HOTELS);
  hotels.forEach((hotel) => {
    assert.equal(hotel.url, 'keflavík.html');
    assert.equal(hotel.country, 'Iceland');
  });

  const filePath = path.join(root, 'keflavík.html');
  const html = fs.readFileSync(filePath, 'utf8');
  const page = getCityPage('keflavík.html');
  assert.ok(page);
  assert.equal(html, page.html);
  assert.equal(page.city_name, 'Keflavík');
  assert.equal(page.country, 'Iceland');
  assert.match(html, /name=["']viewport["']/);
  assert.match(html, /data-city="Keflavík"/);

  const stored = hotelsFor('keflavík.html');
  assert.equal(stored.length, HOTELS.length);
  HOTELS.forEach((name) => {
    assert.ok(stored.some((hotel) => hotel.name === name), name);
    assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  const found = search(openSearchDatabase(), 'keflavik');
  assert.ok(found.cities.some((item) => item.name === 'Keflavík'));
  HOTELS.forEach((name) => {
    assert.ok(found.hotels.some((hotel) => hotel.name === name), name);
  });

  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexHtml, /id="boreal-keflavik-title"/);
  assert.match(indexHtml, /id="boreal-keflavik-town"/);
  assert.match(indexHtml, /Keflavík/);
});
