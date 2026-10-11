const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const places = require('../lib/places-without-pages');
const { regionSlug, canonicalHotelPageUrl, serveCityPage } = require('../lib/city-pages');
const express = require('express');
const http = require('http');

const root = path.join(__dirname, '..');

function loadCatalog() {
  const source = fs.readFileSync(path.join(root, 'assets/search-catalog.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SEARCH_CATALOG;
}

function assertHotelPage(hotel, cityUrl) {
  assert.ok(hotel.url, hotel.name + ' should have a page url');
  assert.notEqual(hotel.url, cityUrl || '', hotel.name + ' should not reuse the city page');
  const filePath = path.join(root, hotel.url);
  assert.equal(fs.existsSync(filePath), true, hotel.url + ' should exist for ' + hotel.name);
  const html = fs.readFileSync(filePath, 'utf8');
  assert.match(html, /<meta\s+name=["']viewport["']/i, hotel.url);
  assert.match(html, /class="hotel-detail"/, hotel.url);
  assert.match(html, /site-preferences\.js/, hotel.url + ' should load the shared navbar');
  assert.match(html, /language-switcher|class="site-nav"/, hotel.url + ' should include the navbar');
}

test('every catalog hotel has an HTML page with the navbar', () => {
  const catalog = loadCatalog();
  const cityUrls = new Map(catalog.cities.map((city) => [city.city, city.url]));
  assert.ok(catalog.hotels.length > 0);
  catalog.hotels.forEach((hotel) => {
    assertHotelPage(hotel, cityUrls.get(hotel.city));
  });
});

test('hotels in places without a city page still have their own HTML page', () => {
  places.hotels.forEach((hotel) => {
    assertHotelPage(hotel, null);
  });
});

test('hotel pages sit in the same region folder as their city', () => {
  const catalog = loadCatalog();
  catalog.hotels.concat(places.hotels).forEach((hotel) => {
    const expected = 'html/cities/' + regionSlug(hotel.country) + '/' + path.posix.basename(hotel.url);
    assert.equal(hotel.url, expected, hotel.name);
    const html = fs.readFileSync(path.join(root, hotel.url), 'utf8');
    assert.match(html, /<base href="\/">/, hotel.url);
    const legacy = path.posix.basename(hotel.url);
    assert.equal(canonicalHotelPageUrl(legacy), hotel.url, hotel.name);
  });
});

test('a root hotel address redirects into its region folder', async () => {
  const app = express();
  app.use(serveCityPage);
  app.use(express.static(root));
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
    const legacy = await fetch(base + '/comwell-aarhus.html', { redirect: 'manual' });
    assert.equal(legacy.status, 302);
    assert.equal(legacy.headers.get('location'), '/html/cities/denmark/comwell-aarhus.html');
    const page = await fetch(base + '/html/cities/denmark/comwell-aarhus.html');
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /class="hotel-detail"/);
    assert.match(html, /Comwell Aarhus/);
    const missing = await fetch(base + '/not-a-hotel.html');
    assert.equal(missing.status, 404);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
