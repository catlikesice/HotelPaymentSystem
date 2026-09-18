const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const navPages = [
  'index.html',
  'about-ecotourism.html',
  'about-us-and-partners.html',
  'account.html',
  'business-register.html',
  'crypto-environment.html',
  'crypto-reliability.html',
  'culture-blog.html',
  'forgot-password.html',
  'hotel-chains.html',
  'login.html',
  'personal-register.html',
  'register.html',
  'search.html'
];

test('primary nav pages expose an Environmental Mission dropdown with About EcoTourism', () => {
  navPages.forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    assert.match(html, /nav-dropdown-environment/, `${fileName} should include the environment dropdown`);
    assert.match(html, /Environmental Mission/, `${fileName} should use the renamed label`);
    assert.match(html, /about-ecotourism\.html/, `${fileName} should link to About EcoTourism`);
    assert.equal(html.includes('Environment Mission'), false, `${fileName} should not keep the old label`);
  });
});

test('About EcoTourism page explains the EcoTourism commitment', () => {
  const html = fs.readFileSync(path.join(root, 'about-ecotourism.html'), 'utf8');
  assert.match(html, /committed to promoting EcoTourism/i);
  assert.match(html, /nav-about-ecotourism" aria-current="page"/);
});

test('nav translations include Environmental Mission and About EcoTourism', () => {
  const source = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(source, /environmentMission: 'Environmental Mission'/);
  assert.match(source, /aboutEcoTourism: 'About EcoTourism'/);
  assert.match(source, /nav-dropdown-environment/);
});
