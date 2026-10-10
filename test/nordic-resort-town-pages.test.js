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
    city: 'Levi',
    country: 'Finland',
    url: 'levi.html',
    hotels: ['Hotel K5 Levi', 'Hullu Poro', 'Levi Hotel Spa']
  },
  {
    city: 'Voss',
    country: 'Norway',
    url: 'voss.html',
    hotels: ['Fleischer’s Hotel', 'Park Hotel Vossevangen', 'Scandic Voss']
  },
  {
    city: 'Geilo',
    country: 'Norway',
    url: 'geilo.html',
    hotels: ['Bardøla Høyfjellshotell', 'Dr. Holms Hotel', 'Hotel Vestlia']
  },
  {
    city: 'Sälen',
    country: 'Sweden',
    url: 'salen.html',
    hotels: ['Högfjällshotellet', 'Hundfjällshotellet', 'Tandådalens Fjällhotell']
  },
  {
    city: 'Ylläs',
    country: 'Finland',
    url: 'yllas.html',
    hotels: ['Äkäshotelli', 'Lapland Hotels Ylläs', 'Ylläs Saaga']
  },
  {
    city: 'Hemsedal',
    country: 'Norway',
    url: 'hemsedal.html',
    hotels: ['Harahorn', 'Hotel Skogstad', 'Skarsnuten Hotel']
  },
  {
    city: 'Skagen',
    country: 'Denmark',
    url: 'skagen.html',
    hotels: ['Brøndums Hotel', 'Color Hotel Skagen', 'Ruths Hotel']
  },
  {
    city: 'Ruka-Kuusamo',
    country: 'Finland',
    url: 'ruka-kuusamo.html',
    hotels: ['Hotel Rukatonttu', 'Ruka Peak', 'Scandic Rukahovi']
  }
];

test('Levi, Voss, Geilo, Sälen, Ylläs, Hemsedal, Skagen, and Ruka-Kuusamo are in the catalog', () => {
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

test('Levi, Voss, Geilo, Sälen, Ylläs, Hemsedal, Skagen, and Ruka-Kuusamo have listing pages', () => {
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
