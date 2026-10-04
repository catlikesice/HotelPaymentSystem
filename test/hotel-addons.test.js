const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const { listAddons, tripOffer } = require('../lib/hotel-addons');
const hotelAddonsRouter = require('../routes/hotel-addons');
const currencies = require('../assets/payment-currencies');

const root = path.join(__dirname, '..');

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: 'http://127.0.0.1:' + server.address().port });
    });
    server.on('error', reject);
  });
}

test('Esbjerg hotel selection includes that hotel’s extras and the city upsells', () => {
  const offer = listAddons({ hotel: 'Hotel Britannia', city: 'Esbjerg' });
  const ids = offer.addons.map((addon) => addon.id);
  assert.equal(offer.city, 'Esbjerg');
  assert.equal(offer.hotel, 'Hotel Britannia');
  assert.ok(ids.includes('breakfast'));
  assert.ok(ids.includes('late-checkout'));
  assert.ok(ids.includes('maritime-museum'));
  assert.ok(ids.includes('wadden-walk'));
  assert.ok(ids.includes('station-transfer'));
  assert.equal(ids.includes('harbour-breakfast') || offer.addons.some((addon) => addon.hotelName === 'Hotel Ansgar'), false);

  const museum = offer.addons.find((addon) => addon.id === 'maritime-museum');
  assert.equal(museum.scope, 'city');
  assert.equal(museum.category, 'experience');
  assert.equal(museum.billing, 'per-stay');
  assert.equal(currencies.convert(museum.priceEth, 'ETH', 'GBP').value, 34);

  const walk = offer.addons.find((addon) => addon.id === 'wadden-walk');
  assert.equal(currencies.convert(walk.priceEth, 'ETH', 'GBP').value, 48);
});

test('a different hotel in the same city gets its own stay extras', () => {
  const scandic = listAddons({ hotel: 'Scandic Olympic', page: 'esbjerg.html' });
  assert.equal(scandic.addons.some((addon) => addon.id === 'late-checkout'), false);
  assert.equal(scandic.addons.find((addon) => addon.id === 'breakfast').label, 'Breakfast buffet');
  assert.equal(scandic.addons.some((addon) => addon.id === 'maritime-museum'), true);
});

test('the trip offer lists Esbjerg hotels and keeps the Britannia nightly rate', () => {
  const trip = tripOffer({ hotel: 'Hotel Britannia', city: 'Esbjerg', page: 'esbjerg.html' });
  assert.deepEqual(trip.hotels.map((hotel) => hotel.name), [
    'Hotel Britannia',
    'Scandic Olympic',
    'Hotel Ansgar'
  ]);
  assert.equal(trip.selectedHotel, 'Hotel Britannia');
  const britannia = trip.hotels[0];
  assert.equal(britannia.priceEth, 0.035);
  assert.equal(britannia.chain, 'Britannia Hotels');
  assert.equal(britannia.city, 'Esbjerg');
  assert.ok(trip.addons.some((addon) => addon.hotelName === 'Hotel Britannia'));
  assert.ok(trip.addons.some((addon) => addon.hotelName === 'Scandic Olympic'));
  assert.ok(trip.addons.some((addon) => addon.scope === 'city' && addon.id === 'wadden-walk'));
});

test('property-page extras stay attached to that hotel', () => {
  const funken = listAddons({ hotel: 'Funken Lodge', city: 'Longyearbyen' });
  const ids = funken.addons.map((addon) => addon.id);
  assert.ok(ids.includes('spa-access'));
  assert.ok(ids.includes('snowmobile'));
  assert.ok(ids.includes('dogsled'));
  assert.equal(ids.includes('boat-safari'), false);
});

test('an unknown city does not invent a trip', () => {
  assert.throws(() => tripOffer({ city: 'Not A Real City' }), (error) => error.status === 404);
});

test('GET /api/hotel-addons/trip returns the Esbjerg upsells', async () => {
  const app = express();
  app.use('/api/hotel-addons', hotelAddonsRouter);
  const { server, base } = await listen(app);
  try {
    const response = await fetch(base + '/api/hotel-addons/trip?hotel=Hotel%20Britannia&city=Esbjerg&page=esbjerg.html');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.selectedHotel, 'Hotel Britannia');
    assert.equal(body.addons.some((addon) => addon.label === 'Maritime Museum admission'), true);
    const missing = await fetch(base + '/api/hotel-addons/trip?city=Nowhere');
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('selecting a listed hotel opens the trip page', () => {
  const search = fs.readFileSync(path.join(root, 'assets/search.js'), 'utf8');
  const select = fs.readFileSync(path.join(root, 'assets/hotel-select.js'), 'utf8');
  const preferences = fs.readFileSync(path.join(root, 'site-preferences.js'), 'utf8');
  const summary = fs.readFileSync(path.join(root, 'assets/hotel-booking-summary.js'), 'utf8');
  const trip = fs.readFileSync(path.join(root, 'trip.html'), 'utf8');
  assert.match(search, /function hotelSelectHref/);
  assert.match(search, /Select stay/);
  assert.match(search, /hotelHasOwnPage/);
  assert.match(select, /trip\.html\?/);
  assert.match(preferences, /assets\/hotel-select\.js/);
  assert.match(summary, /\/api\/hotel-addons\?/);
  assert.match(trip, /assets\/trip-builder\.js/);
  assert.match(fs.readFileSync(path.join(root, 'docs/sql/hotel-addons.sql'), 'utf8'), /CREATE TABLE hotel_addons/);
});
