;(function() {
  const LANGUAGE_COOKIE_NAME = 'preferredLanguage';
  const LANGUAGE_COOKIE_LIFETIME_DAYS = 365;
  const LANGUAGE_CHANGE_EVENT = 'preferredLanguageChange';

  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const secure = window.location && window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
  }

  function getCookie(name) {
    const encoded = encodeURIComponent(name);
    const cookieString = document.cookie ? document.cookie.split('; ') : [];
    for (let i = 0; i < cookieString.length; i += 1) {
      const [key, value] = cookieString[i].split('=');
      if (key === encoded) {
        return value ? decodeURIComponent(value) : '';
      }
    }
    return null;
  }

  function dispatchLanguageChange(lang) {
    document.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { lang } }));
  }

  function optionExists(select, value) {
    if (!select) return false;
    return Array.prototype.some.call(select.options, function(option) {
      return option.value === value;
    });
  }

  const LANGUAGE_SELECT_SELECTOR = 'select[data-language-preference], select.lang-select, select#lang-select';

  function isSelectable(node) {
    return !!node && node.nodeName === 'SELECT';
  }

  function toArray(collection) {
    if (!collection) {
      return [];
    }
    if (Array.isArray(collection)) {
      return collection.filter(isSelectable);
    }
    if (typeof collection.length === 'number' && typeof collection !== 'string') {
      return Array.prototype.filter.call(collection, isSelectable);
    }
    return isSelectable(collection) ? [collection] : [];
  }

  function collectLanguageSelects(selectElement) {
    const discovered = Array.prototype.slice.call(document.querySelectorAll(LANGUAGE_SELECT_SELECTOR));

    if (!selectElement) {
      return discovered;
    }

    const explicit = toArray(selectElement);
    if (!explicit.length) {
      return discovered;
    }

    const seen = new Set();
    const merged = [];

    explicit.concat(discovered).forEach(function(select) {
      if (!select || seen.has(select)) {
        return;
      }
      seen.add(select);
      merged.push(select);
    });

    return merged;
  }

  function applyLanguage(selectCollection, lang, options) {
    if (!lang) return;

    const selects = selectCollection === undefined
      ? collectLanguageSelects()
      : toArray(selectCollection);
    const settings = options || {};

    selects.forEach(function(select) {
      if (optionExists(select, lang)) {
        select.value = lang;
      }
    });

    if (document.documentElement) {
      document.documentElement.setAttribute('lang', lang);
    }

    if (settings.persist !== false) {
      setCookie(LANGUAGE_COOKIE_NAME, lang, LANGUAGE_COOKIE_LIFETIME_DAYS);
    }

    dispatchLanguageChange(lang);
  }

  function initLanguagePreference(selectElement) {
    const selects = collectLanguageSelects(selectElement);

    const savedLanguage = getCookie(LANGUAGE_COOKIE_NAME);

    if (!selects.length) {
      if (savedLanguage) {
        applyLanguage(undefined, savedLanguage);
      }
      return;
    }

    const initialLanguageCandidate = selects.reduce(function(found, current) {
      if (found) return found;
      if (current && current.value) {
        return current.value;
      }
      if (current && current.options && current.options.length > 0) {
        return current.options[0].value;
      }
      return found;
    }, '') || 'en';

    const savedLanguageMatches = savedLanguage && selects.some(function(select) {
      return optionExists(select, savedLanguage);
    });

    const initialLanguage = savedLanguageMatches
      ? savedLanguage
      : initialLanguageCandidate;

    applyLanguage(undefined, initialLanguage);

    selects.forEach(function(select) {
      if (select.dataset.languagePreferenceInitialized === 'true') {
        return;
      }

      select.dataset.languagePreferenceInitialized = 'true';
      select.addEventListener('change', function(event) {
        applyLanguage(undefined, event.target.value);
      });
    });
  }

  window.LanguagePreferences = {
    init: initLanguagePreference,
    getPreferredLanguage: function() {
      return getCookie(LANGUAGE_COOKIE_NAME);
    },
    setPreferredLanguage: function(lang) {
      if (!lang) {
        return;
      }
      applyLanguage(undefined, lang);
    },
    COOKIE_NAME: LANGUAGE_COOKIE_NAME,
    CHANGE_EVENT: LANGUAGE_CHANGE_EVENT
  };

  function autoInit() {
    initLanguagePreference();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }
})();
