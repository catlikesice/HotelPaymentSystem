;(function() {
  const STORAGE_KEY = 'balticComfortBooking';
  const PENDING_CHECKOUT_KEY = 'bh_pending_checkout';
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
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

  function parseGuestCount(value, min, max, fallback) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function formatGuestSummary(details) {
    if (!details) {
      return '';
    }

    const adults = parseGuestCount(details.adults, 0, 20, NaN);
    const children = parseGuestCount(details.children, 0, 10, NaN);
    const parts = [];

    if (Number.isFinite(adults) && adults > 0) {
      parts.push(adults === 1 ? '1 adult' : adults + ' adults');
    }
    if (Number.isFinite(children) && children > 0) {
      parts.push(children === 1 ? '1 child' : children + ' children');
    } else if (Number.isFinite(children) && children === 0 && parts.length) {
      parts.push('no children');
    }

    if (!parts.length && typeof details.guests === 'number' && details.guests > 0) {
      parts.push(details.guests === 1 ? '1 guest' : details.guests + ' guests');
    }

    return parts.join(', ');
  }

  function formatDate(value) {
    if (window.BookingDates && typeof window.BookingDates.toEuropean === 'function') {
      return window.BookingDates.toEuropean(value) || null;
    }
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : null;
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

  function selectedFiatCurrency(detailContainer) {
    const select = (detailContainer && detailContainer.querySelector('#fiat-currency')) || document.getElementById('fiat-currency');
    const catalog = window.PaymentCurrencies;
    const fromSelect = select && select.value;
    if (fromSelect && catalog && catalog.isFiat(fromSelect)) {
      return catalog.find(fromSelect).code;
    }
    if (catalog && typeof catalog.readFiatPreference === 'function') {
      const saved = catalog.readFiatPreference();
      if (saved) {
        return saved;
      }
    }
    return 'EUR';
  }

  function moneyFromBase(amount, baseCurrency, baseDecimals, targetCurrency) {
    const catalog = window.PaymentCurrencies;
    if (!catalog || !targetCurrency || targetCurrency === baseCurrency) {
      return {
        value: amount,
        currency: baseCurrency,
        decimals: baseDecimals,
        kind: catalog && catalog.isFiat(baseCurrency) ? 'fiat' : 'crypto'
      };
    }
    const converted = catalog.convert(amount, baseCurrency, targetCurrency);
    if (!converted) {
      return {
        value: amount,
        currency: baseCurrency,
        decimals: baseDecimals,
        kind: 'crypto'
      };
    }
    return converted;
  }

  function ensurePaymentSelector(detailContainer) {
    if (!detailContainer || detailContainer.querySelector('#fiat-currency') || !window.PaymentCurrencies) {
      return;
    }

    const catalog = window.PaymentCurrencies;
    const summaryEl = detailContainer.querySelector('.booking-summary');
    const anchor = summaryEl || detailContainer.querySelector('.confirm-button');
    const wrapper = document.createElement('div');
    wrapper.className = 'payment-currency';

    const label = document.createElement('label');
    label.htmlFor = 'fiat-currency';
    label.id = 'fiat-currency-label';
    label.textContent = 'Also pay in';

    const select = document.createElement('select');
    select.id = 'fiat-currency';
    select.setAttribute('aria-label', 'Fiat currency');
    select.appendChild(catalog.optionGroup('Fiat', catalog.fiat));

    const preferred = catalog.readFiatPreference();
    if (preferred) {
      select.value = preferred;
    }

    select.addEventListener('change', function () {
      catalog.writeFiatPreference(select.value);
      renderSummary(detailContainer);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    if (anchor) {
      detailContainer.insertBefore(wrapper, anchor);
    } else {
      detailContainer.appendChild(wrapper);
    }
  }

  function refreshOptionLabels(detailContainer) {
    if (!detailContainer) {
      return;
    }

    const fiatCode = selectedFiatCurrency(detailContainer);

    detailContainer.querySelectorAll('input[name="roomOption"]').forEach(function (input) {
      const base = parseFloat(input.dataset.baseAmount || input.dataset.nightlyRate);
      if (!Number.isFinite(base)) {
        return;
      }
      const baseCurrency = input.dataset.baseCurrency || input.dataset.currency || 'ETH';
      const baseDecimals = toSafeDecimals(input.dataset.baseDecimals || input.dataset.decimals, 2);
      const fiat = moneyFromBase(base, baseCurrency, baseDecimals, fiatCode);
      const details = input.parentElement;
      const rateDiv = details && details.querySelector('.room-option__rate');
      if (rateDiv) {
        rateDiv.textContent = formatAmount(base, baseDecimals) + ' ' + baseCurrency + ' / night';
      }
      if (details) {
        let fiatDiv = details.querySelector('.room-option__fiat');
        if (!fiatDiv) {
          fiatDiv = document.createElement('div');
          fiatDiv.className = 'room-option__fiat';
          if (rateDiv && rateDiv.nextSibling) {
            details.insertBefore(fiatDiv, rateDiv.nextSibling);
          } else {
            details.appendChild(fiatDiv);
          }
        }
        fiatDiv.textContent = 'or ' + formatAmount(fiat.value, fiat.decimals) + ' ' + fiat.currency + ' / night';
      }
    });

    detailContainer.querySelectorAll('input[name="addonOption"]').forEach(function (input) {
      const base = parseFloat(input.dataset.baseAmount || input.dataset.price);
      if (!Number.isFinite(base)) {
        return;
      }
      const baseCurrency = input.dataset.baseCurrency || input.dataset.currency || 'ETH';
      const baseDecimals = toSafeDecimals(input.dataset.baseDecimals || input.dataset.decimals, 2);
      const fiat = moneyFromBase(base, baseCurrency, baseDecimals, fiatCode);
      const billing = (input.dataset.billing || '').toLowerCase() === 'per-night' ? ' / night' : ' per stay';
      const details = input.parentElement;
      const rateDiv = details && details.querySelector('.addon-option__rate');
      if (rateDiv) {
        rateDiv.textContent = '+' + formatAmount(base, baseDecimals) + ' ' + baseCurrency + billing;
      }
      if (details) {
        let fiatDiv = details.querySelector('.addon-option__fiat');
        if (!fiatDiv) {
          fiatDiv = document.createElement('div');
          fiatDiv.className = 'addon-option__fiat';
          if (rateDiv && rateDiv.nextSibling) {
            details.insertBefore(fiatDiv, rateDiv.nextSibling);
          } else {
            details.appendChild(fiatDiv);
          }
        }
        fiatDiv.textContent = 'or +' + formatAmount(fiat.value, fiat.decimals) + ' ' + fiat.currency + billing;
      }
    });
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
      input.dataset.baseAmount = String(nightlyRate);
      input.dataset.baseCurrency = currency;
      input.dataset.baseDecimals = String(decimals);
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
      input.dataset.baseAmount = String(price);
      input.dataset.baseCurrency = currency;
      input.dataset.baseDecimals = String(decimals);
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

    captureListPrice(priceEl);

    if (config && insertionPoint) {
      createRoomOptions(detailContainer, config, priceEl, insertionPoint);
      createAddOnOptions(detailContainer, config, priceEl, insertionPoint);
    }
    ensurePaymentSelector(detailContainer);
  }

  function captureListPrice(priceEl) {
    if (!priceEl || !priceEl.dataset || priceEl.dataset.listAmount) {
      return;
    }
    const value = priceEl.dataset.rateValue || priceEl.dataset.nightlyRate;
    if (!value) {
      return;
    }
    priceEl.dataset.listAmount = value;
    priceEl.dataset.listCurrency = priceEl.dataset.rateCurrency || priceEl.dataset.currency || 'ETH';
    priceEl.dataset.listDecimals = priceEl.dataset.rateDecimals || priceEl.dataset.decimals || '2';
  }

  function showConvertedPrice(priceEl, baseAmount, baseCurrency, baseDecimals, detailContainer) {
    priceEl.dataset.rateValue = String(baseAmount);
    priceEl.dataset.rateCurrency = baseCurrency;
    priceEl.dataset.rateDecimals = String(baseDecimals);
    priceEl.textContent = formatAmount(baseAmount, baseDecimals) + ' ' + baseCurrency + ' / night';

    const fiat = moneyFromBase(baseAmount, baseCurrency, baseDecimals, selectedFiatCurrency(detailContainer));
    let fiatEl = priceEl.nextElementSibling;
    if (!fiatEl || !fiatEl.className || String(fiatEl.className).indexOf('price-fiat') === -1) {
      fiatEl = document.createElement('div');
      fiatEl.className = 'price-fiat';
      if (typeof priceEl.insertAdjacentElement === 'function') {
        priceEl.insertAdjacentElement('afterend', fiatEl);
      }
    }
    fiatEl.textContent = 'or ' + formatAmount(fiat.value, fiat.decimals) + ' ' + fiat.currency + ' / night';
    return {
      value: baseAmount,
      currency: baseCurrency,
      decimals: baseDecimals,
      kind: 'crypto'
    };
  }

  function getSelectedRoom(detailContainer, priceEl) {
    if (!detailContainer) {
      return null;
    }

    const selectedInput = detailContainer.querySelector('input[name="roomOption"]:checked');
    if (!selectedInput) {
      return null;
    }

    const baseRate = parseFloat(selectedInput.dataset.baseAmount || selectedInput.dataset.nightlyRate);
    if (!Number.isFinite(baseRate) || baseRate <= 0) {
      return null;
    }

    const fallbackCurrency = priceEl && priceEl.dataset ? (priceEl.dataset.baseCurrency || priceEl.dataset.rateCurrency) : null;
    const baseCurrency = selectedInput.dataset.baseCurrency || selectedInput.dataset.currency || fallbackCurrency || 'ETH';
    const fallbackDecimals = priceEl && priceEl.dataset ? priceEl.dataset.rateDecimals : null;
    const baseDecimals = toSafeDecimals(
      selectedInput.dataset.baseDecimals || selectedInput.dataset.decimals,
      toSafeDecimals(fallbackDecimals, 2)
    );
    const money = moneyFromBase(baseRate, baseCurrency, baseDecimals, baseCurrency);
    const label = selectedInput.dataset.label || selectedInput.getAttribute('aria-label') || selectedInput.value || 'Selected room';

    return {
      id: selectedInput.value || label,
      label,
      baseRate: baseRate,
      baseCurrency: baseCurrency,
      baseDecimals: baseDecimals,
      rate: money.value,
      currency: money.currency,
      decimals: money.decimals,
      kind: money.kind
    };
  }

  function getSelectedAddOns(detailContainer, expectedCurrency, expectedDecimals) {
    if (!detailContainer) {
      return [];
    }

    return Array.from(detailContainer.querySelectorAll('input[name="addonOption"]:checked'))
      .map(function(input) {
        const basePrice = parseFloat(input.dataset.baseAmount || input.dataset.price);
        if (!Number.isFinite(basePrice) || basePrice <= 0) {
          return null;
        }

        const billingRaw = (input.dataset.billing || '').toLowerCase();
        const billing = billingRaw === 'per-night' ? 'per-night' : 'per-stay';
        const baseCurrency = input.dataset.baseCurrency || input.dataset.currency || expectedCurrency || 'ETH';
        const baseDecimals = toSafeDecimals(input.dataset.baseDecimals || input.dataset.decimals, toSafeDecimals(expectedDecimals, 2));
        const money = moneyFromBase(basePrice, baseCurrency, baseDecimals, baseCurrency);
        const label = input.dataset.label || input.getAttribute('aria-label') || input.value || 'Add-on';

        return {
          id: input.value || label,
          label,
          price: money.value,
          billing,
          currency: money.currency,
          decimals: money.decimals,
          kind: money.kind
        };
      })
      .filter(Boolean);
  }

  function applyRoomRate(priceEl, roomSelection) {
    if (!priceEl || !roomSelection) {
      return;
    }

    const detail = priceEl.closest ? priceEl.closest('.hotel-detail') : document.querySelector('.hotel-detail');
    const baseRate = Number.isFinite(roomSelection.baseRate) ? roomSelection.baseRate : roomSelection.rate;
    const baseCurrency = roomSelection.baseCurrency || roomSelection.currency || 'ETH';
    const baseDecimals = Number.isFinite(roomSelection.baseDecimals) ? roomSelection.baseDecimals : roomSelection.decimals;
    priceEl.dataset.listAmount = String(baseRate);
    priceEl.dataset.listCurrency = baseCurrency;
    priceEl.dataset.listDecimals = String(baseDecimals);
    showConvertedPrice(priceEl, baseRate, baseCurrency, baseDecimals, detail);
  }

  function renderSummary(detailContainer) {
    if (!detailContainer) {
      detailContainer = document.querySelector('.hotel-detail');
    }
    if (!detailContainer) {
      return;
    }

    ensureOptionControls(detailContainer);
    refreshOptionLabels(detailContainer);

    const priceEl = detailContainer.querySelector('.price');
    captureListPrice(priceEl);
    const roomSelection = getSelectedRoom(detailContainer, priceEl);
    if (priceEl && roomSelection) {
      applyRoomRate(priceEl, roomSelection);
    } else if (priceEl && priceEl.dataset.listAmount) {
      showConvertedPrice(
        priceEl,
        parseFloat(priceEl.dataset.listAmount),
        priceEl.dataset.listCurrency || 'ETH',
        toSafeDecimals(priceEl.dataset.listDecimals, 2),
        detailContainer
      );
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
      if (rate) {
        updatePayButtons(
          detailContainer,
          rate.value,
          rate.currency,
          rate.decimals,
          moneyFromBase(rate.value, rate.currency, rate.decimals, selectedFiatCurrency(detailContainer))
        );
      } else {
        updatePayButtons(detailContainer);
      }
      return;
    }

    if (!rate) {
      const message = document.createElement('p');
      message.className = 'booking-summary__notice';
      message.textContent = 'Booking dates saved. Nightly pricing information is unavailable for this property.';
      summaryEl.appendChild(message);
      updatePayButtons(detailContainer);
      const guestLabelWithoutRate = formatGuestSummary(bookingDetails);
      if (guestLabelWithoutRate) {
        const guestsEl = document.createElement('p');
        guestsEl.className = 'booking-summary__guests';
        guestsEl.textContent = 'Guests: ' + guestLabelWithoutRate;
        summaryEl.appendChild(guestsEl);
      }
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

    const guestLabel = formatGuestSummary(bookingDetails);
    if (guestLabel) {
      const guestsEl = document.createElement('p');
      guestsEl.className = 'booking-summary__guests';
      guestsEl.textContent = 'Guests: ' + guestLabel;
      summaryEl.appendChild(guestsEl);
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
    totalEl.textContent = 'Total in crypto: ' + formatAmount(totalAmount, rate.decimals) + ' ' + rate.currency;
    summaryEl.appendChild(totalEl);

    const fiatTotal = moneyFromBase(totalAmount, rate.currency, rate.decimals, selectedFiatCurrency(detailContainer));
    const fiatTotalEl = document.createElement('p');
    fiatTotalEl.className = 'booking-summary__fiat-total';
    fiatTotalEl.textContent = 'Or pay ' + formatAmount(fiatTotal.value, fiatTotal.decimals) + ' ' + fiatTotal.currency + ' in fiat';
    summaryEl.appendChild(fiatTotalEl);
    updatePayButtons(detailContainer, totalAmount, rate.currency, rate.decimals, fiatTotal);

    const reminderEl = document.createElement('p');
    reminderEl.className = 'booking-summary__reminder';
    reminderEl.innerHTML = 'Need to change your dates? <a href="index.html">Update your booking details.</a>';
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

  function inferLocation(detailContainer) {
    const dataset = (detailContainer && detailContainer.dataset) || {};
    const heading = detailContainer ? detailContainer.querySelector('h2') : null;
    const propertyName = (dataset.propertyName || (heading && heading.textContent) || '').replace(/\s+/g, ' ').trim();
    let city = (dataset.city || '').trim();
    let country = (dataset.country || '').trim();
    const path = (window.location.pathname.split('/').pop() || '').toLowerCase();

    if (!city) {
      if (path.indexOf('riga') !== -1) {
        city = 'Riga';
        country = country || 'Latvia';
      } else if (path.indexOf('copenhagen') !== -1) {
        city = 'Copenhagen';
        country = country || 'Denmark';
      }
    }

    return {
      propertyName: propertyName,
      city: city,
      country: country,
      propertyUrl: path
    };
  }

  function computeStayQuote(detailContainer) {
    if (!detailContainer) {
      return null;
    }

    const location = inferLocation(detailContainer);
    const bookingDetails = readBookingDetails() || {};
    const nights = computeNights(bookingDetails) || 0;
    const priceEl = detailContainer.querySelector('.price');
    const roomSelection = getSelectedRoom(detailContainer, priceEl);
    if (priceEl && roomSelection) {
      applyRoomRate(priceEl, roomSelection);
    }
    const rate = getNightlyRate(priceEl);
    const addOns = getSelectedAddOns(
      detailContainer,
      rate ? rate.currency : (roomSelection && roomSelection.currency) || 'ETH',
      rate ? rate.decimals : (roomSelection && roomSelection.decimals) || 2
    );

    let perNightAddOnTotal = 0;
    let perStayAddOnTotal = 0;
    addOns.forEach(function(addOn) {
      if (rate && addOn.currency !== rate.currency) {
        return;
      }
      if (addOn.billing === 'per-night') {
        perNightAddOnTotal += addOn.price;
      } else {
        perStayAddOnTotal += addOn.price;
      }
    });

    const stayNights = nights > 0 ? nights : 1;
    const nightly = rate ? rate.value : 0;
    const totalAmount = (nightly + perNightAddOnTotal) * stayNights + perStayAddOnTotal;

    return {
      kind: 'stay',
      propertyName: location.propertyName,
      city: location.city,
      country: location.country,
      propertyUrl: location.propertyUrl,
      checkInDate: bookingDetails.checkInDate || '',
      checkOutDate: bookingDetails.checkOutDate || '',
      nights: nights,
      guests: {
        adults: parseGuestCount(bookingDetails.adults, 1, 20, 1),
        children: parseGuestCount(bookingDetails.children, 0, 10, 0)
      },
      roomLabel: roomSelection ? roomSelection.label : '',
      addOns: addOns.map(function(addOn) {
        return {
          id: addOn.id,
          label: addOn.label,
          price: addOn.price,
          billing: addOn.billing
        };
      }),
      amount: totalAmount,
      currency: rate ? rate.currency : 'ETH',
      decimals: rate ? rate.decimals : 2,
      paymentMethod: window.PaymentCurrencies
        ? window.PaymentCurrencies.paymentMethodFor(rate ? rate.currency : 'ETH')
        : 'crypto',
      hasDates: nights > 0,
      hasRate: Boolean(rate)
    };
  }

  function persistPendingCheckout(payload) {
    try {
      if (!window.sessionStorage) {
        return false;
      }
      window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('Unable to store checkout details:', error);
      return false;
    }
  }

  function checkoutHref() {
    const path = window.location.pathname || '';
    if (path.indexOf('/assets/') !== -1) {
      return '../checkout.html';
    }
    return 'checkout.html';
  }

  function ensurePayButtons(detailContainer) {
    const cryptoBtn = detailContainer.querySelector('.confirm-button');
    if (!cryptoBtn) {
      return;
    }

    let wrap = detailContainer.querySelector('.pay-actions');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'pay-actions';
      cryptoBtn.parentNode.insertBefore(wrap, cryptoBtn);
      wrap.appendChild(cryptoBtn);
    }

    cryptoBtn.setAttribute('data-pay-kind', 'crypto');
    cryptoBtn.setAttribute('href', checkoutHref());

    let fiatBtn = wrap.querySelector('[data-pay-kind="fiat"]');
    if (!fiatBtn) {
      fiatBtn = document.createElement('a');
      fiatBtn.className = 'confirm-button confirm-button--fiat';
      fiatBtn.setAttribute('data-pay-kind', 'fiat');
      fiatBtn.href = checkoutHref();
      fiatBtn.textContent = 'Pay with fiat';
      wrap.appendChild(fiatBtn);
    }
  }

  function updatePayButtons(detailContainer, cryptoAmount, cryptoCurrency, cryptoDecimals, fiatMoney) {
    if (!detailContainer) {
      return;
    }
    ensurePayButtons(detailContainer);
    const cryptoBtn = detailContainer.querySelector('[data-pay-kind="crypto"]');
    const fiatBtn = detailContainer.querySelector('[data-pay-kind="fiat"]');
    if (cryptoBtn) {
      cryptoBtn.textContent = Number.isFinite(cryptoAmount)
        ? 'Pay ' + formatAmount(cryptoAmount, cryptoDecimals) + ' ' + cryptoCurrency + ' with crypto'
        : 'Pay with crypto';
    }
    if (fiatBtn) {
      fiatBtn.textContent = fiatMoney && Number.isFinite(fiatMoney.value)
        ? 'Pay ' + formatAmount(fiatMoney.value, fiatMoney.decimals) + ' ' + fiatMoney.currency + ' with fiat'
        : 'Pay with fiat';
    }
  }

  function quoteForPayment(quote, payKind) {
    if (!quote || payKind !== 'fiat' || !window.PaymentCurrencies) {
      if (quote) {
        quote.paymentMethod = 'crypto';
      }
      return quote;
    }

    const fiatCode = selectedFiatCurrency(document.querySelector('.hotel-detail'));
    const converted = moneyFromBase(quote.amount, quote.currency, quote.decimals, fiatCode);
    return {
      kind: quote.kind,
      propertyName: quote.propertyName,
      city: quote.city,
      country: quote.country,
      propertyUrl: quote.propertyUrl,
      checkInDate: quote.checkInDate,
      checkOutDate: quote.checkOutDate,
      nights: quote.nights,
      guests: quote.guests,
      roomLabel: quote.roomLabel,
      addOns: (quote.addOns || []).map(function (addOn) {
        const money = moneyFromBase(addOn.price, quote.currency, quote.decimals, fiatCode);
        return {
          id: addOn.id,
          label: addOn.label,
          price: money.value,
          billing: addOn.billing
        };
      }),
      amount: converted.value,
      currency: converted.currency,
      decimals: converted.decimals,
      paymentMethod: 'fiat',
      hasDates: quote.hasDates,
      hasRate: quote.hasRate
    };
  }

  function bindPayNow(detailContainer) {
    if (!detailContainer) {
      return;
    }
    ensurePayButtons(detailContainer);
    detailContainer.querySelectorAll('[data-pay-kind]').forEach(function (button) {
      if (button.getAttribute('data-bound')) {
        return;
      }
      button.setAttribute('data-bound', 'true');
      button.setAttribute('href', checkoutHref());
      button.addEventListener('click', function (event) {
        const quote = quoteForPayment(computeStayQuote(detailContainer), button.getAttribute('data-pay-kind'));
        if (!quote || !quote.propertyName) {
          return;
        }
        persistPendingCheckout(quote);
        event.preventDefault();
        window.location.href = checkoutHref();
      });
    });
  }

  function start() {
    initializeOptionControls();
    renderSummary();
    bindPayNow(document.querySelector('.hotel-detail'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

