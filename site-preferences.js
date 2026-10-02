;(function() {
  const preferencesScript = document.currentScript;
  const assetRoot = preferencesScript && preferencesScript.src
    ? preferencesScript.src.replace(/[^/]*$/, '')
    : '';
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
    mountBookingNavbar();
    initLanguagePreference();
  }

  // City booking pages render a full-width language bar and no site navbar.
  // Seat the existing language control in the shared navbar before the
  // following inline translation script looks up #lang-select.
  if (document.body) {
    mountBookingNavbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    autoInit();
  }

  function isInsideSiteNav(node) {
    let current = node;
    while (current) {
      if (current.classList && current.classList.contains('site-nav')) {
        return true;
      }
      current = current.parentElement || current.parentNode;
    }
    return false;
  }

  function findLooseLanguageSwitcher(doc) {
    const nodes = doc.querySelectorAll('.language-switcher');
    for (let i = 0; i < nodes.length; i += 1) {
      if (!isInsideSiteNav(nodes[i])) {
        return nodes[i];
      }
    }
    return null;
  }

  function shouldMountBookingNavbar(doc) {
    if (doc.querySelector('[data-booking-nav], header .site-nav .nav-inner, .site-nav .nav-inner')) {
      return false;
    }
    if (!doc.querySelector('.booking-container, .booking-header')) {
      return false;
    }
    return Boolean(findLooseLanguageSwitcher(doc));
  }

  function bookingNavbarMarkup() {
    return ''
      + '<nav class="site-nav" aria-label="Primary navigation">'
      +   '<div class="nav-inner">'
      +     '<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav-links">'
      +       '<span class="sr-only">Menu</span>'
      +       '<span class="nav-toggle__bars" aria-hidden="true"></span>'
      +     '</button>'
      +     '<div class="nav-containers" id="site-nav-links" role="menubar" aria-label="Site quick links">'
      +       '<details class="nav-dropdown nav-dropdown-home" role="none">'
      +         '<summary class="nav-box nav-box-home" role="menuitem" aria-haspopup="true" aria-label="Home">Home</summary>'
      +         '<div class="nav-dropdown-menu" role="menu">'
      +           '<a href="index.html" role="menuitem" class="nav-home-link">Home</a>'
      +           '<a href="about-us-and-partners.html" role="menuitem" class="nav-about-partners">About Us and Partners</a>'
      +           '<a href="hotel-chains.html" role="menuitem" class="nav-hotel-chains">Tailored for Hotel Chains</a>'
      +         '</div>'
      +       '</details>'
      +       '<a class="nav-box nav-box-blog" href="culture-blog.html" role="menuitem" aria-label="Blog">Blog</a>'
      +       '<details class="nav-dropdown nav-dropdown-environment" role="none">'
      +         '<summary class="nav-box nav-box-environment" role="menuitem" aria-haspopup="true" aria-label="Environmental Mission">Environmental Mission</summary>'
      +         '<div class="nav-dropdown-menu" role="menu">'
      +           '<a href="crypto-environment.html" role="menuitem" class="nav-environment-link">Environmental Mission</a>'
      +           '<a href="about-ecotourism.html" role="menuitem" class="nav-about-ecotourism">About EcoTourism</a>'
      +         '</div>'
      +       '</details>'
      +       '<a class="nav-box nav-box-reliability" href="crypto-reliability.html" role="menuitem" aria-label="Reliable Blockchain">Reliable Blockchain</a>'
      +       '<a class="nav-box nav-box-right" href="contact.html" role="menuitem" aria-label="Contact us">Contact</a>'
      +     '</div>'
      +     '<div class="nav-tools"></div>'
      +     '<ul class="nav-links" aria-hidden="true">'
      +       '<li><a href="index.html">Home</a></li>'
      +       '<li><a href="about-us-and-partners.html">About Us and Partners</a></li>'
      +       '<li><a href="hotel-chains.html">Tailored for Hotel Chains</a></li>'
      +       '<li><a href="culture-blog.html">Blog</a></li>'
      +       '<li><a href="crypto-environment.html">Environmental Mission</a></li>'
      +       '<li><a href="about-ecotourism.html">About EcoTourism</a></li>'
      +       '<li><a href="crypto-reliability.html">Reliable Blockchain</a></li>'
      +       '<li><a href="contact.html">Contact</a></li>'
      +       '<li><a href="login.html">Login</a></li>'
      +       '<li><a href="register.html">Register</a></li>'
      +     '</ul>'
      +   '</div>'
      + '</nav>';
  }

  function accountToolsMarkup() {
    return ''
      + '<details class="nav-dropdown nav-dropdown-account">'
      +   '<summary class="nav-account-btn nav-box-account" data-login-open aria-haspopup="true" aria-expanded="false">Login</summary>'
      +   '<div class="nav-dropdown-menu" role="menu" aria-label="Account">'
      +     '<a href="login.html" role="menuitem" class="nav-account-login">Login</a>'
      +     '<a href="register.html" role="menuitem" class="nav-account-register">Register</a>'
      +   '</div>'
      + '</details>';
  }

  function scriptAlreadyPresent(src) {
    const scripts = document.querySelectorAll('script[src]');
    for (let i = 0; i < scripts.length; i += 1) {
      const current = scripts[i].getAttribute('src') || '';
      if (current === src || current.endsWith('/' + src) || current.endsWith(src)) {
        return true;
      }
    }
    return false;
  }

  function loadBookingNavCompanions() {
    if (window.__bookingNavScriptsRequested) {
      return;
    }
    window.__bookingNavScriptsRequested = true;

    const sources = [
      'assets/nav-translations.js',
      'assets/nav-rail.js',
      'assets/local-auth.js',
      'assets/auth-client.js'
    ];

    function loadAt(index) {
      if (index >= sources.length) {
        return;
      }
      const src = sources[index];
      if (scriptAlreadyPresent(src)) {
        loadAt(index + 1);
        return;
      }
      const script = document.createElement('script');
      script.src = assetRoot + src;
      script.async = false;
      script.onload = function() {
        loadAt(index + 1);
      };
      script.onerror = function() {
        loadAt(index + 1);
      };
      document.body.appendChild(script);
    }

    loadAt(0);
  }

  function mountBookingNavbar() {
    if (!document.body || !shouldMountBookingNavbar(document)) {
      return;
    }

    const languageSwitcher = findLooseLanguageSwitcher(document);
    const header = document.createElement('header');
    header.setAttribute('data-booking-nav', 'true');
    header.innerHTML = bookingNavbarMarkup();

    const tools = header.querySelector('.nav-tools');
    if (tools) {
      tools.insertAdjacentHTML('afterbegin', accountToolsMarkup());
      if (languageSwitcher) {
        tools.appendChild(languageSwitcher);
      }
    }

    document.body.insertBefore(header, document.body.firstChild);
    loadBookingNavCompanions();
  }
})();
