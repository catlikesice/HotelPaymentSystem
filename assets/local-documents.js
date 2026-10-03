(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./document-records'));
  } else {
    root.LocalDocuments = factory(root.DocumentRecords);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (DocumentRecords) {
  'use strict';

  var DOCUMENTS_KEY = 'bh_local_documents';

  function fail(status, message) {
    var err = new Error(message);
    err.status = status;
    throw err;
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

    function allDocuments() {
      var list = readJson(storage, DOCUMENTS_KEY, []);
      return Array.isArray(list) ? list : [];
    }

    function sortNewest(list, deleted) {
      return list.slice().sort(function (left, right) {
        var leftKey = deleted ? (left.deletedAt || left.updatedAt) : (left.updatedAt || left.createdAt);
        var rightKey = deleted ? (right.deletedAt || right.updatedAt) : (right.updatedAt || right.createdAt);
        var leftTime = Date.parse(leftKey || '') || 0;
        var rightTime = Date.parse(rightKey || '') || 0;
        return rightTime - leftTime;
      });
    }

    function ownedIndex(userId, documentId) {
      var ownerId = String(userId || '').trim();
      var id = String(documentId || '').trim();
      if (!ownerId) {
        fail(401, 'Not authenticated.');
      }
      var documents = allDocuments();
      var index = -1;
      var i;
      for (i = 0; i < documents.length; i += 1) {
        if (documents[i] && documents[i].id === id && documents[i].userId === ownerId) {
          index = i;
          break;
        }
      }
      return { documents: documents, index: index };
    }

    function list(userId, options) {
      var ownerId = String(userId || '').trim();
      if (!ownerId) {
        fail(401, 'Not authenticated.');
      }
      var deleted = Boolean(options && options.deleted);
      return sortNewest(allDocuments().filter(function (document) {
        if (!document || document.userId !== ownerId) {
          return false;
        }
        return deleted ? Boolean(document.deletedAt) : !document.deletedAt;
      }), deleted).map(DocumentRecords.publicDocument).filter(Boolean);
    }

    function createDocument(userId, payload) {
      var record = DocumentRecords.createRecord(userId, payload);
      var documents = allDocuments();
      documents.push(record);
      writeJson(storage, DOCUMENTS_KEY, documents);
      return DocumentRecords.publicDocument(record);
    }

    function removeDocument(userId, documentId) {
      var found = ownedIndex(userId, documentId);
      if (found.index === -1) {
        fail(404, 'Document not found.');
      }
      var next = DocumentRecords.softDelete(found.documents[found.index]);
      found.documents[found.index] = next;
      writeJson(storage, DOCUMENTS_KEY, found.documents);
      return DocumentRecords.publicDocument(next);
    }

    function restoreDocument(userId, documentId) {
      var found = ownedIndex(userId, documentId);
      if (found.index === -1) {
        fail(404, 'Document not found.');
      }
      var next = DocumentRecords.restore(found.documents[found.index]);
      found.documents[found.index] = next;
      writeJson(storage, DOCUMENTS_KEY, found.documents);
      return DocumentRecords.publicDocument(next);
    }

    return {
      list: list,
      create: createDocument,
      remove: removeDocument,
      restore: restoreDocument
    };
  }

  return {
    create: create
  };
});
