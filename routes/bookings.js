const express = require('express');
const fs = require('fs');
const path = require('path');
const BookingRecords = require('../assets/booking-records');

const router = express.Router();

const DATA_DIR = process.env.AUTH_DATA_DIR
  ? path.resolve(process.env.AUTH_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, '[]', 'utf8');
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

function allBookings() {
  const list = readJson(BOOKINGS_FILE, []);
  return Array.isArray(list) ? list : [];
}

function existingCodes() {
  const used = {};
  allBookings().forEach((booking) => {
    if (booking && booking.confirmationCode) {
      used[booking.confirmationCode] = true;
    }
  });
  return used;
}

function bookingsForUser(userId) {
  return allBookings()
    .filter((booking) => booking && booking.userId === userId)
    .map(BookingRecords.publicBooking)
    .filter(Boolean)
    .sort((left, right) => {
      const leftDate = BookingRecords.bookingDate(left);
      const rightDate = BookingRecords.bookingDate(right);
      const leftTime = leftDate ? leftDate.getTime() : 0;
      const rightTime = rightDate ? rightDate.getTime() : 0;
      return leftTime - rightTime;
    });
}

router.get('/', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  return res.json({ bookings: bookingsForUser(user.id) });
});

router.post('/', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  try {
    const record = BookingRecords.createRecord(user.id, req.body || {}, {
      existingCodes: existingCodes()
    });
    const bookings = allBookings();
    bookings.push(record);
    writeJson(BOOKINGS_FILE, bookings);
    return res.status(201).json({ booking: BookingRecords.publicBooking(record) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to save booking.' });
  }
});

module.exports = router;
