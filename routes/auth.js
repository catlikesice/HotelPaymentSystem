const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const CountryAddress = require('../assets/country-address');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');
  }
}

function readJson(filePath, fallback) {
  try {
    ensureDataStore();
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataStore();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password, salt) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { salt: usedSalt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const left = Buffer.from(hash, 'hex');
  const right = Buffer.from(expectedHash, 'hex');
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
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

function isValidWebsite(value) {
  if (!value) {
    return true;
  }
  try {
    const withProtocol = /^(https?:)?\/\//i.test(value) ? value : 'https://' + value;
    const url = new URL(withProtocol);
    return Boolean(url.hostname && url.hostname.includes('.'));
  } catch (error) {
    return false;
  }
}

function createSession(userId) {
  const sessions = readJson(SESSIONS_FILE, {});
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = {
    userId,
    createdAt: new Date().toISOString()
  };
  writeJson(SESSIONS_FILE, sessions);
  return token;
}

function getTokenFromRequest(req) {
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return '';
}

function findUserByToken(token) {
  if (!token) {
    return null;
  }
  const sessions = readJson(SESSIONS_FILE, {});
  const session = sessions[token];
  if (!session) {
    return null;
  }
  const users = readJson(USERS_FILE, []);
  return users.find((user) => user.id === session.userId) || null;
}

router.post('/register', authLimiter, (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const accountType = body.accountType === 'business' ? 'business' : 'customer';
  const companyName = String(body.companyName || '').trim();
  const businessType = String(body.businessType || '').trim();
  const phone = String(body.phone || '').trim();
  const vatId = String(body.vatId || '').trim();
  const website = String(body.website || '').trim();
  const country = String(body.country || '').trim();
  let city = String(body.city || '').trim();
  let address = body.address && typeof body.address === 'object' ? body.address : null;
  let addressFormatted = String(body.addressFormatted || '').trim();

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (accountType === 'business' && (!companyName || companyName.length < 2)) {
    return res.status(400).json({ error: 'Please enter your company name (at least 2 characters).' });
  }
  if (accountType === 'business' && !businessType) {
    return res.status(400).json({ error: 'Please select a business type.' });
  }
  if (!isValidWebsite(website)) {
    return res.status(400).json({ error: 'Please enter a valid website URL.' });
  }
  if (accountType === 'business') {
    const addressResult = CountryAddress.validateAddress(country, address || {}, { companyName });
    if (!addressResult.ok) {
      return res.status(400).json({ error: addressResult.message });
    }
    city = addressResult.values.city || city;
    address = addressResult.values;
    addressFormatted = addressResult.formatted;
  }

  const users = readJson(USERS_FILE, []);
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    accountType,
    companyName,
    businessType,
    phone,
    vatId,
    website,
    country,
    city,
    address,
    addressFormatted,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJson(USERS_FILE, users);

  const token = createSession(user.id);
  return res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: publicUser(user)
  });
});

router.post('/login', authLimiter, (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  const password = String((req.body && req.body.password) || '');

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readJson(USERS_FILE, []);
  const user = users.find((entry) => entry.email === email);
  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createSession(user.id);
  return res.json({
    message: 'Logged in successfully.',
    token,
    user: publicUser(user)
  });
});

router.get('/me', (req, res) => {
  const user = findUserByToken(getTokenFromRequest(req));
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  const token = getTokenFromRequest(req);
  if (token) {
    const sessions = readJson(SESSIONS_FILE, {});
    if (sessions[token]) {
      delete sessions[token];
      writeJson(SESSIONS_FILE, sessions);
    }
  }
  return res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
