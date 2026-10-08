/**
 * Birth-date calendar for personal registration.
 * Opens a month grid so a client can pick a day, month, and year.
 * Typed values stay in European day/month/year form.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BirthDateCalendar = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MIN_YEAR = 1900;
  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function todayParts(now) {
    var date = now || new Date();
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  function adultCutoff(now) {
    var api = datesApi();
    if (api && typeof api.latestAdultISO === 'function') {
      var iso = api.latestAdultISO(now);
      return {
        year: Number(iso.slice(0, 4)),
        month: Number(iso.slice(5, 7)),
        day: Number(iso.slice(8, 10))
      };
    }
    var actual = todayParts(now);
    var year = actual.year - 18;
    var month = actual.month;
    var day = actual.day;
    var count = daysInMonth(year, month);
    if (day > count) {
      day = count;
    }
    return { year: year, month: month, day: day };
  }

  function isAfter(year, month, day, today) {
    if (year !== today.year) {
      return year > today.year;
    }
    if (month !== today.month) {
      return month > today.month;
    }
    return day > today.day;
  }

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function mondayIndex(year, month) {
    var jsDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return (jsDay + 6) % 7;
  }

  function toISO(year, month, day) {
    return String(year) + '-' + pad(month) + '-' + pad(day);
  }

  function buildMonth(year, month, today, selectedISO) {
    var cells = [];
    var lead = mondayIndex(year, month);
    var count = daysInMonth(year, month);
    var cursor = today || todayParts();
    var i;
    for (i = 0; i < lead; i += 1) {
      cells.push({ type: 'pad' });
    }
    for (i = 1; i <= count; i += 1) {
      var iso = toISO(year, month, i);
      cells.push({
        type: 'day',
        day: i,
        iso: iso,
        disabled: isAfter(year, month, i, cursor),
        selected: iso === selectedISO
      });
    }
    return {
      year: year,
      month: month,
      label: MONTHS[month - 1] + ' ' + year,
      cells: cells
    };
  }

  function clampView(year, month, today) {
    var nextYear = year;
    var nextMonth = month;
    if (nextYear < MIN_YEAR) {
      nextYear = MIN_YEAR;
      nextMonth = 1;
    }
    if (nextYear > today.year || (nextYear === today.year && nextMonth > today.month)) {
      nextYear = today.year;
      nextMonth = today.month;
    }
    if (nextMonth < 1) {
      nextMonth = 1;
    }
    if (nextMonth > 12) {
      nextMonth = 12;
    }
    return { year: nextYear, month: nextMonth };
  }

  function shiftMonth(year, month, delta, today) {
    var nextMonth = month + delta;
    var nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    return clampView(nextYear, nextMonth, today);
  }

  function defaultView(today) {
    var year = today.year - 30;
    if (year < MIN_YEAR) {
      year = MIN_YEAR;
    }
    return clampView(year, today.month, today);
  }

  function datesApi() {
    if (typeof globalThis !== 'undefined' && globalThis.BookingDates) {
      return globalThis.BookingDates;
    }
    return null;
  }

  function bind(options) {
    var input = options && options.input;
    var button = options && options.button;
    var dialog = options && options.dialog;
    if (!input || !button || !dialog || typeof document === 'undefined') {
      return null;
    }

    var today = adultCutoff();
    var view = defaultView(today);
    var selectedISO = '';
    var open = false;

    function readSelection() {
      selectedISO = '';
      var api = datesApi();
      var result = api && typeof api.validateBirthDate === 'function'
        ? api.validateBirthDate(input.value)
        : null;
      if (result && result.ok) {
        selectedISO = result.iso;
        view = clampView(
          Number(result.iso.slice(0, 4)),
          Number(result.iso.slice(5, 7)),
          today
        );
      }
    }

    function setOpen(next) {
      open = Boolean(next);
      dialog.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function optionList(items, selectedValue, isDisabled) {
      return items.map(function (item) {
        var disabled = isDisabled ? isDisabled(item) : false;
        return '<option value="' + item.value + '"' +
          (item.value === selectedValue ? ' selected' : '') +
          (disabled ? ' disabled' : '') + '>' + item.label + '</option>';
      }).join('');
    }

    function render(focusSelector) {
      var month = buildMonth(view.year, view.month, today, selectedISO);
      var canPrev = !(view.year === MIN_YEAR && view.month === 1);
      var canNext = !(view.year === today.year && view.month === today.month);
      var monthOptions = MONTHS.map(function (name, index) {
        return { value: index + 1, label: name };
      });
      var yearOptions = [];
      var year;
      for (year = today.year; year >= MIN_YEAR; year -= 1) {
        yearOptions.push({ value: year, label: String(year) });
      }
      var html = '';
      html += '<div class="birth-calendar__header">';
      html += '<button type="button" class="birth-calendar__nav" data-cal-nav="-1"' +
        (canPrev ? '' : ' disabled') + ' aria-label="Previous month">&#8249;</button>';
      html += '<div class="birth-calendar__selects">';
      html += '<label class="sr-only" for="' + input.id + '-month">Month</label>';
      html += '<select id="' + input.id + '-month" data-cal-month aria-label="Month">';
      html += optionList(monthOptions, view.month, function (item) {
        return view.year === today.year && item.value > today.month;
      });
      html += '</select>';
      html += '<label class="sr-only" for="' + input.id + '-year">Year</label>';
      html += '<select id="' + input.id + '-year" data-cal-year aria-label="Year">';
      html += optionList(yearOptions, view.year);
      html += '</select></div>';
      html += '<button type="button" class="birth-calendar__nav" data-cal-nav="1"' +
        (canNext ? '' : ' disabled') + ' aria-label="Next month">&#8250;</button>';
      html += '</div>';
      html += '<div class="birth-calendar__weekdays" aria-hidden="true">';
      WEEKDAYS.forEach(function (label) {
        html += '<span>' + label + '</span>';
      });
      html += '</div>';
      html += '<div class="birth-calendar__days" role="grid" aria-label="' + month.label + '">';
      month.cells.forEach(function (cell) {
        if (cell.type !== 'day') {
          html += '<span class="birth-calendar__pad"></span>';
          return;
        }
        html += '<button type="button" class="birth-calendar__day' +
          (cell.selected ? ' is-selected' : '') + '" role="gridcell" data-cal-day="' + cell.iso + '"' +
          (cell.disabled ? ' disabled' : '') +
          (cell.selected ? ' aria-selected="true"' : ' aria-selected="false"') +
          '>' + cell.day + '</button>';
      });
      html += '</div>';
      dialog.innerHTML = html;
      if (focusSelector) {
        var focusTarget = dialog.querySelector(focusSelector);
        if (focusTarget && typeof focusTarget.focus === 'function') {
          focusTarget.focus();
        }
      }
    }

    function openCalendar() {
      today = adultCutoff();
      readSelection();
      if (!selectedISO) {
        view = defaultView(today);
      }
      setOpen(true);
      render('[data-cal-year]');
    }

    function closeCalendar(restoreFocus) {
      setOpen(false);
      if (restoreFocus && typeof button.focus === 'function') {
        button.focus();
      }
    }

    function applyDate(iso) {
      var api = datesApi();
      input.value = api && typeof api.toEuropean === 'function' ? (api.toEuropean(iso) || iso) : iso;
      selectedISO = iso;
      if (typeof input.setCustomValidity === 'function') {
        input.setCustomValidity('');
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closeCalendar(false);
      if (typeof input.focus === 'function') {
        input.focus();
      }
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (open) {
        closeCalendar(false);
      } else {
        openCalendar();
      }
    });

    dialog.addEventListener('click', function (event) {
      var nav = event.target.closest('[data-cal-nav]');
      if (nav && !nav.disabled) {
        var delta = Number(nav.getAttribute('data-cal-nav'));
        view = shiftMonth(view.year, view.month, delta, today);
        render('[data-cal-nav="' + delta + '"]');
        return;
      }
      var day = event.target.closest('[data-cal-day]');
      if (day && !day.disabled) {
        applyDate(day.getAttribute('data-cal-day'));
      }
    });

    dialog.addEventListener('change', function (event) {
      var target = event.target;
      if (target.matches('[data-cal-month]')) {
        view = clampView(view.year, Number(target.value), today);
        render('[data-cal-month]');
        return;
      }
      if (target.matches('[data-cal-year]')) {
        view = clampView(Number(target.value), view.month, today);
        render('[data-cal-year]');
      }
    });

    document.addEventListener('click', function (event) {
      if (!open) {
        return;
      }
      if (dialog.contains(event.target) || button.contains(event.target)) {
        return;
      }
      closeCalendar(false);
    });

    document.addEventListener('keydown', function (event) {
      if (!open || event.key !== 'Escape') {
        return;
      }
      event.preventDefault();
      closeCalendar(true);
    });

    input.addEventListener('input', function () {
      if (typeof input.setCustomValidity === 'function') {
        input.setCustomValidity('');
      }
      var api = datesApi();
      if (!api || typeof api.maskInput !== 'function') {
        return;
      }
      var start = input.selectionStart;
      var raw = input.value;
      var digitsBefore = raw.slice(0, start == null ? raw.length : start).replace(/\D/g, '').length;
      var masked = api.maskInput(raw);
      if (input.value === masked) {
        return;
      }
      input.value = masked;
      var pos = 0;
      var seen = 0;
      while (pos < masked.length && seen < digitsBefore) {
        if (/\d/.test(masked.charAt(pos))) {
          seen += 1;
        }
        pos += 1;
      }
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(pos, pos);
      }
    });

    return {
      open: openCalendar,
      close: closeCalendar
    };
  }

  function init(scope) {
    var rootNode = scope && scope.querySelector ? scope : (typeof document !== 'undefined' ? document : null);
    if (!rootNode) {
      return null;
    }
    var field = rootNode.querySelector('[data-birth-calendar]');
    if (!field || field.getAttribute('data-birth-calendar-ready') === 'true') {
      return null;
    }
    var input = field.querySelector('#birthDate');
    var button = field.querySelector('[data-birth-calendar-open]');
    var dialog = field.querySelector('[data-birth-calendar-dialog]');
    if (!input || !button || !dialog) {
      return null;
    }
    field.setAttribute('data-birth-calendar-ready', 'true');
    return bind({ input: input, button: button, dialog: dialog });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        init(document);
      }, { once: true });
    } else {
      init(document);
    }
  }

  return {
    MIN_YEAR: MIN_YEAR,
    MONTHS: MONTHS,
    WEEKDAYS: WEEKDAYS,
    todayParts: todayParts,
    adultCutoff: adultCutoff,
    buildMonth: buildMonth,
    shiftMonth: shiftMonth,
    clampView: clampView,
    defaultView: defaultView,
    isAfter: isAfter,
    bind: bind,
    init: init
  };
});
