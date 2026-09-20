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
  assert.match(source, /function bindAccountPage/);
  assert.match(source, /function listBookings/);
  assert.match(source, /function createBooking/);
});

test('homepage login popup no longer includes a View account button', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /data-login-account/);
  assert.doesNotMatch(html, /View account/);
  assert.doesNotMatch(html, /login-popup__account/);
});

test('signed-in navbar account button goes to the account page', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(
    source,
    /const opener = event\.target\.closest\('\[data-login-open\], \.nav-account-btn'\);[\s\S]*?if \(user && user\.email\) \{[\s\S]*?goToAccountPage\(\);/
  );
  assert.doesNotMatch(source, /data-login-account/);
  assert.doesNotMatch(source, /login-popup__account/);
});

test('nav translations still include View account for the account dropdown', () => {
  const source = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(source, /viewAccount: 'View account'/);
  assert.match(source, /viewDetails: 'View details'/);
  assert.doesNotMatch(source, /data-login-account/);
});

test('account portal has an account dropdown with details and logout links', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.match(html, /class="portal-account"/);
  assert.match(html, /id="portal-account-menu"/);
  assert.match(html, /data-portal-account="details"/);
  assert.match(html, /href="#profile"/);
  assert.match(html, /View details/);
  assert.match(html, /data-portal-account="logout"/);
  assert.match(html, /href="logout\.html"/);
});

test('logout page signs the visitor out and returns them to login', () => {
  const html = fs.readFileSync(path.join(root, 'logout.html'), 'utf8');
  assert.match(html, /id="logout-page"/);
  assert.match(html, /id="logout-status"/);
  assert.match(html, /assets\/auth-client\.js/);
  assert.match(html, /assets\/local-auth\.js/);
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(source, /function bindLogoutPage/);
  assert.match(source, /window\.location\.href = 'login\.html'/);
});

test('account styles hide empty profile rows', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /account-dl > div\[hidden\]/);
  assert.match(css, /\.portal-nav/);
  assert.match(css, /\.portal-stats/);
  assert.match(css, /\.portal-account/);
  assert.match(css, /\.portal-account__menu/);
});

test('account portal keeps the sidebar on screen while the main column scrolls', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /body\.portal-open\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /body\.portal-open #account-page\s*\{[^}]*overflow:\s*hidden/s);
  const navBlock = css.match(/\.portal-nav\s*\{[^}]+\}/);
  assert.ok(navBlock, 'expected a .portal-nav rule');
  assert.match(navBlock[0], /max-height:\s*100%/);
  assert.match(navBlock[0], /overflow-y:\s*auto/);
  assert.match(css, /\.portal-main\s*\{[^}]*overflow-y:\s*auto/s);
});
