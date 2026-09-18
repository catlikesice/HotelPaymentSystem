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

test('login and register send people to the account page after success', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(source, /window\.location\.href = 'account\.html'/);
  assert.match(source, /function goToAccountPage/);
  assert.match(source, /data-login-account/);
  assert.match(source, /function bindAccountPage/);
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
