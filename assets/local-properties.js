(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./property-records'));
  } else {
    root.LocalProperties = factory(root.PropertyRecords);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (PropertyRecords) {
  'use strict';

  var PROPERTIES_KEY = 'bh_local_properties';

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

    function allProperties() {
      var list = readJson(storage, PROPERTIES_KEY, []);
      return Array.isArray(list) ? list : [];
    }

    function sortNewest(list) {
      return list.slice().sort(function (left, right) {
        var leftTime = Date.parse(left.updatedAt || left.createdAt || '') || 0;
        var rightTime = Date.parse(right.updatedAt || right.createdAt || '') || 0;
        return rightTime - leftTime;
      });
    }

    function list(userId) {
      var ownerId = String(userId || '').trim();
      if (!ownerId) {
        fail(401, 'Not authenticated.');
      }
      return sortNewest(allProperties().filter(function (property) {
        return property && property.userId === ownerId;
      })).map(PropertyRecords.publicProperty).filter(Boolean);
    }

    function createProperty(userId, payload) {
      var record = PropertyRecords.createRecord(userId, payload);
      var properties = allProperties();
      properties.push(record);
      writeJson(storage, PROPERTIES_KEY, properties);
      return PropertyRecords.publicProperty(record);
    }

    function updateProperty(userId, propertyId, payload) {
      var ownerId = String(userId || '').trim();
      var id = String(propertyId || '').trim();
      var properties = allProperties();
      var index = -1;
      var i;
      for (i = 0; i < properties.length; i += 1) {
        if (properties[i] && properties[i].id === id && properties[i].userId === ownerId) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        fail(404, 'Accommodation location not found.');
      }
      var next = PropertyRecords.updateRecord(properties[index], payload);
      properties[index] = next;
      writeJson(storage, PROPERTIES_KEY, properties);
      return PropertyRecords.publicProperty(next);
    }

    function removeProperty(userId, propertyId) {
      var ownerId = String(userId || '').trim();
      var id = String(propertyId || '').trim();
      if (!ownerId) {
        fail(401, 'Not authenticated.');
      }
      var properties = allProperties();
      var next = properties.filter(function (property) {
        return !(property && property.id === id && property.userId === ownerId);
      });
      if (next.length === properties.length) {
        fail(404, 'Accommodation location not found.');
      }
      writeJson(storage, PROPERTIES_KEY, next);
      return { ok: true };
    }

    return {
      list: list,
      create: createProperty,
      update: updateProperty,
      remove: removeProperty
    };
  }

  return {
    create: create
  };
});
