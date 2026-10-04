const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const searchRouter = require('../routes/search');
const { loadStaticCatalog } = require('../lib/search-db');
const { getCityPage, hotelsFor } = require('../lib/city-pages');

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

test('every catalog hotel opens its own page', async () => {
  const body = await searchFor('CABINN City');
  assert.equal(body.hotels.length, 1);
  assert.equal(body.hotels[0].name, 'CABINN City');
  assert.equal(body.hotels[0].city, 'Copenhagen');
  assert.equal(body.hotels[0].cityUrl, 'copenhagen.html');
  assert.notEqual(body.hotels[0].url, 'copenhagen.html');
  assert.equal(fs.existsSync(path.join(root, body.hotels[0].url)), true);
  assert.equal(fs.existsSync(path.join(root, 'copenhagen.html')), true);
  const page = fs.readFileSync(path.join(root, body.hotels[0].url), 'utf8');
  assert.match(page, /class="hotel-detail"/);
  assert.match(page, /site-preferences\.js/);
  assert.match(page, /language-switcher|class="site-nav"/);
  const copenhagen = getCityPage('copenhagen.html');
  assert.ok(copenhagen);
  assert.ok(hotelsFor('copenhagen.html').some((hotel) => hotel.name === 'CABINN City' && hotel.book_url === body.hotels[0].url));
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

  const nida = await searchFor('nida');
  assert.deepEqual(nida.cities.map((city) => city.name), ['Nida']);
  assert.equal(nida.cities[0].url, null);
  assert.equal(nida.cities[0].country, 'Lithuania');
  assert.equal(nida.hotels.length, 1);
  assert.equal(nida.hotels[0].name, 'Hotel Nida Marina');
  assert.ok(nida.hotels[0].url);
  assert.notEqual(nida.hotels[0].url, 'nida.html');
  assert.equal(fs.existsSync(path.join(root, nida.hotels[0].url)), true);
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

});

test('accent-folded city names still match', async () => {
  const body = await searchFor('reykjavik');
  assert.ok(body.cities.some((city) => city.name === 'Reykjavík' && city.url === 'reykjavík.html'));
});

test('plain ASCII queries match letters SQL cannot unaccent on its own', async () => {
  const hafnarfjordur = await searchFor('hafnarfjordur');
  assert.deepEqual(hafnarfjordur.cities.map((city) => city.name), ['Hafnarfjörður']);
  assert.deepEqual(hafnarfjordur.hotels.map((hotel) => hotel.name), [
    'Helguhús Guesthouse',
    'Hótel Hafnarfjörður',
    'Hotel Viking'
  ]);

  const reykjanes = await searchFor('reykjanesbaer');
  assert.deepEqual(reykjanes.cities.map((city) => city.name), ['Reykjanesbær']);
  assert.equal(reykjanes.hotels.length, 3);

  const straight = await searchFor("d'Angleterre");
  const curly = await searchFor('d’Angleterre');
  const stripped = await searchFor('dangleterre');
  for (const body of [straight, curly, stripped]) {
    assert.deepEqual(body.hotels.map((hotel) => hotel.name), ['Hotel d’Angleterre']);
  }

  const kings = await searchFor('The Kings Arms');
  assert.deepEqual(kings.hotels.map((hotel) => hotel.name), ['The King’s Arms Hotel']);
});

test('scotland, lithuania, and finland towns without pages are searchable', async () => {
  const places = [
    { q: 'Kirkwall', city: 'Kirkwall', country: 'Scotland', hotel: 'Kirkwall Harbour Hotel', file: 'kirkwall.html' },
    { q: 'Tobermory', city: 'Tobermory', country: 'Scotland', hotel: 'Tobermory Waterfront Hotel', file: 'tobermory.html' },
    { q: 'Uist', city: 'Uist', country: 'Scotland', hotel: 'Uist Machair House', file: 'uist.html' },
    { q: 'Tarbert (Harris)', city: 'Tarbert (Harris)', country: 'Scotland', hotel: 'Tarbert Harris Hotel', file: 'tarbert-harris.html' },
    { q: 'Uig', city: 'Uig', country: 'Scotland', hotel: 'Uig Bay Hotel', file: 'uig.html' },
    { q: 'Dunvegan', city: 'Dunvegan', country: 'Scotland', hotel: 'Dunvegan Castle Hotel', file: 'dunvegan.html' },
    { q: 'Broadford', city: 'Broadford', country: 'Scotland', hotel: 'Broadford Bay Hotel', file: 'broadford.html' },
    { q: 'Armadale', city: 'Armadale', country: 'Scotland', hotel: 'Armadale Pier Hotel', file: 'armadale.html' },
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
    assert.ok(hotel.url);
    assert.notEqual(hotel.url, place.file);
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
  }
});

test('other named places without pages are searchable', async () => {
  const places = [
    { q: 'Jukkasjärvi', city: 'Jukkasjärvi', country: 'Sweden', hotel: 'Icehotel Jukkasjärvi', file: 'jukkasjarvi.html' },
    { q: 'Gjogv', city: 'Gjógv', country: 'Faroe Islands', hotel: 'Gjógv Guesthouse', file: 'gjogv.html' },
    { q: 'Saksun', city: 'Saksun', country: 'Faroe Islands', hotel: 'Saksun Turf House', file: 'saksun.html' },
    { q: 'Mykines', city: 'Mykines', country: 'Faroe Islands', hotel: 'Mykines Puffin Lodge', file: 'mykines.html' },
    { q: 'Nolsoy', city: 'Nólsoy', country: 'Faroe Islands', hotel: 'Nólsoy Harbour House', file: 'nolsoy.html' },
    { q: 'Vagar', city: 'Vágar', country: 'Faroe Islands', hotel: 'Vágar Cliff Hotel', file: 'vagar.html' },
    { q: 'Streymoy', city: 'Streymoy', country: 'Faroe Islands', hotel: 'Streymoy Valley Inn', file: 'streymoy.html' },
    { q: 'Eysturoy', city: 'Eysturoy', country: 'Faroe Islands', hotel: 'Eysturoy Sound Hotel', file: 'eysturoy.html' },
    { q: 'Ny-Alesund', city: 'Ny-Ålesund', country: 'Svalbard', hotel: 'Ny-Ålesund Polar Lodge', file: 'ny-alesund.html' },
    { q: 'Kastelholm', city: 'Kastelholm', country: 'Åland Islands', hotel: 'Kastelholm Castle Inn', file: 'kastelholm.html' },
    { q: 'Bomarsund', city: 'Bomarsund', country: 'Åland Islands', hotel: 'Bomarsund Fortress House', file: 'bomarsund.html' },
    { q: 'Isle of Skye', city: 'Isle of Skye', country: 'Scotland', hotel: 'Skye Cuillin Hotel', file: 'isle-of-skye.html' }
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
    assert.ok(hotel.url);
    assert.notEqual(hotel.url, place.file);
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.cityUrl, null);
  }
});

test('pages missing from the catalog are returned from SQL', async () => {
  assert.equal(fs.existsSync(path.join(root, 'šiauliai.htm')), true);
  assert.equal(getCityPage('šiauliai.htm').city_name, 'Šiauliai');
  const siauliai = await searchFor('Siauliai');
  assert.deepEqual(siauliai.cities.map((city) => city.name), ['Šiauliai']);
  assert.equal(siauliai.cities[0].url, 'šiauliai.htm');
  assert.equal(siauliai.cities[0].country, 'Lithuania');
  assert.deepEqual(siauliai.hotels.map((hotel) => hotel.name), ['Park Inn Šiauliai', 'Old Town Boutique']);
  siauliai.hotels.forEach((hotel) => {
    assert.notEqual(hotel.url, 'šiauliai.htm');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.cityUrl, 'šiauliai.htm');
  });

  const odense = await searchFor('Odense');
  assert.ok(odense.cities.some((city) => city.name === 'Odense' && city.url === 'odense.html'));
  assert.deepEqual(
    odense.hotels.map((hotel) => hotel.name),
    ['Hotel Odeon', 'First Hotel Grand', 'Comwell H.C. Andersen Odense']
  );
  odense.hotels.forEach((hotel) => {
    assert.notEqual(hotel.url, 'odense.html');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    assert.equal(hotel.city, 'Odense');
  });

  assert.equal(fs.existsSync(path.join(root, 'hotel-dangleterre-copenhagen.html')), true);
  const angleterre = await searchFor('Angleterre');
  assert.equal(angleterre.hotels.length, 1);
  assert.equal(angleterre.hotels[0].name, 'Hotel d’Angleterre');
  assert.equal(angleterre.hotels[0].city, 'Copenhagen');
  assert.equal(angleterre.hotels[0].url, 'hotel-dangleterre-copenhagen.html');
  assert.equal(angleterre.hotels[0].price, '0.12 ETH / night');
});

test('Bauska, Latvia can be booked from search', async () => {
  assert.equal(fs.existsSync(path.join(root, 'bauska.html')), true);
  const cityHtml = fs.readFileSync(path.join(root, 'bauska.html'), 'utf8');
  assert.equal(cityHtml, getCityPage('bauska.html').html);
  assert.match(cityHtml, /data-city="Bauska"/);
  assert.match(cityHtml, /href="hotel-bauska\.html"/);
  assert.match(cityHtml, /href="bauska-castle-hotel\.html"/);
  assert.deepEqual(
    hotelsFor('bauska.html').map((hotel) => hotel.book_url),
    ['hotel-bauska.html', 'bauska-castle-hotel.html']
  );

  const body = await searchFor('Bauska');
  assert.deepEqual(body.cities.map((city) => city.name), ['Bauska']);
  assert.equal(body.cities[0].country, 'Latvia');
  assert.equal(body.cities[0].url, 'bauska.html');
  assert.deepEqual(body.hotels.map((hotel) => hotel.name), ['Hotel Bauska', 'Bauska Castle Hotel']);

  for (const hotel of body.hotels) {
    assert.equal(hotel.city, 'Bauska');
    assert.equal(hotel.country, 'Latvia');
    assert.equal(fs.existsSync(path.join(root, hotel.url)), true);
    const html = fs.readFileSync(path.join(root, hotel.url), 'utf8');
    assert.match(html, /data-city="Bauska"/);
    assert.match(html, /data-country="Latvia"/);
    assert.match(html, /checkout\.html/);
    assert.match(html, /assets\/hotel-booking-summary\.js/);
    assert.match(html, /assets\/booking-dates\.js/);
    assert.match(html, new RegExp(hotel.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('destination labels include places that have no page', async () => {
  const response = await fetch(base + '/api/search/destinations');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.labels.includes('Nida'));
  assert.ok(body.labels.includes('Hotel Nida Marina — Nida'));
  assert.ok(body.labels.includes('St Andrews'));
  assert.ok(body.labels.includes('Aviemore'));
  assert.ok(body.labels.includes('Pitlochry'));
  assert.ok(body.labels.includes('Ullapool'));
  assert.ok(body.labels.includes('Palanga'));
  assert.ok(body.labels.includes('Porvoo'));
  assert.ok(body.labels.includes('Savonlinna Castle Hotel — Savonlinna'));
  assert.ok(body.labels.includes('Gjógv'));
  assert.ok(body.labels.includes('Ny-Ålesund'));
  assert.ok(body.labels.includes('Isle of Skye'));
  assert.ok(body.labels.includes('Skye Cuillin Hotel — Isle of Skye'));
  assert.ok(body.labels.includes('Kirkwall'));
  assert.ok(body.labels.includes('Tarbert (Harris)'));
  assert.ok(body.labels.includes('Ullapool Ferry Hotel — Ullapool'));
  assert.ok(body.labels.includes('Armadale Pier Hotel — Armadale'));
  assert.ok(body.labels.includes('Šiauliai'));
  assert.ok(body.labels.includes('Hotel d’Angleterre — Copenhagen'));
  assert.ok(body.labels.includes('Bauska'));
  assert.ok(body.labels.includes('Hotel Bauska — Bauska'));
  assert.ok(body.labels.includes('Aarhus'));
  assert.ok(body.labels.includes('Grand Hotel Kempinski — Riga'));
});
