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

function getCityPage(pageUrl) {
  const name = String(pageUrl || '');
  return plain(db().prepare(`
    SELECT
      page_url, title, city_name, country, heading, header_title, header_description,
      back_href, placeholder_text, expected_path, currencies, html
    FROM city_pages
    WHERE page_url = ?
  `).get(name));
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
  `).all(String(pageUrl || '')).map(plain);
}

function stringsFor(pageUrl, lang) {
  const params = [String(pageUrl || '')];
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
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    next();
    return;
  }
  const page = getCityPage(name);
  if (!page) {
    next();
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
  getCityPage,
  listCityPages,
  hotelsFor,
  stringsFor,
  serveCityPage
};
