/**
 * price-range-sidebar.js
 *
 * Builds and enhances a price range sidebar on city hotel listing pages.
 * It automatically categorises hotels into cheap, midrange, and luxury tiers
 * based on the nightly prices embedded in the markup.
 */
(function () {
  const RANGE_KEYS = ["cheap", "midrange", "luxury"];
  const LABELS = { cheap: "Cheap", midrange: "Midrange", luxury: "Luxury" };
  const EPSILON = 1e-6;
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  function formatEth(value) {
    if (!Number.isFinite(value)) return null;
    return value.toFixed(3).replace(/\.?0+$/, "");
  }

  function formatUsdt(value) {
    if (!Number.isFinite(value)) return null;
    return currencyFormatter.format(Math.round(value));
  }

  function computeThresholds(values) {
    if (!values.length) return null;
    const sorted = values.slice().sort(function (a, b) {
      return a - b;
    });
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const spread = max - min;
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    if (spread < EPSILON) {
      return { min, max, cheap: min, luxury: max, spread: 0 };
    }
    return {
      min,
      max,
      cheap: min + spread / 3,
      luxury: min + (2 * spread) / 3,
      spread,
    };
  }

  function buildHintText(thresholds, type, unit, formatter) {
    if (!thresholds) return "";
    const convert = function (value) {
      return formatter ? formatter(value) : value;
    };

    if (thresholds.spread < EPSILON) {
      const base = convert(thresholds.min);
      return base != null ? base + " " + unit : "";
    }

    if (type === "cheap") {
      const upTo = convert(thresholds.cheap);
      return upTo != null ? "Up to " + upTo + " " + unit : "";
    }
    if (type === "midrange") {
      const low = convert(thresholds.cheap);
      const high = convert(thresholds.luxury);
      if (low != null && high != null) {
        return low + " - " + high + " " + unit;
      }
      return "";
    }
    if (type === "luxury") {
      const over = convert(thresholds.luxury);
      return over != null ? "Above " + over + " " + unit : "";
    }
    return "";
  }

  function applyHints(sidebar, options) {
    RANGE_KEYS.forEach(function (key) {
      const target = sidebar.querySelector('[data-range-hint="' + key + '"]');
      if (!target) return;
      const lines = [];
      if (options.primary && options.primary.text[key]) {
        lines.push(options.primary.text[key]);
      }
      if (options.secondary && options.secondary.text[key]) {
        lines.push(options.secondary.text[key]);
      }
      target.textContent = lines.join(" • ");
    });

    const note = sidebar.querySelector("[data-range-note]");
    if (note && options.primary) {
      if (options.primary.thresholds.spread < EPSILON) {
        note.textContent =
          "All listed rooms share a similar nightly rate. Compare amenities to find your fit.";
      } else {
        note.textContent =
          "Ranges update automatically from the prices shown for this city.";
      }
    }
  }

  function createSidebar(index) {
    const aside = document.createElement("aside");
    const headingId = "price-range-heading-" + index;
    aside.className = "price-range-sidebar";
    aside.setAttribute("aria-labelledby", headingId);

    const badge = document.createElement("span");
    badge.className = "price-range-tag";
    badge.textContent = "Price Guide";
    aside.appendChild(badge);

    const heading = document.createElement("h3");
    heading.id = headingId;
    heading.textContent = "Stay by Budget";
    aside.appendChild(heading);

    const desc = document.createElement("p");
    desc.className = "price-range-desc";
    desc.textContent = "Choose a budget tier to spotlight hotels that match.";
    aside.appendChild(desc);

    const options = document.createElement("div");
    options.className = "price-range-options";
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "Highlight hotels by nightly rate");

    RANGE_KEYS.forEach(function (key) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "price-range-option";
      button.dataset.filter = key;

      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent = LABELS[key] || key;

      const value = document.createElement("span");
      value.className = "range-value";
      value.setAttribute("data-range-hint", key);
      value.textContent = "";

      button.appendChild(label);
      button.appendChild(value);
      options.appendChild(button);
    });

    aside.appendChild(options);

    const note = document.createElement("p");
    note.className = "price-range-footnote";
    note.setAttribute("data-range-note", "");
    note.textContent = "Select a tier to highlight matching stays.";
    aside.appendChild(note);

    return aside;
  }

  function ensureLayout(container, index) {
    const hotelList = container.querySelector(".hotel-list");
    if (!hotelList) {
      return null;
    }

    let layout = container.querySelector(".booking-layout");
    if (!layout) {
      layout = document.createElement("div");
      layout.className = "booking-layout";
      hotelList.parentNode.insertBefore(layout, hotelList);
    }

    let sidebar = layout.querySelector(".price-range-sidebar");
    if (!sidebar) {
      sidebar = createSidebar(index + 1);
      layout.insertBefore(sidebar, layout.firstChild);
    }

    let content = layout.querySelector(".booking-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "booking-content";
      layout.appendChild(content);
    }

    if (hotelList.parentNode !== content) {
      content.appendChild(hotelList);
    }

    return sidebar;
  }

  function initSidebar(sidebar, container) {
    const hotelCards = Array.prototype.slice.call(
      container.querySelectorAll(".hotel-list .hotel-card")
    );
    if (!hotelCards.length) {
      return;
    }

    const priceEntries = hotelCards
      .map(function (card) {
        const priceEl = card.querySelector(".price");
        if (!priceEl) {
          return null;
        }
        const eth = parseFloat(priceEl.dataset.eth);
        const usdt = parseFloat(priceEl.dataset.usdt);
        return {
          card,
          eth: Number.isFinite(eth) ? eth : null,
          usdt: Number.isFinite(usdt) ? usdt : null,
        };
      })
      .filter(Boolean);

    if (!priceEntries.length) {
      return;
    }

    const ethValues = priceEntries
      .map(function (entry) {
        return entry.eth;
      })
      .filter(function (value) {
        return Number.isFinite(value);
      });
    const usdtValues = priceEntries
      .map(function (entry) {
        return entry.usdt;
      })
      .filter(function (value) {
        return Number.isFinite(value);
      });

    const ethThresholds = computeThresholds(ethValues);
    const usdtThresholds = computeThresholds(usdtValues);

    hotelCards.forEach(function (card) {
      card.classList.remove("is-highlighted", "is-dimmed");
      card.removeAttribute("data-price-range");
    });

    priceEntries.forEach(function (entry) {
      var category = "midrange";
      var reference;
      var thresholds;

      if (Number.isFinite(entry.eth) && ethThresholds) {
        reference = entry.eth;
        thresholds = ethThresholds;
      } else if (Number.isFinite(entry.usdt) && usdtThresholds) {
        reference = entry.usdt;
        thresholds = usdtThresholds;
      }

      if (thresholds && Number.isFinite(reference) && thresholds.spread >= EPSILON) {
        if (reference <= thresholds.cheap + EPSILON) {
          category = "cheap";
        } else if (reference > thresholds.luxury + EPSILON) {
          category = "luxury";
        }
      } else if (thresholds && Number.isFinite(reference)) {
        category = "midrange";
      }

      entry.card.setAttribute("data-price-range", category);
    });

    const primary =
      ethThresholds && ethValues.length
        ? {
            unit: "ETH",
            thresholds: ethThresholds,
            text: RANGE_KEYS.reduce(function (acc, key) {
              acc[key] = buildHintText(ethThresholds, key, "ETH", formatEth);
              return acc;
            }, {}),
          }
        : usdtThresholds && usdtValues.length
        ? {
            unit: "USDT",
            thresholds: usdtThresholds,
            text: RANGE_KEYS.reduce(function (acc, key) {
              acc[key] = buildHintText(usdtThresholds, key, "USDT", formatUsdt);
              return acc;
            }, {}),
          }
        : null;

    let secondary = null;
    if (primary && primary.unit === "ETH" && usdtThresholds) {
      secondary = {
        unit: "USDT",
        thresholds: usdtThresholds,
        text: RANGE_KEYS.reduce(function (acc, key) {
          acc[key] = buildHintText(usdtThresholds, key, "USDT", formatUsdt);
          return acc;
        }, {}),
      };
    } else if (primary && primary.unit === "USDT" && ethThresholds) {
      secondary = {
        unit: "ETH",
        thresholds: ethThresholds,
        text: RANGE_KEYS.reduce(function (acc, key) {
          acc[key] = buildHintText(ethThresholds, key, "ETH", formatEth);
          return acc;
        }, {}),
      };
    }

    if (primary) {
      applyHints(sidebar, { primary, secondary });
    }

    const buttons = Array.prototype.slice.call(
      sidebar.querySelectorAll(".price-range-option")
    );
    if (!buttons.length) {
      return;
    }

    let activeFilter = null;

    function updateButtons() {
      buttons.forEach(function (btn) {
        const isActive = btn.dataset.filter === activeFilter;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function applyFilter() {
      hotelCards.forEach(function (card) {
        const range = card.getAttribute("data-price-range");
        const matches = !activeFilter || range === activeFilter;
        const highlight = activeFilter && matches;
        const dim = activeFilter && !matches;
        card.classList.toggle("is-highlighted", !!highlight);
        card.classList.toggle("is-dimmed", !!dim);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = button.dataset.filter;
        activeFilter = activeFilter === filter ? null : filter;
        updateButtons();
        applyFilter();
      });
    });

    updateButtons();
    applyFilter();
  }

  function boot() {
    const containers = document.querySelectorAll(".booking-container");
    containers.forEach(function (container, index) {
      const sidebar = ensureLayout(container, index);
      if (sidebar) {
        initSidebar(sidebar, container);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
