;(function () {
  const PENDING_CHECKOUT_KEY = 'bh_pending_checkout';

  function readPending() {
    try {
      const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function clearPending() {
    try {
      window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch (error) {
      // no-op
    }
  }

  function formatDate(value) {
    if (window.BookingDates && typeof window.BookingDates.toEuropean === 'function') {
      return window.BookingDates.toEuropean(value) || value || '';
    }
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : (value || '');
  }

  function formatAmount(amount, currency, decimals) {
    const numeric = Number(amount);
    const places = Number.isFinite(decimals) ? decimals : 4;
    if (!Number.isFinite(numeric)) {
      return '';
    }
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: Math.min(2, places),
      maximumFractionDigits: places
    }) + ' ' + (currency || 'ETH');
  }

  function guestLabel(guests) {
    const adults = guests && Number(guests.adults);
    const children = guests && Number(guests.children);
    const parts = [];
    if (Number.isFinite(adults) && adults > 0) {
      parts.push(adults === 1 ? '1 adult' : adults + ' adults');
    }
    if (Number.isFinite(children) && children > 0) {
      parts.push(children === 1 ? '1 child' : children + ' children');
    }
    return parts.join(', ') || '1 adult';
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = value || '';
    }
  }

  function showPanel(id) {
    ['checkout-empty', 'checkout-auth', 'checkout-summary', 'checkout-success'].forEach(function (panelId) {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.hidden = panelId !== id;
      }
    });
  }

  function setStatus(message, kind) {
    const status = document.getElementById('checkout-status');
    if (!status) {
      return;
    }
    status.textContent = message || '';
    status.className = 'auth-status' + (kind ? ' auth-status--' + kind : '');
  }

  function refresh() {
    const pending = readPending();
    const user = window.AuthClient ? window.AuthClient.getUser() : null;
    const success = document.getElementById('checkout-success');
    if (success && !success.hidden && success.getAttribute('data-complete') === 'true') {
      return;
    }

    if (!pending || !pending.propertyName) {
      showPanel('checkout-empty');
      return;
    }

    if (!pending.hasDates || !pending.checkInDate || !pending.checkOutDate) {
      showPanel('checkout-empty');
      setStatus('Choose check-in and check-out dates before paying.', 'error');
      return;
    }

    setText('[data-checkout-property]', pending.propertyName);
    setText(
      '[data-checkout-place]',
      [pending.city, pending.country].filter(Boolean).join(', ')
    );
    const nightsLabel = pending.nights === 1 ? '1 night' : pending.nights + ' nights';
    setText(
      '[data-checkout-dates]',
      formatDate(pending.checkInDate) + ' – ' + formatDate(pending.checkOutDate) + ' (' + nightsLabel + ')'
    );
    setText('[data-checkout-guests]', guestLabel(pending.guests));
    setText('[data-checkout-total]', formatAmount(pending.amount, pending.currency, pending.decimals));

    const roomRow = document.querySelector('[data-checkout-row="room"]');
    if (roomRow) {
      roomRow.hidden = !pending.roomLabel;
      setText('[data-checkout-room]', pending.roomLabel);
    }

    if (!user || !user.id) {
      showPanel('checkout-auth');
      return;
    }

    showPanel('checkout-summary');
  }

  function bindConfirm() {
    const button = document.getElementById('checkout-confirm');
    if (!button || button.getAttribute('data-bound')) {
      return;
    }
    button.setAttribute('data-bound', 'true');
    button.addEventListener('click', function () {
      const pending = readPending();
      const auth = window.AuthClient;
      if (!pending || !auth || typeof auth.createBooking !== 'function') {
        setStatus('Checkout is not ready. Please refresh and try again.', 'error');
        return;
      }
      if (!pending.hasDates) {
        setStatus('Choose stay dates before paying.', 'error');
        return;
      }

      button.disabled = true;
      button.textContent = 'Confirming payment...';
      setStatus('');

      auth.createBooking({
        kind: 'stay',
        propertyName: pending.propertyName,
        propertyUrl: pending.propertyUrl,
        city: pending.city,
        country: pending.country,
        checkInDate: pending.checkInDate,
        checkOutDate: pending.checkOutDate,
        guests: pending.guests,
        roomLabel: pending.roomLabel,
        addOns: pending.addOns,
        amount: pending.amount,
        currency: pending.currency
      }).then(function (data) {
        const booking = data && data.booking;
        clearPending();
        setText('[data-checkout-confirmation]', booking && booking.confirmationCode);
        const success = document.getElementById('checkout-success');
        if (success) {
          success.setAttribute('data-complete', 'true');
        }
        showPanel('checkout-success');
        setStatus('Payment confirmed.', 'success');
      }).catch(function (error) {
        setStatus(error.message || 'Unable to complete booking.', 'error');
        button.disabled = false;
        button.textContent = 'Confirm crypto payment';
      });
    });
  }

  function init() {
    if (!document.getElementById('checkout-page')) {
      return;
    }
    bindConfirm();
    refresh();
    if (window.AuthClient && typeof window.AuthClient.me === 'function') {
      window.AuthClient.me().then(function () {
        refresh();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.CheckoutPage = {
    refresh: refresh
  };
})();
