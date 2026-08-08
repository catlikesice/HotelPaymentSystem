;(function() {
  const TOKEN_KEY = 'bh_auth_token';
  const USER_KEY = 'bh_auth_user';

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

  function updateAccountNav() {
    const user = getStoredUser();
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
        // Keep translated labels if NavBarTranslations already ran; only reset structure when empty.
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
  }

  function init() {
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
    updateAccountNav: updateAccountNav
  };
})();
