/**
 * price-range-sidebar.js
 *
 * Builds and enhances a price range sidebar on city hotel listing pages.
 * It automatically categorises hotels into cheap, midrange, and luxury tiers
 * based on the nightly prices embedded in the markup.
 */
(function () {
  const RANGE_KEYS = ["cheap", "midrange", "luxury"];
  const EPSILON = 1e-6;
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const DEFAULT_TRANSLATIONS = {
    en: {
      badge: "Price Guide",
      heading: "Stay by Budget",
      description: "Choose a budget tier to spotlight hotels that match.",
      ariaLabel: "Highlight hotels by nightly rate",
      noteDefault: "Select a tier to highlight matching stays.",
      noteUniform:
        "All listed rooms share a similar nightly rate. Compare amenities to find your fit.",
      noteDynamic:
        "Ranges update automatically from the prices shown for this city.",
      options: {
        cheap: "Cheap",
        midrange: "Midrange",
        luxury: "Luxury",
      },
      hints: {
        cheap: "Up to {amount} {unit}",
        midrange: "{min} - {max} {unit}",
        luxury: "Above {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      combinationSeparator: " • ",
    },
    ru: {
      badge: "Гид по ценам",
      heading: "Выбор по бюджету",
      description: "Выберите бюджет, чтобы подсветить подходящие отели.",
      ariaLabel: "Подсветить отели по ночной цене",
      noteDefault: "Выберите категорию, чтобы увидеть подходящие варианты.",
      noteUniform:
        "Все номера имеют схожую стоимость за ночь. Сравните удобства, чтобы выбрать свой вариант.",
      noteDynamic:
        "Диапазоны рассчитываются автоматически на основе цен для этого города.",
      options: {
        cheap: "Эконом",
        midrange: "Стандарт",
        luxury: "Премиум",
      },
      hints: {
        cheap: "До {amount} {unit}",
        midrange: "{min} — {max} {unit}",
        luxury: "Выше {amount} {unit}",
        uniform: "{amount} {unit}",
      },
    },
    lv: {
      badge: "Cenu ceļvedis",
      heading: "Uzturēšanās pēc budžeta",
      description:
        "Izvēlieties budžeta līmeni, lai izceltu piemērotās viesnīcas.",
      ariaLabel: "Izcelt viesnīcas pēc nakts cenas",
      noteDefault: "Izvēlieties līmeni, lai izceltu atbilstošās iespējas.",
      noteUniform:
        "Visiem numuriem ir līdzīga cena par nakti. Salīdziniet ērtības, lai atrastu piemērotāko.",
      noteDynamic:
        "Robežas tiek aprēķinātas automātiski, izmantojot šajā pilsētā norādītās cenas.",
      options: {
        cheap: "Ekonomisks",
        midrange: "Vidējs",
        luxury: "Luksusa",
      },
      hints: {
        cheap: "Līdz {amount} {unit}",
        midrange: "{min}–{max} {unit}",
        luxury: "Virs {amount} {unit}",
        uniform: "{amount} {unit}",
      },
    },
    et: {
      badge: "Hinnajuht",
      heading: "Majutus eelarve järgi",
      description:
        "Vali eelarvekategooria, et esile tõsta sobivad hotellid.",
      ariaLabel: "Tõsta esile hotellid öö hinna järgi",
      noteDefault: "Vali tase, et näha sobivaid majutusvõimalusi.",
      noteUniform:
        "Kõigil tubadel on sarnane ööhind. Võrdle mugavusi, et leida sobivaim.",
      noteDynamic:
        "Vahemikud uuenevad automaatselt selle linna hindade põhjal.",
      options: {
        cheap: "Soodne",
        midrange: "Keskmine",
        luxury: "Luksus",
      },
      hints: {
        cheap: "Kuni {amount} {unit}",
        midrange: "{min}–{max} {unit}",
        luxury: "Üle {amount} {unit}",
        uniform: "{amount} {unit}",
      },
    },
    de: {
      badge: "Preisübersicht",
      heading: "Übernachtung nach Budget",
      description:
        "Wählen Sie eine Budgetstufe, um passende Hotels hervorzuheben.",
      ariaLabel: "Hotels nach Übernachtungspreis hervorheben",
      noteDefault: "Wählen Sie eine Stufe, um passende Angebote zu sehen.",
      noteUniform:
        "Alle Zimmer haben einen ähnlichen Übernachtungspreis. Vergleichen Sie die Ausstattung, um das Richtige zu finden.",
      noteDynamic:
        "Die Bereiche aktualisieren sich automatisch anhand der Preise dieser Stadt.",
      options: {
        cheap: "Preiswert",
        midrange: "Mittelklasse",
        luxury: "Premium",
      },
      hints: {
        cheap: "Bis {amount} {unit}",
        midrange: "{min}–{max} {unit}",
        luxury: "Über {amount} {unit}",
        uniform: "{amount} {unit}",
      },
    },
  };

  const contexts = [];
  const customTranslations = {};
  let currentLanguage = "en";
  let languageHooksBound = false;

  function mergeDeep(target, source) {
    if (!source) {
      return target;
    }
    Object.keys(source).forEach(function (key) {
      var value = source[key];
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        if (
          !target[key] ||
          typeof target[key] !== "object" ||
          Array.isArray(target[key])
        ) {
          target[key] = {};
        }
        mergeDeep(target[key], value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function composeTranslation(lang) {
    var normalized = typeof lang === "string" ? lang.toLowerCase() : "en";
    var merged = mergeDeep({}, DEFAULT_TRANSLATIONS.en);
    if (customTranslations.en) {
      mergeDeep(merged, customTranslations.en);
    }
    if (normalized !== "en") {
      if (DEFAULT_TRANSLATIONS[normalized]) {
        mergeDeep(merged, DEFAULT_TRANSLATIONS[normalized]);
      }
      if (customTranslations[normalized]) {
        mergeDeep(merged, customTranslations[normalized]);
      }
    }
    return merged;
  }

  function formatEth(value) {
    if (!Number.isFinite(value)) return null;
    return value.toFixed(3).replace(/\.?0+$/, "");
  }

  function formatUsdt(value) {
    if (!Number.isFinite(value)) return null;
    return currencyFormatter.format(Math.round(value));
  }

  function getFormatter(unit) {
    if (unit === "ETH") {
      return formatEth;
    }
    if (unit === "USDT") {
      return formatUsdt;
    }
    return null;
  }

  function computeThresholds(values) {
    if (!values.length) return null;
    const sorted = values
      .slice()
      .sort(function (a, b) {
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

  function formatTemplate(template, values) {
    if (!template) {
      return "";
    }
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        var value = values[key];
        if (value !== undefined && value !== null) {
          return value;
        }
      }
      return "";
    });
  }

  function buildHintText(thresholds, type, unit, formatter, hintTemplates) {
    if (!thresholds) {
      return "";
    }
    const templates = hintTemplates || {};
    const formatValue =
      typeof formatter === "function"
        ? function (value) {
            if (!Number.isFinite(value)) {
              return null;
            }
            return formatter(value);
          }
        : function (value) {
            if (!Number.isFinite(value)) {
              return null;
            }
            return String(value);
          };

    if (thresholds.spread < EPSILON) {
      const uniformValue = formatValue(thresholds.min);
      if (uniformValue == null) {
        return "";
      }
      const template = templates.uniform || templates[type];
      if (!template) {
        return uniformValue + " " + unit;
      }
      return formatTemplate(template, {
        amount: uniformValue,
        unit: unit,
      });
    }

    if (type === "cheap") {
      const upTo = formatValue(thresholds.cheap);
      if (upTo == null) {
        return "";
      }
      const template = templates.cheap;
      if (!template) {
        return "Up to " + upTo + " " + unit;
      }
      return formatTemplate(template, {
        amount: upTo,
        unit: unit,
      });
    }

    if (type === "midrange") {
      const low = formatValue(thresholds.cheap);
      const high = formatValue(thresholds.luxury);
      if (low == null || high == null) {
        return "";
      }
      const template = templates.midrange;
      if (!template) {
        return low + " - " + high + " " + unit;
      }
      return formatTemplate(template, {
        min: low,
        max: high,
        unit: unit,
      });
    }

    if (type === "luxury") {
      const over = formatValue(thresholds.luxury);
      if (over == null) {
        return "";
      }
      const template = templates.luxury;
      if (!template) {
        return "Above " + over + " " + unit;
      }
      return formatTemplate(template, {
        amount: over,
        unit: unit,
      });
    }

    return "";
  }

  function applyStaticTranslations(sidebar, strings) {
    if (!sidebar || !strings) {
      return;
    }

    const badge = sidebar.querySelector(".price-range-tag");
    if (badge && strings.badge) {
      badge.textContent = strings.badge;
    }

    const heading = sidebar.querySelector("h3");
    if (heading && strings.heading) {
      heading.textContent = strings.heading;
    }

    const desc = sidebar.querySelector(".price-range-desc");
    if (desc && strings.description) {
      desc.textContent = strings.description;
    }

    const optionsGroup = sidebar.querySelector(".price-range-options");
    if (optionsGroup && strings.ariaLabel) {
      optionsGroup.setAttribute("aria-label", strings.ariaLabel);
    }

    RANGE_KEYS.forEach(function (key) {
      const button = sidebar.querySelector(
        '.price-range-option[data-filter="' + key + '"]'
      );
      if (!button) {
        return;
      }
      const label = button.querySelector(".range-label");
      if (label && strings.options && strings.options[key]) {
        label.textContent = strings.options[key];
      }
    });

    const note = sidebar.querySelector("[data-range-note]");
    if (note && strings.noteDefault) {
      note.textContent = strings.noteDefault;
    }
  }

  function updateHintValues(context, strings) {
    const sidebar = context && context.sidebar;
    if (!sidebar) {
      return;
    }

    const metrics = context.metrics;
    const separator =
      (strings && strings.combinationSeparator) || " • ";
    const note = sidebar.querySelector("[data-range-note]");

    if (!metrics || !metrics.primary) {
      RANGE_KEYS.forEach(function (key) {
        const hintEl = sidebar.querySelector(
          '[data-range-hint="' + key + '"]'
        );
        if (hintEl) {
          hintEl.textContent = "";
        }
      });
      if (note && strings && strings.noteDefault) {
        note.textContent = strings.noteDefault;
      }
      return;
    }

    const primary = metrics.primary;
    const secondary = metrics.secondary || null;

    RANGE_KEYS.forEach(function (key) {
      const hintEl = sidebar.querySelector(
        '[data-range-hint="' + key + '"]'
      );
      if (!hintEl) {
        return;
      }
      const segments = [];
      const primaryText = buildHintText(
        primary.thresholds,
        key,
        primary.unit,
        primary.formatter,
        strings && strings.hints
      );
      if (primaryText) {
        segments.push(primaryText);
      }
      if (secondary) {
        const secondaryText = buildHintText(
          secondary.thresholds,
          key,
          secondary.unit,
          secondary.formatter,
          strings && strings.hints
        );
        if (secondaryText) {
          segments.push(secondaryText);
        }
      }
      hintEl.textContent = segments.join(separator);
    });

    if (note) {
      if (primary.thresholds && primary.thresholds.spread < EPSILON) {
        note.textContent =
          (strings && strings.noteUniform) ||
          (strings && strings.noteDefault) ||
          "";
      } else {
        note.textContent =
          (strings && strings.noteDynamic) ||
          (strings && strings.noteDefault) ||
          "";
      }
    }
  }

  function renderSidebar(context, strings) {
    if (!context || !context.sidebar) {
      return;
    }
    applyStaticTranslations(context.sidebar, strings);
    updateHintValues(context, strings);
  }

  function refreshSidebars() {
    const strings = composeTranslation(currentLanguage);
    contexts.forEach(function (context) {
      renderSidebar(context, strings);
    });
  }

  function setLanguage(lang) {
    var normalized = typeof lang === "string" ? lang.toLowerCase() : "en";
    if (
      !DEFAULT_TRANSLATIONS[normalized] &&
      !customTranslations[normalized]
    ) {
      normalized = "en";
    }
    if (normalized !== currentLanguage) {
      currentLanguage = normalized;
    }
    refreshSidebars();
    return currentLanguage;
  }

  function registerTranslations(map) {
    if (!map) {
      return;
    }
    Object.keys(map).forEach(function (langKey) {
      const normalized = langKey.toLowerCase();
      if (!customTranslations[normalized]) {
        customTranslations[normalized] = {};
      }
      mergeDeep(customTranslations[normalized], map[langKey]);
    });
    refreshSidebars();
  }

  function detectLanguage() {
    const select = document.getElementById("lang-select");
    if (select && select.value) {
      return select.value.toLowerCase();
    }
    if (document.documentElement && document.documentElement.lang) {
      return document.documentElement.lang.toLowerCase();
    }
    return currentLanguage || "en";
  }

  function bindLanguageHooks() {
    if (languageHooksBound) {
      return;
    }
    languageHooksBound = true;

    const languageEventName =
      (window.LanguagePreferences &&
        window.LanguagePreferences.CHANGE_EVENT) ||
      "preferredLanguageChange";

    document.addEventListener(languageEventName, function (event) {
      const nextLang =
        (event && event.detail && event.detail.lang) || detectLanguage();
      setLanguage(nextLang);
    });

    const select = document.getElementById("lang-select");
    if (select) {
      select.addEventListener("change", function () {
        setLanguage(this.value || "en");
      });
    }
  }

  function createSidebar(index) {
    const strings = DEFAULT_TRANSLATIONS.en;
    const aside = document.createElement("aside");
    const headingId = "price-range-heading-" + index;
    aside.className = "price-range-sidebar";
    aside.setAttribute("aria-labelledby", headingId);

    const badge = document.createElement("span");
    badge.className = "price-range-tag";
    badge.textContent = strings.badge;
    aside.appendChild(badge);

    const heading = document.createElement("h3");
    heading.id = headingId;
    heading.textContent = strings.heading;
    aside.appendChild(heading);

    const desc = document.createElement("p");
    desc.className = "price-range-desc";
    desc.textContent = strings.description;
    aside.appendChild(desc);

    const options = document.createElement("div");
    options.className = "price-range-options";
    options.setAttribute("role", "group");
    options.setAttribute(
      "aria-label",
      strings.ariaLabel || "Highlight hotels by nightly rate"
    );

    RANGE_KEYS.forEach(function (key) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "price-range-option";
      button.dataset.filter = key;

      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent =
        (strings.options && strings.options[key]) || key;

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
    note.textContent = strings.noteDefault;
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

  function initSidebar(context, container) {
    const sidebar = context.sidebar;
    const hotelCards = Array.prototype.slice.call(
      container.querySelectorAll(".hotel-list .hotel-card")
    );
    if (!hotelCards.length) {
      context.metrics = null;
      renderSidebar(context, composeTranslation(currentLanguage));
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
      context.metrics = null;
      renderSidebar(context, composeTranslation(currentLanguage));
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
      var reference = null;
      var thresholds = null;

      if (Number.isFinite(entry.eth) && ethThresholds) {
        reference = entry.eth;
        thresholds = ethThresholds;
      } else if (Number.isFinite(entry.usdt) && usdtThresholds) {
        reference = entry.usdt;
        thresholds = usdtThresholds;
      }

      if (
        thresholds &&
        Number.isFinite(reference) &&
        thresholds.spread >= EPSILON
      ) {
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
            formatter: formatEth,
          }
        : usdtThresholds && usdtValues.length
        ? {
            unit: "USDT",
            thresholds: usdtThresholds,
            formatter: formatUsdt,
          }
        : null;

    let secondary = null;
    if (primary && primary.unit === "ETH" && usdtThresholds) {
      secondary = {
        unit: "USDT",
        thresholds: usdtThresholds,
        formatter: formatUsdt,
      };
    } else if (primary && primary.unit === "USDT" && ethThresholds) {
      secondary = {
        unit: "ETH",
        thresholds: ethThresholds,
        formatter: formatEth,
      };
    }

    context.metrics = primary
      ? { primary: primary, secondary: secondary }
      : null;

    renderSidebar(context, composeTranslation(currentLanguage));

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
      if (!sidebar) {
        return;
      }
      const context = { sidebar: sidebar, metrics: null };
      contexts.push(context);
      initSidebar(context, container);
    });

    bindLanguageHooks();
    setLanguage(detectLanguage());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var api = window.PriceRangeSidebar || {};
  api.setLanguage = setLanguage;
  api.registerTranslations = registerTranslations;
  window.PriceRangeSidebar = api;
})();
