const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-bookings-'));
process.env.AUTH_DATA_DIR = dataDir;
process.env.AUTH_RATE_LIMIT_DISABLED = '1';

const authRouter = require('../routes/auth');
const bookingsRouter = require('../routes/bookings');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/bookings', bookingsRouter);
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

test('requires authentication to list or create bookings', async () => {
  const listed = await jsonRequest('/api/bookings');
  assert.equal(listed.status, 401);

  const created = await jsonRequest('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'stay',
      propertyName: 'Wellton Riverside Riga',
      city: 'Riga',
      country: 'Latvia',
      checkInDate: '2099-05-10',
      checkOutDate: '2099-05-13',
      amount: 0.18,
      currency: 'ETH'
    })
  });
  assert.equal(created.status, 401);
});

test('saves a confirmed stay and lists it for that account only', async () => {
  const email = 'booker-' + Date.now() + '@example.com';
  const createdUser = await jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Booker',
      email,
      password: 'password123'
    })
  });
  assert.equal(createdUser.status, 201);
  const token = createdUser.data.token;

  const empty = await jsonRequest('/api/bookings', {
    headers: { Authorization: 'Bearer ' + token }
  });
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.data.bookings, []);

  const booked = await jsonRequest('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      kind: 'stay',
      propertyName: 'Wellton Riverside Riga',
      city: 'Riga',
      country: 'Latvia',
      checkInDate: '2099-05-10',
      checkOutDate: '2099-05-13',
      guests: { adults: 2, children: 1 },
      roomLabel: 'Riverside Deluxe Room',
      amount: 0.18,
      currency: 'ETH',
      confirmationCode: 'BH-4821'
    })
  });

  assert.equal(booked.status, 201);
  assert.equal(booked.data.booking.propertyName, 'Wellton Riverside Riga');
  assert.equal(booked.data.booking.nights, 3);
  assert.notEqual(booked.data.booking.confirmationCode, 'BH-4821');
  assert.match(booked.data.booking.confirmationCode, /^BH-[A-Z0-9]{6}$/);

  const listed = await jsonRequest('/api/bookings', {
    headers: { Authorization: 'Bearer ' + token }
  });
  assert.equal(listed.status, 200);
  assert.equal(listed.data.bookings.length, 1);
  assert.equal(listed.data.bookings[0].propertyName, 'Wellton Riverside Riga');
});
