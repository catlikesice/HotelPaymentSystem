(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.PaymentCurrencies = api;
  } else if (root) {
    root.PaymentCurrencies = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var PREFERENCE_KEY = 'bh_payment_currency';
  var FIAT_PREFERENCE_KEY = 'bh_fiat_currency';

  // perUsdt is how many units of this currency equal 1 USDT.
  // USDT prices on the site are treated as US dollars.
  // Crypto rates match the existing stay-pricing table.
  var CRYPTO = [
    { code: 'ETH', label: 'ETH (Ethereum)', perUsdt: 0.00035 },
    { code: 'BTC', label: 'BTC (Bitcoin)', perUsdt: 0.0000058 },
    { code: 'USDT', label: 'USDT (Tether)', perUsdt: 1 },
    { code: 'LTC', label: 'LTC (Litecoin)', perUsdt: 0.0105 },
    { code: 'BCH', label: 'BCH (Bitcoin Cash)', perUsdt: 0.00235 },
    { code: 'DOGE', label: 'DOGE (Dogecoin)', perUsdt: 9.5 },
    { code: 'XRP', label: 'XRP', perUsdt: 1.9 },
    { code: 'XMR', label: 'XMR (Monero)', perUsdt: 0.006 },
    { code: 'XNO', label: 'XNO (Nano)', perUsdt: 0.95 },
    { code: 'DASH', label: 'DASH', perUsdt: 0.0335 },
    { code: 'VET', label: 'VET (Vechain)', perUsdt: 28 },
    { code: 'UNI', label: 'UNI (Uniswap)', perUsdt: 0.14 },
    { code: 'SOL', label: 'SOL (Solana)', perUsdt: 0.0065 },
    { code: 'ADA', label: 'ADA (Cardano)', perUsdt: 1.3 },
    { code: 'TRN', label: 'TRN (Tron)', perUsdt: 5.5 }
  ];

  var FIAT = [
    { code: 'EUR', label: 'EUR (Euro)', perUsdt: 0.92 },
    { code: 'USD', label: 'USD (US Dollar)', perUsdt: 1 },
    { code: 'GBP', label: 'GBP (British Pound)', perUsdt: 0.76 },
    { code: 'SEK', label: 'SEK (Swedish Krona)', perUsdt: 10.5 },
    { code: 'NOK', label: 'NOK (Norwegian Krone)', perUsdt: 10.7 },
    { code: 'DKK', label: 'DKK (Danish Krone)', perUsdt: 6.86 },
    { code: 'ISK', label: 'ISK (Icelandic Króna)', perUsdt: 137 }
  ];

  var byCode = {};
  CRYPTO.forEach(function (entry) {
    byCode[entry.code] = Object.assign({ kind: 'crypto' }, entry);
  });
  FIAT.forEach(function (entry) {
    byCode[entry.code] = Object.assign({ kind: 'fiat' }, entry);
  });

  Object.keys(byCode).forEach(function (code) {
    byCode[code].decimals = decimalsFor(byCode[code]);
  });

  var rates = {};
  Object.keys(byCode).forEach(function (code) {
    rates[code] = byCode[code].perUsdt;
  });

  function decimalsFor(entry) {
    if (!entry) {
      return 2;
    }
    if (entry.kind === 'fiat') {
      return entry.perUsdt >= 50 ? 0 : 2;
    }
    if (entry.perUsdt < 0.001) {
      return 6;
    }
    if (entry.perUsdt < 0.1) {
      return 4;
    }
    return 2;
  }

  function find(code) {
    if (!code) {
      return null;
    }
    return byCode[String(code).trim().toUpperCase()] || null;
  }

  function isFiat(code) {
    var entry = find(code);
    return Boolean(entry && entry.kind === 'fiat');
  }

  function roundTo(value, decimals) {
    var places = Number.isFinite(decimals) ? decimals : 2;
    var factor = Math.pow(10, places);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function convert(amount, fromCode, toCode) {
    var from = find(fromCode);
    var to = find(toCode);
    var numeric = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!from || !to || !Number.isFinite(numeric)) {
      return null;
    }
    if (from.code === to.code) {
      return {
        value: numeric,
        currency: to.code,
        decimals: to.decimals,
        kind: to.kind,
        label: to.label
      };
    }
    var usdt = numeric / from.perUsdt;
    var value = roundTo(usdt * to.perUsdt, to.decimals);
    return {
      value: value,
      currency: to.code,
      decimals: to.decimals,
      kind: to.kind,
      label: to.label
    };
  }

  function optionGroup(label, entries) {
    var group = document.createElement('optgroup');
    group.label = label;
    entries.forEach(function (entry) {
      var option = document.createElement('option');
      option.value = entry.code;
      option.textContent = entry.label;
      group.appendChild(option);
    });
    return group;
  }

  function appendFiatOptions(selectEl) {
    if (!selectEl || selectEl.querySelector('option[value="EUR"]')) {
      return;
    }
    selectEl.appendChild(optionGroup('Fiat', FIAT));
  }

  function storageGet(key) {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return '';
      }
      return window.sessionStorage.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function storageSet(key, value) {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return;
      }
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      // Preference is optional; pricing still works for this page view.
    }
  }

  function readPreference() {
    var entry = find(storageGet(PREFERENCE_KEY));
    if (!entry || entry.kind === 'fiat') {
      return '';
    }
    return entry.code;
  }

  function writePreference(code) {
    var entry = find(code);
    if (!entry || entry.kind === 'fiat') {
      return;
    }
    storageSet(PREFERENCE_KEY, entry.code);
  }

  function readFiatPreference() {
    var entry = find(storageGet(FIAT_PREFERENCE_KEY));
    if (entry && entry.kind === 'fiat') {
      return entry.code;
    }
    var legacy = find(storageGet(PREFERENCE_KEY));
    return legacy && legacy.kind === 'fiat' ? legacy.code : '';
  }

  function writeFiatPreference(code) {
    var entry = find(code);
    if (!entry || entry.kind !== 'fiat') {
      return;
    }
    storageSet(FIAT_PREFERENCE_KEY, entry.code);
  }

  function paymentMethodFor(code) {
    return isFiat(code) ? 'fiat' : 'crypto';
  }

  return {
    PREFERENCE_KEY: PREFERENCE_KEY,
    FIAT_PREFERENCE_KEY: FIAT_PREFERENCE_KEY,
    crypto: CRYPTO.map(function (entry) { return byCode[entry.code]; }),
    fiat: FIAT.map(function (entry) { return byCode[entry.code]; }),
    rates: rates,
    find: find,
    isFiat: isFiat,
    decimalsFor: function (code) {
      var entry = find(code);
      return entry ? entry.decimals : 2;
    },
    convert: convert,
    optionGroup: optionGroup,
    appendFiatOptions: appendFiatOptions,
    readPreference: readPreference,
    writePreference: writePreference,
    readFiatPreference: readFiatPreference,
    writeFiatPreference: writeFiatPreference,
    paymentMethodFor: paymentMethodFor
  };
});
