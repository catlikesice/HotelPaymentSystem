;(function() {
  const TOKEN_KEY = 'bh_auth_token';
  const USER_KEY = 'bh_auth_user';
  const LOGIN_POPUP_ID = 'login-popup';

  let lastAccountTrigger = null;
  let loginPopupBound = false;

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
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const message = (data && data.error) || 'Request failed. Please try again.';
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  async function register(payload) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSession(data.token, data.user);
    return data;
  }

  async function login(payload) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSession(data.token, data.user);
    return data;
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST', body: '{}' });
    } catch (error) {
      // Clear local session even if the network call fails.
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
          '<button type="button" class="btn login-popup__logout">Log out</button>' +
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
        event.preventDefault();
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
              status.textContent = 'Welcome back!';
              status.className = 'login-popup__status auth-status--success';
            }
            syncLoginPopupState();
            window.setTimeout(closeLoginPopup, 450);
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
    const accountLabel = (mapping && mapping.account) || 'Account';

    accountButtons.forEach(function(button) {
      if (user && user.name) {
        button.textContent = user.name.split(' ')[0];
        button.setAttribute('aria-label', 'Account menu for ' + user.name);
      } else {
        button.textContent = accountLabel;
        button.setAttribute('aria-label', (mapping && mapping.accountAria) || accountLabel);
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
          '<a href="login.html" role="menuitem" class="nav-account-status">Signed in as ' + escapeHtml(user.email) + '</a>' +
          '<button type="button" role="menuitem" class="nav-account-logout">Log out</button>';
        const logoutBtn = menu.querySelector('.nav-account-logout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function() {
            logout().then(function() {
              window.location.href = 'index.html';
            });
          });
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
            window.setTimeout(function() {
              window.location.href = 'index.html';
            }, 600);
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

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating account...';
        }
        if (status) {
          status.textContent = '';
          status.className = 'auth-status';
        }

        register({ name, email, password })
          .then(function() {
            if (status) {
              status.textContent = 'Account created! Redirecting...';
              status.className = 'auth-status auth-status--success';
            }
            window.setTimeout(function() {
              window.location.href = 'index.html';
            }, 600);
          })
          .catch(function(error) {
            if (status) {
              status.textContent = error.message;
              status.className = 'auth-status auth-status--error';
            }
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Create account';
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
    // Refresh session quietly when a token exists.
    if (getToken()) {
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
    updateAccountNav: updateAccountNav,
    openLoginPopup: openLoginPopup,
    closeLoginPopup: closeLoginPopup
  };
})();
