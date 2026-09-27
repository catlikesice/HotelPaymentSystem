const express = require('express');
const fs = require('fs');
const path = require('path');
const PropertyRecords = require('../assets/property-records');

const router = express.Router();

const DATA_DIR = process.env.AUTH_DATA_DIR
  ? path.resolve(process.env.AUTH_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const PROPERTIES_FILE = path.join(DATA_DIR, 'properties.json');

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROPERTIES_FILE)) {
    fs.writeFileSync(PROPERTIES_FILE, '[]', 'utf8');
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

function requireUser(req, res) {
  const user = findUserByToken(getTokenFromRequest(req));
  if (!user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  return user;
}

function requireBusiness(req, res) {
  const user = requireUser(req, res);
  if (!user) {
    return null;
  }
  if (user.accountType !== 'business') {
    res.status(403).json({ error: 'Business accounts can upload accommodation locations.' });
    return null;
  }
  return user;
}

function allProperties() {
  const list = readJson(PROPERTIES_FILE, []);
  return Array.isArray(list) ? list : [];
}

function sortNewest(list) {
  return list.slice().sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || '') || 0;
    const rightTime = Date.parse(right.updatedAt || right.createdAt || '') || 0;
    return rightTime - leftTime;
  });
}

function propertiesForUser(userId) {
  return sortNewest(allProperties().filter((property) => property && property.userId === userId))
    .map(PropertyRecords.publicProperty)
    .filter(Boolean);
}

function findOwned(userId, propertyId) {
  const id = String(propertyId || '').trim();
  const properties = allProperties();
  const index = properties.findIndex((property) => property && property.id === id && property.userId === userId);
  return { properties, index };
}

router.get('/', (req, res) => {
  const user = requireBusiness(req, res);
  if (!user) {
    return;
  }
  return res.json({ properties: propertiesForUser(user.id) });
});

router.post('/', (req, res) => {
  const user = requireBusiness(req, res);
  if (!user) {
    return;
  }

  try {
    const record = PropertyRecords.createRecord(user.id, req.body || {});
    const properties = allProperties();
    properties.push(record);
    writeJson(PROPERTIES_FILE, properties);
    return res.status(201).json({ property: PropertyRecords.publicProperty(record) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to save the accommodation location.' });
  }
});

router.put('/:id', (req, res) => {
  const user = requireBusiness(req, res);
  if (!user) {
    return;
  }

  const found = findOwned(user.id, req.params.id);
  if (found.index === -1) {
    return res.status(404).json({ error: 'Accommodation location not found.' });
  }

  try {
    const next = PropertyRecords.updateRecord(found.properties[found.index], req.body || {});
    found.properties[found.index] = next;
    writeJson(PROPERTIES_FILE, found.properties);
    return res.json({ property: PropertyRecords.publicProperty(next) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to update the accommodation location.' });
  }
});

router.delete('/:id', (req, res) => {
  const user = requireBusiness(req, res);
  if (!user) {
    return;
  }

  const found = findOwned(user.id, req.params.id);
  if (found.index === -1) {
    return res.status(404).json({ error: 'Accommodation location not found.' });
  }
  found.properties.splice(found.index, 1);
  writeJson(PROPERTIES_FILE, found.properties);
  return res.json({ ok: true });
});

module.exports = router;
