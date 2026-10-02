;(function() {
  const STORAGE_KEY = 'balticComfortBooking';
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const fallbackRates = {
    ETH: 0.00035,
    BTC: 0.0000058,
    USDT: 1,
    LTC: 0.0105,
    BCH: 0.00235,
    DOGE: 9.5,
    XRP: 1.9,
    XMR: 0.006,
    XNO: 0.95,
    DASH: 0.0335,
    VET: 28,
    UNI: 0.14,
    SOL: 0.0065,
    ADA: 1.3,
    TRN: 5.5,
    EUR: 0.92,
    USD: 1,
    GBP: 0.76,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.86,
    ISK: 137
  };

  function activeRates() {
    if (window.PaymentCurrencies && window.PaymentCurrencies.rates) {
      return window.PaymentCurrencies.rates;
    }
    return fallbackRates;
  }

  function isFiatCurrency(currency) {
    if (window.PaymentCurrencies && typeof window.PaymentCurrencies.isFiat === 'function') {
      return window.PaymentCurrencies.isFiat(currency);
    }
    return currency === 'EUR' || currency === 'USD' || currency === 'GBP' ||
      currency === 'SEK' || currency === 'NOK' || currency === 'DKK' || currency === 'ISK';
  }

  function safeGetSessionStorage() {
    try {
      return window.sessionStorage || null;
    } catch (error) {
      console.warn('Session storage is unavailable:', error);
      return null;
    }
  }

  function readBookingDetails() {
    const storage = safeGetSessionStorage();
    if (!storage) {
      return null;
    }

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Unable to read stored booking details', error);
      return null;
    }
  }

  function computeNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
      return null;
    }

    const checkInParts = checkIn.split('-').map(Number);
    const checkOutParts = checkOut.split('-').map(Number);

    if (
      checkInParts.length !== 3 ||
      checkOutParts.length !== 3 ||
      checkInParts.some(Number.isNaN) ||
      checkOutParts.some(Number.isNaN)
    ) {
      return null;
    }

    const checkInUTC = Date.UTC(checkInParts[0], checkInParts[1] - 1, checkInParts[2]);
    const checkOutUTC = Date.UTC(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2]);
    const diff = checkOutUTC - checkInUTC;

    if (diff <= 0) {
      return null;
    }

    return Math.round(diff / MS_PER_DAY);
  }

  function getStayNights() {
    const booking = readBookingDetails();
    if (!booking) {
      return 1;
    }

    if (typeof booking.nights === 'number' && booking.nights > 0) {
      return Math.max(1, Math.round(booking.nights));
    }

    const derived = computeNights(booking.checkInDate, booking.checkOutDate);
    if (derived && derived > 0) {
      return derived;
    }

    return 1;
  }

  function decimalPlacesFromValue(value) {
    if (value === undefined || value === null) {
      return 2;
    }

    const stringValue = String(value);
    const dotIndex = stringValue.indexOf('.');
    if (dotIndex === -1) {
      return 0;
    }
    return stringValue.length - dotIndex - 1;
  }

  function clampDecimals(decimals) {
    if (!Number.isFinite(decimals)) {
      return 2;
    }
    return Math.max(0, Math.min(6, Math.round(decimals)));
  }

  function formatValue(value, decimals) {
    if (!Number.isFinite(value)) {
      return '';
    }
    return value.toFixed(clampDecimals(decimals));
  }

  function getPerNightPricing(priceEl, currency) {
    if (!priceEl) {
      return null;
    }

    const dataset = priceEl.dataset || {};

    if (currency === 'ETH' && dataset.eth) {
      const value = parseFloat(dataset.eth);
      return Number.isFinite(value) ? { value, decimals: decimalPlacesFromValue(dataset.eth) } : null;
    }

    if (currency === 'BTC' && dataset.btc) {
      const value = parseFloat(dataset.btc);
      return Number.isFinite(value) ? { value, decimals: decimalPlacesFromValue(dataset.btc) } : null;
    }

    if (currency === 'USDT' && dataset.usdt) {
      const value = parseFloat(dataset.usdt);
      return Number.isFinite(value) ? { value, decimals: decimalPlacesFromValue(dataset.usdt) } : null;
    }

    const usdtValue = dataset.usdt ? parseFloat(dataset.usdt) : NaN;
    const rate = activeRates()[currency];

    if (!Number.isFinite(usdtValue) || !Number.isFinite(rate)) {
      return null;
    }

    const perNight = usdtValue * rate;
    const decimals = isFiatCurrency(currency)
      ? (window.PaymentCurrencies && typeof window.PaymentCurrencies.decimalsFor === 'function'
        ? window.PaymentCurrencies.decimalsFor(currency)
        : (rate >= 50 ? 0 : 2))
      : (rate < 0.001 ? 6 : rate < 0.1 ? 4 : 2);
    const factor = Math.pow(10, decimals);
    const rounded = isFiatCurrency(currency)
      ? Math.round((perNight + Number.EPSILON) * factor) / factor
      : perNight;

    return { value: rounded, decimals };
  }

  function selectedCryptoCurrency() {
    const currencySelect = document.getElementById('currency');
    const currency = currencySelect ? currencySelect.value : 'ETH';
    if (!currency || isFiatCurrency(currency)) {
      return 'ETH';
    }
    return currency;
  }

  function selectedFiatCurrency() {
    const fiatSelect = document.getElementById('fiat-currency');
    if (fiatSelect && isFiatCurrency(fiatSelect.value)) {
      return fiatSelect.value;
    }
    if (window.PaymentCurrencies && typeof window.PaymentCurrencies.readFiatPreference === 'function') {
      const saved = window.PaymentCurrencies.readFiatPreference();
      if (saved) {
        return saved;
      }
    }
    return 'EUR';
  }

  function ensureFiatCurrencyOptions() {
    const container = document.querySelector('.currency-selector');
    const currencySelect = document.getElementById('currency');
    if (!container || !currencySelect || !window.PaymentCurrencies || document.getElementById('fiat-currency')) {
      return;
    }

    const catalog = window.PaymentCurrencies;
    const savedCrypto = catalog.readPreference();
    if (savedCrypto && currencySelect.querySelector('option[value="' + savedCrypto + '"]')) {
      currencySelect.value = savedCrypto;
    }
    if (!currencySelect.dataset.cryptoBound) {
      currencySelect.dataset.cryptoBound = 'true';
      currencySelect.addEventListener('change', function () {
        if (!isFiatCurrency(currencySelect.value)) {
          catalog.writePreference(currencySelect.value);
        }
        updatePricesInternal();
      });
    }

    const field = document.createElement('div');
    field.className = 'fiat-currency-field';

    const label = document.createElement('label');
    label.htmlFor = 'fiat-currency';
    label.id = 'fiat-currency-label';
    label.textContent = 'Also pay in:';

    const fiatSelect = document.createElement('select');
    fiatSelect.id = 'fiat-currency';
    fiatSelect.setAttribute('aria-label', 'Fiat currency');
    catalog.appendFiatOptions(fiatSelect);
    fiatSelect.value = catalog.readFiatPreference() || 'EUR';
    fiatSelect.addEventListener('change', function () {
      catalog.writeFiatPreference(fiatSelect.value);
      updatePricesInternal();
    });

    field.appendChild(label);
    field.appendChild(fiatSelect);
    container.appendChild(field);
  }

  function fiatLineFor(priceEl) {
    const next = priceEl.nextElementSibling;
    if (next && next.className && String(next.className).indexOf('price-fiat') !== -1) {
      return next;
    }

    const line = document.createElement('div');
    line.className = 'price-fiat';
    if (typeof priceEl.insertAdjacentElement === 'function') {
      priceEl.insertAdjacentElement('afterend', line);
    } else if (priceEl.parentNode) {
      priceEl.parentNode.appendChild(line);
    }
    return line;
  }

  function ensureStaySummary(nights) {
    const container = document.querySelector('.currency-selector');
    if (!container) {
      return;
    }

    let summaryEl = container.querySelector('[data-stay-duration]');
    if (!summaryEl) {
      summaryEl = document.createElement('p');
      summaryEl.setAttribute('data-stay-duration', 'true');
      summaryEl.style.marginTop = '0.5rem';
      summaryEl.style.fontWeight = 'bold';
      summaryEl.style.color = '#2e4d25';
      summaryEl.style.fontSize = '0.95rem';
      summaryEl.style.textAlign = 'center';
      container.appendChild(summaryEl);
    }

    summaryEl.textContent = nights === 1
      ? 'Rates shown for a 1-night stay.'
      : `Rates shown for a ${nights}-night stay.`;
  }

  function updatePricesInternal() {
    const currency = selectedCryptoCurrency();
    const fiatCurrency = selectedFiatCurrency();
    const nights = getStayNights();

    ensureStaySummary(nights);

    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach(function(priceEl) {
      const pricing = getPerNightPricing(priceEl, currency);
      if (!pricing) {
        return;
      }

      const perNightFormatted = formatValue(pricing.value, pricing.decimals);
      const totalValue = pricing.value * nights;
      const totalFormatted = formatValue(totalValue, pricing.decimals);
      const nightsLabel = nights === 1 ? '1 night' : `${nights} nights`;

      if (nights === 1) {
        priceEl.textContent = `${perNightFormatted} ${currency} / night`;
      } else {
        priceEl.textContent = `${totalFormatted} ${currency} total for ${nightsLabel} (${perNightFormatted} ${currency}/night)`;
      }

      const fiatPricing = getPerNightPricing(priceEl, fiatCurrency);
      if (!fiatPricing) {
        return;
      }
      const fiatPerNight = formatValue(fiatPricing.value, fiatPricing.decimals);
      const fiatTotal = formatValue(fiatPricing.value * nights, fiatPricing.decimals);
      const fiatLine = fiatLineFor(priceEl);
      if (!fiatLine) {
        return;
      }
      fiatLine.textContent = nights === 1
        ? `or ${fiatPerNight} ${fiatCurrency}`
        : `or ${fiatTotal} ${fiatCurrency} total (${fiatPerNight} ${fiatCurrency}/night)`;
    });
  }

  function initStayPricing() {
    ensureFiatCurrencyOptions();
    updatePricesInternal();
  }

  window.updatePrices = updatePricesInternal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStayPricing, { once: true });
  } else {
    initStayPricing();
  }
})();
