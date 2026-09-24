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
  'logout.html',
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

test('navbar account control has a dropdown under the accounts portal', () => {
  navPages.concat(['checkout.html']).forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    assert.match(html, /nav-dropdown-account/, `${fileName} should include the account dropdown`);
    assert.match(html, /nav-account-login/, `${fileName} should link to login`);
    assert.match(html, /nav-account-register/, `${fileName} should link to register`);
    assert.match(html, /class="nav-account-btn nav-box-account"/, `${fileName} should keep the account control`);
  });
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.nav-dropdown-account:hover\s*>\s*\.nav-dropdown-menu/);
  const rail = fs.readFileSync(path.join(root, 'assets/nav-rail.js'), 'utf8');
  assert.match(rail, /mouseenter/);
  assert.doesNotMatch(rail, /hover: hover/);
});

test('reference footers sit outside the centered article column', () => {
  ['crypto-environment.html', 'hotel-chains.html'].forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    const mainStart = html.indexOf('<main');
    const mainEnd = html.indexOf('</main>');
    assert.ok(mainStart !== -1 && mainEnd > mainStart, `${fileName} should have a main element`);
    const main = html.slice(mainStart, mainEnd);
    assert.equal(main.includes('<footer'), false, `${fileName} should keep the green footer outside the article column`);
    assert.match(html.slice(mainEnd), /<footer>/, `${fileName} should still render a footer`);
  });
  const contact = fs.readFileSync(path.join(root, 'contact us business client.html'), 'utf8');
  assert.doesNotMatch(contact, /<footer[^>]*\bcontainer\b/);
});

test('nav translations include Environmental Mission and About EcoTourism', () => {
  const source = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(source, /environmentMission: 'Environmental Mission'/);
  assert.match(source, /aboutEcoTourism: 'About EcoTourism'/);
  assert.match(source, /nav-dropdown-environment/);
});
