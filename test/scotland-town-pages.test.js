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
    city: 'Ullapool',
    query: 'ullapool',
    url: 'ullapool.html',
    section: 'boreal-ullapool-title',
    hotels: ['The Ceilidh Place', 'Broomfield House', 'Ullapool Ferry Hotel']
  },
  {
    city: 'St Andrews',
    query: 'st andrews',
    url: 'st-andrews.html',
    section: 'boreal-st-andrews-title',
    hotels: ['Scores Hotel', 'St Andrews Harbour Hotel', 'Cathedral Gate House']
  },
  {
    city: 'Aviemore',
    query: 'aviemore',
    url: 'aviemore.html',
    section: 'boreal-aviemore-title',
    hotels: ['Cairngorm Hotel', 'Rothiemurchus Lodge', 'Spey Valley Hotel']
  },
  {
    city: 'Pitlochry',
    query: 'pitlochry',
    url: 'pitlochry.html',
    section: 'boreal-pitlochry-title',
    hotels: ['Atholl Palace Hotel', 'Fishers Hotel', 'Loch Faskally House']
  },
  {
    city: 'Benbecula',
    query: 'benbecula',
    url: 'benbecula.html',
    section: 'boreal-benbecula-title',
    hotels: ['Dark Island Hotel', 'Balivanich Airport House', 'Culla Bay Hotel']
  }
];

test('Ullapool, St Andrews, Aviemore, Pitlochry, and Benbecula are on the HTML city list and in search', () => {
  const catalog = loadCatalog();
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const db = openSearchDatabase();

  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city);
    assert.equal(city.country, 'Scotland');
    assert.equal(city.url, destination.url);

    const hotels = catalog.hotels.filter((item) => item.city === destination.city);
    assert.deepEqual(Array.from(hotels, (hotel) => hotel.name), destination.hotels);
    hotels.forEach((hotel) => {
      assert.equal(hotel.url, destination.url);
      assert.equal(hotel.country, 'Scotland');
    });

    const html = fs.readFileSync(path.join(root, destination.url), 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url);
    assert.equal(html, page.html);
    assert.equal(page.city_name, destination.city);
    assert.equal(page.country, 'Scotland');
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
