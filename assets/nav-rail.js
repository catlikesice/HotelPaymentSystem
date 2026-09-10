;(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(function () {
    const nav = document.querySelector('header .site-nav');
    if (!nav || !nav.querySelector('.nav-inner')) {
      return;
    }

    const toggle = nav.querySelector('.nav-toggle');
    const dropdowns = Array.prototype.slice.call(nav.querySelectorAll('.nav-dropdown'));
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    function setMenuOpen(isOpen) {
      nav.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('nav-rail-open', isOpen);
      if (toggle) {
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    }

    if (toggle) {
      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        setMenuOpen(!nav.classList.contains('is-open'));
      });
    }

    dropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('toggle', function () {
        if (!dropdown.open) {
          return;
        }
        dropdowns.forEach(function (other) {
          if (other !== dropdown) {
            other.removeAttribute('open');
          }
        });
      });

      dropdown.addEventListener('mouseenter', function () {
        if (!hoverMq.matches || window.innerWidth <= 1080) {
          return;
        }
        dropdown.open = true;
      });

      dropdown.addEventListener('mouseleave', function () {
        if (!hoverMq.matches || window.innerWidth <= 1080) {
          return;
        }
        dropdown.open = false;
      });
    });

    document.addEventListener('click', function (event) {
      if (nav.contains(event.target)) {
        return;
      }
      dropdowns.forEach(function (dropdown) {
        dropdown.removeAttribute('open');
      });
      setMenuOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') {
        return;
      }
      dropdowns.forEach(function (dropdown) {
        dropdown.removeAttribute('open');
      });
      setMenuOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) {
        setMenuOpen(false);
      }
    });
  });
})();
