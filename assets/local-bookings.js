(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./booking-records'));
  } else {
    root.LocalBookings = factory(root.BookingRecords);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (BookingRecords) {
  'use strict';

  var BOOKINGS_KEY = 'bh_local_bookings';

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

    function allBookings() {
      var list = readJson(storage, BOOKINGS_KEY, []);
      return Array.isArray(list) ? list : [];
    }

    function existingCodes() {
      var used = {};
      allBookings().forEach(function (booking) {
        if (booking && booking.confirmationCode) {
          used[booking.confirmationCode] = true;
        }
      });
      return used;
    }

    function list(userId) {
      var ownerId = String(userId || '').trim();
      if (!ownerId) {
        fail(401, 'Not authenticated.');
      }
      return allBookings()
        .filter(function (booking) { return booking && booking.userId === ownerId; })
        .map(BookingRecords.publicBooking)
        .filter(Boolean)
        .sort(function (left, right) {
          var leftDate = BookingRecords.bookingDate(left);
          var rightDate = BookingRecords.bookingDate(right);
          var leftTime = leftDate ? leftDate.getTime() : 0;
          var rightTime = rightDate ? rightDate.getTime() : 0;
          return leftTime - rightTime;
        });
    }

    function createBooking(userId, payload) {
      var record = BookingRecords.createRecord(userId, payload, {
        existingCodes: existingCodes()
      });
      var bookings = allBookings();
      bookings.push(record);
      writeJson(storage, BOOKINGS_KEY, bookings);
      return BookingRecords.publicBooking(record);
    }

    return {
      list: list,
      create: createBooking
    };
  }

  return {
    create: create
  };
});
