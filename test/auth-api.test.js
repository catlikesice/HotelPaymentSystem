const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-auth-'));
process.env.AUTH_DATA_DIR = dataDir;
process.env.AUTH_RATE_LIMIT_DISABLED = '1';

const authRouter = require('../routes/auth');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    base = 'http://127.0.0.1:' + address.port;
    resolve();
  });
  server.on('error', reject);
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
}));

async function jsonRequest(pathname, options) {
  const response = await fetch(base + pathname, options);
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }
  return { status: response.status, data };
}

test('registers a guest account, logs in, and returns the public profile', async () => {
  const email = 'guest-' + Date.now() + '@example.com';
  const password = 'password123';

  const created = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Guest',
      email,
      password,
      birthDate: '15/03/1990'
    })
  });

  assert.equal(created.status, 201);
  assert.equal(created.data.user.name, 'Ada Guest');
  assert.equal(created.data.user.email, email);
  assert.equal(created.data.user.accountType, 'customer');
  assert.ok(created.data.token);
  assert.equal(created.data.user.passwordHash, undefined);

  const me = await jsonRequest('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + created.data.token }
  });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, email);

  const login = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.name, 'Ada Guest');
});

test('registers a guest birth date and rejects a future date', async () => {
  const created = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Guest',
      email: 'birth-' + Date.now() + '@example.com',
      password: 'password123',
      birthDate: '15/03/1990'
    })
  });

  assert.equal(created.status, 201, created.data && created.data.error);
  assert.equal(created.data.user.birthDate, '1990-03-15');

  const future = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Future Guest',
      email: 'future-' + Date.now() + '@example.com',
      password: 'password123',
      birthDate: '01/01/2999'
    })
  });
  assert.equal(future.status, 400);
  assert.match(future.data.error, /future/i);

  const young = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Young Guest',
      email: 'young-' + Date.now() + '@example.com',
      password: 'password123',
      birthDate: '01/01/2020'
    })
  });
  assert.equal(young.status, 400);
  assert.match(young.data.error, /at least 18/);

  const missingBirthDate = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'No Date',
      email: 'nodate-' + Date.now() + '@example.com',
      password: 'password123'
    })
  });
  assert.equal(missingBirthDate.status, 400);
  assert.match(missingBirthDate.data.error, /birth date/i);
});

test('registers a business account with a local postal address', async () => {
  const created = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Jane Doe',
      email: 'biz-' + Date.now() + '@hotels.example',
      password: 'password123',
      accountType: 'business',
      companyName: 'Northern Lights Hotels',
      businessType: 'independent-hotel',
      country: 'Latvia',
      address: {
        streetName: 'Brīvības iela',
        houseNumber: '76',
        apartment: '3',
        postalCode: '1011',
        city: 'Rīga'
      }
    })
  });

  assert.equal(created.status, 201, created.data && created.data.error);
  assert.equal(created.data.user.accountType, 'business');
  assert.equal(created.data.user.companyName, 'Northern Lights Hotels');
  assert.match(created.data.user.addressFormatted, /Northern Lights Hotels/);
  assert.match(created.data.user.addressFormatted, /Rīga/);
});

test('rejects duplicate emails, bad passwords, and missing sessions', async () => {
  const email = 'dupe-' + Date.now() + '@example.com';
  const first = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'First User', email, password: 'password123', birthDate: '15/03/1990' })
  });
  assert.equal(first.status, 201);

  const duplicate = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Second User', email, password: 'password123', birthDate: '15/03/1990' })
  });
  assert.equal(duplicate.status, 409);

  const shortPassword = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tiny Pass', email: 'tiny@example.com', password: 'short' })
  });
  assert.equal(shortPassword.status, 400);

  const badLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrong-password' })
  });
  assert.equal(badLogin.status, 401);

  const anonymous = await jsonRequest('/api/auth/me');
  assert.equal(anonymous.status, 401);

  const logout = await jsonRequest('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + first.data.token,
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  assert.equal(logout.status, 200);

  const afterLogout = await jsonRequest('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + first.data.token }
  });
  assert.equal(afterLogout.status, 401);
});

test('personal profile can save a photo and change the email address', async () => {
  const stamp = Date.now() + '-' + Math.random().toString(16).slice(2);
  const email = 'profile-' + stamp + '@example.com';
  const otherEmail = 'other-' + stamp + '@example.com';
  const password = 'password123';
  const photo = 'data:image/png;base64,' + Buffer.from('photo').toString('base64');

  const created = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Guest', email, password, birthDate: '15/03/1990' })
  });
  assert.equal(created.status, 201, created.data && created.data.error);
  assert.equal(created.data.user.photo, '');

  const named = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + created.data.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'Ada Traveler' })
  });
  assert.equal(named.status, 200, named.data && named.data.error);
  assert.equal(named.data.user.name, 'Ada Traveler');
  assert.equal(named.data.user.birthDate, '1990-03-15');
  assert.match(named.data.message, /Name updated/);

  const youngProfile = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + created.data.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ birthDate: '01/01/2020' })
  });
  assert.equal(youngProfile.status, 400);
  assert.match(youngProfile.data.error, /at least 18/);

  const shortName = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + created.data.token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'A' })
  });
  assert.equal(shortName.status, 400);

  await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Other Guest', email: otherEmail, password, birthDate: '15/03/1990' })
  });

  const authHeaders = {
    Authorization: 'Bearer ' + created.data.token,
    'Content-Type': 'application/json'
  };

  const anonymous = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo })
  });
  assert.equal(anonymous.status, 401);

  const withPhoto = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ photo })
  });
  assert.equal(withPhoto.status, 200, withPhoto.data && withPhoto.data.error);
  assert.equal(withPhoto.data.user.photo, photo);
  assert.equal(withPhoto.data.user.passwordHash, undefined);
  assert.match(withPhoto.data.message, /Profile photo saved/);

  const svg = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ photo: 'data:image/svg+xml;base64,PHN2Zz4=' })
  });
  assert.equal(svg.status, 400);

  const nextEmail = 'ada-' + stamp + '@example.com';
  const missingPassword = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: nextEmail })
  });
  assert.equal(missingPassword.status, 400);
  assert.match(missingPassword.data.error, /password/i);

  const wrongPassword = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: nextEmail, password: 'wrong-password' })
  });
  assert.equal(wrongPassword.status, 401);

  const duplicate = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: otherEmail, password })
  });
  assert.equal(duplicate.status, 409);

  const renamed = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: 'Ada-' + stamp + '@Example.com', password })
  });
  assert.equal(renamed.status, 200, renamed.data && renamed.data.error);
  assert.equal(renamed.data.user.email, nextEmail);
  assert.equal(renamed.data.user.photo, photo);

  const me = await jsonRequest('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + created.data.token }
  });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, nextEmail);
  assert.equal(me.data.user.photo, photo);

  const oldLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: nextEmail, password })
  });
  assert.equal(newLogin.status, 200);
  assert.equal(newLogin.data.user.email, nextEmail);

  const cleared = await jsonRequest('/api/auth/profile', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ photo: '' })
  });
  assert.equal(cleared.status, 200, cleared.data && cleared.data.error);
  assert.equal(cleared.data.user.photo, '');
  assert.match(cleared.data.message, /removed/i);
});

test('resets a forgotten password without revealing whether the email exists', async () => {
  const email = 'reset-' + Date.now() + '@example.com';
  const password = 'password123';
  const created = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Reset Guest', email, password })
  });
  assert.equal(created.status, 201, created.data && created.data.error);

  const unknown = await jsonRequest('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody-' + Date.now() + '@example.com', password: 'newpassword1' })
  });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.data.updated, undefined);
  assert.match(unknown.data.message, /if an account exists/i);

  const tooShort = await jsonRequest('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'short' })
  });
  assert.equal(tooShort.status, 400);

  const reset = await jsonRequest('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toUpperCase(), password: 'newpassword1' })
  });
  assert.equal(reset.status, 200, reset.data && reset.data.error);
  assert.match(reset.data.message, /password has been updated/i);

  const oldSession = await jsonRequest('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + created.data.token }
  });
  assert.equal(oldSession.status, 401);

  const oldLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.equal(oldLogin.status, 401);

  const newLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'newpassword1' })
  });
  assert.equal(newLogin.status, 200);
  assert.equal(newLogin.data.user.email, email);
});
