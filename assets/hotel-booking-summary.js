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
  const optionsConfigCache = new WeakMap();

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

  function toSafeDecimals(value, fallback) {
    const numeric = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isFinite(numeric)) {
      return Number.isFinite(fallback) ? Math.max(0, Math.min(8, fallback)) : 2;
    }
    return Math.max(0, Math.min(8, numeric));
  }

  function getBaseCurrency(priceEl) {
    if (!priceEl || !priceEl.dataset) {
      return 'ETH';
    }
    return priceEl.dataset.rateCurrency || priceEl.dataset.currency || 'ETH';
  }

  function getBaseDecimals(priceEl) {
    if (!priceEl || !priceEl.dataset) {
      return 2;
    }
    return toSafeDecimals(priceEl.dataset.rateDecimals || priceEl.dataset.decimals, 2);
  }

  function readOptionsConfig(detailContainer) {
    if (!detailContainer) {
      return null;
    }

    if (optionsConfigCache.has(detailContainer)) {
      return optionsConfigCache.get(detailContainer);
    }

    const scriptSelector = [
      'script[type="application/json"][data-hotel-config]',
      'script[type="application/json"][data-room-config]',
      'script[type="application/json"].hotel-room-config'
    ].join(', ');

    const scriptEl = detailContainer.querySelector(scriptSelector);
    if (!scriptEl) {
      optionsConfigCache.set(detailContainer, null);
      return null;
    }

    try {
      const raw = (scriptEl.textContent || '').trim();
      if (!raw) {
        optionsConfigCache.set(detailContainer, null);
        return null;
      }
      const parsed = JSON.parse(raw);
      optionsConfigCache.set(detailContainer, parsed);
      return parsed;
    } catch (error) {
      console.warn('Unable to parse hotel options config:', error);
      optionsConfigCache.set(detailContainer, null);
      return null;
    }
  }

  function createRoomOptions(detailContainer, config, priceEl, insertionPoint) {
    const rooms = Array.isArray(config && config.rooms)
      ? config.rooms
      : Array.isArray(config && config.roomOptions)
        ? config.roomOptions
        : [];

    if (!rooms.length || detailContainer.querySelector('.room-options')) {
      return;
    }

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'room-options';

    const legend = document.createElement('legend');
    legend.textContent = config.roomLegend || config.roomsLegend || 'Choose your room type';
    fieldset.appendChild(legend);

    const baseCurrency = getBaseCurrency(priceEl);
    const baseDecimals = getBaseDecimals(priceEl);
    const hasValidExplicitDefault = rooms.some(function(room) {
      if (!room) {
        return false;
      }
      const rate = parseFloat(room.nightlyRate);
      return Number.isFinite(rate) && rate > 0 && room.default;
    });
    let defaultAssigned = false;
    let hasValidOption = false;

    rooms.forEach(function(room, index) {
      if (!room) {
        return;
      }

      const nightlyRate = parseFloat(room.nightlyRate);
      if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) {
        return;
      }

      const currency = room.currency || baseCurrency;
      const decimals = toSafeDecimals(room.decimals, baseDecimals);
      const labelText = room.label || 'Room option';

      const labelEl = document.createElement('label');
      labelEl.className = 'room-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'roomOption';
      input.value = room.id || 'room-' + index;
      input.dataset.label = labelText;
      input.dataset.nightlyRate = String(nightlyRate);
      input.dataset.currency = currency;
      input.dataset.decimals = String(decimals);
      input.setAttribute('aria-label', labelText);

      if (!defaultAssigned) {
        if (room.default) {
          input.checked = true;
          defaultAssigned = true;
        } else if (!hasValidExplicitDefault) {
          input.checked = true;
          defaultAssigned = true;
        }
      }

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'room-option__details';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'room-option__title';
      titleDiv.textContent = labelText;
      detailsDiv.appendChild(titleDiv);

      const rateDiv = document.createElement('div');
      rateDiv.className = 'room-option__rate';
      rateDiv.textContent = formatAmount(nightlyRate, decimals) + ' ' + currency + ' / night';
      detailsDiv.appendChild(rateDiv);

      if (room.description) {
        const descP = document.createElement('p');
        descP.className = 'room-option__description';
        descP.textContent = room.description;
        detailsDiv.appendChild(descP);
      }

      labelEl.appendChild(input);
      labelEl.appendChild(detailsDiv);
      fieldset.appendChild(labelEl);
      hasValidOption = true;
    });

    if (hasValidOption) {
      detailContainer.insertBefore(fieldset, insertionPoint);
    }
  }

  function createAddOnOptions(detailContainer, config, priceEl, insertionPoint) {
    const addOns = Array.isArray(config && config.addons)
      ? config.addons
      : Array.isArray(config && config.addOns)
        ? config.addOns
        : [];

    if (!addOns.length || detailContainer.querySelector('.addon-options')) {
      return;
    }

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'addon-options';

    const legend = document.createElement('legend');
    legend.textContent = config.addonLegend || config.addOnsLegend || 'Enhance your stay';
    fieldset.appendChild(legend);

    const baseCurrency = getBaseCurrency(priceEl);
    const baseDecimals = getBaseDecimals(priceEl);
    let hasValidAddOn = false;

    addOns.forEach(function(addOn, index) {
      if (!addOn) {
        return;
      }

      const price = parseFloat(addOn.price);
      if (!Number.isFinite(price) || price <= 0) {
        return;
      }

      const billing = (addOn.billing || '').toLowerCase() === 'per-night' ? 'per-night' : 'per-stay';
      const currency = addOn.currency || baseCurrency;
      const decimals = toSafeDecimals(addOn.decimals, baseDecimals);
      const labelText = addOn.label || 'Add-on';

      const labelEl = document.createElement('label');
      labelEl.className = 'addon-option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'addonOption';
      input.value = addOn.id || 'addon-' + index;
      input.dataset.label = labelText;
      input.dataset.price = String(price);
      input.dataset.billing = billing;
      input.dataset.currency = currency;
      input.dataset.decimals = String(decimals);
      input.setAttribute('aria-label', labelText);
      if (addOn.preselected) {
        input.checked = true;
      }

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'addon-option__details';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'addon-option__title';
      titleDiv.textContent = labelText;
      detailsDiv.appendChild(titleDiv);

      const rateDiv = document.createElement('div');
      rateDiv.className = 'addon-option__rate';
      const unitLabel = billing === 'per-night' ? ' / night' : ' per stay';
      rateDiv.textContent = '+' + formatAmount(price, decimals) + ' ' + currency + unitLabel;
      detailsDiv.appendChild(rateDiv);

      if (addOn.description) {
        const descP = document.createElement('p');
        descP.className = 'addon-option__description';
        descP.textContent = addOn.description;
        detailsDiv.appendChild(descP);
      }

      labelEl.appendChild(input);
      labelEl.appendChild(detailsDiv);
      fieldset.appendChild(labelEl);
      hasValidAddOn = true;
    });

    if (hasValidAddOn) {
      detailContainer.insertBefore(fieldset, insertionPoint);
    }
  }

  function ensureOptionControls(detailContainer) {
    if (!detailContainer) {
      return;
    }

    const priceEl = detailContainer.querySelector('.price');
    const summaryEl = detailContainer.querySelector('.booking-summary');
    const fallbackAnchor = detailContainer.querySelector('.confirm-button') || detailContainer.lastElementChild;
    const insertionPoint = summaryEl || fallbackAnchor;
    const config = readOptionsConfig(detailContainer);

    if (!config || !insertionPoint) {
      return;
    }

    createRoomOptions(detailContainer, config, priceEl, insertionPoint);
    createAddOnOptions(detailContainer, config, priceEl, insertionPoint);
  }

  function getSelectedRoom(detailContainer, priceEl) {
    if (!detailContainer) {
      return null;
    }

    const selectedInput = detailContainer.querySelector('input[name="roomOption"]:checked');
    if (!selectedInput) {
      return null;
    }

    const nightlyRate = parseFloat(selectedInput.dataset.nightlyRate);
    if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) {
      return null;
    }

    const fallbackCurrency = priceEl && priceEl.dataset ? priceEl.dataset.rateCurrency : null;
    const currency = selectedInput.dataset.currency || fallbackCurrency || 'ETH';
    const fallbackDecimals = priceEl && priceEl.dataset ? priceEl.dataset.rateDecimals : null;
    const decimals = toSafeDecimals(selectedInput.dataset.decimals, toSafeDecimals(fallbackDecimals, 2));
    const label = selectedInput.dataset.label || selectedInput.getAttribute('aria-label') || selectedInput.value || 'Selected room';

    return {
      id: selectedInput.value || label,
      label,
      rate: nightlyRate,
      currency,
      decimals
    };
  }

  function getSelectedAddOns(detailContainer, expectedCurrency, expectedDecimals) {
    if (!detailContainer) {
      return [];
    }

    return Array.from(detailContainer.querySelectorAll('input[name="addonOption"]:checked'))
      .map(function(input) {
        const price = parseFloat(input.dataset.price);
        if (!Number.isFinite(price) || price <= 0) {
          return null;
        }

        const billingRaw = (input.dataset.billing || '').toLowerCase();
        const billing = billingRaw === 'per-night' ? 'per-night' : 'per-stay';
        const currency = input.dataset.currency || expectedCurrency || 'ETH';
        const decimals = toSafeDecimals(input.dataset.decimals, toSafeDecimals(expectedDecimals, 2));
        const label = input.dataset.label || input.getAttribute('aria-label') || input.value || 'Add-on';

        return {
          id: input.value || label,
          label,
          price,
          billing,
          currency,
          decimals
        };
      })
      .filter(Boolean);
  }

  function applyRoomRate(priceEl, roomSelection) {
    if (!priceEl || !roomSelection) {
      return;
    }

    priceEl.dataset.rateValue = String(roomSelection.rate);
    priceEl.dataset.rateCurrency = roomSelection.currency;
    priceEl.dataset.rateDecimals = String(roomSelection.decimals);
    priceEl.textContent = formatAmount(roomSelection.rate, roomSelection.decimals) + ' ' + roomSelection.currency + ' / night';
  }

  function renderSummary(detailContainer) {
    if (!detailContainer) {
      detailContainer = document.querySelector('.hotel-detail');
    }
    if (!detailContainer) {
      return;
    }

    ensureOptionControls(detailContainer);

    const priceEl = detailContainer.querySelector('.price');
    const roomSelection = getSelectedRoom(detailContainer, priceEl);
    if (priceEl && roomSelection) {
      applyRoomRate(priceEl, roomSelection);
    }
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

    if (roomSelection) {
      const roomEl = document.createElement('p');
      roomEl.className = 'booking-summary__room';
      roomEl.textContent = 'Room: ' + roomSelection.label + ' – ' + formatAmount(rate.value, rate.decimals) + ' ' + rate.currency + ' / night';
      summaryEl.appendChild(roomEl);
    }

    const addOnSelections = getSelectedAddOns(detailContainer, rate.currency, rate.decimals);
    var perNightAddOnTotal = 0;
    var perStayAddOnTotal = 0;
    var displayableAddOns = [];

    addOnSelections.forEach(function(addOn) {
      if (addOn.currency !== rate.currency) {
        console.warn('Skipping add-on due to currency mismatch:', addOn);
        return;
      }

      displayableAddOns.push(addOn);
      if (addOn.billing === 'per-night') {
        perNightAddOnTotal += addOn.price;
      } else {
        perStayAddOnTotal += addOn.price;
      }
    });

    if (perNightAddOnTotal > 0) {
      const nightlyEnhancementsEl = document.createElement('p');
      nightlyEnhancementsEl.className = 'booking-summary__addons-nightly';
      nightlyEnhancementsEl.textContent = 'Nightly enhancements: +' + formatAmount(perNightAddOnTotal, rate.decimals) + ' ' + rate.currency + ' / night';
      summaryEl.appendChild(nightlyEnhancementsEl);
    }

    if (perStayAddOnTotal > 0) {
      const stayEnhancementsEl = document.createElement('p');
      stayEnhancementsEl.className = 'booking-summary__addons-stay';
      stayEnhancementsEl.textContent = 'Per-stay enhancements: +' + formatAmount(perStayAddOnTotal, rate.decimals) + ' ' + rate.currency + ' per stay';
      summaryEl.appendChild(stayEnhancementsEl);
    }

    if (displayableAddOns.length) {
      const addOnHeading = document.createElement('p');
      addOnHeading.className = 'booking-summary__addons-heading';
      addOnHeading.textContent = 'Selected add-ons:';
      summaryEl.appendChild(addOnHeading);

      const addOnList = document.createElement('ul');
      addOnList.className = 'booking-summary__addons-list';
      displayableAddOns.forEach(function(addOn) {
        const unitLabel = addOn.billing === 'per-night' ? ' / night' : ' per stay';
        const listItem = document.createElement('li');
        listItem.textContent = addOn.label + ' (+' + formatAmount(addOn.price, addOn.decimals) + ' ' + addOn.currency + unitLabel + ')';
        addOnList.appendChild(listItem);
      });
      summaryEl.appendChild(addOnList);
    }

    const nightlyTotal = rate.value + perNightAddOnTotal;
    if (perNightAddOnTotal > 0) {
      const nightlyTotalEl = document.createElement('p');
      nightlyTotalEl.className = 'booking-summary__nightly-total';
      nightlyTotalEl.textContent = 'Nightly total: ' + formatAmount(nightlyTotal, rate.decimals) + ' ' + rate.currency;
      summaryEl.appendChild(nightlyTotalEl);
    }

    const totalAmount = nightlyTotal * nights + perStayAddOnTotal;
    const totalEl = document.createElement('p');
    totalEl.className = 'booking-summary__total';
    totalEl.textContent = 'Total cost: ' + formatAmount(totalAmount, rate.decimals) + ' ' + rate.currency;
    summaryEl.appendChild(totalEl);

    const reminderEl = document.createElement('p');
    reminderEl.className = 'booking-summary__reminder';
    reminderEl.innerHTML = 'Need to change your dates? <a href="selectlocation.html">Update your booking details.</a>';
    summaryEl.appendChild(reminderEl);
  }

  function initializeOptionControls() {
    const detailContainer = document.querySelector('.hotel-detail');
    if (!detailContainer) {
      return;
    }

    ensureOptionControls(detailContainer);

    const priceEl = detailContainer.querySelector('.price');
    const initialRoom = getSelectedRoom(detailContainer, priceEl);
    if (initialRoom && priceEl) {
      applyRoomRate(priceEl, initialRoom);
    }

    const roomInputs = detailContainer.querySelectorAll('input[name="roomOption"]');
    roomInputs.forEach(function(input) {
      input.addEventListener('change', function() {
        const selection = getSelectedRoom(detailContainer, priceEl);
        if (selection && priceEl) {
          applyRoomRate(priceEl, selection);
        }
        renderSummary(detailContainer);
      });
    });

    const addonInputs = detailContainer.querySelectorAll('input[name="addonOption"]');
    addonInputs.forEach(function(input) {
      input.addEventListener('change', function() {
        renderSummary(detailContainer);
      });
    });
  }

  function start() {
    initializeOptionControls();
    renderSummary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

