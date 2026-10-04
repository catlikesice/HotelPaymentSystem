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

const DESTINATIONS = [
  {
    city: 'Alnwick',
    query: 'alnwick',
    url: 'alnwick.html',
    hotels: ['The Cookie Jar', 'The Oaks Hotel', 'White Swan Hotel']
  },
  {
    city: 'Northumberland National Park',
    query: 'northumberland national park',
    url: 'northumberland-national-park.html',
    hotels: ['Otterburn Castle', 'The Tankerville Arms', 'Twice Brewed Inn']
  }
];

test('Alnwick and Northumberland National Park are listing pages and searchable', () => {
  const catalog = loadCatalog();
  const db = openSearchDatabase();

  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city);
    assert.equal(city.country, 'Northeast England');
    assert.equal(city.url, destination.url);

    const hotels = catalog.hotels.filter((item) => item.city === destination.city);
    assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), destination.hotels);
    hotels.forEach((hotel) => {
      assert.equal(hotel.url, destination.url);
      assert.equal(hotel.country, 'Northeast England');
    });

    const html = fs.readFileSync(path.join(root, destination.url), 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url);
    assert.equal(html, page.html);
    assert.equal(page.city_name, destination.city);
    assert.equal(page.country, 'Northeast England');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));
    assert.match(html, /site-preferences\.js/);

    const stored = hotelsFor(destination.url);
    assert.equal(stored.length, destination.hotels.length);
    destination.hotels.forEach((name) => {
      assert.ok(stored.some((hotel) => hotel.name === name), name);
      assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });

    const found = search(db, destination.query);
    assert.ok(found.cities.some((item) => item.name === destination.city), destination.query);
    destination.hotels.forEach((name) => {
      assert.ok(found.hotels.some((hotel) => hotel.name === name), name);
    });
  });
});
