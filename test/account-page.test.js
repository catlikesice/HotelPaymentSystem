const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

test('account page shows a guest prompt and a signed-in dashboard', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.match(html, /id="account-page"/);
  assert.match(html, /id="account-guest"/);
  assert.match(html, /id="account-dashboard"/);
  assert.match(html, /href="register\.html"/);
  assert.match(html, /href="login\.html"/);
  assert.match(html, /data-account-name/);
  assert.match(html, /data-account-email/);
  assert.match(html, /id="account-bookings-title"/);
  assert.match(html, /id="account-logout"/);
  assert.match(html, /aria-current="page"/);
});

test('account portal follows the overview wireframe without mock trip details', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.match(html, /class="portal"/);
  assert.match(html, /data-portal-section="overview"/);
  assert.match(html, /data-portal-section="trips"/);
  assert.match(html, /data-portal-section="accommodation"/);
  assert.match(html, /data-portal-section="events"/);
  assert.match(html, /data-portal-section="messages"/);
  assert.match(html, /data-portal-section="saved"/);
  assert.match(html, /data-portal-section="payments"/);
  assert.match(html, /data-portal-section="profile"/);
  assert.match(html, /Your next adventure/);
  assert.match(html, /data-upcoming-stay/);
  assert.doesNotMatch(html, /Old Town Riverside Hostel/);
  assert.doesNotMatch(html, /BH-4821/);
  assert.doesNotMatch(html, /Alternative Riga walking tour/);
  assert.doesNotMatch(html, /Baltic electronic music night/);
  assert.doesNotMatch(html, /0\.0082 ETH/);
});

test('account portal scripts load booking helpers', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.match(html, /assets\/account-portal\.js/);
  assert.match(html, /assets\/booking-records\.js/);
  assert.match(html, /assets\/local-bookings\.js/);
});

test('login and register send people to the account page after success', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(source, /window\.location\.href = 'account\.html'/);
  assert.match(source, /function goToAccountPage/);
  assert.match(source, /data-login-account/);
  assert.match(source, /function bindAccountPage/);
  assert.match(source, /function listBookings/);
  assert.match(source, /function createBooking/);
});

test('homepage login popup includes a View account link', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /href="account\.html"/);
  assert.match(html, /data-login-account/);
  assert.match(html, /View account/);
});

test('nav translations include View account', () => {
  const source = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(source, /viewAccount: 'View account'/);
});

test('account styles hide empty profile rows', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /account-dl > div\[hidden\]/);
  assert.match(css, /\.portal-nav/);
  assert.match(css, /\.portal-stats/);
});
