const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-properties-'));
process.env.AUTH_DATA_DIR = dataDir;
process.env.AUTH_RATE_LIMIT_DISABLED = '1';

const authRouter = require('../routes/auth');
const propertiesRouter = require('../routes/properties');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/properties', propertiesRouter);
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

function locationPayload(overrides) {
  return Object.assign({
    name: 'Harbour House',
    propertyType: 'guesthouse',
    country: 'Latvia',
    address: {
      streetName: 'Brīvības iela',
      houseNumber: '76',
      postalCode: '1011',
      city: 'Rīga'
    },
    directions: 'Entrance on Brīvības iela, beside the riverside park.',
    latitude: 56.9496,
    longitude: 24.1052
  }, overrides);
}

async function register(account) {
  return jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account)
  });
}

test('requires a business account to upload an accommodation location', async () => {
  const anonymous = await jsonRequest('/api/properties');
  assert.equal(anonymous.status, 401);

  const guest = await register({
    name: 'Ada Guest',
    email: 'guest-' + Date.now() + '@example.com',
    password: 'password123',
    accountType: 'customer',
    birthDate: '01/01/1990'
  });
  assert.equal(guest.status, 201, guest.data && guest.data.error);

  const denied = await jsonRequest('/api/properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + guest.data.token
    },
    body: JSON.stringify(locationPayload())
  });
  assert.equal(denied.status, 403);
});

test('saves, updates, and lists locations for that business only', async () => {
  const owner = await register({
    name: 'Jane Doe',
    email: 'owner-' + Date.now() + '@hotels.example',
    password: 'password123',
    accountType: 'business',
    companyName: 'Northern Lights Hotels',
    businessType: 'independent-hotel',
    country: 'Latvia',
    address: {
      streetName: 'Brīvības iela',
      houseNumber: '1',
      postalCode: '1011',
      city: 'Rīga'
    }
  });
  assert.equal(owner.status, 201, owner.data && owner.data.error);

  const other = await register({
    name: 'Other Owner',
    email: 'other-' + Date.now() + '@hotels.example',
    password: 'password123',
    accountType: 'business',
    companyName: 'Other Hotels',
    businessType: 'hotel-chain',
    country: 'Latvia',
    address: {
      streetName: 'Brīvības iela',
      houseNumber: '2',
      postalCode: '1011',
      city: 'Rīga'
    }
  });
  assert.equal(other.status, 201, other.data && other.data.error);

  const created = await jsonRequest('/api/properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + owner.data.token
    },
    body: JSON.stringify(locationPayload())
  });
  assert.equal(created.status, 201, created.data && created.data.error);
  assert.equal(created.data.property.name, 'Harbour House');
  assert.equal(created.data.property.city, 'Rīga');
  assert.match(created.data.property.addressFormatted, /Harbour House/);
  assert.equal(created.data.property.latitude, 56.9496);

  const incomplete = await jsonRequest('/api/properties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + owner.data.token
    },
    body: JSON.stringify(locationPayload({ directions: '' }))
  });
  assert.equal(incomplete.status, 400);

  const updated = await jsonRequest('/api/properties/' + created.data.property.id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + owner.data.token
    },
    body: JSON.stringify(locationPayload({
      name: 'Harbour House Hotel',
      directions: 'Use the courtyard door on the river side of the building.'
    }))
  });
  assert.equal(updated.status, 200, updated.data && updated.data.error);
  assert.equal(updated.data.property.name, 'Harbour House Hotel');

  const stolen = await jsonRequest('/api/properties/' + created.data.property.id, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + other.data.token
    },
    body: JSON.stringify(locationPayload({ name: 'Taken Over' }))
  });
  assert.equal(stolen.status, 404);

  const listed = await jsonRequest('/api/properties', {
    headers: { Authorization: 'Bearer ' + owner.data.token }
  });
  assert.equal(listed.status, 200);
  assert.equal(listed.data.properties.length, 1);
  assert.equal(listed.data.properties[0].name, 'Harbour House Hotel');

  const otherList = await jsonRequest('/api/properties', {
    headers: { Authorization: 'Bearer ' + other.data.token }
  });
  assert.deepEqual(otherList.data.properties, []);

  const removed = await jsonRequest('/api/properties/' + created.data.property.id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + owner.data.token }
  });
  assert.equal(removed.status, 200);

  const after = await jsonRequest('/api/properties', {
    headers: { Authorization: 'Bearer ' + owner.data.token }
  });
  assert.deepEqual(after.data.properties, []);
});
