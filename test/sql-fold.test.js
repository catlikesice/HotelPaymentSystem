const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const vm = require('vm');

const { openSearchDatabase, search, foldText, SQL_FILE } = require('../lib/search-db');
const { normalizeResults, normalizeHero, tokensFor, foldMapEntries } = require('../lib/text-fold');
const { renderHotelSearchSql } = require('../lib/search-sql');

function browserNormalize(file, hero) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const match = source.match(/function normalize\(text\) \{\n[\s\S]*?\n  \}/);
  assert.ok(match, file + ' should define normalize');
  const fn = vm.runInNewContext(match[0] + '\nnormalize', {});
  return fn;
}

test('the SQL file matches the catalog renderer', () => {
  const rendered = renderHotelSearchSql();
  const onDisk = fs.readFileSync(SQL_FILE, 'utf8');
  assert.equal(onDisk, rendered);
});

test('sqlite3 can search the file without a JavaScript normalizer', () => {
  const output = execFileSync('sqlite3', [':memory:'], {
    input: fs.readFileSync(SQL_FILE),
    encoding: 'utf8'
  });
  assert.match(output, /Hotel Royal Aarhus/);
  assert.match(output, /city\|Nida\|Nida\|Lithuania\|/);
  assert.match(output, /Hotel Nida Marina/);
  assert.match(output, /city\|\d+\|\|Reykjavík\|reykjavík\.html/);
});

test('fold_map matches the JavaScript normalizer', () => {
  const db = openSearchDatabase();
  const actual = new Map(db.prepare('SELECT src, dst FROM fold_map').all().map((row) => [row.src, row.dst]));
  const expected = foldMapEntries();
  assert.equal(actual.size, expected.length);
  for (const [src, dst] of expected) {
    assert.equal(actual.get(src), dst, 'fold_map entry for ' + src);
  }

  const samples = [
    'Reykjavík',
    'Hafnarfjörður',
    'Reykjanesbær',
    'TROMSØ',
    "Hotel d'Angleterre",
    'Hotel d’Angleterre',
    'The King’s Arms Hotel',
    'Šiauliai',
    'Ny-Ålesund',
    'Hotel Føroyar'
  ];
  for (const sample of samples) {
    assert.equal(foldText(db, sample), normalizeResults(sample), sample);
    assert.deepEqual(
      foldText(db, sample).replace(/[—–]/g, ' ').split(/\s+/).filter(Boolean),
      tokensFor(sample)
    );
  }

  const cities = db.prepare('SELECT name, country, description, search_text, name_key FROM cities').all();
  assert.equal(cities.length, 99);
  for (const city of cities) {
    const joined = [city.name, city.name, city.country, city.description, '', 'city'].join(' ');
    assert.equal(foldText(db, joined), city.search_text, city.name);
    assert.equal(normalizeHero(city.name), city.name_key, city.name);
  }

  const hotels = db.prepare(`
    SELECT h.name AS name, c.name AS city, c.country AS country, h.description AS description,
           h.price_label AS price, h.search_text AS search_text, h.name_key AS name_key, h.label_key AS label_key
    FROM hotels AS h
    JOIN cities AS c ON c.id = h.city_id
  `).all();
  assert.equal(hotels.length, 218);
  for (const hotel of hotels) {
    const joined = [hotel.name, hotel.city, hotel.country, hotel.description, hotel.price, 'hotel'].join(' ');
    assert.equal(foldText(db, joined), hotel.search_text, hotel.name);
    assert.equal(normalizeHero(hotel.name), hotel.name_key, hotel.name);
    assert.equal(normalizeHero(hotel.name + ' — ' + hotel.city), hotel.label_key, hotel.name);
  }
});

test('a raw SQL token list finds Hafnarfjörður and Hotel d’Angleterre', () => {
  const db = openSearchDatabase();

  function namesFor(raw) {
    db.prepare('DELETE FROM fold_input').run();
    db.prepare('INSERT INTO fold_input (value) VALUES (?)').run(raw);
    db.exec('DELETE FROM query_tokens; INSERT INTO query_tokens (position, token) SELECT position, token FROM raw_query_tokens;');
    return {
      cities: db.prepare(`
        SELECT c.name AS name
        FROM cities AS c
        WHERE (
          SELECT COUNT(*) FROM query_tokens AS t WHERE instr(c.search_text, t.token) > 0
        ) = (SELECT COUNT(*) FROM query_tokens)
        ORDER BY c.sort_order
      `).all().map((row) => row.name),
      hotels: db.prepare(`
        SELECT h.name AS name
        FROM hotels AS h
        WHERE (
          SELECT COUNT(*) FROM query_tokens AS t WHERE instr(h.search_text, t.token) > 0
        ) = (SELECT COUNT(*) FROM query_tokens)
        ORDER BY h.sort_order
      `).all().map((row) => row.name)
    };
  }

  assert.deepEqual(namesFor('hafnarfjordur').cities, ['Hafnarfjörður']);
  assert.deepEqual(namesFor("Hotel d'Angleterre").hotels, ['Hotel d’Angleterre']);
  assert.deepEqual(namesFor('Royal Aarhus').hotels, ['Hotel Royal Aarhus']);
  assert.deepEqual(search(db, 'Nida').cities.map((city) => city.name), ['Nida']);
});

test('browser normalizers follow the SQL fold', () => {
  const searchNormalize = browserNormalize('assets/search.js');
  const heroNormalize = browserNormalize('assets/hero-search.js');
  const samples = ['Hafnarfjörður', 'Reykjanesbær', "d'Angleterre", 'The King’s Arms Hotel', '  Tromsø  '];
  for (const sample of samples) {
    assert.equal(searchNormalize(sample), normalizeResults(sample), sample);
    assert.equal(heroNormalize(sample), normalizeHero(sample), sample);
  }
});
