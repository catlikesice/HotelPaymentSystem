const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

const DESTINATIONS = [
  { city: 'Mariehamn', country: 'Åland Islands', url: 'mariehamn.html', hotels: ['Hotel Arkipelag', 'Park Alandia Hotel', 'Hotel Pommern'] },
  { city: 'Nuuk', country: 'Greenland', url: 'nuuk.html', hotels: ['Hotel Hans Egede', 'Inuit Hotel', 'Hotel Nuuk'] },
  { city: 'Ilulissat', country: 'Greenland', url: 'ilulissat.html', hotels: ['Hotel Arctic', 'Hotel Icefiord', 'Hotel Hvide Falk'] },
  { city: 'Tórshavn', country: 'Faroe Islands', url: 'tórshavn.html', hotels: ['Hotel Føroyar', 'Hotel Hafnia', 'Hotel Streym'] }
];

test('search catalog includes Åland, Greenland, and Faroe Island cities', () => {
  const catalog = loadCatalog();
  const cities = catalog.cities.map((item) => item.city);

  DESTINATIONS.forEach((destination) => {
    const city = catalog.cities.find((item) => item.city === destination.city);
    assert.ok(city, destination.city + ' is missing from the city catalog');
    assert.equal(city.country, destination.country);
    assert.equal(city.url, destination.url);

    const hotels = catalog.hotels.filter((item) => item.city === destination.city);
    assert.equal(hotels.length, destination.hotels.length, destination.city + ' should list its hotels');
    destination.hotels.forEach((name) => {
      assert.ok(hotels.some((hotel) => hotel.name === name), name + ' is missing from the hotel catalog');
    });
  });

  assert.ok(cities.includes('Mariehamn'));
  assert.ok(cities.includes('Nuuk'));
  assert.ok(cities.includes('Ilulissat'));
  assert.ok(cities.includes('Tórshavn'));
});

test('Åland, Greenland, and Faroe Island city pages list local hotels', () => {
  DESTINATIONS.forEach((destination) => {
    const filePath = path.join(root, destination.url);
    assert.ok(fs.existsSync(filePath), destination.url + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));
    destination.hotels.forEach((name) => {
      assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });
});
