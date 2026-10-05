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

test('a hotel with no hand-written extras still has stay, experience, and transport', () => {
  const offer = listAddons({ hotel: 'Motel One Glasgow', city: 'Glasgow', page: 'glasgow.html' });
  assert.equal(offer.hotel, 'Motel One Glasgow');
  const categories = new Set(offer.addons.map((addon) => addon.category));
  assert.ok(categories.has('stay'));
  assert.ok(categories.has('experience'));
  assert.ok(categories.has('transport'));
  const breakfast = offer.addons.find((addon) => addon.id === 'breakfast');
  assert.equal(breakfast.label, 'Breakfast for two');
  assert.equal(breakfast.billing, 'per-night');
  assert.equal(currencies.convert(breakfast.priceEth, 'ETH', 'GBP').value, 18);
  const transfer = offer.addons.find((addon) => addon.id === 'station-transfer');
  assert.equal(transfer.label, 'Glasgow station transfer');
  assert.equal(currencies.convert(transfer.priceEth, 'ETH', 'GBP').value, 22);
});

test('curated Esbjerg extras are not replaced by the default breakfast or walking tour', () => {
  const offer = listAddons({ hotel: 'Hotel Britannia', city: 'Esbjerg' });
  const breakfasts = offer.addons.filter((addon) => addon.id === 'breakfast');
  assert.equal(breakfasts.length, 1);
  assert.equal(breakfasts[0].label, 'Breakfast for two');
  assert.equal(offer.addons.some((addon) => addon.id === 'walking-tour'), false);
  assert.equal(offer.addons.filter((addon) => addon.id === 'station-transfer').length, 1);
});

test('a longer property-page name uses the catalog hotel and its curated extras', () => {
  const html = fs.readFileSync(path.join(root, 'hotel-dangleterre-copenhagen.html'), 'utf8');
  const name = html.match(/data-property-name="([^"]+)"/)[1];
  const offer = listAddons({ hotel: name, city: 'Copenhagen', page: 'hotel-dangleterre-copenhagen.html' });
  assert.equal(offer.hotel, 'Hotel d’Angleterre');
  assert.equal(offer.addons.filter((addon) => addon.id === 'breakfast').length, 1);
  assert.equal(offer.addons.some((addon) => addon.id === 'canal-tour'), true);
  assert.equal(offer.addons.some((addon) => addon.id === 'airport-transfer'), true);

  const kempinski = listAddons({
    hotel: 'Grand Hotel Kempinski Riga',
    city: 'Riga',
    page: 'grand-hotel-kempinski-riga.html'
  });
  assert.equal(kempinski.hotel, 'Grand Hotel Kempinski');
  assert.equal(kempinski.addons.filter((addon) => addon.id === 'spa-access').length, 1);
  assert.equal(kempinski.addons.some((addon) => addon.id === 'breakfast'), false);
  assert.equal(kempinski.addons.some((addon) => addon.id === 'art-nouveau'), true);
});

test('scandic-copenhagen.html shares Scandic Palace Hotel extras', () => {
  const offer = listAddons({
    hotel: 'Scandic Copenhagen',
    city: 'Copenhagen',
    page: 'scandic-copenhagen.html'
  });
  assert.equal(offer.hotel, 'Scandic Palace Hotel');
  assert.equal(offer.addons.some((addon) => addon.id === 'breakfast'), true);
  assert.equal(offer.addons.some((addon) => addon.id === 'canal-tour'), true);
});

test('every city-page hotel has stay, experience, and transport extras', () => {
  const { listCityPages, hotelsFor } = require('../lib/city-pages');
  let checked = 0;
  listCityPages().forEach((page) => {
    hotelsFor(page.page_url).forEach((hotel) => {
      const offer = listAddons({ hotel: hotel.name, city: page.city_name, page: page.page_url });
      const categories = new Set(offer.addons.map((addon) => addon.category));
      assert.ok(categories.has('stay'), hotel.name + ' in ' + page.city_name);
      assert.ok(categories.has('experience'), hotel.name + ' in ' + page.city_name);
      assert.ok(categories.has('transport'), hotel.name + ' in ' + page.city_name);
      checked += 1;
    });
  });
  assert.ok(checked > 50);
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
  assert.match(preferences, /assets\/property-pages\.js/);
  assert.match(preferences, /assets\/hotel-select\.js/);
  assert.match(select, /BorealPropertyPages/);
  const propertyPages = fs.readFileSync(path.join(root, 'assets/property-pages.js'), 'utf8');
  assert.match(propertyPages, /scandic-copenhagen\.html/);
  assert.match(propertyPages, /funken-lodge\.html/);
  assert.doesNotMatch(propertyPages, /hotel-telegraaf-tallinn/);
  assert.doesNotMatch(propertyPages, /hotel-kamp-helsinki/);
  assert.match(summary, /params\.set\('page'/);
  assert.match(summary, /\/api\/hotel-addons\?/);
  assert.match(trip, /assets\/trip-builder\.js/);
  assert.match(fs.readFileSync(path.join(root, 'docs/sql/hotel-addons.sql'), 'utf8'), /CREATE TABLE hotel_addons/);
});
