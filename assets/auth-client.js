;(function() {
  const TOKEN_KEY = 'bh_auth_token';
  const USER_KEY = 'bh_auth_user';
  const LOGIN_POPUP_ID = 'login-popup';

  let lastAccountTrigger = null;
  let loginPopupBound = false;
  const localAccounts = (typeof window !== 'undefined' && window.LocalAuth)
    ? window.LocalAuth.create({ storage: window.localStorage })
    : null;
  const localBookings = (typeof window !== 'undefined' && window.LocalBookings)
    ? window.LocalBookings.create({ storage: window.localStorage })
    : null;

  function apiBase() {
    if (typeof window === 'undefined') {
      return '';
    }
    // Same-origin when served by Express; empty string keeps relative /api paths.
    return '';
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setSession(token, user) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch (error) {
      // Ignore quota / private mode failures; API still returns the payload.
    }
    updateAccountNav();
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      // no-op
    }
    updateAccountNav();
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    const token = getToken();
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    const response = await fetch(apiBase() + path, Object.assign({}, opts, { headers }));
    let rawText = '';
    try {
      rawText = await response.text();
    } catch (error) {
      rawText = '';
    }
    let data = null;
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (error) {
        data = null;
      }
    }

    if (!response.ok) {
      const message = (data && data.error)
        || (typeof data === 'string' && data)
        || defaultRequestError(response.status);
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      err.unavailable = isUnavailableStatus(response.status, data);
      throw err;
    }

    if (!data || typeof data !== 'object') {
      const err = new Error(defaultRequestError(404));
      err.status = response.status || 404;
      err.unavailable = true;
      throw err;
    }

    return data;
  }

  function defaultRequestError(status) {
    if (status === 404 || status === 405) {
      return 'The account service is not running on this host.';
    }
    if (status === 429) {
      return 'Too many attempts. Please try again later.';
    }
    return 'Request failed. Please try again.';
  }

  function isUnavailableStatus(status, data) {
    if (!status) {
      return true;
    }
    if (status === 404 || status === 405 || status === 501 || status === 502 || status === 503) {
      return true;
    }
    return !data && status >= 500;
  }

  function shouldUseLocalFallback(error) {
    if (!localAccounts) {
      return false;
    }
    if (!error) {
      return true;
    }
    if (error.unavailable) {
      return true;
    }
    if (!error.status) {
      return true;
    }
    return isUnavailableStatus(error.status, error.data);
  }

  async function register(payload) {
    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSession(data.token, data.user);
      return data;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) {
        throw error;
      }
      const data = localAccounts.register(payload);
      setSession(data.token, data.user);
      return data;
    }
  }

  async function login(payload) {
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSession(data.token, data.user);
      return data;
    } catch (error) {
      if (!shouldUseLocalFallback(error) && error.status !== 401) {
        throw error;
      }
      try {
        const data = localAccounts ? localAccounts.login(payload) : null;
        if (data) {
          setSession(data.token, data.user);
          return data;
        }
      } catch (localError) {
        if (!shouldUseLocalFallback(error)) {
          throw error.status === 401 ? error : localError;
        }
        throw localError;
      }
      throw error;
    }
  }

  async function logout() {
    const token = getToken();
    try {
      await request('/api/auth/logout', { method: 'POST', body: '{}' });
    } catch (error) {
      // Clear local session even if the network call fails.
    }
    if (localAccounts) {
      localAccounts.logout(token);
    }
    clearSession();
  }

  async function me() {
    const token = getToken();
    if (!token) {
      return null;
    }
    try {
      const data = await request('/api/auth/me');
      setSession(token, data.user);
      return data.user;
    } catch (error) {
      if (localAccounts) {
        const local = localAccounts.me(token);
        if (local && local.user) {
          setSession(token, local.user);
          return local.user;
        }
      }
      if (shouldUseLocalFallback(error)) {
        return getStoredUser();
      }
      clearSession();
      return null;
    }
  }

  function loginPopupMarkup() {
    return (
      '<div class="login-popup__backdrop" data-login-close></div>' +
      '<div class="login-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="login-popup-title">' +
        '<button type="button" class="login-popup__close" data-login-close aria-label="Close">' +
          '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '<h2 id="login-popup-title" class="login-popup__title">Login</h2>' +
        '<p class="login-popup__status" id="login-popup-status" role="status" aria-live="polite"></p>' +
        '<form id="loginPopupForm" class="login-popup__form" novalidate>' +
          '<label class="sr-only" for="login-popup-email">Email</label>' +
          '<input id="login-popup-email" name="email" type="email" required autocomplete="email" placeholder="Email">' +
          '<label class="sr-only" for="login-popup-password">Password</label>' +
          '<input id="login-popup-password" name="password" type="password" required autocomplete="current-password" minlength="8" placeholder="Password">' +
          '<button type="submit" class="btn login-popup__submit">Sign in</button>' +
        '</form>' +
        '<div class="login-popup__session" hidden>' +
          '<p class="login-popup__signed-in" data-login-signed-in></p>' +
          '<button type="button" class="btn btn--secondary login-popup__logout">Log out</button>' +
        '</div>' +
        '<p class="login-popup__links">' +
          '<a href="register.html" class="login-popup__link" data-login-register>Register</a>' +
          '<a href="forgot-password.html" class="login-popup__link" data-login-forgot>Forgot Password</a>' +
        '</p>' +
      '</div>'
    );
  }

  function ensureLoginPopup() {
    let popup = document.getElementById(LOGIN_POPUP_ID);
    if (!popup) {
      popup = document.createElement('div');
      popup.id = LOGIN_POPUP_ID;
      popup.className = 'login-popup';
      popup.hidden = true;
      popup.innerHTML = loginPopupMarkup();
      document.body.appendChild(popup);
    }
    return popup;
  }

  function getFocusable(container) {
    if (!container) {
      return [];
    }
    return Array.prototype.slice.call(
      container.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([disabled]), select')
    ).filter(function(el) {
      return !el.hasAttribute('hidden') && el.offsetParent !== null;
    });
  }

  function syncLoginPopupState() {
    const popup = document.getElementById(LOGIN_POPUP_ID);
    if (!popup) {
      return;
    }

    const user = getStoredUser();
    const form = popup.querySelector('#loginPopupForm');
    const session = popup.querySelector('.login-popup__session');
    const links = popup.querySelector('.login-popup__links');
    const signedIn = popup.querySelector('[data-login-signed-in]');
    const mapping = window.NavBarTranslations && window.NavBarTranslations.translations
      ? (window.NavBarTranslations.translations[document.documentElement.lang] || window.NavBarTranslations.translations.en)
      : null;
    const signedInPrefix = (mapping && mapping.signedInAs) || 'Signed in as';

    if (user && user.email) {
      if (form) {
        form.hidden = true;
      }
      if (session) {
        session.hidden = false;
      }
      if (links) {
        links.hidden = true;
      }
      if (signedIn) {
        signedIn.textContent = signedInPrefix + ' ' + user.email;
      }
    } else {
      if (form) {
        form.hidden = false;
      }
      if (session) {
        session.hidden = true;
      }
      if (links) {
        links.hidden = false;
      }
    }
  }

  function setAccountButtonsExpanded(isOpen) {
    document.querySelectorAll('.nav-account-btn, [data-login-open]').forEach(function(btn) {
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function openLoginPopup(trigger) {
    const popup = ensureLoginPopup();
    lastAccountTrigger = trigger || document.activeElement;
    syncLoginPopupState();

    const status = popup.querySelector('#login-popup-status');
    if (status) {
      status.textContent = '';
      status.className = 'login-popup__status';
    }

    popup.hidden = false;
    document.body.classList.add('login-popup-open');
    setAccountButtonsExpanded(true);

    if (window.NavBarTranslations && typeof window.NavBarTranslations.apply === 'function') {
      window.NavBarTranslations.apply(document.documentElement.lang || 'en');
    }

    window.setTimeout(function() {
      const user = getStoredUser();
      const emailInput = popup.querySelector('#login-popup-email');
      const logoutBtn = popup.querySelector('.login-popup__logout');
      if (user) {
        if (logoutBtn) {
          logoutBtn.focus();
        }
      } else if (emailInput) {
        emailInput.focus();
      }
    }, 0);
  }

  function closeLoginPopup() {
    const popup = document.getElementById(LOGIN_POPUP_ID);
    if (!popup || popup.hidden) {
      return;
    }
    popup.hidden = true;
    document.body.classList.remove('login-popup-open');
    setAccountButtonsExpanded(false);
    if (lastAccountTrigger && typeof lastAccountTrigger.focus === 'function') {
      lastAccountTrigger.focus();
    }
  }

  function bindLoginPopup() {
    if (loginPopupBound) {
      return;
    }
    loginPopupBound = true;

    const popup = ensureLoginPopup();
    if (window.NavBarTranslations && typeof window.NavBarTranslations.apply === 'function') {
      window.NavBarTranslations.apply(document.documentElement.lang || 'en');
    }

    document.addEventListener('click', function(event) {
      const opener = event.target.closest('[data-login-open], .nav-account-btn');
      if (opener) {
        const user = getStoredUser();
        // The navbar account control is a <summary>. A signed-in click must
        // toggle that menu. preventDefault would cancel the toggle, which
        // leaves the menu stuck closed on the account page.
        if (user && user.email && opener.closest('.nav-dropdown-account')) {
          return;
        }
        event.preventDefault();
        if (user && user.email) {
          closeLoginPopup();
          goToAccountPage();
          return;
        }
        if (popup.hidden) {
          openLoginPopup(opener);
        } else {
          closeLoginPopup();
        }
        return;
      }

      if (event.target.closest('[data-login-close]')) {
        event.preventDefault();
        closeLoginPopup();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (popup.hidden) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLoginPopup();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const dialog = popup.querySelector('.login-popup__dialog');
      const focusable = getFocusable(dialog);
      if (!focusable.length) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const form = popup.querySelector('#loginPopupForm');
    if (form && !form.getAttribute('data-bound')) {
      form.setAttribute('data-bound', 'true');
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        const status = popup.querySelector('#login-popup-status');
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = form.email.value.trim();
        const password = form.password.value;

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
        }
        if (status) {
          status.textContent = '';
          status.className = 'login-popup__status';
        }

        login({ email, password })
          .then(function() {
            if (status) {
              status.textContent = 'Welcome back! Opening your account...';
              status.className = 'login-popup__status auth-status--success';
            }
            syncLoginPopupState();
            window.setTimeout(goToAccountPage, 450);
          })
          .catch(function(error) {
            if (status) {
              status.textContent = error.message;
              status.className = 'login-popup__status auth-status--error';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
              const mapping = window.NavBarTranslations && window.NavBarTranslations.translations
                ? (window.NavBarTranslations.translations[document.documentElement.lang] || window.NavBarTranslations.translations.en)
                : null;
              submitBtn.textContent = (mapping && mapping.signIn) || 'Sign in';
            }
          });
      });
    }

    const logoutBtn = popup.querySelector('.login-popup__logout');
    if (logoutBtn && !logoutBtn.getAttribute('data-bound')) {
      logoutBtn.setAttribute('data-bound', 'true');
      logoutBtn.addEventListener('click', function() {
        logout().then(function() {
          closeLoginPopup();
          renderAccountPage(null);
        });
      });
    }
  }

  function updateAccountNav() {
    const user = getStoredUser();
    const accountButtons = document.querySelectorAll('.nav-account-btn');
    const mapping = window.NavBarTranslations && window.NavBarTranslations.translations
      ? (window.NavBarTranslations.translations[document.documentElement.lang] || window.NavBarTranslations.translations.en)
      : null;
    const loginLabel = (mapping && mapping.login) || 'Login';

    accountButtons.forEach(function(button) {
      if (user && user.name) {
        button.textContent = user.name.split(' ')[0];
        button.setAttribute('aria-label', (mapping && mapping.accountAria) || ('Account for ' + user.name));
        button.removeAttribute('aria-haspopup');
        button.removeAttribute('aria-controls');
        button.removeAttribute('aria-expanded');
      } else {
        button.textContent = loginLabel;
        button.setAttribute('aria-label', (mapping && mapping.loginAria) || loginLabel);
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', LOGIN_POPUP_ID);
        button.setAttribute('aria-expanded', 'false');
      }
    });

    const accountDropdowns = document.querySelectorAll('.nav-dropdown-account');
    accountDropdowns.forEach(function(dropdown) {
      const summary = dropdown.querySelector('summary.nav-box-account');
      const menu = dropdown.querySelector('.nav-dropdown-menu');
      if (!summary || !menu) {
        return;
      }

      if (user && user.name) {
        summary.textContent = user.name.split(' ')[0];
        summary.setAttribute('aria-label', 'Account menu for ' + user.name);
        menu.innerHTML =
          '<a href="account.html" role="menuitem" class="nav-account-page">View account</a>' +
          '<span class="nav-account-status">Signed in as ' + escapeHtml(user.email) + '</span>' +
          '<button type="button" role="menuitem" class="nav-account-logout">Log out</button>';
        const logoutBtn = menu.querySelector('.nav-account-logout');
        if (logoutBtn) {
          if (mapping && mapping.logOut) {
            logoutBtn.textContent = mapping.logOut;
          }
          logoutBtn.addEventListener('click', function() {
            logout().then(function() {
              window.location.href = 'index.html';
            });
          });
        }
        const accountPageLink = menu.querySelector('.nav-account-page');
        if (accountPageLink && mapping && mapping.viewAccount) {
          accountPageLink.textContent = mapping.viewAccount;
          accountPageLink.setAttribute('aria-label', mapping.viewAccount);
        }
      } else {
        if (!menu.querySelector('.nav-account-login')) {
          menu.innerHTML =
            '<a href="login.html" role="menuitem" class="nav-account-login">Login</a>' +
            '<a href="register.html" role="menuitem" class="nav-account-register">Register</a>';
          if (window.NavBarTranslations && typeof window.NavBarTranslations.apply === 'function') {
            const lang = document.documentElement.lang || 'en';
            window.NavBarTranslations.apply(lang);
          } else {
            summary.textContent = 'Account';
            summary.setAttribute('aria-label', 'Account');
          }
        }
      }
    });

    const authStatus = document.querySelectorAll('[data-auth-status]');
    authStatus.forEach(function(el) {
      if (user) {
        el.textContent = 'Signed in as ' + user.email;
        el.hidden = false;
      } else {
        el.textContent = '';
        el.hidden = true;
      }
    });

    syncLoginPopupState();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isAccountPage() {
    return Boolean(document.getElementById('account-page'));
  }

  function isLocalToken(token) {
    return String(token || '').indexOf('local.') === 0;
  }

  function getUserId() {
    const user = getStoredUser();
    return user && user.id ? user.id : '';
  }

  async function listBookings() {
    try {
      return await request('/api/bookings');
    } catch (error) {
      if (localBookings && (shouldUseLocalFallback(error) || isLocalToken(getToken()))) {
        const userId = getUserId();
        if (!userId) {
          return { bookings: [] };
        }
        return { bookings: localBookings.list(userId) };
      }
      throw error;
    }
  }

  async function createBooking(payload) {
    try {
      return await request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (localBookings && (shouldUseLocalFallback(error) || isLocalToken(getToken()))) {
        const userId = getUserId();
        if (!userId) {
          throw error;
        }
        return { booking: localBookings.create(userId, payload) };
      }
      throw error;
    }
  }

  function goToAccountPage() {
    if (document.getElementById('checkout-page')) {
      closeLoginPopup();
      if (window.CheckoutPage && typeof window.CheckoutPage.refresh === 'function') {
        window.CheckoutPage.refresh();
      }
      return;
    }
    if (isAccountPage()) {
      closeLoginPopup();
      renderAccountPage(getStoredUser());
      return;
    }
    window.location.href = 'account.html';
  }

  function setAccountText(selector, value) {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = value || '';
    }
  }

  function setAccountRow(field, value) {
    const row = document.querySelector('[data-account-row="' + field + '"]');
    if (!row) {
      return;
    }
    const hasValue = Boolean(value);
    row.hidden = !hasValue;
    const dd = row.querySelector('dd');
    if (dd && hasValue) {
      dd.textContent = value;
    }
  }

  function businessTypeLabel(value) {
    const labels = {
      'independent-hotel': 'Independent hotel',
      'hotel-chain': 'Hotel chain',
      'travel-agency': 'Travel agency',
      'corporate': 'Corporate travel',
      'other': 'Other'
    };
    return labels[value] || value || '';
  }

  function formatJoinedDate(iso) {
    if (!iso) {
      return 'Just now';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function fillAccountDashboard(user) {
    const firstName = String(user.name || '').trim().split(/\s+/)[0] || 'there';
    const isBusiness = user.accountType === 'business';
    setAccountText('[data-account-greeting]', 'Welcome, ' + firstName);
    setAccountText('[data-account-type-badge]', isBusiness ? 'Business account' : 'Guest account');
    setAccountText(
      '[data-account-lead]',
      isBusiness
        ? 'Company details from registration are saved on this profile. Bookings for your properties will appear below.'
        : 'Your guest profile is ready. Stays you book will appear below.'
    );
    setAccountText('[data-account-name]', user.name || '');
    setAccountText('[data-account-email]', user.email || '');
    setAccountText('[data-account-created]', formatJoinedDate(user.createdAt));
    setAccountRow('phone', user.phone);

    const businessCard = document.querySelector('[data-account-business]');
    if (businessCard) {
      businessCard.hidden = !isBusiness;
    }
    if (isBusiness) {
      setAccountText('[data-account-company]', user.companyName || '');
      setAccountRow('businessType', businessTypeLabel(user.businessType));
      setAccountRow('vatId', user.vatId);
      setAccountRow('website', user.website);
      setAccountRow('address', user.addressFormatted);
    }
  }

  function renderAccountPage(user) {
    const guest = document.getElementById('account-guest');
    const dashboard = document.getElementById('account-dashboard');
    if (!guest || !dashboard) {
      return;
    }
    if (user && user.email) {
      guest.hidden = true;
      dashboard.hidden = false;
      document.body.classList.add('portal-open');
      fillAccountDashboard(user);
      if (window.AccountPortal && typeof window.AccountPortal.render === 'function') {
        window.AccountPortal.render(user);
      }
    } else {
      guest.hidden = false;
      dashboard.hidden = true;
      document.body.classList.remove('portal-open');
    }
  }

  function bindLogoutPage() {
    if (!document.getElementById('logout-page')) {
      return;
    }
    const status = document.getElementById('logout-status');
    const finish = function () {
      window.setTimeout(function () {
        window.location.href = 'login.html';
      }, 400);
    };
    logout().then(function () {
      if (status) {
        status.textContent = 'You have been signed out. Redirecting to login...';
        status.className = 'auth-status auth-status--success';
      }
      finish();
    }).catch(function () {
      if (status) {
        status.textContent = 'Signed out. Redirecting to login...';
        status.className = 'auth-status auth-status--success';
      }
      finish();
    });
  }

  function bindAccountPage() {
    if (!isAccountPage()) {
      return;
    }

    const logoutBtn = document.getElementById('account-logout');
    if (logoutBtn && !logoutBtn.getAttribute('data-bound')) {
      logoutBtn.setAttribute('data-bound', 'true');
      logoutBtn.addEventListener('click', function() {
        logout().then(function() {
          renderAccountPage(null);
        });
      });
    }

    renderAccountPage(getStoredUser());
    me().then(function(user) {
      renderAccountPage(user);
    });
  }

  function bindAuthForms() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const status = document.getElementById('auth-form-status');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        if (!loginForm.checkValidity()) {
          loginForm.reportValidity();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
        }
        if (status) {
          status.textContent = '';
          status.className = 'auth-status';
        }

        login({ email, password })
          .then(function() {
            if (status) {
              status.textContent = 'Welcome back! Redirecting...';
              status.className = 'auth-status auth-status--success';
            }
            window.setTimeout(goToAccountPage, 600);
          })
          .catch(function(error) {
            if (status) {
              status.textContent = error.message;
              status.className = 'auth-status auth-status--error';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Sign in';
            }
          });
      });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const status = document.getElementById('auth-form-status');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const name = registerForm.name.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const confirm = registerForm.confirmPassword ? registerForm.confirmPassword.value : password;
        const optionalFields = ['accountType', 'companyName', 'businessType', 'phone', 'vatId', 'website', 'country'];
        const extra = {};
        optionalFields.forEach(function(fieldName) {
          const field = registerForm.elements[fieldName];
          if (field && String(field.value || '').trim()) {
            extra[fieldName] = String(field.value).trim();
          }
        });

        if (!registerForm.checkValidity()) {
          registerForm.reportValidity();
          return;
        }

        if (password !== confirm) {
          if (status) {
            status.textContent = 'Passwords do not match.';
            status.className = 'auth-status auth-status--error';
          }
          return;
        }

        const addressRoot = registerForm.querySelector('#address-fields');
        if (addressRoot) {
          if (!window.CountryAddress) {
            if (status) {
              status.textContent = 'Address form failed to load. Please refresh the page.';
              status.className = 'auth-status auth-status--error';
            }
            return;
          }
          const addressResult = window.CountryAddress.validateAddress(
            extra.country || (registerForm.country && registerForm.country.value) || '',
            window.CountryAddress.collectValues(addressRoot),
            { companyName: extra.companyName || '' }
          );
          if (!addressResult.ok) {
            if (status) {
              status.textContent = addressResult.message;
              status.className = 'auth-status auth-status--error';
            }
            return;
          }
          extra.country = extra.country || registerForm.country.value;
          extra.city = addressResult.values.city || '';
          extra.address = addressResult.values;
          extra.addressFormatted = addressResult.formatted;
        }

        const submitLabel = submitBtn ? submitBtn.textContent : 'Create account';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';
        }
        if (status) {
          status.textContent = '';
          status.className = 'auth-status';
        }

        register(Object.assign({ name: name, email: email, password: password }, extra))
          .then(function() {
            if (status) {
              status.textContent = extra.accountType === 'business'
                ? 'Business account created! Redirecting...'
                : 'Account created! Redirecting...';
              status.className = 'auth-status auth-status--success';
            }
            window.setTimeout(goToAccountPage, 600);
          })
          .catch(function(error) {
            if (status) {
              status.textContent = error.message;
              status.className = 'auth-status auth-status--error';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = submitLabel;
            }
          });
      });
    }

    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const status = document.getElementById('auth-form-status');
        const submitBtn = forgotForm.querySelector('button[type="submit"]');
        const email = forgotForm.email.value.trim();

        if (!forgotForm.checkValidity()) {
          forgotForm.reportValidity();
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
        }
        if (status) {
          status.textContent = 'If an account exists for ' + email + ', reset instructions will be sent.';
          status.className = 'auth-status auth-status--success';
        }
      });
    }
  }

  function init() {
    bindLoginPopup();
    updateAccountNav();
    bindAuthForms();
    bindAccountPage();
    bindLogoutPage();
    // Refresh session quietly when a token exists.
    if (getToken() && !isAccountPage()) {
      me();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.AuthClient = {
    login: login,
    register: register,
    logout: logout,
    me: me,
    getToken: getToken,
    getUser: getStoredUser,
    listBookings: listBookings,
    createBooking: createBooking,
    updateAccountNav: updateAccountNav,
    openLoginPopup: openLoginPopup,
    closeLoginPopup: closeLoginPopup,
    goToAccountPage: goToAccountPage
  };
})();
