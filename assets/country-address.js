(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CountryAddress = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var COUNTRIES = [
    { id: 'Denmark', name: 'Denmark' },
    { id: 'Estonia', name: 'Estonia' },
    { id: 'Finland', name: 'Finland' },
    { id: 'Iceland', name: 'Iceland' },
    { id: 'Latvia', name: 'Latvia' },
    { id: 'Lithuania', name: 'Lithuania' },
    { id: 'Northeast England', name: 'Northeast England' },
    { id: 'Norway', name: 'Norway' },
    { id: 'Scotland', name: 'Scotland' },
    { id: 'Sweden', name: 'Sweden' },
    { id: 'Other', name: 'Other' }
  ];

  function field(id, label, options) {
    var opts = options || {};
    return {
      id: id,
      label: label,
      local: opts.local || '',
      required: opts.required !== false,
      optional: opts.required === false,
      placeholder: opts.placeholder || '',
      autocomplete: opts.autocomplete || 'off',
      inputmode: opts.inputmode || 'text',
      maxlength: opts.maxlength || 80,
      width: opts.width || 'full',
      hint: opts.hint || '',
      pattern: opts.pattern || ''
    };
  }

  var UK_FIELDS = [
    field('subBuilding', 'Flat / unit', {
      local: 'Sub-building',
      required: false,
      placeholder: 'Flat 2',
      width: 'half',
      maxlength: 40
    }),
    field('buildingName', 'Building name', {
      required: false,
      placeholder: 'Central Exchange',
      width: 'half',
      maxlength: 80
    }),
    field('streetNumber', 'Street number', {
      required: true,
      placeholder: '12',
      width: 'half',
      maxlength: 12
    }),
    field('streetName', 'Street name', {
      required: true,
      placeholder: 'Grey Street',
      autocomplete: 'address-line1',
      width: 'half',
      maxlength: 80
    }),
    field('locality', 'Locality', {
      required: false,
      placeholder: 'Quayside',
      autocomplete: 'address-level3',
      width: 'half',
      hint: 'Village, district, or dependent locality if used.'
    }),
    field('city', 'Post town', {
      required: true,
      placeholder: 'Newcastle upon Tyne',
      autocomplete: 'address-level2',
      width: 'half'
    }),
    field('postalCode', 'Postcode', {
      required: true,
      placeholder: 'NE1 6AE',
      autocomplete: 'postal-code',
      width: 'half',
      maxlength: 8,
      hint: 'Royal Mail format, for example EH1 1BB or NE1 6AE.'
    })
  ];

  var SCHEMAS = {
    Denmark: {
      hint: 'Danish addresses put the street and number first, then the 4-digit postcode and city on the next line.',
      fields: [
        field('streetName', 'Street name', { local: 'Gade', placeholder: 'Nørregade', autocomplete: 'address-line1', width: 'full' }),
        field('houseNumber', 'House number', { local: 'Husnummer', placeholder: '12', width: 'half', maxlength: 12 }),
        field('floor', 'Floor / door', { local: 'Etage / dør', required: false, placeholder: '3. tv', width: 'half', maxlength: 20, hint: 'Optional, for example st., 2. th, or 3. tv.' }),
        field('postalCode', 'Postal code', { local: 'Postnummer', placeholder: '1165', autocomplete: 'postal-code', inputmode: 'numeric', width: 'half', maxlength: 4, hint: '4 digits.' }),
        field('city', 'City', { local: 'By', placeholder: 'København K', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Estonia: {
      hint: 'Estonian addresses use street, house number, and optional apartment, then the 5-digit postcode and city.',
      fields: [
        field('streetName', 'Street name', { local: 'Tänav', placeholder: 'Pärnu mnt', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Maja', placeholder: '12', width: 'half', maxlength: 12 }),
        field('apartment', 'Apartment', { local: 'Korter', required: false, placeholder: '5', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Sihtnumber', placeholder: '10148', autocomplete: 'postal-code', inputmode: 'numeric', width: 'half', maxlength: 5, hint: '5 digits.' }),
        field('city', 'City', { local: 'Linn', placeholder: 'Tallinn', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Finland: {
      hint: 'Finnish addresses are street, number, optional staircase and apartment, then the 5-digit postcode and post town.',
      fields: [
        field('streetName', 'Street name', { local: 'Katu / gata', placeholder: 'Mannerheimintie', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Numero', placeholder: '12', width: 'third', maxlength: 12 }),
        field('staircase', 'Staircase', { local: 'Rappu', required: false, placeholder: 'A', width: 'third', maxlength: 4 }),
        field('apartment', 'Apartment', { local: 'Huoneisto', required: false, placeholder: '5', width: 'third', maxlength: 8 }),
        field('postalCode', 'Postal code', { local: 'Postinumero', placeholder: '00100', autocomplete: 'postal-code', inputmode: 'numeric', width: 'half', maxlength: 5, hint: '5 digits.' }),
        field('city', 'Post town', { local: 'Postitoimipaikka', placeholder: 'Helsinki', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Iceland: {
      hint: 'Icelandic addresses are street and house number, then the 3-digit postcode and town.',
      fields: [
        field('streetName', 'Street name', { local: 'Gata', placeholder: 'Laugavegur', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Húsnúmer', placeholder: '11', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Póstnúmer', placeholder: '101', autocomplete: 'postal-code', inputmode: 'numeric', width: 'half', maxlength: 3, hint: '3 digits.' }),
        field('city', 'Town', { local: 'Bær', placeholder: 'Reykjavík', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Latvia: {
      hint: 'Latvian addresses list the street, house, and apartment, then the postcode and city.',
      fields: [
        field('streetName', 'Street name', { local: 'Iela', placeholder: 'Brīvības iela', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Mājas nr.', placeholder: '76', width: 'half', maxlength: 12 }),
        field('apartment', 'Apartment', { local: 'Dzīvokļa nr.', required: false, placeholder: '3', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Pasta indekss', placeholder: 'LV-1011', autocomplete: 'postal-code', width: 'half', maxlength: 7, hint: 'LV- and 4 digits, for example LV-1011.' }),
        field('city', 'City', { local: 'Pilsēta', placeholder: 'Rīga', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Lithuania: {
      hint: 'Lithuanian addresses use street, house number, and optional flat, then the postcode and city.',
      fields: [
        field('streetName', 'Street name', { local: 'Gatvė', placeholder: 'Gedimino pr.', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Namo nr.', placeholder: '9', width: 'half', maxlength: 12 }),
        field('apartment', 'Apartment', { local: 'Buto nr.', required: false, placeholder: '1', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Pašto kodas', placeholder: '01103', autocomplete: 'postal-code', width: 'half', maxlength: 8, hint: '5 digits, optionally prefixed with LT-.' }),
        field('city', 'City', { local: 'Miestas', placeholder: 'Vilnius', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Norway: {
      hint: 'Norwegian addresses put the street and number first, then the 4-digit postcode and post town.',
      fields: [
        field('streetName', 'Street name', { local: 'Gate', placeholder: 'Karl Johans gate', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Nummer', placeholder: '15', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Postnummer', placeholder: '0154', autocomplete: 'postal-code', inputmode: 'numeric', width: 'half', maxlength: 4, hint: '4 digits.' }),
        field('city', 'Post town', { local: 'Poststed', placeholder: 'Oslo', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Sweden: {
      hint: 'Swedish addresses are street and number, then the postcode (written as 123 45) and post town.',
      fields: [
        field('streetName', 'Street name', { local: 'Gata', placeholder: 'Drottninggatan', autocomplete: 'address-line1' }),
        field('houseNumber', 'House number', { local: 'Nummer', placeholder: '12', width: 'half', maxlength: 12 }),
        field('postalCode', 'Postal code', { local: 'Postnummer', placeholder: '111 51', autocomplete: 'postal-code', width: 'half', maxlength: 6, hint: '5 digits, usually written as 111 51.' }),
        field('city', 'Post town', { local: 'Postort', placeholder: 'Stockholm', autocomplete: 'address-level2', width: 'half' })
      ]
    },
    Scotland: {
      hint: 'Scottish addresses follow Royal Mail order: optional flat and building, number and street, optional locality, post town, then postcode.',
      fields: UK_FIELDS.map(function (item) {
        if (item.id === 'city') {
          return Object.assign({}, item, { placeholder: 'Edinburgh' });
        }
        if (item.id === 'streetName') {
          return Object.assign({}, item, { placeholder: 'Princes Street' });
        }
        if (item.id === 'postalCode') {
          return Object.assign({}, item, { placeholder: 'EH2 2AN' });
        }
        return item;
      })
    },
    'Northeast England': {
      hint: 'Northeast England addresses follow Royal Mail order: optional flat and building, number and street, optional locality, post town, then postcode.',
      fields: UK_FIELDS
    },
    Other: {
      hint: 'Enter the address in the order it is written on local post, including the country name.',
      fields: [
        field('line1', 'Address line 1', { placeholder: 'Street and building', autocomplete: 'address-line1' }),
        field('line2', 'Address line 2', { required: false, placeholder: 'Area, district, or additional line', autocomplete: 'address-line2' }),
        field('city', 'City / town', { placeholder: 'City', autocomplete: 'address-level2', width: 'half' }),
        field('region', 'Region / county', { required: false, placeholder: 'Region', autocomplete: 'address-level1', width: 'half' }),
        field('postalCode', 'Postal code', { required: false, placeholder: 'Postal code', autocomplete: 'postal-code', width: 'half' }),
        field('countryName', 'Country', { placeholder: 'Country', autocomplete: 'country-name', width: 'half' })
      ]
    }
  };

  var UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

  function trimValue(value) {
    return String(value == null ? '' : value).trim();
  }

  function compact(parts) {
    return parts.map(trimValue).filter(Boolean);
  }

  function joinLine(parts, separator) {
    return compact(parts).join(separator || ' ');
  }

  function joinAddress(lines) {
    return compact(lines).join('\n');
  }

  function digitsOnly(value) {
    return trimValue(value).replace(/\D/g, '');
  }

  function formatUkPostcode(value) {
    var compactCode = trimValue(value).toUpperCase().replace(/\s+/g, '');
    if (compactCode.length < 5) {
      return compactCode;
    }
    return compactCode.slice(0, -3) + ' ' + compactCode.slice(-3);
  }

  function formatSwedishPostcode(value) {
    var digits = digitsOnly(value);
    if (digits.length === 5) {
      return digits.slice(0, 3) + ' ' + digits.slice(3);
    }
    return trimValue(value);
  }

  function formatLatvianPostcode(value) {
    var digits = digitsOnly(value);
    if (digits.length === 4) {
      return 'LV-' + digits;
    }
    return trimValue(value).toUpperCase();
  }

  function formatLithuanianPostcode(value) {
    var digits = digitsOnly(value);
    if (digits.length === 5) {
      return digits;
    }
    return trimValue(value).toUpperCase();
  }

  function getSchema(countryId) {
    return SCHEMAS[countryId] || null;
  }

  function getCountry(countryId) {
    for (var i = 0; i < COUNTRIES.length; i += 1) {
      if (COUNTRIES[i].id === countryId) {
        return COUNTRIES[i];
      }
    }
    return null;
  }

  function normalizeValues(countryId, values) {
    var next = {};
    var schema = getSchema(countryId);
    var source = values || {};
    var i;
    var key;
    if (!schema) {
      return next;
    }
    for (i = 0; i < schema.fields.length; i += 1) {
      key = schema.fields[i].id;
      next[key] = trimValue(source[key]);
    }
    if (countryId === 'Denmark' || countryId === 'Estonia' || countryId === 'Finland' || countryId === 'Iceland' || countryId === 'Norway') {
      if (next.postalCode) {
        next.postalCode = digitsOnly(next.postalCode);
      }
    } else if (countryId === 'Sweden') {
      next.postalCode = formatSwedishPostcode(next.postalCode);
    } else if (countryId === 'Latvia') {
      next.postalCode = formatLatvianPostcode(next.postalCode);
    } else if (countryId === 'Lithuania') {
      next.postalCode = formatLithuanianPostcode(next.postalCode);
    } else if (countryId === 'Scotland' || countryId === 'Northeast England') {
      next.postalCode = formatUkPostcode(next.postalCode);
    }
    return next;
  }

  function postalError(countryId, postalCode) {
    if (countryId === 'Denmark' && !/^\d{4}$/.test(postalCode)) {
      return 'Danish postcodes are 4 digits, for example 1165.';
    }
    if (countryId === 'Estonia' && !/^\d{5}$/.test(postalCode)) {
      return 'Estonian postcodes are 5 digits, for example 10148.';
    }
    if (countryId === 'Finland' && !/^\d{5}$/.test(postalCode)) {
      return 'Finnish postcodes are 5 digits, for example 00100.';
    }
    if (countryId === 'Iceland' && !/^\d{3}$/.test(postalCode)) {
      return 'Icelandic postcodes are 3 digits, for example 101.';
    }
    if (countryId === 'Norway' && !/^\d{4}$/.test(postalCode)) {
      return 'Norwegian postcodes are 4 digits, for example 0154.';
    }
    if (countryId === 'Sweden' && !/^\d{3}\s\d{2}$/.test(postalCode)) {
      return 'Swedish postcodes are 5 digits, written as 111 51.';
    }
    if (countryId === 'Latvia' && !/^LV-\d{4}$/.test(postalCode)) {
      return 'Latvian postcodes use LV- and 4 digits, for example LV-1011.';
    }
    if (countryId === 'Lithuania' && !/^\d{5}$/.test(postalCode)) {
      return 'Lithuanian postcodes are 5 digits, for example 01103.';
    }
    if ((countryId === 'Scotland' || countryId === 'Northeast England') && !UK_POSTCODE.test(postalCode)) {
      return 'Enter a valid postcode, for example EH2 2AN or NE1 6AE.';
    }
    return '';
  }

  function streetLine(values) {
    return joinLine([values.streetName, values.houseNumber]);
  }

  function formatAddress(countryId, values, extras) {
    var data = normalizeValues(countryId, values);
    var extra = extras || {};
    var companyName = trimValue(extra.companyName);
    var regionLabel = countryId === 'Other' ? trimValue(data.countryName) : countryId;
    var lines;

    if (countryId === 'Denmark') {
      lines = [
        companyName,
        joinLine([streetLine(data), data.floor], ', '),
        joinLine([data.postalCode, data.city]),
        regionLabel
      ];
    } else if (countryId === 'Finland') {
      lines = [
        companyName,
        joinLine([data.streetName, data.houseNumber, data.staircase, data.apartment]),
        joinLine([data.postalCode, data.city]),
        regionLabel
      ];
    } else if (countryId === 'Estonia' || countryId === 'Lithuania') {
      lines = [
        companyName,
        data.apartment ? streetLine(data) + '-' + data.apartment : streetLine(data),
        joinLine([data.postalCode, data.city]),
        regionLabel
      ];
    } else if (countryId === 'Latvia') {
      lines = [
        companyName,
        data.apartment ? streetLine(data) + '–' + data.apartment : streetLine(data),
        joinLine([data.postalCode, data.city], ', '),
        regionLabel
      ];
    } else if (countryId === 'Scotland' || countryId === 'Northeast England') {
      lines = [
        companyName,
        data.subBuilding,
        data.buildingName,
        joinLine([data.streetNumber, data.streetName]),
        data.locality,
        data.city,
        data.postalCode,
        regionLabel
      ];
    } else if (countryId === 'Other') {
      lines = [
        companyName,
        data.line1,
        data.line2,
        data.city,
        data.region,
        data.postalCode,
        regionLabel
      ];
    } else {
      lines = [
        companyName,
        streetLine(data),
        joinLine([data.postalCode, data.city]),
        regionLabel
      ];
    }

    return joinAddress(lines);
  }

  function validateAddress(countryId, values, extras) {
    var schema = getSchema(countryId);
    var extra = extras || {};
    var normalized;
    var errors = {};
    var missing = [];
    var i;
    var item;
    var postalMessage;

    if (!countryId || !getCountry(countryId)) {
      return {
        ok: false,
        message: 'Please select the country or region of the business address.',
        errors: { country: 'Required' },
        values: {},
        formatted: ''
      };
    }
    if (!schema) {
      return {
        ok: false,
        message: 'Please select a supported country or region.',
        errors: { country: 'Unsupported' },
        values: {},
        formatted: ''
      };
    }

    normalized = normalizeValues(countryId, values);
    for (i = 0; i < schema.fields.length; i += 1) {
      item = schema.fields[i];
      if (item.required && !normalized[item.id]) {
        errors[item.id] = 'Required';
        missing.push(item.label);
      }
    }

    if (normalized.postalCode) {
      postalMessage = postalError(countryId, normalized.postalCode);
      if (postalMessage) {
        errors.postalCode = postalMessage;
      }
    }

    if (missing.length) {
      return {
        ok: false,
        message: 'Please complete the business address: ' + missing.join(', ') + '.',
        errors: errors,
        values: normalized,
        formatted: ''
      };
    }
    if (errors.postalCode) {
      return {
        ok: false,
        message: errors.postalCode,
        errors: errors,
        values: normalized,
        formatted: ''
      };
    }

    return {
      ok: true,
      message: '',
      errors: {},
      values: normalized,
      formatted: formatAddress(countryId, normalized, extra)
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function widthClass(width) {
    if (width === 'half') {
      return 'form-group--3';
    }
    if (width === 'third') {
      return 'form-group--2';
    }
    return 'form-group--6';
  }

  function renderFields(container, countryId, previousValues) {
    var schema = getSchema(countryId);
    var values = previousValues || {};
    var html;
    var i;
    var item;
    var local;
    var inputId;

    if (!container) {
      return;
    }
    if (!schema) {
      container.innerHTML = '<p class="address-empty">Select a country or region to enter the postal address in that local format.</p>';
      return;
    }

    html = schema.hint ? '<p class="address-hint">' + escapeHtml(schema.hint) + '</p>' : '';
    for (i = 0; i < schema.fields.length; i += 1) {
      item = schema.fields[i];
      local = item.local ? ' <span class="field-local">(' + escapeHtml(item.local) + ')</span>' : '';
      inputId = 'address-' + item.id;
      html += '<div class="form-group ' + widthClass(item.width) + '">';
      html += '<label for="' + inputId + '">' + escapeHtml(item.label) + local;
      if (item.required) {
        html += ' <span class="required" aria-hidden="true">*</span>';
      }
      html += '</label>';
      html += '<input id="' + inputId + '" name="address-' + escapeHtml(item.id) + '" type="text"';
      html += ' data-address-field="' + escapeHtml(item.id) + '"';
      html += ' autocomplete="' + escapeHtml(item.autocomplete) + '"';
      html += ' inputmode="' + escapeHtml(item.inputmode) + '"';
      html += ' maxlength="' + String(item.maxlength) + '"';
      html += ' placeholder="' + escapeHtml(item.placeholder) + '"';
      if (values[item.id]) {
        html += ' value="' + escapeHtml(values[item.id]) + '"';
      }
      if (item.required) {
        html += ' required';
      }
      html += '>';
      if (item.hint) {
        html += '<small class="field-hint">' + escapeHtml(item.hint) + '</small>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  function collectValues(container) {
    var values = {};
    if (!container) {
      return values;
    }
    Array.prototype.forEach.call(container.querySelectorAll('[data-address-field]'), function (input) {
      values[input.getAttribute('data-address-field')] = input.value;
    });
    return values;
  }

  function fillCountryOptions(select) {
    var current;
    var i;
    var option;
    if (!select) {
      return;
    }
    current = select.value;
    select.innerHTML = '<option value="">Select country or region</option>';
    for (i = 0; i < COUNTRIES.length; i += 1) {
      option = document.createElement('option');
      option.value = COUNTRIES[i].id;
      option.textContent = COUNTRIES[i].name;
      select.appendChild(option);
    }
    if (current) {
      select.value = current;
    }
  }

  function bindForm(form) {
    var countrySelect;
    var fieldsRoot;
    var previewRoot;
    var previewText;
    var companyInput;

    if (!form || form.getAttribute('data-address-bound') === 'true') {
      return;
    }

    countrySelect = form.querySelector('#country');
    fieldsRoot = form.querySelector('#address-fields');
    previewRoot = form.querySelector('#address-preview');
    previewText = form.querySelector('#address-preview-text');
    companyInput = form.querySelector('#companyName');
    if (!countrySelect || !fieldsRoot) {
      return;
    }

    form.setAttribute('data-address-bound', 'true');
    fillCountryOptions(countrySelect);

    function refreshPreview() {
      var result = validateAddress(
        countrySelect.value,
        collectValues(fieldsRoot),
        { companyName: companyInput ? companyInput.value : '' }
      );
      if (!previewRoot || !previewText) {
        return;
      }
      if (result.formatted) {
        previewRoot.hidden = false;
        previewText.textContent = result.formatted;
      } else {
        previewRoot.hidden = true;
        previewText.textContent = '';
      }
    }

    function renderForCountry() {
      var previous = collectValues(fieldsRoot);
      renderFields(fieldsRoot, countrySelect.value, previous);
      refreshPreview();
    }

    countrySelect.addEventListener('change', renderForCountry);
    fieldsRoot.addEventListener('input', refreshPreview);
    if (companyInput) {
      companyInput.addEventListener('input', refreshPreview);
    }
    renderForCountry();
  }

  function init() {
    var form = document.getElementById('registerForm');
    if (form && form.querySelector('#address-fields')) {
      bindForm(form);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }

  return {
    countries: COUNTRIES,
    getCountry: getCountry,
    getSchema: getSchema,
    renderFields: renderFields,
    collectValues: collectValues,
    formatAddress: formatAddress,
    validateAddress: validateAddress,
    normalizeValues: normalizeValues,
    bindForm: bindForm
  };
});
