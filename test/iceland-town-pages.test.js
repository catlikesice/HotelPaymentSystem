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
    city: 'Ísafjörður',
    query: 'isafjordur',
    url: 'ísafjörður.html',
    section: 'boreal-isafjordur-title',
    hotels: ['Hótel Ísafjörður', 'Hótel Horn', 'Gamla Guesthouse']
  },
  {
    city: 'Vestmannaeyjar',
    query: 'vestmannaeyjar',
    url: 'vestmannaeyjar.html',
    section: 'boreal-vestmannaeyjar-title',
    hotels: ['Hotel Vestmannaeyjar', 'Hótel Eyjar', 'Guesthouse Hamar']
  },
  {
    city: 'Sauðárkrókur',
    query: 'saudarkrokur',
    url: 'sauðárkrókur.html',
    section: 'boreal-saudarkrokur-title',
    hotels: ['Hótel Tindastóll', 'Hótel Mikligarður', 'Skagafjörður Guesthouse']
  }
];

test('Ísafjörður, Vestmannaeyjar, and Sauðárkrókur are on the HTML city list and in search', () => {
  const catalog = loadCatalog();
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const db = openSearchDatabase();

  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city);
    assert.equal(city.country, 'Iceland');
    assert.equal(city.url, destination.url);

    const hotels = catalog.hotels.filter((item) => item.city === destination.city);
    assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), destination.hotels);
    hotels.forEach((hotel) => {
      assert.notEqual(hotel.url, destination.url);
      assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
      const hotelHtml = fs.readFileSync(path.join(root, hotel.url), 'utf8');
      assert.match(hotelHtml, /class="hotel-detail"/);
      assert.match(hotelHtml, /site-preferences\.js/);
      assert.match(hotelHtml, /language-switcher|class="site-nav"/);
      assert.equal(hotel.country, 'Iceland');
    });

    const html = fs.readFileSync(path.join(root, destination.url), 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url);
    assert.equal(html, page.html);
    assert.equal(page.city_name, destination.city);
    assert.equal(page.country, 'Iceland');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));

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

    assert.match(indexHtml, new RegExp('id="' + destination.section + '"'));
  });
});
