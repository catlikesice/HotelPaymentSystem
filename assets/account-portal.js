;(function () {
  let hashBound = false;
  const SECTIONS = [
    'overview',
    'trips',
    'accommodation',
    'events',
    'messages',
    'saved',
    'payments',
    'profile'
  ];

  function parseISODate(value) {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  function startOfTodayUtc() {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function isUpcoming(booking) {
    if (!booking) {
      return false;
    }
    const today = startOfTodayUtc();
    if (booking.kind === 'event') {
      const eventDate = parseISODate(booking.eventDate);
      return eventDate ? eventDate.getTime() >= today : false;
    }
    const checkOut = parseISODate(booking.checkOutDate);
    return checkOut ? checkOut.getTime() >= today : false;
  }

  function daysUntil(isoDate) {
    const date = parseISODate(isoDate);
    if (!date) {
      return null;
    }
    return Math.round((date.getTime() - startOfTodayUtc()) / (24 * 60 * 60 * 1000));
  }

  function formatDate(value) {
    if (window.BookingDates && typeof window.BookingDates.toEuropean === 'function') {
      return window.BookingDates.toEuropean(value) || value || '';
    }
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : (value || '');
  }

  function formatDateRange(start, end) {
    const left = formatDate(start);
    const right = formatDate(end);
    if (left && right) {
      return left + ' – ' + right;
    }
    return left || right || '';
  }

  function formatAmount(amount, currency) {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric)) {
      return '';
    }
    const places = Math.abs(numeric) < 1 ? 4 : 2;
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: Math.min(2, places),
      maximumFractionDigits: 6
    }) + ' ' + (currency || 'ETH');
  }

  function placeLabel(booking) {
    if (!booking) {
      return '';
    }
    return [booking.city, booking.country].filter(Boolean).join(', ');
  }

  function guestLabel(guests) {
    if (!guests) {
      return '';
    }
    const parts = [];
    if (guests.adults > 0) {
      parts.push(guests.adults === 1 ? '1 adult' : guests.adults + ' adults');
    }
    if (guests.children > 0) {
      parts.push(guests.children === 1 ? '1 child' : guests.children + ' children');
    }
    return parts.join(', ');
  }

  function setText(root, selector, value) {
    const el = (root || document).querySelector(selector);
    if (el) {
      el.textContent = value == null ? '' : String(value);
    }
  }

  function clearNode(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (text) {
      el.textContent = text;
    }
    return el;
  }

  function bookingCard(booking, options) {
    const card = createEl('article', 'portal-booking');
    const kind = booking.kind === 'event' ? 'Event ticket' : 'Accommodation';
    card.appendChild(createEl('p', 'portal-booking__eyebrow', kind));
    card.appendChild(createEl(
      'h3',
      'portal-booking__title',
      booking.kind === 'event' ? booking.eventName : booking.propertyName
    ));
    const meta = createEl('p', 'portal-booking__meta');
    if (booking.kind === 'event') {
      meta.textContent = [formatDate(booking.eventDate), placeLabel(booking)].filter(Boolean).join(' · ');
    } else {
      const nights = booking.nights === 1 ? '1 night' : booking.nights + ' nights';
      meta.textContent = [
        formatDateRange(booking.checkInDate, booking.checkOutDate),
        nights,
        placeLabel(booking)
      ].filter(Boolean).join(' · ');
    }
    card.appendChild(meta);

    if (booking.roomLabel && !(options && options.compact)) {
      card.appendChild(createEl('p', 'portal-booking__detail', booking.roomLabel));
    }
    const guests = guestLabel(booking.guests);
    if (guests) {
      card.appendChild(createEl('p', 'portal-booking__detail', guests));
    }
    if (booking.confirmationCode) {
      card.appendChild(createEl(
        'p',
        'portal-booking__confirm',
        'Confirmation ' + booking.confirmationCode
      ));
    }
    if (booking.propertyUrl && booking.kind === 'stay') {
      const link = createEl('a', 'portal-booking__link', 'View property');
      link.href = booking.propertyUrl;
      card.appendChild(link);
    }
    return card;
  }

  function emptyMessage(text, href, linkLabel) {
    const wrap = createEl('div', 'portal-empty');
    wrap.appendChild(createEl('p', '', text));
    if (href && linkLabel) {
      const link = createEl('a', 'btn btn--secondary', linkLabel);
      link.href = href;
      wrap.appendChild(link);
    }
    return wrap;
  }

  function nextStay(bookings) {
    const upcoming = bookings.filter(function (booking) {
      return booking.kind === 'stay' && isUpcoming(booking);
    }).sort(function (left, right) {
      return (parseISODate(left.checkInDate) || 0) - (parseISODate(right.checkInDate) || 0);
    });
    return upcoming[0] || null;
  }

  function eventsForStay(bookings, stay) {
    if (!stay) {
      return [];
    }
    const stayStart = parseISODate(stay.checkInDate);
    const stayEnd = parseISODate(stay.checkOutDate);
    const city = String(stay.city || '').toLowerCase();
    return bookings.filter(function (booking) {
      if (booking.kind !== 'event' || !isUpcoming(booking)) {
        return false;
      }
      if (city && String(booking.city || '').toLowerCase() !== city) {
        return false;
      }
      const eventDate = parseISODate(booking.eventDate);
      if (!eventDate || !stayStart || !stayEnd) {
        return false;
      }
      return eventDate.getTime() >= stayStart.getTime() && eventDate.getTime() <= stayEnd.getTime();
    });
  }

  function fillList(container, bookings, emptyText, emptyHref, emptyLink) {
    if (!container) {
      return;
    }
    clearNode(container);
    if (!bookings.length) {
      container.appendChild(emptyMessage(emptyText, emptyHref, emptyLink));
      return;
    }
    bookings.forEach(function (booking) {
      container.appendChild(bookingCard(booking));
    });
  }

  function renderOverview(bookings) {
    const stay = nextStay(bookings);
    const upcoming = bookings.filter(isUpcoming);
    const upcomingStays = upcoming.filter(function (booking) { return booking.kind === 'stay'; });
    const upcomingEvents = upcoming.filter(function (booking) { return booking.kind === 'event'; });

    const days = stay ? daysUntil(stay.checkInDate) : null;
    if (stay && days !== null && days > 0) {
      setText(document, '[data-next-trip-days]', String(days));
      setText(document, '[data-next-trip-days-label]', days === 1 ? 'day' : 'days');
    } else if (stay && days !== null && days === 0) {
      setText(document, '[data-next-trip-days]', 'Today');
      setText(document, '[data-next-trip-days-label]', '');
    } else if (stay && days !== null && days < 0) {
      setText(document, '[data-next-trip-days]', 'Now');
      setText(document, '[data-next-trip-days-label]', 'checked in');
    } else {
      setText(document, '[data-next-trip-days]', '—');
      setText(document, '[data-next-trip-days-label]', '');
    }
    setText(document, '[data-next-trip-place]', stay ? placeLabel(stay) : 'No upcoming stay');

    setText(document, '[data-upcoming-count]', String(upcoming.length));
    if (!upcoming.length) {
      setText(document, '[data-upcoming-breakdown]', 'No stays or event tickets yet');
    } else {
      const parts = [];
      if (upcomingStays.length) {
        parts.push(upcomingStays.length === 1 ? '1 stay' : upcomingStays.length + ' stays');
      }
      if (upcomingEvents.length) {
        parts.push(upcomingEvents.length === 1 ? '1 event' : upcomingEvents.length + ' events');
      }
      setText(document, '[data-upcoming-breakdown]', parts.join(' · '));
    }

    if (stay && stay.paymentStatus === 'paid') {
      setText(document, '[data-wallet-status]', 'Paid');
      setText(document, '[data-wallet-amount]', formatAmount(stay.amount, stay.currency));
    } else if (upcoming.length) {
      const paid = upcoming.find(function (booking) { return booking.paymentStatus === 'paid'; });
      if (paid) {
        setText(document, '[data-wallet-status]', 'Paid');
        setText(document, '[data-wallet-amount]', formatAmount(paid.amount, paid.currency));
      } else {
        setText(document, '[data-wallet-status]', 'Pending');
        setText(document, '[data-wallet-amount]', '');
      }
    } else {
      setText(document, '[data-wallet-status]', '—');
      setText(document, '[data-wallet-amount]', 'No payments yet');
    }

    const stayMount = document.querySelector('[data-upcoming-stay]');
    if (stayMount) {
      clearNode(stayMount);
      if (stay) {
        stayMount.appendChild(bookingCard(stay));
      } else {
        stayMount.appendChild(emptyMessage(
          'You have not booked a stay yet. Search Northern Europe and complete checkout to see it here.',
          'search.html',
          'Find a stay'
        ));
      }
    }

    const eventsMount = document.querySelector('[data-stay-events]');
    if (eventsMount) {
      clearNode(eventsMount);
      const linkedEvents = eventsForStay(bookings, stay);
      if (!stay) {
        eventsMount.appendChild(emptyMessage('Book a stay first, then add event tickets for those dates.'));
      } else if (!linkedEvents.length) {
        eventsMount.appendChild(emptyMessage(
          'No event tickets are booked for this stay.',
          'search.html',
          'Explore events'
        ));
      } else {
        linkedEvents.forEach(function (booking) {
          eventsMount.appendChild(bookingCard(booking, { compact: true }));
        });
      }
    }
  }

  function renderPayments(bookings) {
    const mount = document.querySelector('[data-payment-list]');
    if (!mount) {
      return;
    }
    clearNode(mount);
    if (!bookings.length) {
      mount.appendChild(emptyMessage('No payments yet. Confirmed bookings will list their crypto payments here.'));
      return;
    }
    bookings.slice().reverse().forEach(function (booking) {
      const row = createEl('article', 'portal-payment');
      row.appendChild(createEl(
        'h3',
        'portal-booking__title',
        booking.kind === 'event' ? booking.eventName : booking.propertyName
      ));
      row.appendChild(createEl(
        'p',
        'portal-booking__meta',
        (booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus) +
          ' · ' + formatAmount(booking.amount, booking.currency)
      ));
      if (booking.confirmationCode) {
        row.appendChild(createEl('p', 'portal-booking__confirm', 'Confirmation ' + booking.confirmationCode));
      }
      mount.appendChild(row);
    });
  }

  function currentSection() {
    const hash = (window.location.hash || '#overview').replace('#', '');
    return SECTIONS.indexOf(hash) === -1 ? 'overview' : hash;
  }

  function showSection(name) {
    const section = SECTIONS.indexOf(name) === -1 ? 'overview' : name;
    document.querySelectorAll('[data-portal-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-portal-panel') !== section;
    });
    document.querySelectorAll('[data-portal-section]').forEach(function (link) {
      const active = link.getAttribute('data-portal-section') === section;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function bindAccountMenu() {
    const menu = document.getElementById('portal-account-menu');
    if (!menu || menu.getAttribute('data-bound')) {
      return;
    }
    menu.setAttribute('data-bound', 'true');
    const summary = menu.querySelector('summary');

    function syncExpanded() {
      if (summary) {
        summary.setAttribute('aria-expanded', menu.hasAttribute('open') ? 'true' : 'false');
      }
    }

    function setOpen(isOpen) {
      if (isOpen) {
        menu.setAttribute('open', '');
      } else {
        menu.removeAttribute('open');
      }
      syncExpanded();
    }

    menu.addEventListener('toggle', function () {
      if (!menu.hasAttribute('open') && menu.matches(':hover')) {
        setOpen(true);
        return;
      }
      syncExpanded();
    });
    syncExpanded();

    menu.addEventListener('mouseenter', function () {
      setOpen(true);
    });

    menu.addEventListener('mouseleave', function () {
      setOpen(false);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        menu.removeAttribute('open');
        syncExpanded();
      }
    });

    document.addEventListener('click', function (event) {
      if (!menu.hasAttribute('open') || menu.contains(event.target)) {
        return;
      }
      menu.removeAttribute('open');
      syncExpanded();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !menu.hasAttribute('open')) {
        return;
      }
      menu.removeAttribute('open');
      syncExpanded();
      if (summary) {
        summary.focus();
      }
    });
  }

  function bindNav() {
    const roots = document.querySelectorAll('.portal-nav, .portal-account');
    roots.forEach(function (root) {
      if (!root || root.getAttribute('data-section-bound')) {
        return;
      }
      root.setAttribute('data-section-bound', 'true');
      root.addEventListener('click', function (event) {
        const link = event.target.closest('[data-portal-section]');
        if (!link) {
          return;
        }
        const section = link.getAttribute('data-portal-section');
        if (SECTIONS.indexOf(section) === -1) {
          return;
        }
        event.preventDefault();
        if (window.location.hash !== '#' + section) {
          window.location.hash = section;
        } else {
          showSection(section);
        }
      });
    });
    if (!hashBound) {
      hashBound = true;
      window.addEventListener('hashchange', function () {
        showSection(currentSection());
      });
    }
    bindAccountMenu();
  }

  function renderLists(bookings) {
    const stays = bookings.filter(function (booking) { return booking.kind === 'stay'; });
    const events = bookings.filter(function (booking) { return booking.kind === 'event'; });
    fillList(
      document.querySelector('[data-trip-list]'),
      bookings.filter(isUpcoming),
      'You have no upcoming trips. Book a stay and it will appear here after checkout.',
      'search.html',
      'Find a stay'
    );
    fillList(
      document.querySelector('[data-stay-list]'),
      stays,
      'No accommodation bookings yet.',
      'search.html',
      'Find a stay'
    );
    fillList(
      document.querySelector('[data-event-list]'),
      events,
      'No event tickets have been booked on this account.',
      'search.html',
      'Explore events'
    );
    renderPayments(bookings);
  }

  function render(user) {
    const dashboard = document.getElementById('account-dashboard');
    if (!dashboard || !user) {
      return;
    }
    bindNav();
    showSection(currentSection());

    const auth = window.AuthClient;
    if (!auth || typeof auth.listBookings !== 'function') {
      renderOverview([]);
      renderLists([]);
      return;
    }

    auth.listBookings().then(function (data) {
      const bookings = (data && Array.isArray(data.bookings)) ? data.bookings : [];
      renderOverview(bookings);
      renderLists(bookings);
    }).catch(function () {
      renderOverview([]);
      renderLists([]);
    });
  }

  window.AccountPortal = {
    render: render
  };

  if (document.readyState !== 'loading') {
    const dashboard = document.getElementById('account-dashboard');
    const user = window.AuthClient && typeof window.AuthClient.getUser === 'function'
      ? window.AuthClient.getUser()
      : null;
    if (dashboard && !dashboard.hidden && user) {
      render(user);
    }
  }
})();
