const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const http = require('http');
const { getCityPage, listCityPages, hotelsFor, stringsFor, serveCityPage } = require('../lib/city-pages');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

test('every catalog city page is stored in SQL and removed as a file', () => {
  const catalog = loadCatalog();
  const stored = new Set(listCityPages().map((page) => page.page_url));
  assert.equal(stored.size, catalog.cities.length);
  catalog.cities.forEach((city) => {
    assert.equal(stored.has(city.url), true, city.url);
    assert.equal(fs.existsSync(path.join(root, city.url)), false, city.url);
    const page = getCityPage(city.url);
    assert.equal(page.city_name, city.city);
    assert.equal(page.country, city.country);
    assert.match(page.html, /<html/i);
    if (city.url.endsWith('.html')) {
      assert.match(page.html, /name=["']viewport["']/, city.url);
    }
    assert.match(page.title, /\S/);
  });
});

test('Aarhus keeps nightly ETH, BTC, and USDT from the old listing', () => {
  const hotels = hotelsFor('aarhus.html');
  const royal = hotels.find((hotel) => hotel.name === 'Hotel Royal Aarhus');
  assert.ok(royal);
  assert.equal(royal.price_eth, 0.08);
  assert.equal(royal.price_btc, 0.0013);
  assert.equal(royal.price_usdt, 228);
  assert.match(royal.description, /spa services/);
  assert.equal(royal.image_alt, 'Hotel Royal Aarhus');
  assert.match(getCityPage('aarhus.html').html, /data-btc="0.0013"/);
});

test('placeholder cities keep their translated copy', () => {
  const page = getCityPage('aalborg.html');
  assert.match(page.placeholder_text, /placeholder page for Aalborg/);
  assert.equal(page.expected_path, 'html/cities/denmark/aalborg.html');
  const english = stringsFor('aalborg.html', 'en').find((row) => row.string_key === 'page-title');
  const russian = stringsFor('aalborg.html', 'ru').find((row) => row.string_key === 'placeholder-text');
  assert.equal(english.value, 'Aalborg — Denmark');
  assert.match(russian.value, /Ольборга/);
  assert.equal(hotelsFor('aalborg.html').length, 0);
});

test('Esbjerg keeps the hotel group and the visible ETH price', () => {
  const britannia = hotelsFor('esbjerg.html').find((hotel) => hotel.name === 'Hotel Britannia');
  assert.equal(britannia.chain_name, 'Britannia Hotels');
  assert.equal(britannia.price_eth, 0.035);
  assert.equal(britannia.price_label, '0.035 ETH / night');
  assert.equal(britannia.book_label, 'Book Now');
  assert.equal(britannia.book_url, null);
});

test('the server answers a city address from SQL', async () => {
  const app = express();
  app.use(serveCityPage);
  app.use((req, res) => {
    res.status(404).type('text').send('missing');
  });
  const server = http.createServer(app);
  const base = await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      resolve('http://127.0.0.1:' + server.address().port);
    });
    server.on('error', reject);
  });

  try {
  const encoded = await fetch(base + '/' + encodeURIComponent('šiauliai.htm'));
  assert.equal(encoded.status, 200);
  const html = await encoded.text();
  assert.match(html, /Park Inn Šiauliai/);
  assert.match(html, /Old Town Boutique/);
  const page = getCityPage('šiauliai.htm');
  assert.equal(page.heading, 'Available Hotels in Šiauliai.Htm');
  assert.equal(page.currencies, 'ETH,BTC,USDT');
  assert.equal(page.back_href, 'selectlocation.html');

  const missing = await fetch(base + '/funken-lodge.html');
  assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
