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
  assert.match(html, /data-account-row="birthDate"/);
  assert.match(html, /data-account-birth-date/);
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

test('account portals can remove a document and bring it back', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  const guest = fs.readFileSync(path.join(root, 'assets/account-portal.js'), 'utf8');
  const business = fs.readFileSync(path.join(root, 'assets/business-portal.js'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(html, /data-portal-section="documents"/);
  assert.match(html, /id="account-documents-title"/);
  assert.match(html, /id="business-documents-title"/);
  assert.match(html, /data-document-deleted/);
  assert.match(html, /assets\/document-records\.js/);
  assert.match(html, /assets\/documents-portal\.js/);
  assert.match(guest, /'documents'/);
  assert.match(business, /'documents'/);
  assert.match(auth, /function deleteDocument/);
  assert.match(auth, /function restoreDocument/);
  assert.match(auth, /\/restore/);
});

test('login and register send people to the account page after success', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(source, /window\.location\.href = 'account\.html'/);
  assert.match(source, /function goToAccountPage/);
  assert.match(source, /function bindAccountPage/);
  assert.match(source, /function listBookings/);
  assert.match(source, /function createBooking/);
  assert.match(source, /setAccountRow\('birthDate'/);
});

test('homepage login popup no longer includes a View account button', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /data-login-account/);
  assert.doesNotMatch(html, /View account/);
  assert.doesNotMatch(html, /login-popup__account/);
});

test('signed-in navbar account dropdown toggles on the account page', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(
    source,
    /if \(user && user\.email && opener\.closest\('\.nav-dropdown-account'\)\) \{\s*return;\s*\}/
  );
  assert.match(
    source,
    /if \(user && user\.email\) \{[\s\S]*?goToAccountPage\(\);/
  );
  assert.doesNotMatch(source, /data-login-account/);
  assert.doesNotMatch(source, /login-popup__account/);
});

test('account dropdown shows the signed-in full name instead of the email', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  assert.match(source, /data-signed-in-name/);
  assert.match(source, /escapeHtml\(displayName\)/);
  assert.match(source, /return String\(user\.name \|\| ''\)\.trim\(\)/);
  assert.doesNotMatch(
    source,
    /nav-account-status[\s\S]{0,220}escapeHtml\(user\.email\)/
  );
});

test('business account portal shows the company name instead of the representative', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  const portal = fs.readFileSync(path.join(root, 'assets/business-portal.js'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  const businessProfile = html.slice(
    html.indexOf('id="business-profile-heading"'),
    html.indexOf('id="business-logout"')
  );
  const companyAt = businessProfile.indexOf('data-business-company-name');
  const representativeAt = businessProfile.indexOf('>Representative<');
  assert.ok(companyAt !== -1, 'company name should be on the business profile');
  assert.ok(representativeAt !== -1, 'representative should stay labeled as the contact');
  assert.ok(companyAt < representativeAt, 'company name should appear before the representative');
  assert.match(portal, /const greetingName = company \|\| representative\.split/);
  assert.match(portal, /Welcome, ' \+ greetingName/);
  assert.match(portal, /setText\('\[data-business-company\]', company \|\| 'Your properties'\)/);
  assert.doesNotMatch(portal, /Welcome, ' \+ firstName/);
  assert.match(auth, /function accountDisplayName/);
  assert.match(auth, /user\.accountType === 'business'/);
  assert.match(auth, /user\.companyName/);
  assert.match(auth, /function accountButtonLabel/);
});

test('nav translations still include View account for the account dropdown', () => {
  const source = fs.readFileSync(path.join(root, 'assets/nav-translations.js'), 'utf8');
  assert.match(source, /viewAccount: 'View account'/);
  assert.doesNotMatch(source, /viewDetails/);
  assert.doesNotMatch(source, /data-login-account/);
});

test('account portal does not show a name dropdown above the dashboard', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'assets/account-portal.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.doesNotMatch(html, /class="portal-account"/);
  assert.doesNotMatch(html, /id="portal-account-menu"/);
  assert.doesNotMatch(html, /data-portal-account-label/);
  assert.doesNotMatch(source, /portal-account-menu/);
  assert.doesNotMatch(css, /\.portal-account/);
  assert.match(html, /data-portal-section="profile"/);
  assert.match(html, /id="account-logout"/);
});

test('account portal does not include a search bar', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.doesNotMatch(html, /class="portal-search"/);
  assert.doesNotMatch(html, /id="portal-search-q"/);
  assert.doesNotMatch(html, /Search stays, cities or events/);
});

test('account portal keeps profile and logout without a name menu', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  assert.doesNotMatch(html, /class="portal-account"/);
  assert.doesNotMatch(html, /View details/);
  assert.match(html, /data-portal-section="profile"/);
  assert.match(html, /href="#profile"/);
  assert.match(html, /id="account-logout"/);
  assert.match(html, /Log out/);
});

test('navbar account logout stays on the current page', () => {
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  const handler = source.match(
    /class="nav-account-logout"[\s\S]*?addEventListener\('click', function\(\) \{[\s\S]*?\}\);/
  );
  assert.ok(handler, 'navbar logout handler should exist');
  assert.doesNotMatch(handler[0], /index\.html/);
  assert.doesNotMatch(handler[0], /location\.href/);
  assert.match(handler[0], /renderAccountPage\(null\)/);
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
  assert.doesNotMatch(css, /\.portal-account/);
});

test('business accounts do not show the guest trip portal', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const businessNav = html.slice(
    html.indexOf('id="business-dashboard"'),
    html.indexOf('id="property-form"')
  );
  assert.match(source, /dashboard\.hidden = !signedIn \|\| Boolean\(isBusiness\)/);
  assert.doesNotMatch(businessNav, /data-portal-section="trips"/);
  assert.doesNotMatch(businessNav, /My trips/);
  assert.match(css, /\.portal\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s);
});

test('business accounts get a portal for uploading accommodation locations', () => {
  const html = fs.readFileSync(path.join(root, 'account.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'assets/auth-client.js'), 'utf8');
  const portal = fs.readFileSync(path.join(root, 'assets/business-portal.js'), 'utf8');
  assert.match(html, /id="business-dashboard"/);
  assert.match(html, /id="property-form"/);
  assert.match(html, /id="directions"/);
  assert.match(html, /Location details/);
  assert.match(html, /data-property-list/);
  assert.match(html, /assets\/business-portal\.js/);
  assert.match(html, /assets\/property-records\.js/);
  assert.match(html, /assets\/country-address\.js/);
  assert.match(source, /getElementById\('business-dashboard'\)/);
  assert.match(source, /function listProperties/);
  assert.match(source, /function saveProperty/);
  assert.match(source, /accountType === 'business'/);
  assert.match(portal, /Save location/);
  assert.match(portal, /data-property-list/);
  assert.doesNotMatch(html, /Old Town Riverside Hostel/);
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
