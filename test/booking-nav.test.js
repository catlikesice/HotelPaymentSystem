const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { listCityPages, getCityPage } = require('../lib/city-pages');

const root = path.join(__dirname, '..');

function htmlFiles() {
  return fs.readdirSync(root).filter((name) => name.endsWith('.html'));
}

test('city pages in SQL that show a language bar load the shared preferences script', () => {
  const pages = listCityPages();
  const listings = pages.filter((page) => {
    const html = getCityPage(page.page_url).html;
    const hasBooking = html.includes('booking-container') || html.includes('booking-header');
    const hasLooseLanguage = html.includes('class="language-switcher"') && !html.includes('nav-inner');
    return hasBooking && hasLooseLanguage;
  });

  assert.ok(listings.length > 0, 'expected city booking pages with a standalone language bar');
  assert.ok(listings.some((page) => page.page_url === 'tallinn.html'));

  listings.forEach((page) => {
    const html = getCityPage(page.page_url).html;
    assert.equal(fs.existsSync(path.join(root, page.page_url)), false, page.page_url + ' should not remain as a file');
    assert.match(html, /site-preferences\.js/, `${page.page_url} should load the shared preferences script`);
  });
});

test('shared preferences script mounts the primary navbar around the language control', () => {
  const source = fs.readFileSync(path.join(root, 'site-preferences.js'), 'utf8');
  assert.match(source, /function mountBookingNavbar/);
  assert.match(source, /data-booking-nav/);
  assert.match(source, /nav-dropdown-environment/);
  assert.match(source, /nav-dropdown-account/);
  assert.match(source, /class="nav-tools"/);
  assert.match(source, /assets\/nav-translations\.js/);
  assert.match(source, /assets\/nav-rail\.js/);
  assert.match(source, /findLooseLanguageSwitcher/);
  assert.match(source, /header \.site-nav \.nav-inner/);
});

test('a standalone booking language bar stays compact instead of stretching full width', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /body:has\(\.booking-container\) > \.language-switcher/);
  assert.match(css, /align-self:\s*flex-end/);
  assert.match(css, /max-width:\s*11rem/);
});
