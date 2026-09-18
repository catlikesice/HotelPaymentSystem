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
      password
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
    body: JSON.stringify({ name: 'First User', email, password: 'password123' })
  });
  assert.equal(first.status, 201);

  const duplicate = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Second User', email, password: 'password123' })
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
