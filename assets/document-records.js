(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DocumentRecords = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KINDS = {
    confirmation: 'Confirmation',
    invoice: 'Invoice',
    receipt: 'Receipt',
    itinerary: 'Itinerary',
    other: 'Other'
  };

  function fail(status, message) {
    var err = new Error(message);
    err.status = status;
    throw err;
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
    return 'document-' + randomHex(16);
  }

  function cleanLine(value, maxLength) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength || 180);
  }

  function optionalBlock(value, maxLength, longMessage) {
    var text = String(value || '').replace(/\r\n/g, '\n').trim();
    if (!text) {
      return '';
    }
    if (text.length > maxLength) {
      fail(400, longMessage);
    }
    return text;
  }

  function timestamp(now) {
    var date = now instanceof Date ? now : new Date();
    return date.toISOString();
  }

  function requireRecord(record) {
    var current = record || {};
    if (!String(current.id || '').trim() || !String(current.userId || '').trim()) {
      fail(404, 'Document not found.');
    }
    return current;
  }

  function buildRecord(ownerId, input, now) {
    var body = input || {};
    var owner = String(ownerId || '').trim();
    if (!owner) {
      fail(401, 'Not authenticated.');
    }

    var title = cleanLine(body.title, 160);
    if (title.length < 2) {
      fail(400, 'Please enter a document title (at least 2 characters).');
    }

    var kind = cleanLine(body.kind, 40) || 'other';
    if (!KINDS[kind]) {
      fail(400, 'Please select the type of document.');
    }

    var reference = cleanLine(body.reference, 80);
    var note = optionalBlock(body.note, 800, 'The note must be 800 characters or fewer.');
    var when = timestamp(now);

    return {
      userId: owner,
      title: title,
      kind: kind,
      reference: reference,
      note: note,
      updatedAt: when,
      deletedAt: null
    };
  }

  function createRecord(userId, input, options) {
    var opts = options || {};
    var record = buildRecord(userId, input, opts.now);
    record.id = randomId();
    record.createdAt = record.updatedAt;
    return record;
  }

  function softDelete(existing, options) {
    var current = requireRecord(existing);
    if (current.deletedAt) {
      return current;
    }
    var opts = options || {};
    var when = timestamp(opts.now);
    var next = Object.assign({}, current);
    next.deletedAt = when;
    next.updatedAt = when;
    return next;
  }

  function restore(existing, options) {
    var current = requireRecord(existing);
    if (!current.deletedAt) {
      return current;
    }
    var opts = options || {};
    var next = Object.assign({}, current);
    next.deletedAt = null;
    next.updatedAt = timestamp(opts.now);
    return next;
  }

  function publicDocument(record) {
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      title: record.title,
      kind: record.kind,
      reference: record.reference || '',
      note: record.note || '',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt || record.createdAt,
      deletedAt: record.deletedAt || null
    };
  }

  function kindLabel(value) {
    return KINDS[value] || value || '';
  }

  return {
    KINDS: KINDS,
    createRecord: createRecord,
    softDelete: softDelete,
    restore: restore,
    publicDocument: publicDocument,
    kindLabel: kindLabel
  };
});
