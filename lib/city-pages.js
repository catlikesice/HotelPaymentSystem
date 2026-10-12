'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const SQL_FILE = path.join(__dirname, '..', 'docs', 'sql', 'city-pages.sql');

let database;

function db() {
  if (!database) {
    database = new DatabaseSync(':memory:');
    database.exec(fs.readFileSync(SQL_FILE, 'utf8'));
  }
  return database;
}

function plain(row) {
  return row ? Object.assign({}, row) : null;
}

const PAGE_COLUMNS = `
  page_url, title, city_name, country, heading, header_title, header_description,
  back_href, placeholder_text, expected_path, currencies, html
`;

function regionSlug(country) {
  return String(country || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cityPublicPath(fileName, country) {
  const base = path.posix.basename(String(fileName || '').replace(/\\/g, '/'));
  return 'html/cities/' + regionSlug(country) + '/' + base;
}

function canonicalPageUrl(pageUrl) {
  const name = String(pageUrl || '');
  const exact = db().prepare('SELECT page_url FROM city_pages WHERE page_url = ?').get(name);
  if (exact) {
    return exact.page_url;
  }
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return name;
  }
  const matches = db().prepare('SELECT page_url FROM city_pages').all()
    .filter((row) => row.page_url.endsWith('/' + name));
  return matches.length === 1 ? matches[0].page_url : name;
}

function getCityPage(pageUrl) {
  return plain(db().prepare(`
    SELECT ${PAGE_COLUMNS}
    FROM city_pages
    WHERE page_url = ?
  `).get(canonicalPageUrl(pageUrl)));
}

function listCityPages() {
  return db().prepare(`
    SELECT page_url, title, city_name, country, heading
    FROM city_pages
    ORDER BY city_name
  `).all().map(plain);
}

function hotelsFor(pageUrl) {
  return db().prepare(`
    SELECT
      page_url, position, name, image_url, image_alt, chain_name, price_label,
      price_eth, price_btc, price_usdt, description, book_url, book_label
    FROM city_page_hotels
    WHERE page_url = ?
    ORDER BY position
  `).all(canonicalPageUrl(pageUrl)).map(plain);
}

function stringsFor(pageUrl, lang) {
  const params = [canonicalPageUrl(pageUrl)];
  let sql = `
    SELECT lang, string_key, value
    FROM city_page_strings
    WHERE page_url = ?
  `;
  if (lang) {
    sql += ' AND lang = ?';
    params.push(String(lang));
  }
  sql += ' ORDER BY lang, string_key';
  return db().prepare(sql).all(...params).map(plain);
}

function onDiskCityPage(name) {
  const root = path.resolve(__dirname, '..');
  const filePath = path.resolve(root, name);
  if (filePath !== path.join(root, name)) {
    return false;
  }
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function isCityPageRequest(name) {
  if (!name || name.includes('\\') || name.includes('\0') || name.includes('..')) {
    return false;
  }
  if (!name.includes('/')) {
    return /^[^/]+\.(?:html|htm)$/i.test(name);
  }
  return /^html\/cities\/[a-z0-9-]+\/[^/]+\.(?:html|htm)$/i.test(name);
}

function encodedPublicPath(pageUrl) {
  return '/' + String(pageUrl || '').split('/').map((part) => encodeURIComponent(part)).join('/');
}

let hotelPageUrls;

function hotelPageIndex() {
  if (!hotelPageUrls) {
    const { getSearchDatabase } = require('./search-db');
    const byBasename = new Map();
    getSearchDatabase().prepare(`
      SELECT page_url FROM hotels WHERE page_url IS NOT NULL AND page_url <> ''
    `).all().forEach((row) => {
      const base = row.page_url.split('/').pop();
      if (!byBasename.has(base)) {
        byBasename.set(base, new Set());
      }
      byBasename.get(base).add(row.page_url);
    });
    hotelPageUrls = new Map();
    byBasename.forEach((urls, base) => {
      if (urls.size !== 1) {
        return;
      }
      const url = Array.from(urls)[0];
      hotelPageUrls.set(url, url);
      hotelPageUrls.set(base, url);
    });
  }
  return hotelPageUrls;
}

function canonicalHotelPageUrl(pageUrl) {
  const name = String(pageUrl || '');
  if (!name || name.includes('\\') || name.includes('\0') || name.includes('..')) {
    return null;
  }
  return hotelPageIndex().get(name) || null;
}

function serveCityPage(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }
  let name = '';
  try {
    name = decodeURIComponent(req.path || '').replace(/^\/+/, '');
  } catch (error) {
    next();
    return;
  }
  if (!isCityPageRequest(name)) {
    next();
    return;
  }
  if (onDiskCityPage(name)) {
    next();
    return;
  }
  const page = getCityPage(name);
  if (!page) {
    const hotelUrl = canonicalHotelPageUrl(name);
    if (hotelUrl && hotelUrl !== name) {
      res.redirect(302, encodedPublicPath(hotelUrl));
      return;
    }
    next();
    return;
  }
  if (page.page_url !== name) {
    res.redirect(302, encodedPublicPath(page.page_url));
    return;
  }
  res.type('html');
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }
  res.send(page.html);
}

module.exports = {
  regionSlug,
  cityPublicPath,
  canonicalPageUrl,
  canonicalHotelPageUrl,
  getCityPage,
  listCityPages,
  hotelsFor,
  stringsFor,
  serveCityPage
};
