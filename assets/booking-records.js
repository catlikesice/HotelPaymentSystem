(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BookingRecords = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CONFIRMATION_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
    return 'booking-' + randomHex(16);
  }

  function generateConfirmationCode(existingCodes) {
    var used = existingCodes || {};
    var attempt;
    for (attempt = 0; attempt < 25; attempt += 1) {
      var code = 'BH-';
      var i;
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        var buf = new Uint8Array(6);
        crypto.getRandomValues(buf);
        for (i = 0; i < 6; i += 1) {
          code += CONFIRMATION_ALPHABET[buf[i] % CONFIRMATION_ALPHABET.length];
        }
      } else {
        for (i = 0; i < 6; i += 1) {
          code += CONFIRMATION_ALPHABET[Math.floor(Math.random() * CONFIRMATION_ALPHABET.length)];
        }
      }
      if (!used[code]) {
        return code;
      }
    }
    return 'BH-' + randomHex(4).toUpperCase();
  }

  function parseISODate(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }
    var match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function nightsBetween(checkIn, checkOut) {
    var start = parseISODate(checkIn);
    var end = parseISODate(checkOut);
    if (!start || !end) {
      return null;
    }
    var diff = end.getTime() - start.getTime();
    if (diff <= 0) {
      return null;
    }
    return Math.round(diff / (24 * 60 * 60 * 1000));
  }

  function cleanText(value, maxLength) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return '';
    }
    return text.slice(0, maxLength || 180);
  }

  function parseGuests(input) {
    var adults = parseInt(input && input.adults, 10);
    var children = parseInt(input && input.children, 10);
    if (!Number.isFinite(adults) || adults < 1) {
      adults = 1;
    }
    if (!Number.isFinite(children) || children < 0) {
      children = 0;
    }
    return {
      adults: Math.min(20, adults),
      children: Math.min(10, children)
    };
  }

  function parseAddOns(list) {
    if (!Array.isArray(list)) {
      return [];
    }
    return list.slice(0, 12).map(function (item) {
      if (!item || typeof item !== 'object') {
        return null;
      }
      var label = cleanText(item.label, 120);
      var price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
      if (!label || !Number.isFinite(price) || price < 0) {
        return null;
      }
      return {
        id: cleanText(item.id, 80) || label,
        label: label,
        price: price,
        billing: item.billing === 'per-night' ? 'per-night' : 'per-stay'
      };
    }).filter(Boolean);
  }

  function createRecord(userId, input, options) {
    var body = input || {};
    var opts = options || {};
    var ownerId = String(userId || '').trim();
    if (!ownerId) {
      fail(401, 'Not authenticated.');
    }

    var kind = body.kind === 'event' ? 'event' : 'stay';
    var city = cleanText(body.city, 80);
    var country = cleanText(body.country, 80);
    var currency = cleanText(body.currency, 8).toUpperCase() || 'ETH';
    var amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount);
    var now = opts.now instanceof Date ? opts.now : new Date();

    if (!city) {
      fail(400, 'Please include the city for this booking.');
    }
    if (!Number.isFinite(amount) || amount < 0) {
      fail(400, 'Please include a valid payment amount.');
    }

    var record = {
      id: randomId(),
      userId: ownerId,
      kind: kind,
      confirmationCode: generateConfirmationCode(opts.existingCodes || {}),
      status: 'confirmed',
      paymentStatus: 'paid',
      city: city,
      country: country,
      amount: amount,
      currency: currency,
      createdAt: now.toISOString()
    };

    if (kind === 'stay') {
      var propertyName = cleanText(body.propertyName, 160);
      var checkInDate = cleanText(body.checkInDate, 10);
      var checkOutDate = cleanText(body.checkOutDate, 10);
      var nights = nightsBetween(checkInDate, checkOutDate);
      if (!propertyName) {
        fail(400, 'Please include the accommodation name.');
      }
      if (!nights) {
        fail(400, 'Please choose valid check-in and check-out dates.');
      }
      record.propertyName = propertyName;
      record.propertyUrl = cleanText(body.propertyUrl, 180);
      record.checkInDate = checkInDate;
      record.checkOutDate = checkOutDate;
      record.nights = nights;
      record.guests = parseGuests(body.guests);
      record.roomLabel = cleanText(body.roomLabel, 120);
      record.addOns = parseAddOns(body.addOns);
    } else {
      var eventName = cleanText(body.eventName, 160);
      var eventDate = cleanText(body.eventDate, 10);
      if (!eventName) {
        fail(400, 'Please include the event name.');
      }
      if (!parseISODate(eventDate)) {
        fail(400, 'Please include a valid event date.');
      }
      record.eventName = eventName;
      record.eventDate = eventDate;
      record.eventTime = cleanText(body.eventTime, 40);
    }

    return record;
  }

  function publicBooking(record) {
    if (!record) {
      return null;
    }
    var booking = {
      id: record.id,
      kind: record.kind,
      confirmationCode: record.confirmationCode,
      status: record.status,
      paymentStatus: record.paymentStatus,
      city: record.city || '',
      country: record.country || '',
      amount: record.amount,
      currency: record.currency,
      createdAt: record.createdAt
    };
    if (record.kind === 'stay') {
      booking.propertyName = record.propertyName;
      booking.propertyUrl = record.propertyUrl || '';
      booking.checkInDate = record.checkInDate;
      booking.checkOutDate = record.checkOutDate;
      booking.nights = record.nights;
      booking.guests = record.guests || { adults: 1, children: 0 };
      booking.roomLabel = record.roomLabel || '';
      booking.addOns = Array.isArray(record.addOns) ? record.addOns : [];
    } else {
      booking.eventName = record.eventName;
      booking.eventDate = record.eventDate;
      booking.eventTime = record.eventTime || '';
    }
    return booking;
  }

  function bookingDate(record) {
    if (!record) {
      return null;
    }
    return parseISODate(record.kind === 'event' ? record.eventDate : record.checkInDate);
  }

  function isUpcoming(record, now) {
    var today = now instanceof Date ? now : new Date();
    var todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (!record) {
      return false;
    }
    if (record.kind === 'event') {
      var eventDate = parseISODate(record.eventDate);
      return eventDate ? eventDate.getTime() >= todayUtc : false;
    }
    var checkOut = parseISODate(record.checkOutDate);
    return checkOut ? checkOut.getTime() >= todayUtc : false;
  }

  return {
    createRecord: createRecord,
    publicBooking: publicBooking,
    parseISODate: parseISODate,
    nightsBetween: nightsBetween,
    generateConfirmationCode: generateConfirmationCode,
    bookingDate: bookingDate,
    isUpcoming: isUpcoming
  };
});
