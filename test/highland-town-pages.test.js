const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { getCityPage, hotelsFor } = require('../lib/city-pages');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

const DESTINATIONS = [
  {
    city: 'Abisko',
    country: 'Sweden',
    url: 'abisko.html',
    hotels: ['Abisko Mountain Lodge', 'Björkliden Mountain Lodge', 'STF Abisko Turiststation']
  },
  {
    city: 'Lillehammer',
    country: 'Norway',
    url: 'lillehammer.html',
    hotels: ['Mølla Hotell', 'Radisson Blu Lillehammer Hotel', 'Scandic Lillehammer']
  },
  {
    city: 'Portree',
    country: 'Scotland',
    url: 'portree.html',
    hotels: ['Bosville Hotel', 'Cuillin Hills Hotel', 'The Royal Hotel']
  },
  {
    city: 'Oban',
    country: 'Scotland',
    url: 'oban.html',
    hotels: ['Manor House Hotel', 'Oban Bay Hotel', 'Perle Oban Hotel']
  },
  {
    city: 'Fort William',
    country: 'Scotland',
    url: 'fort-william.html',
    hotels: ['Alexandra Hotel', 'Ben Nevis Lodge', 'The Lime Tree Hotel']
  },
  {
    city: 'Stornoway',
    country: 'Scotland',
    url: 'stornoway.html',
    hotels: ['Cabarfeidh Hotel', 'Caladh Inn', 'Lews Castle Lodge']
  },
  {
    city: 'Lerwick',
    country: 'Scotland',
    url: 'lerwick.html',
    hotels: ['Grand Hotel Lerwick', 'Lerwick Harbour House', 'Shetland Hotel']
  }
];

test('Abisko, Lillehammer, and the Scottish harbour towns are in the catalog', () => {
  const catalog = loadCatalog();
  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city + ' is missing from the city catalog');
    assert.equal(city.country, destination.country);
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
      assert.equal(hotel.country, destination.country);
    });
  });
});

test('Abisko, Lillehammer, and the Scottish harbour towns have listing pages', () => {
  DESTINATIONS.forEach((destination) => {
    const filePath = path.join(root, destination.url);
    assert.equal(fs.existsSync(filePath), true, destination.url + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url + ' should be stored in SQL');
    assert.equal(html, page.html);
    assert.equal(page.city_name, destination.city);
    assert.equal(page.country, destination.country);
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));
    assert.match(html, /site-preferences\.js/);
    const hotels = hotelsFor(destination.url);
    assert.equal(hotels.length, destination.hotels.length);
    destination.hotels.forEach((name) => {
      assert.ok(hotels.some((hotel) => hotel.name === name), name + ' should be a SQL hotel row');
      assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });
});
