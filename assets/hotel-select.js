/**
 * City listing pages keep their hotel cards. Book Now and View & Book open the
 * trip page, where that hotel can be selected and catalog add-ons upsold.
 * A link that already opens a property page (Kempinski, Funken Lodge, …) stays.
 */
(function () {
  var STORAGE_KEY = 'balticComfortBooking';

  function currentPage() {
    var path = (window.location && window.location.pathname) || '';
    var parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  function fileName(href) {
    var path = String(href || '').split('#')[0].split('?')[0];
    var parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  function isOwnPropertyPage(href) {
    var file = fileName(href);
    if (!file || !/\.html?$/i.test(file)) {
      return false;
    }
    if (file === 'index.html' || file === 'search.html' || file === 'trip.html' || file === 'checkout.html') {
      return false;
    }
    if (file === currentPage()) {
      return false;
    }
    return true;
  }

  function cityName() {
    var heading = document.querySelector('[data-city]');
    if (heading) {
      var fromData = heading.getAttribute('data-city');
      if (fromData && fromData.trim()) {
        return fromData.trim();
      }
    }
    var title = document.querySelector('#available-hotels');
    var text = title ? title.textContent || '' : '';
    var match = text.match(/\bin\s+(.+)$/i);
    return match ? match[1].trim() : '';
  }

  function readStay() {
    try {
      var raw = window.sessionStorage && window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function tripHref(hotelName) {
    var params = new URLSearchParams();
    params.set('hotel', hotelName);
    var city = cityName();
    if (city) {
      params.set('city', city);
    }
    var page = currentPage();
    if (page) {
      params.set('page', page);
    }
    var stay = readStay() || {};
    if (stay.checkInDate) params.set('checkIn', stay.checkInDate);
    if (stay.checkOutDate) params.set('checkOut', stay.checkOutDate);
    if (stay.adults != null && stay.adults !== '') params.set('adults', String(stay.adults));
    if (stay.children != null && stay.children !== '') params.set('children', String(stay.children));
    return 'trip.html?' + params.toString();
  }

  function wireCard(card) {
    var heading = card.querySelector('h3');
    var name = heading ? String(heading.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if (!name) {
      return;
    }
    var control = card.querySelector('button, a.book-link');
    if (!control || control.getAttribute('data-trip-wired') === 'true') {
      return;
    }
    var href = control.getAttribute('href') || '';
    if (isOwnPropertyPage(href)) {
      return;
    }
    var target = tripHref(name);
    control.setAttribute('data-trip-wired', 'true');
    if (control.tagName === 'BUTTON') {
      control.type = 'button';
      control.addEventListener('click', function () {
        window.location.href = target;
      });
    } else {
      control.setAttribute('href', target);
    }
  }

  function wire() {
    var cards = document.querySelectorAll('.hotel-card');
    Array.prototype.forEach.call(cards, wireCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
