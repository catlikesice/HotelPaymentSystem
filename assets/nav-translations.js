;(function() {
  const NAV_TRANSLATIONS = {
    en: {
      home: 'Home',
      homeAria: 'Home',
      book: 'Book with Us',
      bookAria: 'Book with Us',
      navLinkBookAria: 'Book with us',
      aboutMenu: 'Places to Visit',
      aboutMenuAria: 'Places to Visit',
      aboutLatvia: 'About Latvia',
      aboutEstonia: 'About Estonia',
      aboutLithuania: 'About Lithuania',
      aboutScotland: 'About Scotland',
      aboutSweden: 'About Sweden',
      aboutIceland: 'About Iceland',
      contact: 'Contact',
      contactAria: 'Contact us',
      account: 'Account',
      accountAria: 'Account',
      login: 'Login',
      loginAria: 'Login',
      register: 'Register',
      registerAria: 'Register'
    },
    ru: {
      home: 'Главная',
      homeAria: 'Главная',
      book: 'Забронировать у нас',
      bookAria: 'Забронировать у нас',
      navLinkBookAria: 'Забронировать у нас',
      aboutMenu: 'Места для посещения',
      aboutMenuAria: 'Места для посещения',
      aboutLatvia: 'О Латвии',
      aboutEstonia: 'Об Эстонии',
      aboutLithuania: 'О Литве',
      aboutScotland: 'О Шотландии',
      aboutSweden: 'О Швеции',
      aboutIceland: 'Об Исландии',
      contact: 'Контакты',
      contactAria: 'Связаться с нами',
      account: 'Аккаунт',
      accountAria: 'Аккаунт',
      login: 'Вход',
      loginAria: 'Вход',
      register: 'Регистрация',
      registerAria: 'Регистрация'
    },
    lv: {
      home: 'Sākums',
      homeAria: 'Sākums',
      book: 'Rezervēt pie mums',
      bookAria: 'Rezervēt pie mums',
      navLinkBookAria: 'Rezervēt pie mums',
      aboutMenu: 'Vietas, ko apmeklēt',
      aboutMenuAria: 'Vietas, ko apmeklēt',
      aboutLatvia: 'Par Latviju',
      aboutEstonia: 'Par Igauniju',
      aboutLithuania: 'Par Lietuvu',
      aboutScotland: 'Par Skotiju',
      aboutSweden: 'Par Zviedriju',
      aboutIceland: 'Par Islandi',
      contact: 'Kontakti',
      contactAria: 'Sazinieties ar mums',
      account: 'Konts',
      accountAria: 'Konts',
      login: 'Pieslēgties',
      loginAria: 'Pieslēgties',
      register: 'Reģistrēties',
      registerAria: 'Reģistrēties'
    },
    et: {
      home: 'Avaleht',
      homeAria: 'Avaleht',
      book: 'Broneeri meie juures',
      bookAria: 'Broneeri meie juures',
      navLinkBookAria: 'Broneeri meie juures',
      aboutMenu: 'Külastamisväärsed kohad',
      aboutMenuAria: 'Külastamisväärsed kohad',
      aboutLatvia: 'Läti kohta',
      aboutEstonia: 'Eesti kohta',
      aboutLithuania: 'Leedu kohta',
      aboutScotland: 'Šotimaa kohta',
      aboutSweden: 'Rootsi kohta',
      aboutIceland: 'Islandi kohta',
      contact: 'Kontakt',
      contactAria: 'Võtke meiega ühendust',
      account: 'Konto',
      accountAria: 'Konto',
      login: 'Logi sisse',
      loginAria: 'Logi sisse',
      register: 'Registreeru',
      registerAria: 'Registreeru'
    },
    de: {
      home: 'Startseite',
      homeAria: 'Startseite',
      book: 'Bei uns buchen',
      bookAria: 'Bei uns buchen',
      navLinkBookAria: 'Bei uns buchen',
      aboutMenu: 'Orte zum Besuchen',
      aboutMenuAria: 'Orte zum Besuchen',
      aboutLatvia: 'Über Lettland',
      aboutEstonia: 'Über Estland',
      aboutLithuania: 'Über Litauen',
      aboutScotland: 'Über Schottland',
      aboutSweden: 'Über Schweden',
      aboutIceland: 'Über Island',
      contact: 'Kontakt',
      contactAria: 'Kontaktieren Sie uns',
      account: 'Konto',
      accountAria: 'Konto',
      login: 'Anmelden',
      loginAria: 'Anmelden',
      register: 'Registrieren',
      registerAria: 'Registrieren'
    }
  };

  function getFallbackLanguage() {
    if (window.LanguagePreferences && typeof window.LanguagePreferences.getPreferredLanguage === 'function') {
      const preferred = window.LanguagePreferences.getPreferredLanguage();
      if (preferred) {
        return preferred;
      }
    }

    const select = document.getElementById('lang-select');
    if (select && select.value) {
      return select.value;
    }

    if (document.documentElement && document.documentElement.lang) {
      return document.documentElement.lang;
    }

    return 'en';
  }

  function updateLinkContent(link, text, ariaText) {
    if (!link || !text) {
      return;
    }

    link.textContent = text;

    if (link.hasAttribute('aria-label')) {
      link.setAttribute('aria-label', ariaText || text);
    }

    if (link.hasAttribute('title')) {
      link.setAttribute('title', text);
    }
  }

  function updateSummaryContent(summary, text, ariaText) {
    if (!summary || !text) {
      return;
    }

    summary.textContent = text;

    if (ariaText || summary.hasAttribute('aria-label')) {
      summary.setAttribute('aria-label', ariaText || text);
    }

    if (summary.hasAttribute('title')) {
      summary.setAttribute('title', text);
    }
  }

  function applyNavTranslations(lang) {
    const mapping = NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS.en;
    if (!mapping) {
      return;
    }

    const navRoot = document.querySelector('.site-nav');
    if (!navRoot) {
      return;
    }

    const homeLinks = navRoot.querySelectorAll('.nav-box-home');
    homeLinks.forEach(function(link) {
      updateLinkContent(link, mapping.home, mapping.homeAria);
    });

    const bookLinks = navRoot.querySelectorAll('.nav-box-left');
    bookLinks.forEach(function(link) {
      updateLinkContent(link, mapping.book, mapping.bookAria);
    });

    const contactLinks = navRoot.querySelectorAll('.nav-box-right');
    contactLinks.forEach(function(link) {
      updateLinkContent(link, mapping.contact, mapping.contactAria);
    });

    const navLinkBookLinks = document.querySelectorAll('.nav-link-book');
    navLinkBookLinks.forEach(function(link) {
      updateLinkContent(link, mapping.book, mapping.navLinkBookAria || mapping.bookAria || mapping.book);
    });

    const accountDropdown = navRoot.querySelector('.nav-dropdown-account');
    if (accountDropdown) {
      const accountSummary = accountDropdown.querySelector('summary.nav-box-account');
      // Avoid overwriting the signed-in first-name label managed by AuthClient.
      const signedIn = Boolean(window.AuthClient && typeof window.AuthClient.getUser === 'function' && window.AuthClient.getUser());
      if (!signedIn) {
        updateSummaryContent(accountSummary, mapping.account, mapping.accountAria);
      }

      const accountMenu = accountDropdown.querySelector('.nav-dropdown-menu');
      if (accountMenu) {
        const loginLink = accountMenu.querySelector('.nav-account-login');
        updateLinkContent(loginLink, mapping.login, mapping.loginAria);

        const registerLink = accountMenu.querySelector('.nav-account-register');
        updateLinkContent(registerLink, mapping.register, mapping.registerAria);
      }
    }

    const navDropdown = navRoot.querySelector('.nav-dropdown:not(.nav-dropdown-account)');
    if (navDropdown) {
      const summary = navDropdown.querySelector('summary.nav-box');
      updateSummaryContent(summary, mapping.aboutMenu, mapping.aboutMenuAria);

      const dropdownMenu = navDropdown.querySelector('.nav-dropdown-menu');
      if (dropdownMenu) {
        const latviaLink = dropdownMenu.querySelector('a[href$="aboutlatvia.html"]');
        updateLinkContent(latviaLink, mapping.aboutLatvia, mapping.aboutLatvia);

        const estoniaLink = dropdownMenu.querySelector('a[href$="aboutestonia.html"]');
        updateLinkContent(estoniaLink, mapping.aboutEstonia, mapping.aboutEstonia);

        const lithuaniaLink = dropdownMenu.querySelector('a[href$="aboutlithuania.html"]');
        updateLinkContent(lithuaniaLink, mapping.aboutLithuania, mapping.aboutLithuania);

        const scotlandLink = dropdownMenu.querySelector('a[href$="aboutscotland.html"]');
        updateLinkContent(scotlandLink, mapping.aboutScotland, mapping.aboutScotland);

        const swedenLink = dropdownMenu.querySelector('a[href$="aboutsweden.html"]');
        updateLinkContent(swedenLink, mapping.aboutSweden, mapping.aboutSweden);

        const icelandLink = dropdownMenu.querySelector('a[href$="abouticeland.html"]');
        updateLinkContent(icelandLink, mapping.aboutIceland, mapping.aboutIceland);
      }
    } else {
      const latviaDirectLink = navRoot.querySelector('.nav-box-center[href$="aboutlatvia.html"]');
      updateLinkContent(latviaDirectLink, mapping.aboutLatvia, mapping.aboutLatvia);

      const estoniaDirectLink = navRoot.querySelector('.nav-box[href$="aboutestonia.html"]');
      if (estoniaDirectLink && !estoniaDirectLink.classList.contains('nav-box-left') && !estoniaDirectLink.classList.contains('nav-box-right')) {
        updateLinkContent(estoniaDirectLink, mapping.aboutEstonia, mapping.aboutEstonia);
      }

      const lithuaniaDirectLink = navRoot.querySelector('.nav-box[href$="aboutlithuania.html"]');
      if (lithuaniaDirectLink && !lithuaniaDirectLink.classList.contains('nav-box-left') && !lithuaniaDirectLink.classList.contains('nav-box-right')) {
        updateLinkContent(lithuaniaDirectLink, mapping.aboutLithuania, mapping.aboutLithuania);
      }

      const scotlandDirectLink = navRoot.querySelector('.nav-box[href$="aboutscotland.html"]');
      if (scotlandDirectLink && !scotlandDirectLink.classList.contains('nav-box-left') && !scotlandDirectLink.classList.contains('nav-box-right')) {
        updateLinkContent(scotlandDirectLink, mapping.aboutScotland, mapping.aboutScotland);
      }

      const swedenDirectLink = navRoot.querySelector('.nav-box[href$="aboutsweden.html"]');
      if (swedenDirectLink && !swedenDirectLink.classList.contains('nav-box-left') && !swedenDirectLink.classList.contains('nav-box-right')) {
        updateLinkContent(swedenDirectLink, mapping.aboutSweden, mapping.aboutSweden);
      }

      const icelandDirectLink = navRoot.querySelector('.nav-box[href$="abouticeland.html"]');
      if (icelandDirectLink && !icelandDirectLink.classList.contains('nav-box-left') && !icelandDirectLink.classList.contains('nav-box-right')) {
        updateLinkContent(icelandDirectLink, mapping.aboutIceland, mapping.aboutIceland);
      }
    }

    const hiddenNavList = navRoot.querySelector('.nav-links');
    if (hiddenNavList) {
      const listAnchors = hiddenNavList.querySelectorAll('a[href]');
      listAnchors.forEach(function(anchor) {
        const href = anchor.getAttribute('href');
        if (href === 'index.html') {
          updateLinkContent(anchor, mapping.home, mapping.homeAria);
        } else if (href === 'selectlocation.html') {
          updateLinkContent(anchor, mapping.book, mapping.bookAria);
        } else if (href === 'aboutlatvia.html') {
          updateLinkContent(anchor, mapping.aboutLatvia, mapping.aboutLatvia);
        } else if (href === 'aboutestonia.html') {
          updateLinkContent(anchor, mapping.aboutEstonia, mapping.aboutEstonia);
        } else if (href === 'aboutlithuania.html') {
          updateLinkContent(anchor, mapping.aboutLithuania, mapping.aboutLithuania);
        } else if (href === 'aboutscotland.html') {
          updateLinkContent(anchor, mapping.aboutScotland, mapping.aboutScotland);
        } else if (href === 'aboutsweden.html') {
          updateLinkContent(anchor, mapping.aboutSweden, mapping.aboutSweden);
        } else if (href === 'abouticeland.html') {
          updateLinkContent(anchor, mapping.aboutIceland, mapping.aboutIceland);
        } else if (href === '#contact' || href === 'index.html#contact') {
          updateLinkContent(anchor, mapping.contact, mapping.contactAria);
        } else if (href === 'login.html') {
          updateLinkContent(anchor, mapping.login, mapping.loginAria);
        } else if (href === 'register.html') {
          updateLinkContent(anchor, mapping.register, mapping.registerAria);
        }
      });
    }
  }

  const languageEventName = (window.LanguagePreferences && window.LanguagePreferences.CHANGE_EVENT) || 'preferredLanguageChange';

  document.addEventListener(languageEventName, function(event) {
    const nextLang = event && event.detail && event.detail.lang;
    applyNavTranslations(nextLang || getFallbackLanguage());
  });

  function init() {
    applyNavTranslations(getFallbackLanguage());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.NavBarTranslations = {
    apply: applyNavTranslations,
    translations: NAV_TRANSLATIONS
  };
})();
