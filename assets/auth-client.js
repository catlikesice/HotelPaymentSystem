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
  const localProperties = (typeof window !== 'undefined' && window.LocalProperties)
    ? window.LocalProperties.create({ storage: window.localStorage })
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

  async function updateProfile(payload) {
    try {
      const data = await request('/api/auth/profile', {
        method: 'POST',
        body: JSON.stringify(payload || {})
      });
      if (data && data.user) {
        setSession(getToken(), data.user);
      }
      return data;
    } catch (error) {
      if (!shouldUseLocalFallback(error) || !localAccounts) {
        throw error;
      }
      const data = localAccounts.updateProfile(getToken(), payload || {});
      if (data && data.user) {
        setSession(getToken(), data.user);
      }
      return data;
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

  function accountDisplayName(user) {
    if (!user) {
      return '';
    }
    if (user.accountType === 'business') {
      const company = String(user.companyName || '').trim();
      if (company) {
        return company;
      }
    }
    return String(user.name || '').trim();
  }

  function accountButtonLabel(user) {
    const displayName = accountDisplayName(user);
    if (user && user.accountType === 'business') {
      return displayName;
    }
    return displayName.split(' ')[0];
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
        const displayName = accountDisplayName(user);
        button.textContent = accountButtonLabel(user);
        button.setAttribute('aria-label', (mapping && mapping.accountAria) || ('Account for ' + displayName));
        if (user.accountType === 'business') {
          button.setAttribute('title', displayName);
        } else {
          button.removeAttribute('title');
        }
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
        const displayName = accountDisplayName(user);
        const signedInPrefix = (mapping && mapping.signedInAs) || 'Signed in as';
        summary.textContent = accountButtonLabel(user);
        summary.setAttribute('aria-label', 'Account menu for ' + displayName);
        if (user.accountType === 'business') {
          summary.setAttribute('title', displayName);
        } else {
          summary.removeAttribute('title');
        }
        menu.innerHTML =
          '<a href="account.html" role="menuitem" class="nav-account-page">View account</a>' +
          '<span class="nav-account-status"><span data-signed-in-prefix>' + escapeHtml(signedInPrefix) + '</span> ' +
          '<span data-signed-in-name>' + escapeHtml(displayName) + '</span></span>' +
          '<button type="button" role="menuitem" class="nav-account-logout">Log out</button>';
        const logoutBtn = menu.querySelector('.nav-account-logout');
        if (logoutBtn) {
          if (mapping && mapping.logOut) {
            logoutBtn.textContent = mapping.logOut;
          }
          logoutBtn.addEventListener('click', function() {
            const dropdown = logoutBtn.closest('.nav-dropdown-account');
            if (dropdown) {
              dropdown.removeAttribute('open');
            }
            logout().then(function() {
              renderAccountPage(null);
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

  function requireBusinessUser() {
    const user = getStoredUser();
    if (!user || user.accountType !== 'business' || !user.id) {
      const err = new Error('Business accounts can upload accommodation locations.');
      err.status = 403;
      throw err;
    }
    return user;
  }

  function useLocalProperties(error) {
    return Boolean(localProperties && (shouldUseLocalFallback(error) || isLocalToken(getToken())));
  }

  async function listProperties() {
    const user = requireBusinessUser();
    try {
      return await request('/api/properties');
    } catch (error) {
      if (useLocalProperties(error)) {
        return { properties: localProperties.list(user.id) };
      }
      throw error;
    }
  }

  async function saveProperty(payload) {
    const user = requireBusinessUser();
    const body = payload || {};
    const propertyId = String(body.id || '').trim();
    try {
      if (propertyId) {
        return await request('/api/properties/' + encodeURIComponent(propertyId), {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      }
      return await request('/api/properties', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    } catch (error) {
      if (useLocalProperties(error)) {
        if (propertyId) {
          return { property: localProperties.update(user.id, propertyId, body) };
        }
        return { property: localProperties.create(user.id, body) };
      }
      throw error;
    }
  }

  async function deleteProperty(propertyId) {
    const user = requireBusinessUser();
    const id = String(propertyId || '').trim();
    try {
      return await request('/api/properties/' + encodeURIComponent(id), {
        method: 'DELETE'
      });
    } catch (error) {
      if (useLocalProperties(error)) {
        return localProperties.remove(user.id, id);
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

  function formatCalendarDate(iso) {
    const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return '';
    }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    showAccountPhoto(user.photo || '', user);
    fillAccountEmailField(user);
    setAccountRow('birthDate', formatCalendarDate(user.birthDate));
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

  function isProfilePhoto(value) {
    return /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(String(value || ''));
  }

  function showAccountPhoto(photo, user) {
    const image = document.querySelector('[data-account-photo]');
    const fallback = document.querySelector('[data-account-photo-fallback]');
    const removeBtn = document.getElementById('account-photo-remove');
    const name = String((user && user.name) || '').trim();
    const initial = name ? name.charAt(0).toUpperCase() : '';
    const visiblePhoto = isProfilePhoto(photo) ? photo : '';
    if (fallback) {
      fallback.textContent = initial;
      fallback.hidden = Boolean(visiblePhoto);
    }
    if (image) {
      if (visiblePhoto) {
        image.src = visiblePhoto;
        image.alt = name ? (name + ' profile photo') : 'Profile photo';
        image.hidden = false;
      } else {
        image.removeAttribute('src');
        image.alt = '';
        image.hidden = true;
      }
    }
    if (removeBtn) {
      const saved = isProfilePhoto(user && user.photo);
      removeBtn.hidden = !saved;
    }
  }

  function fillAccountEmailField(user) {
    const input = document.getElementById('account-email-input');
    if (!input || document.activeElement === input) {
      return;
    }
    input.value = (user && user.email) || '';
  }

  function setSettingsStatus(id, message, kind) {
    const status = document.getElementById(id);
    if (!status) {
      return;
    }
    status.textContent = message || '';
    status.className = 'auth-status' + (kind ? ' auth-status--' + kind : '');
  }

  function prepareProfilePhoto(file) {
    return new Promise(function(resolve, reject) {
      const allowed = {
        'image/jpeg': true,
        'image/png': true,
        'image/webp': true,
        'image/gif': true
      };
      if (!file || !allowed[file.type]) {
        reject(new Error('Please upload a JPEG, PNG, WebP, or GIF photo.'));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('That photo is too large. Please choose an image under 8 MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function() {
        reject(new Error('Could not read that photo. Please try another image.'));
      };
      reader.onload = function() {
        const image = new Image();
        image.onerror = function() {
          reject(new Error('Could not read that photo. Please try another image.'));
        };
        image.onload = function() {
          const maxEdge = 320;
          const scale = Math.min(1, maxEdge / Math.max(image.width || 1, image.height || 1));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Could not read that photo. Please try another image.'));
            return;
          }
          context.fillStyle = '#fffdf2';
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          let quality = 0.82;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 90000 && quality > 0.45) {
            quality = Math.round((quality - 0.08) * 100) / 100;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          if (!isProfilePhoto(dataUrl) || dataUrl.length > 110000) {
            reject(new Error('That photo is too large. Please choose a smaller image.'));
            return;
          }
          resolve(dataUrl);
        };
        image.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function bindAccountSettings() {
    const photoForm = document.getElementById('account-photo-form');
    const emailForm = document.getElementById('account-email-form');
    if (photoForm && !photoForm.getAttribute('data-bound')) {
      photoForm.setAttribute('data-bound', 'true');
      const input = document.getElementById('account-photo-input');
      const saveBtn = document.getElementById('account-photo-save');
      const removeBtn = document.getElementById('account-photo-remove');

      if (input) {
        input.addEventListener('change', function() {
          const file = input.files && input.files[0];
          if (!file) {
            return;
          }
          prepareProfilePhoto(file).then(function(photo) {
            showAccountPhoto(photo, getStoredUser());
            setSettingsStatus('account-photo-status', '', '');
          }).catch(function(error) {
            input.value = '';
            showAccountPhoto((getStoredUser() && getStoredUser().photo) || '', getStoredUser());
            setSettingsStatus('account-photo-status', error.message, 'error');
          });
        });
      }

      photoForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const file = input && input.files && input.files[0];
        if (!file) {
          setSettingsStatus('account-photo-status', 'Choose a photo to upload.', 'error');
          if (input) {
            input.focus();
          }
          return;
        }
        const saveLabel = saveBtn ? saveBtn.textContent : 'Save photo';
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving...';
        }
        prepareProfilePhoto(file)
          .then(function(photo) {
            return updateProfile({ photo: photo });
          })
          .then(function(data) {
            if (input) {
              input.value = '';
            }
            setSettingsStatus('account-photo-status', (data && data.message) || 'Profile photo saved.', 'success');
            renderAccountPage((data && data.user) || getStoredUser());
          })
          .catch(function(error) {
            setSettingsStatus('account-photo-status', error.message || 'Could not save that photo.', 'error');
            showAccountPhoto((getStoredUser() && getStoredUser().photo) || '', getStoredUser());
          })
          .finally(function() {
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = saveLabel;
            }
          });
      });

      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          removeBtn.disabled = true;
          updateProfile({ photo: '' })
            .then(function(data) {
              if (input) {
                input.value = '';
              }
              setSettingsStatus('account-photo-status', (data && data.message) || 'Profile photo removed.', 'success');
              renderAccountPage((data && data.user) || getStoredUser());
            })
            .catch(function(error) {
              setSettingsStatus('account-photo-status', error.message || 'Could not remove that photo.', 'error');
            })
            .finally(function() {
              removeBtn.disabled = false;
            });
        });
      }
    }

    if (emailForm && !emailForm.getAttribute('data-bound')) {
      emailForm.setAttribute('data-bound', 'true');
      const emailInput = document.getElementById('account-email-input');
      const passwordInput = document.getElementById('account-email-password');
      const saveBtn = document.getElementById('account-email-save');
      emailForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const current = String((getStoredUser() && getStoredUser().email) || '');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
          setSettingsStatus('account-email-status', 'Please enter a valid email address.', 'error');
          if (emailInput) {
            emailInput.focus();
          }
          return;
        }
        const changed = email.toLowerCase() !== current.toLowerCase();
        if (changed && !password) {
          setSettingsStatus('account-email-status', 'Enter your current password to change your email address.', 'error');
          if (passwordInput) {
            passwordInput.focus();
          }
          return;
        }
        const saveLabel = saveBtn ? saveBtn.textContent : 'Change email';
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving...';
        }
        updateProfile({ email: email, password: password })
          .then(function(data) {
            if (passwordInput) {
              passwordInput.value = '';
            }
            setSettingsStatus('account-email-status', (data && data.message) || 'Email address updated.', 'success');
            renderAccountPage((data && data.user) || getStoredUser());
          })
          .catch(function(error) {
            setSettingsStatus('account-email-status', error.message || 'Could not change that email address.', 'error');
          })
          .finally(function() {
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = saveLabel;
            }
          });
      });
    }
  }

  function renderAccountPage(user) {
    const guest = document.getElementById('account-guest');
    const dashboard = document.getElementById('account-dashboard');
    const business = document.getElementById('business-dashboard');
    if (!guest || !dashboard) {
      return;
    }
    const signedIn = Boolean(user && user.email);
    const isBusiness = signedIn && user.accountType === 'business' && business;
    guest.hidden = signedIn;
    dashboard.hidden = !signedIn || Boolean(isBusiness);
    if (business) {
      business.hidden = !isBusiness;
    }
    if (!signedIn) {
      document.body.classList.remove('portal-open');
      return;
    }
    document.body.classList.add('portal-open');
    if (isBusiness) {
      if (window.BusinessPortal && typeof window.BusinessPortal.render === 'function') {
        window.BusinessPortal.render(user);
      }
      return;
    }
    fillAccountDashboard(user);
    if (window.AccountPortal && typeof window.AccountPortal.render === 'function') {
      window.AccountPortal.render(user);
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

    ['account-logout', 'business-logout'].forEach(function(buttonId) {
      const logoutBtn = document.getElementById(buttonId);
      if (logoutBtn && !logoutBtn.getAttribute('data-bound')) {
        logoutBtn.setAttribute('data-bound', 'true');
        logoutBtn.addEventListener('click', function() {
          logout().then(function() {
            renderAccountPage(null);
          });
        });
      }
    });

    bindAccountSettings();
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

        const birthDateInput = registerForm.elements.birthDate;
        if (birthDateInput) {
          const dates = window.BookingDates;
          const birthResult = dates && typeof dates.validateBirthDate === 'function'
            ? dates.validateBirthDate(birthDateInput.value)
            : null;
          if (!birthResult) {
            if (status) {
              status.textContent = 'Birth date calendar failed to load. Please refresh the page.';
              status.className = 'auth-status auth-status--error';
            }
            return;
          }
          if (!birthResult.ok) {
            birthDateInput.setCustomValidity(birthResult.message);
            if (status) {
              status.textContent = birthResult.message;
              status.className = 'auth-status auth-status--error';
            }
            birthDateInput.reportValidity();
            return;
          }
          birthDateInput.setCustomValidity('');
          extra.birthDate = birthResult.iso;
        }

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
    updateProfile: updateProfile,
    getToken: getToken,
    getUser: getStoredUser,
    listBookings: listBookings,
    createBooking: createBooking,
    listProperties: listProperties,
    saveProperty: saveProperty,
    deleteProperty: deleteProperty,
    updateAccountNav: updateAccountNav,
    openLoginPopup: openLoginPopup,
    closeLoginPopup: closeLoginPopup,
    goToAccountPage: goToAccountPage
  };
})();
