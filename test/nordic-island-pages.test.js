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
  { city: 'Mariehamn', country: 'Åland Islands', url: 'mariehamn.html', hotels: ['Hotel Arkipelag', 'Park Alandia Hotel', 'Hotel Pommern'] },
  { city: 'Nuuk', country: 'Greenland', url: 'nuuk.html', hotels: ['Hotel Hans Egede', 'Inuit Hotel', 'Hotel Nuuk'] },
  { city: 'Ilulissat', country: 'Greenland', url: 'ilulissat.html', hotels: ['Hotel Arctic', 'Hotel Icefiord', 'Hotel Hvide Falk'] },
  { city: 'Tórshavn', country: 'Faroe Islands', url: 'tórshavn.html', hotels: ['Hotel Føroyar', 'Hotel Hafnia', 'Hotel Streym'] },
  { city: 'Longyearbyen', country: 'Svalbard', url: 'longyearbyen.html', hotels: ['Radisson Blu Polar Hotel Spitsbergen', 'Funken Lodge', 'Basecamp Hotel'] },
  { city: 'Visby', country: 'Sweden', url: 'visby.html', hotels: ['Clarion Hotel Wisby', 'Strand Hotel Visby', 'Hotel St Clemens'] }
];

test('search catalog includes Åland, Greenland, Faroe Island, and Svalbard cities', () => {
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
  assert.ok(cities.includes('Longyearbyen'));
  assert.ok(cities.includes('Visby'));
});

test('Åland, Greenland, Faroe Island, and Svalbard city pages list local hotels', () => {
  DESTINATIONS.forEach((destination) => {
    const filePath = path.join(root, destination.url);
    assert.equal(fs.existsSync(filePath), true, destination.url + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');
    const page = getCityPage(destination.url);
    assert.ok(page, destination.url + ' should be stored in SQL');
    assert.equal(html, page.html);
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, new RegExp('data-city="' + destination.city + '"'));
    const hotels = hotelsFor(destination.url);
    destination.hotels.forEach((name) => {
      assert.ok(hotels.some((hotel) => hotel.name === name), name + ' should be a SQL hotel row');
      assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });
});

test('Svalbard hotels can be booked from Longyearbyen and search', () => {
  const catalog = loadCatalog();
  const city = catalog.cities.find((item) => item.city === 'Longyearbyen');
  assert.ok(city);
  assert.match(city.country + ' ' + city.description, /Svalbard/);

  const hotels = catalog.hotels.filter((item) => item.city === 'Longyearbyen');
  assert.equal(hotels.length, 3);
  hotels.forEach((hotel) => {
    assert.equal(hotel.country, 'Svalbard');
    assert.notEqual(hotel.url, 'longyearbyen.html', hotel.name + ' should open a hotel booking page');
    const filePath = path.join(root, hotel.url);
    assert.ok(fs.existsSync(filePath), hotel.url + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, /data-city="Longyearbyen"/);
    assert.match(html, /data-country="Svalbard"/);
    assert.match(html, /checkout\.html/);
    assert.match(html, new RegExp(hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexHtml, /id="boreal-svalbard-title"/);
  assert.match(indexHtml, /id="boreal-svalbard-longyearbyen"/);

  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  assert.match(searchHtml, /Svalbard/);
});

test('Visby Island hotels can be booked from the Visby page and search', () => {
  const catalog = loadCatalog();
  const city = catalog.cities.find((item) => item.city === 'Visby');
  assert.ok(city);
  assert.equal(city.country, 'Sweden');
  assert.equal(city.url, 'visby.html');
  assert.match(city.description, /Visby Island/);

  const hotels = catalog.hotels.filter((item) => item.city === 'Visby');
  assert.equal(hotels.length, 3);
  hotels.forEach((hotel) => {
    assert.equal(hotel.country, 'Sweden');
    assert.notEqual(hotel.url, 'visby.html', hotel.name + ' should open a hotel booking page');
    const filePath = path.join(root, hotel.url);
    assert.ok(fs.existsSync(filePath), hotel.url + ' should exist');
    const html = fs.readFileSync(filePath, 'utf8');
    assert.match(html, /name=["']viewport["']/);
    assert.match(html, /data-city="Visby"/);
    assert.match(html, /data-country="Sweden"/);
    assert.match(html, /checkout\.html/);
    assert.match(html, new RegExp(hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexHtml, /id="boreal-visby-title"/);
  assert.match(indexHtml, /Visby Island/);

  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  assert.match(searchHtml, /Visby Island/);
});
