/**
 * Trip builder. Selecting a hotel loads add-on upsells from
 * GET /api/hotel-addons/trip (docs/sql/hotel-addons.sql).
 */
(function () {
  var STORAGE_KEY = 'balticComfortBooking';
  var PENDING_CHECKOUT_KEY = 'bh_pending_checkout';
  var SELECTION_KEY = 'bh_trip_selection';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var ICONS = {
    hotel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 20V10.2L12 4l9 6.2V20h-6.2v-5.2H9.2V20H3zm2.2-2h1.8v-3.2h9.9V18H18.8v-6.7L12 6.6 5.2 11.3V18z"/></svg>',
    museum: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2 21 8v1.6H3V8l9-4.8zM5.2 11.2h2.2V18H5.2v-6.8zm3.8 0h2.2V18H9v-6.8zm3.8 0h2.2V18h-2.2v-6.8zm3.8 0H19V18h-2.4v-6.8zM3 19.2h18V21H3v-1.8z"/></svg>',
    waves: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3 8.5c1.6 0 1.6 2 3.4 2s1.8-2 3.6-2 1.8 2 3.6 2 1.8-2 3.6-2 1.8 2 3.4 2M3 14.5c1.6 0 1.6 2 3.4 2s1.8-2 3.6-2 1.8 2 3.6 2 1.8-2 3.6-2 1.8 2 3.4 2"/></svg>',
    bus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3.5h12a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2v1.2a1.3 1.3 0 0 1-2.6 0V18H8.6v1.2a1.3 1.3 0 0 1-2.6 0V18a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2zm0 2v5.2h12V5.5H6zm.4 8.6a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm11.2 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z"/></svg>',
    utensils: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 3.2v7.2a2.2 2.2 0 0 1-1.6 2.1V20h2.2v-7.5A2.2 2.2 0 0 1 7 10.4V3.2H8zm4.2 0h1.8v17.6h-1.8V3.2zm3.2 0c2.4 1.2 3.8 3.4 3.8 6.2 0 2.2-1.2 4-3 4.6V20h-1.8V3.2h1z"/></svg>',
    spa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2c.4 2.2 1.6 3.8 3.6 4.8-2 .6-3.2 2-3.6 4.2-.4-2.2-1.6-3.6-3.6-4.2 2-1 3.2-2.6 3.6-4.8zM5 14.2c2.2.4 3.6 1.6 4.2 3.6-1-.4-2-.4-3.2 0-1.2.4-2 .4-3.2 0 .6-2 2-3.2 4.2-3.6h-2zm9.8 0c2.2.4 3.6 1.6 4.2 3.6-1-.4-2-.4-3.2 0-1.2.4-2 .4-3.2 0 .6-2 2-3.2 4.2-3.6h-2zM4 20.2h16v1.6H4v-1.6z"/></svg>',
    walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 4.6a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0zM8.2 9.2l2.2-.6.8 2.2-2 .8-1-2.4zm3.2 2.4 1.6 3.2-2.2.8-.4 4.2h-2l.6-5.2 2.2-1.2-.6-2.2.8.4zm2.2.2 2.4 1.2.8 4.8h-2l-.6-3.2-1.4-.6-.4 2.2 2.6 1.2-.4 1.6-4.2-1.6.8-3.6 2.4-2z"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 8.2A2.2 2.2 0 0 1 5.2 6h13.6A2.2 2.2 0 0 1 21 8.2v2.2a1.8 1.8 0 0 0 0 3.2v2.2a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 15.8v-2.2a1.8 1.8 0 0 0 0-3.2V8.2zm6.2.6v1.6H11V8.8H9.2zm0 3.2v1.6H11v-1.6H9.2zm0 3.2v1.6H11v-1.6H9.2z"/></svg>'
  };

  var state = {
    offer: null,
    hotelName: '',
    selected: {},
    stay: { checkIn: '', checkOut: '', adults: NaN, children: NaN }
  };

  function appEl() {
    return document.getElementById('trip-app');
  }

  function statusEl() {
    return document.getElementById('trip-status');
  }

  function setStatus(message) {
    var status = statusEl();
    if (status) {
      status.hidden = !message;
      status.textContent = message || '';
    }
  }

  function parseCount(value, min, max) {
    if (value == null || value === '') {
      return NaN;
    }
    var parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return NaN;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function readStoredBooking() {
    try {
      var raw = window.sessionStorage && window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredBooking(stay) {
    try {
      if (!window.sessionStorage) {
        return;
      }
      var stored = readStoredBooking() || {};
      var payload = Object.assign({}, stored, { updatedAt: new Date().toISOString() });
      if (stay.checkIn) payload.checkInDate = stay.checkIn;
      if (stay.checkOut) payload.checkOutDate = stay.checkOut;
      if (Number.isFinite(stay.adults)) payload.adults = stay.adults;
      if (Number.isFinite(stay.children)) payload.children = stay.children;
      if (Number.isFinite(stay.adults) || Number.isFinite(stay.children)) {
        var adults = Number.isFinite(stay.adults) ? stay.adults : 0;
        var children = Number.isFinite(stay.children) ? stay.children : 0;
        payload.guests = adults + children;
      }
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // The trip can still be priced from the query string.
    }
  }

  function readStay() {
    var params = new URLSearchParams(window.location.search);
    var stored = readStoredBooking() || {};
    var stay = {
      checkIn: params.get('checkIn') || stored.checkInDate || '',
      checkOut: params.get('checkOut') || stored.checkOutDate || '',
      adults: parseCount(params.get('adults') != null ? params.get('adults') : stored.adults, 1, 20),
      children: parseCount(params.get('children') != null ? params.get('children') : stored.children, 0, 10)
    };
    if (params.get('checkIn') || params.get('checkOut') || params.get('adults') || params.get('children')) {
      writeStoredBooking(stay);
    }
    return stay;
  }

  function addonKey(addon) {
    return addon.scope + '|' + (addon.hotelName || '') + '|' + addon.id;
  }

  function readSelection() {
    try {
      var raw = window.sessionStorage && window.sessionStorage.getItem(SELECTION_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function writeSelection() {
    try {
      if (!window.sessionStorage || !state.offer) {
        return;
      }
      var saved = readSelection();
      saved[state.offer.city] = {
        hotel: state.hotelName,
        addons: Object.keys(state.selected).filter(function (key) { return state.selected[key]; })
      };
      window.sessionStorage.setItem(SELECTION_KEY, JSON.stringify(saved));
    } catch (error) {
      // Selection still works for this page view.
    }
  }

  function restoreSelection(offer) {
    var saved = readSelection()[offer.city] || {};
    var selected = {};
    (saved.addons || []).forEach(function (key) {
      selected[key] = true;
    });
    state.selected = selected;
    if (saved.hotel && offer.hotels.some(function (hotel) { return hotel.name === saved.hotel; })) {
      var params = new URLSearchParams(window.location.search);
      if (!params.get('hotel')) {
        state.hotelName = saved.hotel;
      }
    }
  }

  function parseISO(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) {
      return null;
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  function nightsBetween(checkIn, checkOut) {
    var start = parseISO(checkIn);
    var end = parseISO(checkOut);
    if (!start || !end) {
      return 0;
    }
    var diff = (end.getTime() - start.getTime()) / 86400000;
    return diff > 0 ? Math.round(diff) : 0;
  }

  function formatStayRange(checkIn, checkOut) {
    var start = parseISO(checkIn);
    var end = parseISO(checkOut);
    if (!start || !end) {
      return '';
    }
    var sameMonth = start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();
    if (sameMonth) {
      return start.getUTCDate() + '–' + end.getUTCDate() + ' ' + MONTHS[start.getUTCMonth()];
    }
    return start.getUTCDate() + ' ' + MONTHS[start.getUTCMonth()] + ' – ' + end.getUTCDate() + ' ' + MONTHS[end.getUTCMonth()];
  }

  function guestLabel(stay) {
    var adults = Number.isFinite(stay.adults) ? stay.adults : 0;
    var children = Number.isFinite(stay.children) ? stay.children : 0;
    var total = adults + children;
    if (!total) {
      return '';
    }
    return total === 1 ? '1 guest' : total + ' guests';
  }

  function gbpValue(eth) {
    var catalog = window.PaymentCurrencies;
    if (!catalog || typeof catalog.convert !== 'function') {
      return null;
    }
    var money = catalog.convert(eth, 'ETH', 'GBP');
    return money ? money.value : null;
  }

  function formatGbp(value) {
    if (!Number.isFinite(value)) {
      return '';
    }
    var whole = Math.abs(value - Math.round(value)) < 0.001;
    return '£' + value.toLocaleString('en-GB', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    });
  }

  function formatEth(value) {
    if (!Number.isFinite(value)) {
      return '';
    }
    return value.toLocaleString('en-GB', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }) + ' ETH';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function iconEl(name) {
    var wrap = el('span', 'trip-card__glyph');
    wrap.innerHTML = ICONS[name] || ICONS.ticket;
    return wrap;
  }

  function selectedHotel() {
    if (!state.offer) return null;
    return state.offer.hotels.find(function (hotel) { return hotel.name === state.hotelName; }) || null;
  }

  function applicableAddons() {
    if (!state.offer) return [];
    return state.offer.addons.filter(function (addon) {
      if (addon.scope === 'city') return true;
      return addon.hotelName === state.hotelName;
    });
  }

  function chosenAddons() {
    return applicableAddons().filter(function (addon) {
      return state.selected[addonKey(addon)];
    });
  }

  function detailLine(addon) {
    var line = addon.detailLine || '';
    var adults = state.stay.adults;
    if (line.indexOf('adult tickets') !== -1 && Number.isFinite(adults) && adults > 0) {
      line = line.replace('adult tickets', adults === 1 ? '1 adult ticket' : adults + ' adult tickets');
    }
    return line;
  }

  function hotelSubtitle(hotel) {
    if (hotel.description) return hotel.description;
    var parts = [];
    if (hotel.chain) parts.push(hotel.chain);
    if (hotel.city) parts.push(hotel.city);
    return parts.join(' · ');
  }

  function lineEth(priceEth, billing, nights) {
    if (billing === 'per-night') {
      return priceEth * (nights > 0 ? nights : 1);
    }
    return priceEth;
  }

  function sectionCountLabel(list) {
    var count = list.filter(function (addon) { return state.selected[addonKey(addon)]; }).length;
    if (!count) return 'Optional';
    return count === 1 ? '1 added' : count + ' added';
  }

  function render() {
    var root = appEl();
    var offer = state.offer;
    if (!root || !offer) return;
    root.hidden = false;
    root.textContent = '';
    setStatus('');

    var nights = nightsBetween(state.stay.checkIn, state.stay.checkOut);
    var range = nights ? formatStayRange(state.stay.checkIn, state.stay.checkOut) : '';
    var guests = guestLabel(state.stay);
    var hotel = selectedHotel();
    var addons = chosenAddons();
    var bookingCount = (hotel ? 1 : 0) + addons.length;

    var intro = el('div', 'trip-intro');
    var introCopy = el('div', 'trip-intro__copy');
    introCopy.appendChild(el('h1', 'trip-title', 'Build your trip to ' + offer.city));
    introCopy.appendChild(el('p', 'trip-lead', 'Choose a stay, then add experiences and transport to one booking.'));
    intro.appendChild(introCopy);
    var stayBits = [range, guests].filter(Boolean);
    intro.appendChild(el('p', 'trip-stay', stayBits.join(' · ') || 'Add dates to price the full stay'));
    root.appendChild(intro);

    var layout = el('div', 'trip-layout');
    var column = el('div', 'trip-column');

    column.appendChild(hotelSection(offer.hotels));
    var groups = {
      stay: [],
      experience: [],
      transport: []
    };
    applicableAddons().forEach(function (addon) {
      if (groups[addon.category]) groups[addon.category].push(addon);
    });
    if (groups.stay.length) column.appendChild(addonSection('Add to your stay', groups.stay, nights));
    if (groups.experience.length) column.appendChild(addonSection('Add experiences', groups.experience, nights));
    if (groups.transport.length) column.appendChild(addonSection('Add transport', groups.transport, nights));
    if (!groups.stay.length && !groups.experience.length && !groups.transport.length) {
      column.appendChild(el('p', 'trip-empty', 'This stay has no optional extras yet. You can still continue with the hotel.'));
    }

    layout.appendChild(column);
    layout.appendChild(summaryCard(hotel, addons, nights, range, bookingCount));
    root.appendChild(layout);
  }

  function hotelSection(hotels) {
    var section = el('section', 'trip-section');
    section.setAttribute('aria-labelledby', 'trip-accommodation');
    var head = el('div', 'trip-section__head');
    head.appendChild(el('h2', 'trip-section__title', 'Accommodation'));
    head.lastChild.id = 'trip-accommodation';
    head.appendChild(el('p', 'trip-section__meta', hotels.length ? '1 selected' : 'None available'));
    section.appendChild(head);

    if (!hotels.length) {
      section.appendChild(el('p', 'trip-empty', 'No hotels are listed for this city yet.'));
      return section;
    }

    var list = el('div', 'trip-stack');
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', 'Accommodation');
    hotels.forEach(function (hotel) {
      list.appendChild(hotelCard(hotel));
    });
    section.appendChild(list);
    return section;
  }

  function hotelCard(hotel) {
    var nights = nightsBetween(state.stay.checkIn, state.stay.checkOut);
    var selected = hotel.name === state.hotelName;
    var card = el('article', 'trip-card' + (selected ? ' is-selected' : ''));
    var icon = el('div', 'trip-card__icon');
    icon.appendChild(iconEl('hotel'));
    card.appendChild(icon);

    var body = el('div', 'trip-card__body');
    body.appendChild(el('h3', 'trip-card__title', hotel.name));
    var subtitle = hotelSubtitle(hotel);
    if (subtitle) body.appendChild(el('p', 'trip-card__detail', subtitle));
    var gbp = gbpValue(lineEth(hotel.priceEth, 'per-night', nights));
    var priceText = '';
    if (gbp != null && hotel.priceEth > 0) {
      priceText = nights > 0
        ? formatGbp(gbp) + ' for ' + (nights === 1 ? '1 night' : nights + ' nights')
        : formatGbp(gbpValue(hotel.priceEth)) + ' / night';
    } else if (hotel.priceLabel) {
      priceText = hotel.priceLabel;
    }
    if (priceText) body.appendChild(el('p', 'trip-card__price', priceText));
    if (hotel.ownPage) {
      var link = el('a', 'trip-card__more', 'Room types');
      link.href = hotel.ownPage;
      body.appendChild(link);
    }
    card.appendChild(body);

    var button = el('button', 'trip-toggle', selected ? 'Selected' : 'Select');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', selected ? 'true' : 'false');
    button.addEventListener('click', function () {
      state.hotelName = hotel.name;
      writeSelection();
      render();
    });
    card.appendChild(button);
    return card;
  }

  function addonSection(title, addons, nights) {
    var section = el('section', 'trip-section');
    var slug = title.toLowerCase().replace(/[^a-z]+/g, '-');
    var head = el('div', 'trip-section__head');
    var heading = el('h2', 'trip-section__title', title);
    heading.id = 'trip-' + slug;
    head.appendChild(heading);
    head.appendChild(el('p', 'trip-section__meta', sectionCountLabel(addons)));
    section.appendChild(head);
    section.setAttribute('aria-labelledby', heading.id);

    var list = el('div', 'trip-stack');
    addons.forEach(function (addon) {
      list.appendChild(addonCard(addon, nights));
    });
    section.appendChild(list);
    return section;
  }

  function addonCard(addon, nights) {
    var key = addonKey(addon);
    var added = Boolean(state.selected[key]);
    var card = el('article', 'trip-card' + (added ? ' is-added' : ''));
    var icon = el('div', 'trip-card__icon');
    icon.appendChild(iconEl(addon.icon));
    card.appendChild(icon);

    var body = el('div', 'trip-card__body');
    body.appendChild(el('h3', 'trip-card__title', addon.label));
    var detail = detailLine(addon) || addon.description;
    if (detail) body.appendChild(el('p', 'trip-card__detail', detail));
    var amountEth = lineEth(addon.priceEth, addon.billing, nights);
    var gbp = gbpValue(nights > 0 || addon.billing !== 'per-night' ? amountEth : addon.priceEth);
    if (gbp != null) {
      var priceText = addon.billing === 'per-night' && nights === 0
        ? formatGbp(gbp) + ' / night'
        : formatGbp(gbp) + ' total';
      body.appendChild(el('p', 'trip-card__price', priceText));
    }
    card.appendChild(body);

    var button = el('button', 'trip-toggle', added ? 'Added' : 'Add to trip');
    button.type = 'button';
    button.setAttribute('aria-pressed', added ? 'true' : 'false');
    button.addEventListener('click', function () {
      state.selected[key] = !state.selected[key];
      writeSelection();
      render();
    });
    card.appendChild(button);
    return card;
  }

  function summaryCard(hotel, addons, nights, range, bookingCount) {
    var aside = el('aside', 'trip-summary');
    aside.setAttribute('aria-live', 'polite');
    var head = el('div', 'trip-summary__head');
    head.appendChild(el('h2', 'trip-summary__title', 'Your trip'));
    var countLabel = bookingCount === 1 ? '1 booking · paid together' : bookingCount + ' bookings · paid together';
    head.appendChild(el('p', 'trip-summary__count', hotel ? countLabel : 'Select a stay'));
    aside.appendChild(head);

    var body = el('div', 'trip-summary__body');
    var totalEth = 0;
    if (hotel && hotel.priceEth > 0) {
      var hotelEth = lineEth(hotel.priceEth, 'per-night', nights);
      totalEth += hotelEth;
      body.appendChild(summaryLine('hotel', hotel.name, summaryStayDetail(range, nights), gbpValue(hotelEth)));
    }
    addons.forEach(function (addon) {
      var amount = lineEth(addon.priceEth, addon.billing, nights);
      totalEth += amount;
      body.appendChild(summaryLine(addon.icon, addon.label, detailLine(addon), gbpValue(amount)));
    });
    if (!hotel) {
      body.appendChild(el('p', 'trip-summary__empty', 'Select a hotel to start this booking.'));
    }

    var total = el('div', 'trip-summary__total');
    var totalRow = el('div', 'trip-summary__total-row');
    totalRow.appendChild(el('span', 'trip-summary__total-label', 'Total'));
    totalRow.appendChild(el('span', 'trip-summary__total-value', formatGbp(gbpValue(totalEth) || 0)));
    total.appendChild(totalRow);
    total.appendChild(el('p', 'trip-summary__eth', 'Approx. ' + formatEth(totalEth)));
    body.appendChild(total);

    var continueLink = el('a', 'trip-continue', continueLabel(bookingCount, nights));
    continueLink.id = 'trip-continue';
    if (hotel && nights > 0 && hotel.priceEth > 0) {
      continueLink.href = 'checkout.html';
      continueLink.addEventListener('click', function (event) {
        persistCheckout(hotel, addons, nights);
        event.preventDefault();
        window.location.href = 'checkout.html';
      });
    } else if (!nights) {
      continueLink.href = 'index.html';
    } else {
      continueLink.href = state.offer && state.offer.pageUrl ? state.offer.pageUrl : 'search.html';
    }
    body.appendChild(continueLink);
    body.appendChild(el('p', 'trip-summary__note', 'Review cancellation terms for each item before choosing card or crypto payment.'));
    aside.appendChild(body);
    return aside;
  }

  function summaryStayDetail(range, nights) {
    var bits = [];
    if (range) bits.push(range);
    if (nights > 0) bits.push(nights === 1 ? '1 night' : nights + ' nights');
    return bits.join(' · ');
  }

  function summaryLine(iconName, title, detail, gbp) {
    var row = el('div', 'trip-line');
    var icon = el('div', 'trip-line__icon');
    icon.appendChild(iconEl(iconName));
    row.appendChild(icon);
    var copy = el('div', 'trip-line__copy');
    copy.appendChild(el('p', 'trip-line__title', title));
    if (detail) copy.appendChild(el('p', 'trip-line__detail', detail));
    row.appendChild(copy);
    row.appendChild(el('p', 'trip-line__price', gbp == null ? '' : formatGbp(gbp)));
    return row;
  }

  function continueLabel(bookingCount, nights) {
    if (!nights) return 'Choose dates';
    if (!bookingCount) return 'Select a stay';
    var noun = bookingCount === 1 ? 'booking' : 'bookings';
    return 'Continue with ' + bookingCount + ' ' + noun;
  }

  function persistCheckout(hotel, addons, nights) {
    var adults = Number.isFinite(state.stay.adults) ? state.stay.adults : 1;
    var children = Number.isFinite(state.stay.children) ? state.stay.children : 0;
    var totalEth = lineEth(hotel.priceEth, 'per-night', nights);
    var quoteAddons = addons.map(function (addon) {
      totalEth += lineEth(addon.priceEth, addon.billing, nights);
      return {
        id: addon.id,
        label: addon.label,
        price: addon.priceEth,
        billing: addon.billing === 'per-night' ? 'per-night' : 'per-stay'
      };
    });
    var payload = {
      kind: 'stay',
      propertyName: hotel.name,
      city: hotel.city || state.offer.city,
      country: hotel.country || state.offer.country,
      propertyUrl: hotel.ownPage || hotel.pageUrl || state.offer.pageUrl || '',
      checkInDate: state.stay.checkIn,
      checkOutDate: state.stay.checkOut,
      nights: nights,
      guests: { adults: adults, children: children },
      roomLabel: '',
      addOns: quoteAddons,
      amount: totalEth,
      currency: 'ETH',
      decimals: 3,
      paymentMethod: 'crypto',
      hasDates: true,
      hasRate: true
    };
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      // Checkout reads the same key and shows an empty state if it is missing.
    }
  }

  function showError(message) {
    var root = appEl();
    if (root) {
      root.hidden = false;
      root.textContent = '';
      var panel = el('div', 'trip-error');
      panel.appendChild(el('h1', 'trip-title', 'Add-ons are unavailable'));
      panel.appendChild(el('p', 'trip-lead', message));
      var link = el('a', 'trip-continue trip-continue--inline', 'Back to search');
      link.href = 'search.html';
      panel.appendChild(link);
      root.appendChild(panel);
    }
    setStatus('');
  }

  function start() {
    var root = appEl();
    if (!root) return;
    state.stay = readStay();
    var params = new URLSearchParams(window.location.search);
    var query = new URLSearchParams();
    ['hotel', 'city', 'page', 'country'].forEach(function (key) {
      var value = params.get(key);
      if (value) query.set(key, value);
    });
    if (!query.get('hotel') && !query.get('city') && !query.get('page')) {
      showError('Select a hotel from a city page or from search to add experiences and transport.');
      return;
    }
    fetch('/api/hotel-addons/trip?' + query.toString(), { headers: { accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (body) {
            throw new Error((body && body.error) || 'Unable to load this trip.');
          });
        }
        return response.json();
      })
      .then(function (offer) {
        state.offer = offer;
        state.hotelName = offer.selectedHotel || (offer.hotels[0] && offer.hotels[0].name) || '';
        restoreSelection(offer);
        if (!state.hotelName && offer.hotels[0]) state.hotelName = offer.hotels[0].name;
        document.title = 'Build your trip to ' + offer.city + ' – Boreal Horizons';
        render();
      })
      .catch(function (error) {
        showError(error && error.message ? error.message : 'Unable to load this trip.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
