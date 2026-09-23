const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const searchRouter = require('../routes/search');
const { loadStaticCatalog } = require('../lib/search-db');

const root = path.join(__dirname, '..');
let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use('/api/search', searchRouter);
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    base = 'http://127.0.0.1:' + server.address().port;
    resolve();
  });
  server.on('error', reject);
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

async function searchFor(query) {
  const response = await fetch(base + '/api/search?q=' + encodeURIComponent(query) + '&checkIn=2099-01-01&checkOut=2099-01-03&adults=2&children=0');
  assert.equal(response.status, 200);
  return response.json();
}

test('a blank query returns no rows', async () => {
  const body = await searchFor('   ');
  assert.deepEqual(body, { cities: [], hotels: [] });
});

test('catalog hotels without their own page are still searchable', async () => {
  const body = await searchFor('CABINN City');
  assert.equal(body.hotels.length, 1);
  assert.equal(body.hotels[0].name, 'CABINN City');
  assert.equal(body.hotels[0].city, 'Copenhagen');
  assert.equal(body.hotels[0].url, 'copenhagen.html');
  assert.equal(fs.existsSync(path.join(root, 'cabinn-city.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'copenhagen.html')), true);
});

test('hotels with a dedicated page keep that page', async () => {
  const body = await searchFor('kempinski');
  assert.equal(body.cities.length, 0);
  assert.equal(body.hotels.length, 1);
  assert.equal(body.hotels[0].url, 'grand-hotel-kempinski-riga.html');
  assert.equal(fs.existsSync(path.join(root, body.hotels[0].url)), true);
});

test('places with no HTML page are returned from SQL', async () => {
  const catalog = loadStaticCatalog();
  assert.equal(catalog.cities.some((city) => city.name === 'Nida'), false);
  assert.equal(fs.existsSync(path.join(root, 'nida.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'barentsburg.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'pyramiden.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'abisko.html')), false);

  const nida = await searchFor('nida');
  assert.deepEqual(nida.cities.map((city) => city.name), ['Nida']);
  assert.equal(nida.cities[0].url, null);
  assert.equal(nida.cities[0].country, 'Lithuania');
  assert.equal(nida.hotels.length, 1);
  assert.equal(nida.hotels[0].name, 'Hotel Nida Marina');
  assert.equal(nida.hotels[0].url, null);
  assert.equal(nida.hotels[0].cityUrl, null);
  assert.equal(nida.hotels[0].price, '0.07 ETH / night');

  const labelled = await searchFor('Hotel Nida Marina — Nida');
  assert.deepEqual(labelled.hotels.map((hotel) => hotel.name), ['Hotel Nida Marina']);

  const barentsburg = await searchFor('Barentsburg');
  assert.equal(barentsburg.cities[0].url, null);
  assert.equal(barentsburg.hotels[0].name, 'Barentsburg Guesthouse');

  const pyramiden = await searchFor('Pyramiden');
  assert.equal(pyramiden.cities[0].name, 'Pyramiden');
  assert.equal(pyramiden.cities[0].url, null);

  const abisko = await searchFor('Abisko');
  const abiskoCity = abisko.cities.find((city) => city.name === 'Abisko');
  assert.ok(abiskoCity);
  assert.equal(abiskoCity.url, null);
  assert.ok(abisko.hotels.some((hotel) => hotel.name === 'Abisko Mountain Lodge' && hotel.url === null));
});

test('accent-folded city names still match', async () => {
  const body = await searchFor('reykjavik');
  assert.ok(body.cities.some((city) => city.name === 'Reykjavík' && city.url === 'reykjavík.html'));
});

test('scotland, lithuania, and finland towns without pages are searchable', async () => {
  const places = [
    { q: 'St Andrews', city: 'St Andrews', country: 'Scotland', hotel: 'St Andrews Harbour Hotel', file: 'st-andrews.html' },
    { q: 'Fort William', city: 'Fort William', country: 'Scotland', hotel: 'Ben Nevis Lodge', file: 'fort-william.html' },
    { q: 'Oban', city: 'Oban', country: 'Scotland', hotel: 'Oban Bay Hotel', file: 'oban.html' },
    { q: 'Palanga', city: 'Palanga', country: 'Lithuania', hotel: 'Palanga Dune Hotel', file: 'palanga.html' },
    { q: 'Druskininkai', city: 'Druskininkai', country: 'Lithuania', hotel: 'Druskininkai Spa House', file: 'druskininkai.html' },
    { q: 'Trakai', city: 'Trakai', country: 'Lithuania', hotel: 'Trakai Lake House', file: 'trakai.html' },
    { q: 'Porvoo', city: 'Porvoo', country: 'Finland', hotel: 'Porvoo Old Town Hotel', file: 'porvoo.html' },
    { q: 'Kuopio', city: 'Kuopio', country: 'Finland', hotel: 'Kuopio Lakefront Hotel', file: 'kuopio.html' },
    { q: 'Savonlinna', city: 'Savonlinna', country: 'Finland', hotel: 'Savonlinna Castle Hotel', file: 'savonlinna.html' }
  ];

  for (const place of places) {
    assert.equal(fs.existsSync(path.join(root, place.file)), false, place.file + ' should not exist');
    const body = await searchFor(place.q);
    const city = body.cities.find((item) => item.name === place.city);
    assert.ok(city, place.city + ' should be returned');
    assert.equal(city.country, place.country);
    assert.equal(city.url, null);
    const hotel = body.hotels.find((item) => item.name === place.hotel);
    assert.ok(hotel, place.hotel + ' should be returned');
    assert.equal(hotel.city, place.city);
    assert.equal(hotel.country, place.country);
    assert.equal(hotel.url, null);
  }
});

test('destination labels include places that have no page', async () => {
  const response = await fetch(base + '/api/search/destinations');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.labels.includes('Nida'));
  assert.ok(body.labels.includes('Hotel Nida Marina — Nida'));
  assert.ok(body.labels.includes('St Andrews'));
  assert.ok(body.labels.includes('Palanga'));
  assert.ok(body.labels.includes('Porvoo'));
  assert.ok(body.labels.includes('Savonlinna Castle Hotel — Savonlinna'));
  assert.ok(body.labels.includes('Aarhus'));
  assert.ok(body.labels.includes('Grand Hotel Kempinski — Riga'));
});
