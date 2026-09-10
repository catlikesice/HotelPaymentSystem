/**
 * Homepage booking search bar: destination + stay dates.
 * Persists the same session key as selectlocation.html so hotel pages
 * can price the stay. When SQL search is ready, city matching can move
 * to GET /api/search while this form still posts q, checkIn, and checkOut.
 */
(function () {
  'use strict';

  var BOOKING_STORAGE_KEY = 'balticComfortBooking';
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function normalize(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function calculateNights(checkInValue, checkOutValue) {
    if (!checkInValue || !checkOutValue) {
      return null;
    }

    var checkInParts = checkInValue.split('-').map(Number);
    var checkOutParts = checkOutValue.split('-').map(Number);

    if (
      checkInParts.length !== 3 ||
      checkOutParts.length !== 3 ||
      checkInParts.some(Number.isNaN) ||
      checkOutParts.some(Number.isNaN)
    ) {
      return null;
    }

    var checkInUTC = Date.UTC(checkInParts[0], checkInParts[1] - 1, checkInParts[2]);
    var checkOutUTC = Date.UTC(checkOutParts[0], checkOutParts[1] - 1, checkOutParts[2]);
    var diff = checkOutUTC - checkInUTC;
    if (diff <= 0) {
      return null;
    }

    return Math.round(diff / MS_PER_DAY);
  }

  function persistBookingSelection(details) {
    if (!details) {
      return;
    }

    try {
      var payload = Object.assign({ updatedAt: new Date().toISOString() }, details);
      if (window.sessionStorage) {
        window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn('Unable to persist booking selection details', error);
    }
  }

  function countryToSlug(country) {
    return normalize(country).replace(/ /g, '-');
  }

  function catalog() {
    return window.SEARCH_CATALOG || { cities: [], hotels: [] };
  }

  function fillDestinationList(datalist) {
    if (!datalist) {
      return;
    }

    var seen = {};
    var options = [];
    var data = catalog();

    (data.cities || []).concat(data.hotels || []).forEach(function (item) {
      var label = item.name;
      if (item.type === 'hotel' && item.city) {
        label = item.name + ' — ' + item.city;
      }
      var key = normalize(label);
      if (!key || seen[key]) {
        return;
      }
      seen[key] = true;
      options.push(label);
    });

    options.sort(function (a, b) {
      return a.localeCompare(b);
    });

    datalist.innerHTML = options.map(function (label) {
      return '<option value="' + String(label).replace(/"/g, '&quot;') + '"></option>';
    }).join('');
  }

  function findDestination(query) {
    var needle = normalize(query);
    if (!needle) {
      return null;
    }

    var data = catalog();
    var cities = data.cities || [];
    var hotels = data.hotels || [];
    var i;
    var item;
    var name;

    for (i = 0; i < cities.length; i += 1) {
      if (normalize(cities[i].name) === needle || normalize(cities[i].city) === needle) {
        return { kind: 'city', item: cities[i] };
      }
    }

    for (i = 0; i < hotels.length; i += 1) {
      name = normalize(hotels[i].name);
      if (name === needle || (hotels[i].city && name + ' — ' + normalize(hotels[i].city) === needle)) {
        return { kind: 'hotel', item: hotels[i] };
      }
    }

    for (i = 0; i < cities.length; i += 1) {
      name = normalize(cities[i].name);
      if (name.indexOf(needle) === 0 || needle.indexOf(name) === 0) {
        return { kind: 'city', item: cities[i] };
      }
    }

    for (i = 0; i < hotels.length; i += 1) {
      if (normalize(hotels[i].name).indexOf(needle) !== -1) {
        return { kind: 'hotel', item: hotels[i] };
      }
    }

    return null;
  }

  function setStatus(message) {
    var status = document.getElementById('hero-search-status');
    if (status) {
      status.textContent = message || '';
    }
  }

  function goToMatch(match, checkInDate, checkOutDate, nights) {
    var item = match.item;
    var cityName = item.city || item.name;
    persistBookingSelection({
      country: countryToSlug(item.country),
      citySlug: String(item.url || '').replace(/\.html?$/i, ''),
      cityName: cityName,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights: nights
    });
    window.location.href = item.url;
  }

  function init() {
    var form = document.getElementById('hero-search-form');
    var destination = document.getElementById('hero-search-destination');
    var checkIn = document.getElementById('hero-search-checkin');
    var checkOut = document.getElementById('hero-search-checkout');
    var datalist = document.getElementById('hero-search-destinations');

    if (!form || !destination || !checkIn || !checkOut) {
      return;
    }

    fillDestinationList(datalist);

    var minDate = todayISO();
    checkIn.min = minDate;
    checkOut.min = minDate;

    checkIn.addEventListener('change', function () {
      checkOut.min = checkIn.value || minDate;
      if (checkOut.value && checkOut.value <= checkIn.value) {
        checkOut.value = '';
      }
      setStatus('');
    });

    checkOut.addEventListener('change', function () {
      setStatus('');
    });

    form.addEventListener('submit', function (event) {
      var query = destination.value.trim();
      var checkInDate = checkIn.value;
      var checkOutDate = checkOut.value;
      var nights;

      if (!query) {
        event.preventDefault();
        setStatus('Please enter a city or hotel.');
        destination.focus();
        return;
      }

      if (!checkInDate || !checkOutDate) {
        event.preventDefault();
        setStatus('Please choose check-in and check-out dates.');
        (checkInDate ? checkOut : checkIn).focus();
        return;
      }

      nights = calculateNights(checkInDate, checkOutDate);
      if (!nights) {
        event.preventDefault();
        setStatus('Check-out must be after check-in.');
        checkOut.focus();
        return;
      }

      var match = findDestination(query);
      if (match && match.item && match.item.url) {
        event.preventDefault();
        goToMatch(match, checkInDate, checkOutDate, nights);
        return;
      }

      persistBookingSelection({
        cityName: query,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        nights: nights
      });
      // Fall through to GET search.html?q=...&checkIn=...&checkOut=...
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
