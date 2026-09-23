/**
 * Search results page logic.
 *
 * Today: filters window.SEARCH_CATALOG in the browser.
 * Later (SQL): set USE_SQL_API = true and implement GET /api/search?q=...
 * returning { cities: [...], hotels: [...] } with the same shape as SEARCH_CATALOG.
 * Schema and queries: docs/sql/hotel-search.md.
 */
(function () {
  'use strict';

  // Flip this when the Express + SQL search endpoint is ready.
  var USE_SQL_API = false;
  var SQL_SEARCH_ENDPOINT = '/api/search';
  var BOOKING_STORAGE_KEY = 'balticComfortBooking';

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/ø/g, 'o')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function getQueryFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  }

  function parseGuestCount(value, min, max, fallback) {
    var parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function readStoredBooking() {
    try {
      if (!window.sessionStorage) {
        return null;
      }
      var raw = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to read stored booking details', error);
      return null;
    }
  }

  function persistBookingSelection(details) {
    if (!details) {
      return;
    }

    try {
      var stored = readStoredBooking() || {};
      var payload = Object.assign({}, stored, details, { updatedAt: new Date().toISOString() });
      if (window.sessionStorage) {
        window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('Unable to persist booking selection details', error);
    }
  }

  function formatGuestSummary(adults, children) {
    var parts = [];
    if (Number.isFinite(adults) && adults > 0) {
      parts.push(adults === 1 ? '1 adult' : adults + ' adults');
    }
    if (Number.isFinite(children) && children > 0) {
      parts.push(children === 1 ? '1 child' : children + ' children');
    } else if (Number.isFinite(children) && children === 0 && parts.length) {
      parts.push('no children');
    }
    return parts.join(', ');
  }

  function getStayFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var stored = readStoredBooking() || {};
    var checkIn = (params.get('checkIn') || stored.checkInDate || '').trim();
    var checkOut = (params.get('checkOut') || stored.checkOutDate || '').trim();
    var adults = parseGuestCount(params.get('adults') != null ? params.get('adults') : stored.adults, 1, 20, NaN);
    var children = parseGuestCount(params.get('children') != null ? params.get('children') : stored.children, 0, 10, NaN);

    return {
      checkIn: checkIn,
      checkOut: checkOut,
      adults: adults,
      children: children
    };
  }

  function syncStayFields(stay) {
    var checkInEl = document.getElementById('search-checkin');
    var checkOutEl = document.getElementById('search-checkout');
    var adultsEl = document.getElementById('search-adults');
    var childrenEl = document.getElementById('search-children');
    var stayEl = document.getElementById('search-stay');

    if (checkInEl) checkInEl.value = stay.checkIn || '';
    if (checkOutEl) checkOutEl.value = stay.checkOut || '';
    if (adultsEl && Number.isFinite(stay.adults)) adultsEl.value = String(stay.adults);
    if (childrenEl && Number.isFinite(stay.children)) childrenEl.value = String(stay.children);

    var parts = [];
    if (stay.checkIn && stay.checkOut) {
      parts.push('Stay: ' + stay.checkIn + ' – ' + stay.checkOut);
    }
    var guestLabel = formatGuestSummary(stay.adults, stay.children);
    if (guestLabel) {
      parts.push('Guests: ' + guestLabel);
    }

    if (stayEl) {
      if (parts.length) {
        stayEl.hidden = false;
        stayEl.textContent = parts.join(' · ');
      } else {
        stayEl.hidden = true;
        stayEl.textContent = '';
      }
    }

    if (stay.checkIn || stay.checkOut || Number.isFinite(stay.adults) || Number.isFinite(stay.children)) {
      var payload = {};
      if (stay.checkIn) payload.checkInDate = stay.checkIn;
      if (stay.checkOut) payload.checkOutDate = stay.checkOut;
      if (Number.isFinite(stay.adults)) payload.adults = stay.adults;
      if (Number.isFinite(stay.children)) payload.children = stay.children;
      if (Number.isFinite(stay.adults) && Number.isFinite(stay.children)) {
        payload.guests = stay.adults + stay.children;
      }
      persistBookingSelection(payload);
    }
  }

  function matchesQuery(item, query) {
    if (!query) return false;
    var haystack = normalize([
      item.name,
      item.city,
      item.country,
      item.description,
      item.price,
      item.type
    ].join(' '));
    var tokens = normalize(query).split(/\s+/).filter(Boolean);
    return tokens.every(function (token) {
      return haystack.indexOf(token) !== -1;
    });
  }

  function filterCatalog(query) {
    var catalog = window.SEARCH_CATALOG || { cities: [], hotels: [] };
    return {
      cities: (catalog.cities || []).filter(function (item) {
        return matchesQuery(item, query);
      }),
      hotels: (catalog.hotels || []).filter(function (item) {
        return matchesQuery(item, query);
      })
    };
  }

  /**
   * Single entry point for results. Swap the body to call SQL later:
   *   return fetch(SQL_SEARCH_ENDPOINT + '?q=' + encodeURIComponent(query))
   *     .then(function (res) { if (!res.ok) throw new Error('Search failed'); return res.json(); });
   */
  function fetchSearchResults(query) {
    if (USE_SQL_API) {
      return fetch(SQL_SEARCH_ENDPOINT + '?q=' + encodeURIComponent(query), {
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) {
          throw new Error('Search request failed (' + res.status + ')');
        }
        return res.json();
      });
    }

    return Promise.resolve(filterCatalog(query));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCityCard(city) {
    var location = [city.city, city.country].filter(Boolean).join(', ');
    return (
      '<article class="search-card search-card--city">' +
        '<div class="search-card__body">' +
          '<p class="search-card__eyebrow">City</p>' +
          '<h3 class="search-card__title">' + escapeHtml(city.name) + '</h3>' +
          (location ? '<p class="search-card__meta">' + escapeHtml(location) + '</p>' : '') +
          (city.description ? '<p class="search-card__desc">' + escapeHtml(city.description) + '</p>' : '') +
          '<a class="search-card__link" href="' + escapeHtml(city.url) + '">View hotels</a>' +
        '</div>' +
      '</article>'
    );
  }

  function renderHotelCard(hotel) {
    var location = [hotel.city, hotel.country].filter(Boolean).join(', ');
    var image = hotel.image
      ? '<img class="search-card__image" src="' + escapeHtml(hotel.image) + '" alt="' + escapeHtml(hotel.name) + '">'
      : '<div class="search-card__image search-card__image--placeholder" aria-hidden="true"></div>';

    return (
      '<article class="search-card search-card--hotel">' +
        image +
        '<div class="search-card__body">' +
          '<p class="search-card__eyebrow">Hotel</p>' +
          '<h3 class="search-card__title">' + escapeHtml(hotel.name) + '</h3>' +
          (location ? '<p class="search-card__meta">' + escapeHtml(location) + '</p>' : '') +
          (hotel.price ? '<p class="search-card__price">' + escapeHtml(hotel.price) + '</p>' : '') +
          (hotel.description ? '<p class="search-card__desc">' + escapeHtml(hotel.description) + '</p>' : '') +
          '<a class="search-card__link" href="' + escapeHtml(hotel.url) + '">View &amp; Book</a>' +
        '</div>' +
      '</article>'
    );
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderResults(query, results) {
    var cities = results.cities || [];
    var hotels = results.hotels || [];
    var total = cities.length + hotels.length;
    var citiesEl = document.getElementById('city-results');
    var hotelsEl = document.getElementById('hotel-results');
    var emptyEl = document.getElementById('search-empty');
    var statusEl = document.getElementById('search-status');

    if (!query) {
      setText('search-heading', 'Search hotels and cities');
      setText('search-status', 'Enter a city, country, or hotel name to see results.');
      if (citiesEl) citiesEl.innerHTML = '';
      if (hotelsEl) hotelsEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = true;
      return;
    }

    setText('search-heading', 'Results for “' + query + '”');

    if (statusEl) {
      statusEl.textContent = total === 1
        ? '1 match found.'
        : total + ' matches found.';
    }

    if (citiesEl) {
      citiesEl.innerHTML = cities.map(renderCityCard).join('');
    }
    if (hotelsEl) {
      hotelsEl.innerHTML = hotels.map(renderHotelCard).join('');
    }

    var citiesSection = document.getElementById('city-results-section');
    var hotelsSection = document.getElementById('hotel-results-section');
    if (citiesSection) citiesSection.hidden = cities.length === 0;
    if (hotelsSection) hotelsSection.hidden = hotels.length === 0;
    if (emptyEl) emptyEl.hidden = total > 0;
  }

  function showError(message) {
    setText('search-heading', 'Search unavailable');
    setText('search-status', message);
    var emptyEl = document.getElementById('search-empty');
    if (emptyEl) emptyEl.hidden = true;
  }

  function init() {
    var form = document.getElementById('site-search-form');
    var input = document.getElementById('site-search-input');
    var query = getQueryFromUrl();
    var stay = getStayFromUrl();

    if (input) {
      input.value = query;
    }

    syncStayFields(stay);

    if (form) {
      form.addEventListener('submit', function (event) {
        // Allow normal GET navigation to search.html?q=...
        var value = input ? input.value.trim() : '';
        if (!value) {
          event.preventDefault();
          input && input.focus();
        }
      });
    }

    if (!query) {
      renderResults('', { cities: [], hotels: [] });
      return;
    }

    setText('search-status', 'Searching…');
    fetchSearchResults(query)
      .then(function (results) {
        renderResults(query, results || { cities: [], hotels: [] });
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : 'Unable to load search results.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
