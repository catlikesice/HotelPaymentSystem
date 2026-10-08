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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
  }

  var PROFILE_PHOTO_MAX = 110000;

  function normalizePhoto(value) {
    if (typeof value !== 'string') {
      fail(400, 'Please upload a JPEG, PNG, WebP, or GIF photo.');
    }
    var photo = value.trim();
    if (!photo) {
      return '';
    }
    if (photo.length > PROFILE_PHOTO_MAX) {
      fail(400, 'That photo is too large. Please choose a smaller image.');
    }
    var match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
    if (!match || match[2].length % 4 !== 0) {
      fail(400, 'Please upload a JPEG, PNG, WebP, or GIF photo.');
    }
    return photo;
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
      birthDate: user.birthDate || '',
      photo: user.photo || '',
      createdAt: user.createdAt
    };
  }

  function bookingDatesApi() {
    if (typeof globalThis !== 'undefined' && globalThis.BookingDates &&
        typeof globalThis.BookingDates.validateBirthDate === 'function') {
      return globalThis.BookingDates;
    }
    if (typeof require === 'function') {
      return require('./booking-dates');
    }
    return null;
  }

  function normalizeBirthDate(value) {
    var text = String(value || '').trim();
    if (!text) {
      return '';
    }
    var dates = bookingDatesApi();
    if (!dates) {
      fail(400, 'Please enter a valid birth date (dd/mm/yyyy).');
    }
    var result = dates.validateBirthDate(text);
    if (!result.ok) {
      fail(400, result.message);
    }
    return result.iso;
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

      var birthDate = accountType === 'business' ? '' : normalizeBirthDate(body.birthDate);

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
        birthDate: birthDate,
        photo: '',
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

    function updateProfile(token, payload) {
      var body = payload || {};
      var hasEmail = Object.prototype.hasOwnProperty.call(body, 'email');
      var hasPhoto = Object.prototype.hasOwnProperty.call(body, 'photo');
      if (!hasEmail && !hasPhoto) {
        fail(400, 'Choose a photo or a new email address.');
      }

      var sessions = readJson(storage, SESSIONS_KEY, {});
      var session = token ? sessions[token] : null;
      if (!session) {
        fail(401, 'Not authenticated.');
      }

      var users = readJson(storage, USERS_KEY, []);
      var index = -1;
      var i;
      for (i = 0; i < users.length; i += 1) {
        if (users[i].id === session.userId) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        fail(401, 'Not authenticated.');
      }

      var photoMessage = '';
      var emailMessage = '';

      if (hasPhoto) {
        var photo = normalizePhoto(body.photo);
        users[index].photo = photo;
        photoMessage = photo ? 'Profile photo saved.' : 'Profile photo removed.';
      }

      if (hasEmail) {
        var email = normalizeEmail(body.email);
        if (!isValidEmail(email)) {
          fail(400, 'Please enter a valid email address.');
        }
        if (email !== users[index].email) {
          var password = String(body.password || '');
          if (!password) {
            fail(400, 'Enter your current password to change your email address.');
          }
          var hashed = hashPassword(password, users[index].passwordSalt);
          if (hashed.hash !== users[index].passwordHash) {
            fail(401, 'Current password is incorrect.');
          }
          if (users.some(function (user) { return user.email === email && user.id !== users[index].id; })) {
            fail(409, 'An account with this email already exists.');
          }
          users[index].email = email;
          emailMessage = 'Email address updated.';
        } else {
          emailMessage = 'Email address is already up to date.';
        }
      }

      try {
        writeJson(storage, USERS_KEY, users);
      } catch (error) {
        fail(400, 'That photo is too large to save on this device. Please choose a smaller image.');
      }

      return {
        message: [photoMessage, emailMessage].filter(Boolean).join(' ') || 'Profile updated.',
        user: publicUser(users[index])
      };
    }

    function clearSessionsForUser(userId) {
      var sessions = readJson(storage, SESSIONS_KEY, {});
      var changed = false;
      Object.keys(sessions).forEach(function (token) {
        if (sessions[token] && sessions[token].userId === userId) {
          delete sessions[token];
          changed = true;
        }
      });
      if (changed) {
        writeJson(storage, SESSIONS_KEY, sessions);
      }
    }

    function resetPassword(payload) {
      var email = normalizeEmail(payload && payload.email);
      var password = String((payload && payload.password) || '');
      if (!isValidEmail(email)) {
        fail(400, 'Please enter a valid email address.');
      }
      if (password.length < 8) {
        fail(400, 'Password must be at least 8 characters.');
      }

      var users = readJson(storage, USERS_KEY, []);
      var index = -1;
      var i;
      for (i = 0; i < users.length; i += 1) {
        if (users[i].email === email) {
          index = i;
          break;
        }
      }

      var message = 'If an account exists for this email, the password has been updated.';
      if (index === -1) {
        hashPassword(password);
        return { message: message, updated: false };
      }

      var hashed = hashPassword(password);
      users[index].passwordSalt = hashed.salt;
      users[index].passwordHash = hashed.hash;
      writeJson(storage, USERS_KEY, users);
      clearSessionsForUser(users[index].id);
      return { message: message, updated: true };
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
      me: me,
      updateProfile: updateProfile,
      resetPassword: resetPassword
    };
  }

  return {
    create: create
  };
});
