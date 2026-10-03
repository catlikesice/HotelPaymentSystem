const { test } = require('node:test');
const assert = require('node:assert/strict');
const DocumentRecords = require('../assets/document-records');
const LocalDocuments = require('../assets/local-documents');

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

test('saves a document without exposing the owner id', () => {
  const record = DocumentRecords.createRecord('guest-1', {
    title: 'Riga stay confirmation',
    kind: 'confirmation',
    reference: 'BH-1001',
    note: 'Paid in fiat at checkout.'
  });

  assert.equal(record.userId, 'guest-1');
  assert.equal(record.title, 'Riga stay confirmation');
  assert.equal(record.kind, 'confirmation');
  assert.equal(record.deletedAt, null);
  const published = DocumentRecords.publicDocument(record);
  assert.equal(published.userId, undefined);
  assert.equal(published.reference, 'BH-1001');
  assert.equal(published.deletedAt, null);
});

test('rejects a document without a title or with an unknown type', () => {
  assert.throws(
    () => DocumentRecords.createRecord('guest-1', { title: 'A', kind: 'invoice' }),
    { status: 400 }
  );
  assert.throws(
    () => DocumentRecords.createRecord('guest-1', { title: 'Passport scan', kind: 'passport' }),
    { status: 400 }
  );
  assert.throws(
    () => DocumentRecords.createRecord('', { title: 'Passport scan', kind: 'other' }),
    { status: 401 }
  );
});

test('removing a document keeps it so it can be brought back', () => {
  const storage = memoryStorage();
  const documents = LocalDocuments.create({ storage });
  const saved = documents.create('guest-1', {
    title: 'Hotel invoice',
    kind: 'invoice',
    reference: 'INV-9'
  });

  assert.equal(documents.list('guest-1').length, 1);
  const removed = documents.remove('guest-1', saved.id);
  assert.ok(removed.deletedAt);
  assert.equal(documents.list('guest-1').length, 0);
  assert.equal(documents.list('guest-1', { deleted: true }).length, 1);
  assert.equal(documents.list('guest-2', { deleted: true }).length, 0);

  const restored = documents.restore('guest-1', saved.id);
  assert.equal(restored.deletedAt, null);
  assert.equal(documents.list('guest-1')[0].title, 'Hotel invoice');
  assert.equal(documents.list('guest-1', { deleted: true }).length, 0);
});

test('a second remove or restore leaves the document where it already is', () => {
  const created = DocumentRecords.createRecord('guest-1', {
    title: 'Train itinerary',
    kind: 'itinerary'
  }, { now: new Date('2026-05-01T00:00:00.000Z') });
  const removed = DocumentRecords.softDelete(created, { now: new Date('2026-05-02T00:00:00.000Z') });
  const removedAgain = DocumentRecords.softDelete(removed, { now: new Date('2026-05-03T00:00:00.000Z') });
  assert.equal(removedAgain.deletedAt, '2026-05-02T00:00:00.000Z');

  const restored = DocumentRecords.restore(removed, { now: new Date('2026-05-04T00:00:00.000Z') });
  assert.equal(restored.deletedAt, null);
  assert.equal(restored.updatedAt, '2026-05-04T00:00:00.000Z');
  const restoredAgain = DocumentRecords.restore(restored, { now: new Date('2026-05-05T00:00:00.000Z') });
  assert.equal(restoredAgain.updatedAt, '2026-05-04T00:00:00.000Z');
});
