;(function() {
  const NAV_TRANSLATIONS = {
    en: {
      home: 'Home',
      homeAria: 'Home',
      aboutUsPartners: 'About Us and Partners',
      aboutUsPartnersAria: 'About Us and Partners',
      contact: 'Contact',
      contactAria: 'Contact us',
      cultureBlog: 'Blog',
      cultureBlogAria: 'Blog',
      environmentMission: 'Environment Mission',
      environmentMissionAria: 'Environment Mission',
      reliableBlockchain: 'Reliable Blockchain',
      reliableBlockchainAria: 'Reliable Blockchain',
      account: 'Account',
      accountAria: 'Account',
      login: 'Login',
      loginAria: 'Login',
      register: 'Register',
      registerAria: 'Register',
      affiliatedEmail: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password',
      signIn: 'Sign in',
      closeLogin: 'Close',
      signedInAs: 'Signed in as',
      logOut: 'Log out',
      searchPlaceholder: 'Search...',
      searchAria: 'Search hotels and cities',
      menu: 'Menu'
    },
    ru: {
      home: 'Главная',
      homeAria: 'Главная',
      aboutUsPartners: 'О нас и партнёрах',
      aboutUsPartnersAria: 'О нас и партнёрах',
      contact: 'Контакты',
      contactAria: 'Связаться с нами',
      cultureBlog: 'Блог',
      cultureBlogAria: 'Блог',
      environmentMission: 'Экологическая миссия',
      environmentMissionAria: 'Экологическая миссия',
      reliableBlockchain: 'Надёжный блокчейн',
      reliableBlockchainAria: 'Надёжный блокчейн',
      account: 'Аккаунт',
      accountAria: 'Аккаунт',
      login: 'Вход',
      loginAria: 'Вход',
      register: 'Регистрация',
      registerAria: 'Регистрация',
      affiliatedEmail: 'Эл. почта',
      password: 'Пароль',
      forgotPassword: 'Забыли пароль',
      signIn: 'Войти',
      closeLogin: 'Закрыть',
      signedInAs: 'Вы вошли как',
      logOut: 'Выйти',
      searchPlaceholder: 'Поиск...',
      searchAria: 'Поиск отелей и городов',
      menu: 'Меню'
    },
    sv: {
      home: 'Hem',
      homeAria: 'Hem',
      aboutUsPartners: 'Om oss och partners',
      aboutUsPartnersAria: 'Om oss och partners',
      contact: 'Kontakt',
      contactAria: 'Kontakta oss',
      cultureBlog: 'Blogg',
      cultureBlogAria: 'Blogg',
      environmentMission: 'Miljöuppdrag',
      environmentMissionAria: 'Miljöuppdrag',
      reliableBlockchain: 'Tillförlitlig blockkedja',
      reliableBlockchainAria: 'Tillförlitlig blockkedja',
      account: 'Konto',
      accountAria: 'Konto',
      login: 'Logga in',
      loginAria: 'Logga in',
      register: 'Registrera',
      registerAria: 'Registrera',
      affiliatedEmail: 'E-post',
      password: 'Lösenord',
      forgotPassword: 'Glömt lösenord',
      signIn: 'Logga in',
      closeLogin: 'Stäng',
      signedInAs: 'Inloggad som',
      logOut: 'Logga ut',
      searchPlaceholder: 'Sök...',
      searchAria: 'Sök hotell och städer',
      menu: 'Meny'
    },
    de: {
      home: 'Startseite',
      homeAria: 'Startseite',
      aboutUsPartners: 'Über uns und Partner',
      aboutUsPartnersAria: 'Über uns und Partner',
      contact: 'Kontakt',
      contactAria: 'Kontaktieren Sie uns',
      cultureBlog: 'Blog',
      cultureBlogAria: 'Blog',
      environmentMission: 'Umweltmission',
      environmentMissionAria: 'Umweltmission',
      reliableBlockchain: 'Zuverlässige Blockchain',
      reliableBlockchainAria: 'Zuverlässige Blockchain',
      account: 'Konto',
      accountAria: 'Konto',
      login: 'Anmelden',
      loginAria: 'Anmelden',
      register: 'Registrieren',
      registerAria: 'Registrieren',
      affiliatedEmail: 'E-Mail',
      password: 'Passwort',
      forgotPassword: 'Passwort vergessen',
      signIn: 'Anmelden',
      closeLogin: 'Schließen',
      signedInAs: 'Angemeldet als',
      logOut: 'Abmelden',
      searchPlaceholder: 'Suchen...',
      searchAria: 'Hotels und Städte suchen',
      menu: 'Menü'
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

    const homeDropdown = navRoot.querySelector('.nav-dropdown-home');
    if (homeDropdown) {
      const homeSummary = homeDropdown.querySelector('summary.nav-box-home');
      updateSummaryContent(homeSummary, mapping.home, mapping.homeAria);

      const homeMenu = homeDropdown.querySelector('.nav-dropdown-menu');
      if (homeMenu) {
        const homeLink = homeMenu.querySelector('.nav-home-link, a[href$="index.html"]');
        updateLinkContent(homeLink, mapping.home, mapping.homeAria);

        const aboutPartnersLink = homeMenu.querySelector('.nav-about-partners, a[href$="about-us-and-partners.html"]');
        updateLinkContent(aboutPartnersLink, mapping.aboutUsPartners, mapping.aboutUsPartnersAria);
      }
    } else {
      const homeLinks = navRoot.querySelectorAll('.nav-box-home');
      homeLinks.forEach(function(link) {
        updateLinkContent(link, mapping.home, mapping.homeAria);
      });
    }

    const contactLinks = navRoot.querySelectorAll('.nav-box-right');
    contactLinks.forEach(function(link) {
      updateLinkContent(link, mapping.contact, mapping.contactAria);
    });

    const cultureBlogLinks = navRoot.querySelectorAll('.nav-box-blog, a[href$="culture-blog.html"]');
    cultureBlogLinks.forEach(function(link) {
      if (link.closest('.nav-links')) {
        return;
      }
      updateLinkContent(link, mapping.cultureBlog, mapping.cultureBlogAria);
    });

    const environmentMissionLinks = navRoot.querySelectorAll('.nav-box-environment, a[href$="crypto-environment.html"]');
    environmentMissionLinks.forEach(function(link) {
      if (link.closest('.nav-links')) {
        return;
      }
      updateLinkContent(link, mapping.environmentMission, mapping.environmentMissionAria);
    });

    const reliableBlockchainLinks = navRoot.querySelectorAll('.nav-box-reliability, a[href$="crypto-reliability.html"]');
    reliableBlockchainLinks.forEach(function(link) {
      if (link.closest('.nav-links')) {
        return;
      }
      updateLinkContent(link, mapping.reliableBlockchain, mapping.reliableBlockchainAria);
    });

    const signedIn = Boolean(window.AuthClient && typeof window.AuthClient.getUser === 'function' && window.AuthClient.getUser());

    const accountButtons = navRoot.querySelectorAll('.nav-account-btn');
    accountButtons.forEach(function(button) {
      if (!signedIn) {
        updateSummaryContent(button, mapping.login, mapping.loginAria);
      }
    });

    const accountDropdown = navRoot.querySelector('.nav-dropdown-account');
    if (accountDropdown) {
      const accountSummary = accountDropdown.querySelector('summary.nav-box-account');
      // Avoid overwriting the signed-in first-name label managed by AuthClient.
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

    const loginPopup = document.getElementById('login-popup');
    if (loginPopup) {
      const title = loginPopup.querySelector('#login-popup-title');
      if (title && mapping.login) {
        title.textContent = mapping.login;
      }

      const closeBtn = loginPopup.querySelector('.login-popup__close');
      if (closeBtn && mapping.closeLogin) {
        closeBtn.setAttribute('aria-label', mapping.closeLogin);
      }

      const emailInput = loginPopup.querySelector('#login-popup-email');
      const emailLabel = loginPopup.querySelector('label[for="login-popup-email"]');
      if (emailInput && mapping.affiliatedEmail) {
        emailInput.setAttribute('placeholder', mapping.affiliatedEmail);
        emailInput.setAttribute('aria-label', mapping.affiliatedEmail);
      }
      if (emailLabel && mapping.affiliatedEmail) {
        emailLabel.textContent = mapping.affiliatedEmail;
      }

      const passwordInput = loginPopup.querySelector('#login-popup-password');
      const passwordLabel = loginPopup.querySelector('label[for="login-popup-password"]');
      if (passwordInput && mapping.password) {
        passwordInput.setAttribute('placeholder', mapping.password);
        passwordInput.setAttribute('aria-label', mapping.password);
      }
      if (passwordLabel && mapping.password) {
        passwordLabel.textContent = mapping.password;
      }

      const submitBtn = loginPopup.querySelector('.login-popup__submit');
      if (submitBtn && mapping.signIn && !submitBtn.disabled) {
        submitBtn.textContent = mapping.signIn;
      }

      const registerLink = loginPopup.querySelector('[data-login-register]');
      updateLinkContent(registerLink, mapping.register, mapping.registerAria);

      const forgotLink = loginPopup.querySelector('[data-login-forgot]');
      updateLinkContent(forgotLink, mapping.forgotPassword, mapping.forgotPassword);

      const logoutBtn = loginPopup.querySelector('.login-popup__logout');
      if (logoutBtn && mapping.logOut) {
        logoutBtn.textContent = mapping.logOut;
      }
    }

    const searchInput = navRoot.querySelector('.nav-search__input, .nav-search input[type="search"]');
    if (searchInput) {
      if (mapping.searchPlaceholder) {
        searchInput.setAttribute('placeholder', mapping.searchPlaceholder);
      }
      if (mapping.searchAria) {
        searchInput.setAttribute('aria-label', mapping.searchAria);
      }
    }

    const searchLabel = navRoot.querySelector('.nav-search label');
    if (searchLabel && mapping.searchAria) {
      searchLabel.textContent = mapping.searchAria;
    }

    const menuLabel = navRoot.querySelector('.nav-toggle .sr-only');
    if (menuLabel && mapping.menu) {
      menuLabel.textContent = mapping.menu;
    }

    const hiddenNavList = navRoot.querySelector('.nav-links');
    if (hiddenNavList) {
      const listAnchors = hiddenNavList.querySelectorAll('a[href]');
      listAnchors.forEach(function(anchor) {
        const href = anchor.getAttribute('href');
        if (href === 'index.html') {
          updateLinkContent(anchor, mapping.home, mapping.homeAria);
        } else if (href === 'about-us-and-partners.html') {
          updateLinkContent(anchor, mapping.aboutUsPartners, mapping.aboutUsPartnersAria);
        } else if (href === 'culture-blog.html') {
          updateLinkContent(anchor, mapping.cultureBlog, mapping.cultureBlogAria);
        } else if (href === 'crypto-environment.html') {
          updateLinkContent(anchor, mapping.environmentMission, mapping.environmentMissionAria);
        } else if (href === 'crypto-reliability.html') {
          updateLinkContent(anchor, mapping.reliableBlockchain, mapping.reliableBlockchainAria);
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
