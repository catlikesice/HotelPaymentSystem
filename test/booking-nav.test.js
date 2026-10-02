const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function htmlFiles() {
  return fs.readdirSync(root).filter((name) => name.endsWith('.html'));
}

test('booking listings that show a language bar load the shared preferences script', () => {
  const listings = htmlFiles().filter((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    const hasBooking = html.includes('booking-container') || html.includes('booking-header');
    const hasLooseLanguage = html.includes('class="language-switcher"') && !html.includes('nav-inner');
    return hasBooking && hasLooseLanguage;
  });

  assert.ok(listings.length > 0, 'expected city booking pages with a standalone language bar');
  assert.ok(listings.includes('tallinn.html'));

  listings.forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    assert.match(html, /site-preferences\.js/, `${fileName} should load the shared preferences script`);
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
