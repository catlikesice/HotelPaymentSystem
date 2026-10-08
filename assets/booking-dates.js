/**
 * Booking dates use European day/month/year (dd/mm/yyyy) in the UI.
 * Stored and submitted values stay ISO yyyy-mm-dd.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BookingDates = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function isRealDate(year, month, day) {
    if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  function buildISO(year, month, day) {
    if (!isRealDate(year, month, day)) {
      return '';
    }
    return String(year) + '-' + pad(month) + '-' + pad(day);
  }

  function toISO(value) {
    var text = String(value || '').trim();
    var iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      return buildISO(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    }
    var european = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (european) {
      return buildISO(Number(european[3]), Number(european[2]), Number(european[1]));
    }
    return '';
  }

  function toEuropean(value) {
    var iso = toISO(value);
    if (!iso) {
      return '';
    }
    var parts = iso.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function localTodayISO(now) {
    var date = now || new Date();
    return buildISO(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  function latestAdultISO(now) {
    var date = now || new Date();
    var year = date.getFullYear() - 18;
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day > dim) {
      day = dim;
    }
    return buildISO(year, month, day);
  }

  function validateBirthDate(value) {
    var text = String(value || '').trim();
    if (!text) {
      return {
        ok: false,
        empty: true,
        iso: '',
        message: 'Please choose your birth date.'
      };
    }
    var iso = toISO(text);
    if (!iso) {
      return {
        ok: false,
        empty: false,
        iso: '',
        message: 'Please enter a valid birth date (dd/mm/yyyy).'
      };
    }
    var year = Number(iso.slice(0, 4));
    if (year < 1900) {
      return {
        ok: false,
        empty: false,
        iso: '',
        message: 'Please enter a birth year from 1900 onward.'
      };
    }
    if (iso > localTodayISO()) {
      return {
        ok: false,
        empty: false,
        iso: '',
        message: 'Birth date cannot be in the future.'
      };
    }
    if (iso > latestAdultISO()) {
      return {
        ok: false,
        empty: false,
        iso: '',
        message: 'You must be at least 18 years old. Choose an earlier date.'
      };
    }
    return { ok: true, empty: false, iso: iso, message: '' };
  }

  function maskInput(raw) {
    var text = String(raw || '');
    var trimmed = text.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return toEuropean(trimmed) || '';
    }
    if (text.indexOf('/') !== -1) {
      var parts = text.split('/');
      var day = (parts[0] || '').replace(/\D/g, '');
      var month = (parts[1] || '').replace(/\D/g, '');
      var year = (parts.slice(2).join('')).replace(/\D/g, '');
      if (day.length > 2) {
        month = day.slice(2) + month;
        day = day.slice(0, 2);
      }
      if (month.length > 2) {
        year = month.slice(2) + year;
        month = month.slice(0, 2);
      }
      year = year.slice(0, 4);
      var masked = day;
      if (parts.length > 1 || month || year) {
        masked += '/' + month;
      }
      if (parts.length > 2 || year) {
        masked += '/' + year;
      }
      return masked;
    }
    var digits = text.replace(/\D/g, '').slice(0, 8);
    var out = digits.slice(0, 2);
    if (digits.length > 2) {
      out += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      out += '/' + digits.slice(4);
    }
    return out;
  }

  return {
    toISO: toISO,
    toEuropean: toEuropean,
    maskInput: maskInput,
    isRealDate: isRealDate,
    localTodayISO: localTodayISO,
    latestAdultISO: latestAdultISO,
    validateBirthDate: validateBirthDate
  };
});
