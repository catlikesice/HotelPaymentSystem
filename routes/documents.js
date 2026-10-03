const express = require('express');
const fs = require('fs');
const path = require('path');
const DocumentRecords = require('../assets/document-records');

const router = express.Router();

const DATA_DIR = process.env.AUTH_DATA_DIR
  ? path.resolve(process.env.AUTH_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCUMENTS_FILE)) {
    fs.writeFileSync(DOCUMENTS_FILE, '[]', 'utf8');
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

function allDocuments() {
  const list = readJson(DOCUMENTS_FILE, []);
  return Array.isArray(list) ? list : [];
}

function sortNewest(list, deleted) {
  return list.slice().sort((left, right) => {
    const leftKey = deleted ? (left.deletedAt || left.updatedAt) : (left.updatedAt || left.createdAt);
    const rightKey = deleted ? (right.deletedAt || right.updatedAt) : (right.updatedAt || right.createdAt);
    const leftTime = Date.parse(leftKey || '') || 0;
    const rightTime = Date.parse(rightKey || '') || 0;
    return rightTime - leftTime;
  });
}

function documentsForUser(userId, deleted) {
  return sortNewest(allDocuments().filter((document) => {
    if (!document || document.userId !== userId) {
      return false;
    }
    return deleted ? Boolean(document.deletedAt) : !document.deletedAt;
  }), deleted)
    .map(DocumentRecords.publicDocument)
    .filter(Boolean);
}

function findOwned(userId, documentId) {
  const id = String(documentId || '').trim();
  const documents = allDocuments();
  const index = documents.findIndex((document) => document && document.id === id && document.userId === userId);
  return { documents, index };
}

function wantsDeleted(req) {
  return String(req.query.status || '').trim().toLowerCase() === 'deleted';
}

router.get('/', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  return res.json({ documents: documentsForUser(user.id, wantsDeleted(req)) });
});

router.post('/', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  try {
    const record = DocumentRecords.createRecord(user.id, req.body || {});
    const documents = allDocuments();
    documents.push(record);
    writeJson(DOCUMENTS_FILE, documents);
    return res.status(201).json({ document: DocumentRecords.publicDocument(record) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to save the document.' });
  }
});

router.delete('/:id', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const found = findOwned(user.id, req.params.id);
  if (found.index === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  try {
    const next = DocumentRecords.softDelete(found.documents[found.index]);
    found.documents[found.index] = next;
    writeJson(DOCUMENTS_FILE, found.documents);
    return res.json({ document: DocumentRecords.publicDocument(next) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to remove the document.' });
  }
});

router.post('/:id/restore', (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }

  const found = findOwned(user.id, req.params.id);
  if (found.index === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  try {
    const next = DocumentRecords.restore(found.documents[found.index]);
    found.documents[found.index] = next;
    writeJson(DOCUMENTS_FILE, found.documents);
    return res.json({ document: DocumentRecords.publicDocument(next) });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Unable to bring the document back.' });
  }
});

module.exports = router;
