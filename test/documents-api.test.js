const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-documents-'));
process.env.AUTH_DATA_DIR = dataDir;
process.env.AUTH_RATE_LIMIT_DISABLED = '1';

const authRouter = require('../routes/auth');
const documentsRouter = require('../routes/documents');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/documents', documentsRouter);
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

async function register(account) {
  return jsonRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account)
  });
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  };
}

test('requires a signed-in account to save a document', async () => {
  const anonymous = await jsonRequest('/api/documents');
  assert.equal(anonymous.status, 401);

  const guest = await register({
    name: 'Ada Guest',
    email: 'docs-guest-' + Date.now() + '@example.com',
    password: 'password123',
    accountType: 'customer',
    birthDate: '01/01/1990'
  });
  assert.equal(guest.status, 201, guest.data && guest.data.error);

  const rejected = await jsonRequest('/api/documents', {
    method: 'POST',
    headers: authHeaders(guest.data.token),
    body: JSON.stringify({ title: 'x', kind: 'receipt' })
  });
  assert.equal(rejected.status, 400);
});

test('hides a deleted document and brings it back for that account only', async () => {
  const owner = await register({
    name: 'Ada Guest',
    email: 'docs-owner-' + Date.now() + '@example.com',
    password: 'password123',
    accountType: 'customer',
    birthDate: '02/02/1991'
  });
  const other = await register({
    name: 'Bea Guest',
    email: 'docs-other-' + Date.now() + '@example.com',
    password: 'password123',
    accountType: 'customer',
    birthDate: '03/03/1992'
  });
  assert.equal(owner.status, 201, owner.data && owner.data.error);
  assert.equal(other.status, 201, other.data && other.data.error);

  const created = await jsonRequest('/api/documents', {
    method: 'POST',
    headers: authHeaders(owner.data.token),
    body: JSON.stringify({
      title: 'Northern lights receipt',
      kind: 'receipt',
      reference: 'NL-44',
      note: 'Tromso stay'
    })
  });
  assert.equal(created.status, 201, created.data && created.data.error);
  assert.equal(created.data.document.userId, undefined);
  assert.equal(created.data.document.deletedAt, null);
  const id = created.data.document.id;

  const listed = await jsonRequest('/api/documents', {
    headers: authHeaders(owner.data.token)
  });
  assert.equal(listed.status, 200);
  assert.equal(listed.data.documents.length, 1);

  const hiddenFromOther = await jsonRequest('/api/documents', {
    headers: authHeaders(other.data.token)
  });
  assert.equal(hiddenFromOther.data.documents.length, 0);

  const removed = await jsonRequest('/api/documents/' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: authHeaders(owner.data.token)
  });
  assert.equal(removed.status, 200);
  assert.ok(removed.data.document.deletedAt);

  const active = await jsonRequest('/api/documents', {
    headers: authHeaders(owner.data.token)
  });
  assert.equal(active.data.documents.length, 0);

  const deleted = await jsonRequest('/api/documents?status=deleted', {
    headers: authHeaders(owner.data.token)
  });
  assert.equal(deleted.data.documents.length, 1);
  assert.equal(deleted.data.documents[0].title, 'Northern lights receipt');

  const stolen = await jsonRequest('/api/documents/' + encodeURIComponent(id) + '/restore', {
    method: 'POST',
    headers: authHeaders(other.data.token)
  });
  assert.equal(stolen.status, 404);

  const restored = await jsonRequest('/api/documents/' + encodeURIComponent(id) + '/restore', {
    method: 'POST',
    headers: authHeaders(owner.data.token)
  });
  assert.equal(restored.status, 200);
  assert.equal(restored.data.document.deletedAt, null);

  const back = await jsonRequest('/api/documents', {
    headers: authHeaders(owner.data.token)
  });
  assert.equal(back.data.documents.length, 1);
  assert.equal(back.data.documents[0].reference, 'NL-44');
});
