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

test('stores a personal birth date and rejects a future one', () => {
  const auth = LocalAuth.create({ storage: memoryStorage() });
  const created = auth.register({
    name: 'Ada Guest',
    email: 'ada-birth@example.com',
    password: 'password123',
    birthDate: '15/03/1990'
  });

  assert.equal(created.user.birthDate, '1990-03-15');
  assert.equal(auth.me(created.token).user.birthDate, '1990-03-15');

  assert.throws(
    () => auth.register({
      name: 'Future Guest',
      email: 'future@example.com',
      password: 'password123',
      birthDate: '01/01/2999'
    }),
    (error) => error.status === 400 && /future/i.test(error.message)
  );
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

test('updates a personal photo and email address', () => {
  const auth = LocalAuth.create({ storage: memoryStorage() });
  const created = auth.register({
    name: 'Ada Guest',
    email: 'ada@example.com',
    password: 'password123'
  });
  auth.register({
    name: 'Other Guest',
    email: 'other@example.com',
    password: 'password123'
  });
  assert.equal(created.user.photo, '');

  const photo = 'data:image/png;base64,' + Buffer.from('photo').toString('base64');
  const withPhoto = auth.updateProfile(created.token, { photo });
  assert.equal(withPhoto.user.photo, photo);
  assert.equal(withPhoto.user.passwordHash, undefined);
  assert.equal(auth.me(created.token).user.photo, photo);

  const renamed = auth.updateProfile(created.token, {
    email: 'Ada.New@example.com',
    password: 'password123'
  });
  assert.equal(renamed.user.email, 'ada.new@example.com');
  assert.equal(renamed.user.photo, photo);
  assert.match(renamed.message, /Email address updated/);

  const login = auth.login({ email: 'ada.new@example.com', password: 'password123' });
  assert.equal(login.user.name, 'Ada Guest');
  assert.throws(
    () => auth.login({ email: 'ada@example.com', password: 'password123' }),
    (error) => error.status === 401
  );

  const same = auth.updateProfile(created.token, { email: 'ada.new@example.com' });
  assert.match(same.message, /already up to date/i);

  assert.throws(
    () => auth.updateProfile(created.token, { email: 'other@example.com', password: 'password123' }),
    (error) => error.status === 409
  );
  assert.throws(
    () => auth.updateProfile(created.token, {
      email: 'ada.other@example.com',
      password: 'wrong-password'
    }),
    (error) => error.status === 401
  );
  assert.equal(auth.me(created.token).user.email, 'ada.new@example.com');
  assert.throws(
    () => auth.updateProfile(created.token, { email: 'ada.other@example.com' }),
    (error) => error.status === 400 && /password/i.test(error.message)
  );

  const cleared = auth.updateProfile(created.token, { photo: '' });
  assert.equal(cleared.user.photo, '');
  assert.match(cleared.message, /removed/i);

  assert.throws(
    () => auth.updateProfile(created.token, { photo: 'data:image/svg+xml;base64,PHN2Zz4=' }),
    (error) => error.status === 400
  );
  assert.throws(
    () => auth.updateProfile('', { email: 'fresh@example.com', password: 'password123' }),
    (error) => error.status === 401
  );
  assert.throws(
    () => auth.updateProfile(created.token, {}),
    (error) => error.status === 400
  );
});

test('auth-client falls back to local accounts when the API is missing', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'assets/auth-client.js'), 'utf8');
  assert.match(source, /shouldUseLocalFallback/);
  assert.match(source, /localAccounts\.register/);
  assert.match(source, /assets\/local-auth\.js|window\.LocalAuth/);
  assert.match(source, /localBookings/);
});

test('register pages load the local account helper', () => {
  ['personal-register.html', 'login.html', 'logout.html', 'account.html', 'index.html'].forEach((fileName) => {
    const html = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');
    assert.match(html, /assets\/local-auth\.js/, fileName + ' should load local-auth.js');
  });
});
