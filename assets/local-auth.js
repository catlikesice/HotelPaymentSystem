(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LocalAuth = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var USERS_KEY = 'bh_local_users';
  var SESSIONS_KEY = 'bh_local_sessions';

  function fail(status, message) {
    var err = new Error(message);
    err.status = status;
    throw err;
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function randomHex(bytes) {
    var hex = '';
    var i;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var buf = new Uint8Array(bytes);
      crypto.getRandomValues(buf);
      for (i = 0; i < buf.length; i += 1) {
        hex += ('0' + buf[i].toString(16)).slice(-2);
      }
      return hex;
    }
    for (i = 0; i < bytes; i += 1) {
      hex += ('0' + Math.floor(Math.random() * 256).toString(16)).slice(-2);
    }
    return hex;
  }

  function randomId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'local-' + randomHex(16);
  }

  function hashPassword(password, salt) {
    var usedSalt = salt || randomHex(16);
    var input = usedSalt + '\0' + String(password || '');
    var h1 = 5381;
    var h2 = 52711;
    var round;
    var i;
    for (round = 0; round < 64; round += 1) {
      for (i = 0; i < input.length; i += 1) {
        h1 = Math.imul(h1, 33) ^ input.charCodeAt(i);
        h2 = Math.imul(h2, 33) + input.charCodeAt(i);
      }
      input = usedSalt + h1.toString(16) + h2.toString(16) + input.length;
    }
    return {
      salt: usedSalt,
      hash: (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)
    };
  }

  function publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType || 'customer',
      companyName: user.companyName || '',
      businessType: user.businessType || '',
      phone: user.phone || '',
      vatId: user.vatId || '',
      website: user.website || '',
      country: user.country || '',
      city: user.city || '',
      address: user.address || null,
      addressFormatted: user.addressFormatted || '',
      createdAt: user.createdAt
    };
  }

  function readJson(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function create(options) {
    var storage = (options && options.storage) || {
      getItem: function () { return null; },
      setItem: function () {}
    };

    function register(payload) {
      var body = payload || {};
      var name = String(body.name || '').trim();
      var email = normalizeEmail(body.email);
      var password = String(body.password || '');
      var accountType = body.accountType === 'business' ? 'business' : 'customer';

      if (!name || name.length < 2) {
        fail(400, 'Please enter your full name (at least 2 characters).');
      }
      if (!isValidEmail(email)) {
        fail(400, 'Please enter a valid email address.');
      }
      if (password.length < 8) {
        fail(400, 'Password must be at least 8 characters.');
      }
      if (accountType === 'business' && (!String(body.companyName || '').trim() || String(body.companyName).trim().length < 2)) {
        fail(400, 'Please enter your company name (at least 2 characters).');
      }
      if (accountType === 'business' && !String(body.businessType || '').trim()) {
        fail(400, 'Please select a business type.');
      }

      var users = readJson(storage, USERS_KEY, []);
      if (users.some(function (user) { return user.email === email; })) {
        fail(409, 'An account with this email already exists.');
      }

      var hashed = hashPassword(password);
      var user = {
        id: randomId(),
        name: name,
        email: email,
        accountType: accountType,
        companyName: String(body.companyName || '').trim(),
        businessType: String(body.businessType || '').trim(),
        phone: String(body.phone || '').trim(),
        vatId: String(body.vatId || '').trim(),
        website: String(body.website || '').trim(),
        country: String(body.country || '').trim(),
        city: String(body.city || '').trim(),
        address: body.address && typeof body.address === 'object' ? body.address : null,
        addressFormatted: String(body.addressFormatted || '').trim(),
        passwordSalt: hashed.salt,
        passwordHash: hashed.hash,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      writeJson(storage, USERS_KEY, users);

      var token = 'local.' + randomHex(24);
      var sessions = readJson(storage, SESSIONS_KEY, {});
      sessions[token] = { userId: user.id, createdAt: user.createdAt };
      writeJson(storage, SESSIONS_KEY, sessions);

      return {
        message: 'Account created successfully.',
        token: token,
        user: publicUser(user)
      };
    }

    function login(payload) {
      var email = normalizeEmail(payload && payload.email);
      var password = String((payload && payload.password) || '');
      if (!isValidEmail(email) || !password) {
        fail(400, 'Email and password are required.');
      }
      var users = readJson(storage, USERS_KEY, []);
      var user = users.find(function (entry) { return entry.email === email; });
      if (!user) {
        fail(401, 'Invalid email or password.');
      }
      var hashed = hashPassword(password, user.passwordSalt);
      if (hashed.hash !== user.passwordHash) {
        fail(401, 'Invalid email or password.');
      }
      var token = 'local.' + randomHex(24);
      var sessions = readJson(storage, SESSIONS_KEY, {});
      sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
      writeJson(storage, SESSIONS_KEY, sessions);
      return {
        message: 'Logged in successfully.',
        token: token,
        user: publicUser(user)
      };
    }

    function logout(token) {
      if (!token) {
        return { message: 'Logged out successfully.' };
      }
      var sessions = readJson(storage, SESSIONS_KEY, {});
      if (sessions[token]) {
        delete sessions[token];
        writeJson(storage, SESSIONS_KEY, sessions);
      }
      return { message: 'Logged out successfully.' };
    }

    function me(token) {
      if (!token) {
        return null;
      }
      var sessions = readJson(storage, SESSIONS_KEY, {});
      var session = sessions[token];
      if (!session) {
        return null;
      }
      var users = readJson(storage, USERS_KEY, []);
      var user = users.find(function (entry) { return entry.id === session.userId; });
      return user ? { user: publicUser(user) } : null;
    }

    return {
      register: register,
      login: login,
      logout: logout,
      me: me
    };
  }

  return {
    create: create
  };
});
