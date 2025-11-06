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

  function applyLanguage(select, lang) {
    if (!lang) return;
    if (select && optionExists(select, lang)) {
      select.value = lang;
    }
    if (document.documentElement) {
      document.documentElement.setAttribute('lang', lang);
    }
    setCookie(LANGUAGE_COOKIE_NAME, lang, LANGUAGE_COOKIE_LIFETIME_DAYS);
    dispatchLanguageChange(lang);
  }

  function initLanguagePreference(selectElement) {
    const select = selectElement || document.getElementById('lang-select');
    if (!select) {
      return;
    }

    const savedLanguage = getCookie(LANGUAGE_COOKIE_NAME);
    const initialLanguage = savedLanguage && optionExists(select, savedLanguage)
      ? savedLanguage
      : select.value || select.options[0]?.value || 'en';

    applyLanguage(select, initialLanguage);

    select.addEventListener('change', function(event) {
      applyLanguage(select, event.target.value);
    });
  }

  window.LanguagePreferences = {
    init: initLanguagePreference,
    getPreferredLanguage: function() {
      return getCookie(LANGUAGE_COOKIE_NAME);
    },
    setPreferredLanguage: function(lang) {
      const select = document.getElementById('lang-select');
      if (!lang) {
        return;
      }
      applyLanguage(select, lang);
    },
    COOKIE_NAME: LANGUAGE_COOKIE_NAME,
    CHANGE_EVENT: LANGUAGE_CHANGE_EVENT
  };
})();
