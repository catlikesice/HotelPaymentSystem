/**
 * Shared Adults / Children dropdown under a single Guests field.
 * Used by the homepage search bar.
 */
(function () {
  'use strict';

  var MIN_ADULTS = 1;
  var MAX_ADULTS = 20;
  var MIN_CHILDREN = 0;
  var MAX_CHILDREN = 10;

  function parseGuestCount(value, min, max, fallback) {
    var parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, parsed));
  }

  function formatSummary(adults, children) {
    var parts = [adults === 1 ? '1 adult' : adults + ' adults'];
    if (children > 0) {
      parts.push(children === 1 ? '1 child' : children + ' children');
    }
    return parts.join(', ');
  }

  function closestPicker(el) {
    if (!el || !el.closest) {
      return null;
    }
    return el.closest('[data-guest-picker]');
  }

  function readCounts(root) {
    var adultsInput = root.querySelector('[data-guest-adults]');
    var childrenInput = root.querySelector('[data-guest-children]');
    return {
      adults: parseGuestCount(adultsInput && adultsInput.value, MIN_ADULTS, MAX_ADULTS, MIN_ADULTS),
      children: parseGuestCount(childrenInput && childrenInput.value, MIN_CHILDREN, MAX_CHILDREN, MIN_CHILDREN),
      adultsInput: adultsInput,
      childrenInput: childrenInput
    };
  }

  function sync(root) {
    if (!root) {
      return;
    }

    var counts = readCounts(root);
    if (counts.adultsInput) {
      counts.adultsInput.value = String(counts.adults);
    }
    if (counts.childrenInput) {
      counts.childrenInput.value = String(counts.children);
    }

    var summary = root.querySelector('[data-guest-summary]');
    if (summary) {
      summary.textContent = formatSummary(counts.adults, counts.children);
    }

    root.querySelectorAll('[data-guest-step]').forEach(function (button) {
      var kind = button.getAttribute('data-guest-step');
      var delta = parseInt(button.getAttribute('data-guest-delta'), 10) || 0;
      var current = kind === 'children' ? counts.children : counts.adults;
      var min = kind === 'children' ? MIN_CHILDREN : MIN_ADULTS;
      var max = kind === 'children' ? MAX_CHILDREN : MAX_ADULTS;
      var next = current + delta;
      button.disabled = next < min || next > max;
    });
  }

  function setOpen(root, open) {
    var toggle = root.querySelector('[data-guest-toggle]');
    var menu = root.querySelector('[data-guest-menu]');
    if (!toggle || !menu) {
      return;
    }

    if (open) {
      closeAll(root);
      menu.hidden = false;
      root.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      menu.hidden = true;
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function closeAll(exceptRoot) {
    document.querySelectorAll('[data-guest-picker].is-open').forEach(function (picker) {
      if (picker !== exceptRoot) {
        setOpen(picker, false);
      }
    });
  }

  function step(root, kind, delta) {
    var counts = readCounts(root);
    var input = kind === 'children' ? counts.childrenInput : counts.adultsInput;
    var min = kind === 'children' ? MIN_CHILDREN : MIN_ADULTS;
    var max = kind === 'children' ? MAX_CHILDREN : MAX_ADULTS;
    var current = kind === 'children' ? counts.children : counts.adults;
    if (!input) {
      return;
    }

    input.value = String(Math.max(min, Math.min(max, current + delta)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function initPicker(root) {
    if (!root || root.getAttribute('data-guest-picker-ready') === 'true') {
      return;
    }
    root.setAttribute('data-guest-picker-ready', 'true');

    var toggle = root.querySelector('[data-guest-toggle]');
    var menu = root.querySelector('[data-guest-menu]');
    if (!toggle || !menu) {
      return;
    }

    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    sync(root);

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      setOpen(root, !root.classList.contains('is-open'));
    });

    root.querySelectorAll('[data-guest-step]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        step(root, button.getAttribute('data-guest-step'), parseInt(button.getAttribute('data-guest-delta'), 10) || 0);
      });
    });

    root.querySelectorAll('[data-guest-adults], [data-guest-children]').forEach(function (input) {
      input.addEventListener('input', function () {
        sync(root);
      });
      input.addEventListener('change', function () {
        sync(root);
      });
    });
  }

  function initAll() {
    document.querySelectorAll('[data-guest-picker]').forEach(initPicker);
  }

  document.addEventListener('pointerdown', function (event) {
    var picker = closestPicker(event.target);
    document.querySelectorAll('[data-guest-picker].is-open').forEach(function (openPicker) {
      if (openPicker !== picker) {
        setOpen(openPicker, false);
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }
    var openPicker = document.querySelector('[data-guest-picker].is-open');
    if (!openPicker) {
      return;
    }
    setOpen(openPicker, false);
    var toggle = openPicker.querySelector('[data-guest-toggle]');
    if (toggle) {
      toggle.focus();
    }
  });

  window.GuestPicker = {
    init: initAll,
    sync: sync,
    open: function (root) {
      if (root) {
        setOpen(root, true);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
