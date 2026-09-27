const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const ContactForm = require('../assets/contact-form');

const router = express.Router();

const DATA_DIR = process.env.CONTACT_DATA_DIR
  ? path.resolve(process.env.CONTACT_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'contact-messages.json');

const contactLimiter = process.env.CONTACT_RATE_LIMIT_DISABLED === '1'
  ? function skipContactLimit(req, res, next) { next(); }
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 8,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: ContactForm.messageFor('rate', 'en'), code: 'rate' }
    });

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, '[]', 'utf8');
  }
}

function readMessages() {
  ensureStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeMessages(messages) {
  ensureStore();
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

router.post('/', contactLimiter, function (req, res) {
  const result = ContactForm.validate(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: ContactForm.messageFor(result.code, 'en'),
      code: result.code
    });
  }

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: result.value.name,
    email: result.value.email,
    category: result.value.category,
    message: result.value.message,
    bookingReference: result.value.bookingReference
  };

  const messages = readMessages();
  messages.push(record);
  writeMessages(messages);

  res.status(201).json({ ok: true, id: record.id });
});

module.exports = router;
