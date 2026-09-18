const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const LocalAuth = require('../assets/local-auth');

function memoryStorage() {
  const store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
}

test('creates a guest account locally and logs back in', () => {
  const auth = LocalAuth.create({ storage: memoryStorage() });
  const created = auth.register({
    name: 'Oliver Mark Killington',
    email: 'catlikesice.8h88m@passmail.net',
    password: 'password12345'
  });

  assert.equal(created.user.name, 'Oliver Mark Killington');
  assert.equal(created.user.email, 'catlikesice.8h88m@passmail.net');
  assert.equal(created.user.accountType, 'customer');
  assert.match(created.token, /^local\./);
  assert.equal(created.user.passwordHash, undefined);

  const session = auth.me(created.token);
  assert.equal(session.user.email, created.user.email);

  const login = auth.login({
    email: 'catlikesice.8h88m@passmail.net',
    password: 'password12345'
  });
  assert.equal(login.user.name, 'Oliver Mark Killington');
});

test('rejects duplicate local emails and wrong passwords', () => {
  const auth = LocalAuth.create({ storage: memoryStorage() });
  auth.register({
    name: 'Ada Guest',
    email: 'ada@example.com',
    password: 'password123'
  });

  assert.throws(
    () => auth.register({ name: 'Other', email: 'ada@example.com', password: 'password123' }),
    { status: 409 }
  );
  assert.throws(
    () => auth.login({ email: 'ada@example.com', password: 'wrong-password' }),
    { status: 401 }
  );
});

test('auth-client falls back to local accounts when the API is missing', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'assets/auth-client.js'), 'utf8');
  assert.match(source, /shouldUseLocalFallback/);
  assert.match(source, /localAccounts\.register/);
  assert.match(source, /assets\/local-auth\.js|window\.LocalAuth/);
});

test('register pages load the local account helper', () => {
  ['personal-register.html', 'login.html', 'account.html', 'index.html'].forEach((fileName) => {
    const html = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
    assert.match(html, /assets\/local-auth\.js/, fileName + ' should load local-auth.js');
  });
});
