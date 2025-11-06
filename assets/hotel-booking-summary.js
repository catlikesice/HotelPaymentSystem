;(function() {
  const STORAGE_KEY = 'balticComfortBooking';
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const LOCALE_FALLBACK = {
    en: 'en-GB',
    ru: 'ru-RU',
    lv: 'lv-LV',
    et: 'et-EE',
    de: 'de-DE'
  };

  function safeGetSessionStorage() {
    try {
      return window.sessionStorage || null;
    } catch (error) {
      console.warn('Session storage unavailable:', error);
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
      console.warn('Unable to parse stored booking details:', error);
      return null;
    }
  }

  function parseISODate(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }

    const [year, month, day] = parts;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function computeNights(details) {
    if (!details) {
      return null;
    }

    if (typeof details.nights === 'number' && Number.isFinite(details.nights) && details.nights > 0) {
      return Math.max(1, Math.round(details.nights));
    }

    const checkInDate = parseISODate(details.checkInDate);
    const checkOutDate = parseISODate(details.checkOutDate);

    if (!checkInDate || !checkOutDate) {
      return null;
    }

    const diff = checkOutDate.getTime() - checkInDate.getTime();
    if (diff <= 0) {
      return null;
    }

    return Math.round(diff / MS_PER_DAY);
  }

  function getDocumentLocale() {
    const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return LOCALE_FALLBACK[lang] || 'en-GB';
  }

  function formatDate(value) {
    const date = parseISODate(value);
    if (!date) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat(getDocumentLocale(), {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.warn('Unable to format date', value, error);
      return null;
    }
  }

  function getNightlyRate(priceEl) {
    if (!priceEl || !priceEl.dataset) {
      return null;
    }

    const value = parseFloat(priceEl.dataset.rateValue || priceEl.dataset.nightlyRate);
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }

    const currency = priceEl.dataset.rateCurrency || 'ETH';
    const decimalsAttr = priceEl.dataset.rateDecimals;
    const decimals = decimalsAttr !== undefined ? parseInt(decimalsAttr, 10) : 2;

    return {
      value,
      currency,
      decimals: Number.isFinite(decimals) ? Math.max(0, Math.min(8, decimals)) : 2
    };
  }

  function formatAmount(amount, decimals) {
    if (!Number.isFinite(amount)) {
      return '';
    }

    const safeDecimals = Number.isFinite(decimals) ? Math.max(0, Math.min(8, decimals)) : 2;

    try {
      return amount.toLocaleString(undefined, {
        minimumFractionDigits: safeDecimals,
        maximumFractionDigits: safeDecimals
      });
    } catch (error) {
      console.warn('Unable to format amount', amount, error);
      return amount.toFixed(safeDecimals);
    }
  }

  function renderSummary() {
    const detailContainer = document.querySelector('.hotel-detail');
    if (!detailContainer) {
      return;
    }

    const priceEl = detailContainer.querySelector('.price');
    const rate = getNightlyRate(priceEl);

    let summaryEl = detailContainer.querySelector('.booking-summary');
    if (!summaryEl) {
      summaryEl = document.createElement('div');
      summaryEl.className = 'booking-summary';
      detailContainer.appendChild(summaryEl);
    } else {
      summaryEl.innerHTML = '';
    }

    const bookingDetails = readBookingDetails();
    const nights = computeNights(bookingDetails) || 1;

    if (!bookingDetails) {
      const message = document.createElement('p');
      message.className = 'booking-summary__notice';
      message.textContent = 'We could not find your booking details. Please return to the booking page to choose your dates.';
      summaryEl.appendChild(message);
      return;
    }

    if (!rate) {
      const message = document.createElement('p');
      message.className = 'booking-summary__notice';
      message.textContent = 'Booking dates saved. Nightly pricing information is unavailable for this property.';
      summaryEl.appendChild(message);
      return;
    }

    const nightsLabel = nights === 1 ? '1 night' : nights + ' nights';
    const formattedCheckIn = formatDate(bookingDetails.checkInDate);
    const formattedCheckOut = formatDate(bookingDetails.checkOutDate);

    if (formattedCheckIn && formattedCheckOut) {
      const datesEl = document.createElement('p');
      datesEl.className = 'booking-summary__dates';
      datesEl.textContent = 'Booked stay: ' + formattedCheckIn + ' – ' + formattedCheckOut + ' (' + nightsLabel + ')';
      summaryEl.appendChild(datesEl);
    } else {
      const nightsEl = document.createElement('p');
      nightsEl.className = 'booking-summary__nights';
      nightsEl.textContent = 'Booked stay length: ' + nightsLabel;
      summaryEl.appendChild(nightsEl);
    }

    const totalAmount = rate.value * nights;
    const totalEl = document.createElement('p');
    totalEl.className = 'booking-summary__total';
    totalEl.textContent = 'Total cost: ' + formatAmount(totalAmount, rate.decimals) + ' ' + rate.currency;
    summaryEl.appendChild(totalEl);

    const reminderEl = document.createElement('p');
    reminderEl.className = 'booking-summary__reminder';
    reminderEl.innerHTML = 'Need to change your dates? <a href="selectlocation.html">Update your booking details.</a>';
    summaryEl.appendChild(reminderEl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSummary, { once: true });
  } else {
    renderSummary();
  }
})();

