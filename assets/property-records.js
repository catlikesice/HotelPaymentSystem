(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PropertyRecords = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PROPERTY_TYPES = {
    hotel: 'Hotel',
    hostel: 'Hostel',
    guesthouse: 'Guesthouse',
    apartment: 'Apartment',
    cabin: 'Cabin',
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
    return 'property-' + randomHex(16);
  }

  function countryAddressApi() {
    if (typeof globalThis !== 'undefined' && globalThis.CountryAddress &&
        typeof globalThis.CountryAddress.validateAddress === 'function') {
      return globalThis.CountryAddress;
    }
    if (typeof require === 'function') {
      return require('./country-address');
    }
    return null;
  }

  function cleanLine(value, maxLength) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength || 180);
  }

  function cleanBlock(value, maxLength, emptyMessage, longMessage) {
    var text = String(value || '').replace(/\r\n/g, '\n').trim();
    if (!text) {
      fail(400, emptyMessage);
    }
    if (text.length > maxLength) {
      fail(400, longMessage);
    }
    return text;
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

  function isValidWebsite(value) {
    if (!value) {
      return true;
    }
    try {
      var withProtocol = /^(https?:)?\/\//i.test(value) ? value : 'https://' + value;
      var url = new URL(withProtocol);
      return Boolean(url.hostname && url.hostname.includes('.'));
    } catch (error) {
      return false;
    }
  }

  function isValidPhone(value) {
    if (!value) {
      return true;
    }
    return /^[+0-9][0-9\s().-]{5,39}$/.test(value);
  }

  function parseCoordinate(value, min, max, label) {
    var text = String(value == null ? '' : value).trim();
    if (!text) {
      return null;
    }
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      fail(400, 'Please enter a valid ' + label + '.');
    }
    var number = Number(text);
    if (number < min || number > max) {
      fail(400, label.charAt(0).toUpperCase() + label.slice(1) + ' must be between ' + min + ' and ' + max + '.');
    }
    return Math.round(number * 1e6) / 1e6;
  }

  function locationMessage(message) {
    return String(message || '')
      .replace('Please select the country or region of the business address.', 'Please select the country or region where the accommodation is.')
      .replace('Please complete the business address:', 'Please complete the accommodation address:');
  }

  function buildRecord(ownerId, input, now) {
    var body = input || {};
    var owner = String(ownerId || '').trim();
    if (!owner) {
      fail(401, 'Not authenticated.');
    }

    var name = cleanLine(body.name, 160);
    if (name.length < 2) {
      fail(400, 'Please enter the accommodation name (at least 2 characters).');
    }

    var propertyType = cleanLine(body.propertyType, 40);
    if (!PROPERTY_TYPES[propertyType]) {
      fail(400, 'Please select the type of accommodation.');
    }

    var addresses = countryAddressApi();
    if (!addresses) {
      fail(500, 'Address validation is unavailable.');
    }
    var country = cleanLine(body.country, 80);
    var addressResult = addresses.validateAddress(country, body.address || {}, { companyName: name });
    if (!addressResult.ok) {
      fail(400, locationMessage(addressResult.message));
    }

    var directions = cleanBlock(
      body.directions,
      800,
      'Please describe where the accommodation is (at least a short note for guests).',
      'Location details must be 800 characters or fewer.'
    );
    if (directions.length < 8) {
      fail(400, 'Please describe where the accommodation is (at least 8 characters).');
    }

    var description = optionalBlock(
      body.description,
      600,
      'The description must be 600 characters or fewer.'
    );
    var phone = cleanLine(body.phone, 40);
    if (!isValidPhone(phone)) {
      fail(400, 'Please enter a valid phone number.');
    }
    var website = cleanLine(body.website, 180);
    if (!isValidWebsite(website)) {
      fail(400, 'Please enter a valid website URL.');
    }

    var latitude = parseCoordinate(body.latitude, -90, 90, 'latitude');
    var longitude = parseCoordinate(body.longitude, -180, 180, 'longitude');
    if ((latitude == null) !== (longitude == null)) {
      fail(400, 'Please enter both latitude and longitude, or leave both blank.');
    }

    var timestamp = now instanceof Date ? now : new Date();
    return {
      userId: owner,
      name: name,
      propertyType: propertyType,
      country: country,
      city: addressResult.values.city || cleanLine(body.city, 80),
      address: addressResult.values,
      addressFormatted: addressResult.formatted,
      directions: directions,
      description: description,
      phone: phone,
      website: website,
      latitude: latitude,
      longitude: longitude,
      updatedAt: timestamp.toISOString()
    };
  }

  function createRecord(userId, input, options) {
    var opts = options || {};
    var now = opts.now instanceof Date ? opts.now : new Date();
    var record = buildRecord(userId, input, now);
    record.id = randomId();
    record.createdAt = record.updatedAt;
    return record;
  }

  function updateRecord(existing, input, options) {
    var opts = options || {};
    var current = existing || {};
    var ownerId = String(current.userId || '').trim();
    var id = String(current.id || '').trim();
    if (!ownerId || !id) {
      fail(404, 'Accommodation location not found.');
    }
    var now = opts.now instanceof Date ? opts.now : new Date();
    var record = buildRecord(ownerId, input, now);
    record.id = id;
    record.createdAt = current.createdAt || record.updatedAt;
    return record;
  }

  function publicProperty(record) {
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      name: record.name,
      propertyType: record.propertyType,
      country: record.country || '',
      city: record.city || '',
      address: record.address || null,
      addressFormatted: record.addressFormatted || '',
      directions: record.directions || '',
      description: record.description || '',
      phone: record.phone || '',
      website: record.website || '',
      latitude: record.latitude == null ? null : record.latitude,
      longitude: record.longitude == null ? null : record.longitude,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt || record.createdAt
    };
  }

  function typeLabel(value) {
    return PROPERTY_TYPES[value] || value || '';
  }

  return {
    PROPERTY_TYPES: PROPERTY_TYPES,
    createRecord: createRecord,
    updateRecord: updateRecord,
    publicProperty: publicProperty,
    typeLabel: typeLabel
  };
});
