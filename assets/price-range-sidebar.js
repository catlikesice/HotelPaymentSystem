/**
 * price-range-sidebar.js
 *
 * Builds and enhances a price range sidebar on city hotel listing pages.
 * It categorises hotels into cheap, midrange, and luxury tiers and shows those
 * ranges in the currency the customer selected.
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
      orderDescription:
        "Order stays from much to little, or from little to much.",
      orderAriaLabel: "Order hotels by nightly rate",
      orderOptions: {
        much: "Much",
        little: "Little",
      },
      orderHints: {
        much: "Highest price first",
        little: "Lowest price first",
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
      orderDescription:
        "Отсортируйте варианты от большего к меньшему или от меньшего к большему.",
      orderAriaLabel: "Упорядочить отели по ночной цене",
      orderOptions: {
        much: "Больше",
        little: "Меньше",
      },
      orderHints: {
        much: "Сначала дороже",
        little: "Сначала дешевле",
      },
    },
    sv: {
      badge: "Prisguide",
      heading: "Boende efter budget",
      description: "Välj en budgetnivå för att lyfta fram hotell som passar.",
      ariaLabel: "Markera hotell efter nattpris",
      noteDefault: "Välj en nivå för att visa matchande boenden.",
      noteUniform:
        "Alla listade rum har ett liknande nattpris. Jämför bekvämligheter för att hitta rätt.",
      noteDynamic:
        "Intervallen uppdateras automatiskt utifrån priserna som visas för den här staden.",
      options: {
        cheap: "Budget",
        midrange: "Mellanklass",
        luxury: "Lyx",
      },
      hints: {
        cheap: "Upp till {amount} {unit}",
        midrange: "{min} - {max} {unit}",
        luxury: "Över {amount} {unit}",
        uniform: "{amount} {unit}",
      },
      orderDescription:
        "Sortera boenden från mycket till lite, eller från lite till mycket.",
      orderAriaLabel: "Sortera hotell efter nattpris",
      orderOptions: {
        much: "Mycket",
        little: "Lite",
      },
      orderHints: {
        much: "Högsta pris först",
        little: "Lägsta pris först",
      },
      combinationSeparator: " • ",
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
      orderDescription:
        "Sortieren Sie die Aufenthalte von viel nach wenig oder von wenig nach viel.",
      orderAriaLabel: "Hotels nach Übernachtungspreis sortieren",
      orderOptions: {
        much: "Viel",
        little: "Wenig",
      },
      orderHints: {
        much: "Höchster Preis zuerst",
        little: "Niedrigster Preis zuerst",
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

  const FALLBACK_RATES = {
    ETH: 0.00035,
    BTC: 0.0000058,
    USDT: 1,
    LTC: 0.0105,
    BCH: 0.00235,
    DOGE: 9.5,
    XRP: 1.9,
    XMR: 0.006,
    XNO: 0.95,
    DASH: 0.0335,
    VET: 28,
    UNI: 0.14,
    SOL: 0.0065,
    ADA: 1.3,
    TRN: 5.5,
    EUR: 0.92,
    USD: 1,
    GBP: 0.76,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.86,
    ISK: 137,
  };

  function activeRates() {
    if (window.PaymentCurrencies && window.PaymentCurrencies.rates) {
      return window.PaymentCurrencies.rates;
    }
    return FALLBACK_RATES;
  }

  function isFiatCurrency(currency) {
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.isFiat === "function"
    ) {
      return window.PaymentCurrencies.isFiat(currency);
    }
    return (
      currency === "EUR" ||
      currency === "USD" ||
      currency === "GBP" ||
      currency === "SEK" ||
      currency === "NOK" ||
      currency === "DKK" ||
      currency === "ISK"
    );
  }

  function decimalPlacesFromValue(value) {
    if (value === undefined || value === null) {
      return 2;
    }
    const stringValue = String(value);
    const dotIndex = stringValue.indexOf(".");
    if (dotIndex === -1) {
      return 0;
    }
    return stringValue.length - dotIndex - 1;
  }

  function clampDecimals(decimals) {
    if (!Number.isFinite(decimals)) {
      return 2;
    }
    return Math.max(0, Math.min(6, Math.round(decimals)));
  }

  function decimalsForCurrency(currency, rate) {
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.decimalsFor === "function" &&
      window.PaymentCurrencies.find &&
      window.PaymentCurrencies.find(currency)
    ) {
      return window.PaymentCurrencies.decimalsFor(currency);
    }
    if (!Number.isFinite(rate)) {
      return 2;
    }
    if (isFiatCurrency(currency)) {
      return rate >= 50 ? 0 : 2;
    }
    if (rate < 0.001) {
      return 6;
    }
    if (rate < 0.1) {
      return 4;
    }
    return 2;
  }

  function quoteFromText(priceEl, currency) {
    const text = String((priceEl && priceEl.textContent) || "");
    if (!text) {
      return null;
    }
    if (currency && text.toUpperCase().indexOf(currency) === -1) {
      return null;
    }
    const nightly = text.match(
      /\(([-+]?\d[\d,]*(?:\.\d+)?)\s+[A-Za-z]{2,5}\s*\/\s*night\)/
    );
    const source = nightly ? nightly[1] : text;
    const match = String(source)
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }
    const parsed = parseFloat(match[0]);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return { value: parsed, decimals: decimalPlacesFromValue(match[0]) };
  }

  function directQuote(dataset, key) {
    if (!dataset || dataset[key] === undefined || dataset[key] === "") {
      return null;
    }
    const value = parseFloat(dataset[key]);
    if (!Number.isFinite(value)) {
      return null;
    }
    return { value: value, decimals: decimalPlacesFromValue(dataset[key]) };
  }

  function quoteNightly(priceEl, currency) {
    if (!priceEl) {
      return null;
    }
    const code = String(currency || "ETH")
      .trim()
      .toUpperCase();
    const dataset = priceEl.dataset || {};
    const direct =
      code === "ETH"
        ? directQuote(dataset, "eth")
        : code === "BTC"
        ? directQuote(dataset, "btc")
        : code === "USDT"
        ? directQuote(dataset, "usdt")
        : null;
    if (direct) {
      return direct;
    }

    const usdtQuote = directQuote(dataset, "usdt");
    const rate = activeRates()[code];
    if (usdtQuote && Number.isFinite(rate)) {
      const decimals = decimalsForCurrency(code, rate);
      let perNight = usdtQuote.value * rate;
      if (isFiatCurrency(code)) {
        const factor = Math.pow(10, decimals);
        perNight = Math.round((perNight + Number.EPSILON) * factor) / factor;
      }
      return { value: perNight, decimals: decimals };
    }

    return quoteFromText(priceEl, code);
  }

  function formatterFor(currency, decimals) {
    const code = String(currency || "ETH")
      .trim()
      .toUpperCase();
    const places = clampDecimals(decimals);
    return function (value) {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (code === "ETH") {
        return formatEth(value);
      }
      if (code === "USDT") {
        return formatUsdt(value);
      }
      return value.toFixed(places);
    };
  }

  function categoryFor(amount, thresholds) {
    if (!thresholds || !Number.isFinite(amount) || thresholds.spread < EPSILON) {
      return "midrange";
    }
    if (amount <= thresholds.cheap + EPSILON) {
      return "cheap";
    }
    if (amount > thresholds.luxury + EPSILON) {
      return "luxury";
    }
    return "midrange";
  }

  function measureContext(context) {
    if (!context || !context.sidebar) {
      return;
    }
    const hotelCards = context.hotelCards || [];
    const currency = activeCurrency();
    const quotes = [];

    hotelCards.forEach(function (card) {
      if (card.classList) {
        card.classList.remove("is-highlighted", "is-dimmed");
      }
      if (typeof card.removeAttribute === "function") {
        card.removeAttribute("data-price-range");
      }
      const priceEl = card.querySelector ? card.querySelector(".price") : null;
      const quote = quoteNightly(priceEl, currency);
      if (quote) {
        quotes.push({ card: card, quote: quote });
      }
    });

    const thresholds = computeThresholds(
      quotes.map(function (entry) {
        return entry.quote.value;
      })
    );

    quotes.forEach(function (entry) {
      entry.card.setAttribute(
        "data-price-range",
        categoryFor(entry.quote.value, thresholds)
      );
    });

    if (!thresholds) {
      context.metrics = null;
    } else {
      let decimals = quotes.length ? quotes[0].quote.decimals : 2;
      quotes.forEach(function (entry) {
        if (Number.isFinite(entry.quote.decimals)) {
          decimals = Math.max(decimals, entry.quote.decimals);
        }
      });
      context.metrics = {
        primary: {
          unit: currency,
          thresholds: thresholds,
          formatter: formatterFor(currency, decimals),
        },
        secondary: null,
      };
    }

    renderSidebar(context, composeTranslation(currentLanguage));
    if (typeof context.applyFilter === "function") {
      context.applyFilter();
    }
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

    const orderDesc = sidebar.querySelector("[data-order-desc]");
    if (orderDesc && strings.orderDescription) {
      orderDesc.textContent = strings.orderDescription;
    }

    const orderGroup = sidebar.querySelector("[data-price-order]");
    if (orderGroup && strings.orderAriaLabel) {
      orderGroup.setAttribute("aria-label", strings.orderAriaLabel);
    }

    ["much", "little"].forEach(function (key) {
      const button = sidebar.querySelector(
        '.price-range-option[data-order="' + key + '"]'
      );
      if (!button) {
        return;
      }
      const label = button.querySelector(".range-label");
      if (label && strings.orderOptions && strings.orderOptions[key]) {
        label.textContent = strings.orderOptions[key];
      }
      const hint = button.querySelector("[data-order-hint]");
      if (hint && strings.orderHints && strings.orderHints[key]) {
        hint.textContent = strings.orderHints[key];
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

  function nightlyAmount(card, currency) {
    if (!card || typeof card.querySelector !== "function") {
      return null;
    }
    const priceEl = card.querySelector(".price");
    if (!priceEl) {
      return null;
    }
    const dataset = priceEl.dataset || {};
    const key = String(currency || "ETH").toLowerCase();
    const raw = dataset[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const direct = parseFloat(raw);
      if (Number.isFinite(direct)) {
        return direct;
      }
    }
    const text = String(priceEl.textContent || "").replace(/,/g, "");
    const match = text.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return null;
    }
    const parsed = parseFloat(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function orderStayCards(cards, direction, currency) {
    const list = Array.prototype.slice.call(cards || []);
    const decorated = list.map(function (card, index) {
      return {
        card: card,
        index: index,
        amount: nightlyAmount(card, currency),
      };
    });
    const normalized =
      direction === "little" || direction === "much" ? direction : null;
    decorated.sort(function (a, b) {
      if (!normalized) {
        return a.index - b.index;
      }
      const aMissing = !Number.isFinite(a.amount);
      const bMissing = !Number.isFinite(b.amount);
      if (aMissing || bMissing) {
        if (aMissing && bMissing) {
          return a.index - b.index;
        }
        return aMissing ? 1 : -1;
      }
      if (a.amount === b.amount) {
        return a.index - b.index;
      }
      return normalized === "little" ? a.amount - b.amount : b.amount - a.amount;
    });
    return decorated.map(function (item) {
      return item.card;
    });
  }

  function activeCurrency() {
    const currencySelect = document.getElementById("currency");
    if (currencySelect && currencySelect.value) {
      return String(currencySelect.value).trim().toUpperCase();
    }
    if (
      window.PaymentCurrencies &&
      typeof window.PaymentCurrencies.readPreference === "function"
    ) {
      const saved = window.PaymentCurrencies.readPreference();
      if (saved) {
        return saved;
      }
    }
    return "ETH";
  }

  function wirePriceOrder(context, sidebar, hotelCards) {
    const buttons = Array.prototype.slice.call(
      sidebar.querySelectorAll('.price-range-option[data-order]')
    );
    if (!buttons.length || !hotelCards.length) {
      return;
    }

    const hotelList = hotelCards[0].parentNode;
    let activeOrder = null;

    function updateOrderButtons() {
      buttons.forEach(function (btn) {
        const isActive = btn.dataset.order === activeOrder;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function applyOrder() {
      if (!hotelList) {
        return;
      }
      const ordered = orderStayCards(hotelCards, activeOrder, activeCurrency());
      ordered.forEach(function (card) {
        hotelList.appendChild(card);
      });
    }

    context.applyOrder = applyOrder;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const order = button.dataset.order;
        activeOrder = activeOrder === order ? null : order;
        updateOrderButtons();
        applyOrder();
      });
    });

    updateOrderButtons();
  }

  let currencyHookBound = false;

  function refreshCurrencyRanges() {
    contexts.forEach(function (context) {
      measureContext(context);
      if (typeof context.applyOrder === "function") {
        context.applyOrder();
      }
    });
  }

  function bindCurrencyHook() {
    if (currencyHookBound) {
      return;
    }
    currencyHookBound = true;
    document.addEventListener("change", function (event) {
      const target = event.target;
      if (!target || target.id !== "currency") {
        return;
      }
      refreshCurrencyRanges();
    });

    if (
      typeof window.updatePrices === "function" &&
      !window.updatePrices.__priceRangeWrapped
    ) {
      const original = window.updatePrices;
      const wrapped = function () {
        const result = original.apply(this, arguments);
        refreshCurrencyRanges();
        return result;
      };
      wrapped.__priceRangeWrapped = true;
      window.updatePrices = wrapped;
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

    const orderDesc = document.createElement("p");
    orderDesc.className = "price-range-desc";
    orderDesc.setAttribute("data-order-desc", "");
    orderDesc.textContent = strings.orderDescription || "";
    aside.appendChild(orderDesc);

    const orderOptions = document.createElement("div");
    orderOptions.className = "price-range-options price-range-options--order";
    orderOptions.setAttribute("data-price-order", "");
    orderOptions.setAttribute("role", "group");
    orderOptions.setAttribute(
      "aria-label",
      strings.orderAriaLabel || "Order hotels by nightly rate"
    );

    ["much", "little"].forEach(function (key) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "price-range-option";
      button.dataset.order = key;
      button.setAttribute("aria-pressed", "false");

      const label = document.createElement("span");
      label.className = "range-label";
      label.textContent =
        (strings.orderOptions && strings.orderOptions[key]) || key;

      const value = document.createElement("span");
      value.className = "range-value";
      value.setAttribute("data-order-hint", key);
      value.textContent =
        (strings.orderHints && strings.orderHints[key]) || "";

      button.appendChild(label);
      button.appendChild(value);
      orderOptions.appendChild(button);
    });

    aside.appendChild(orderOptions);

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
    context.hotelCards = hotelCards;
    wirePriceOrder(context, sidebar, hotelCards);
    measureContext(context);

    const buttons = Array.prototype.slice.call(
      sidebar.querySelectorAll('.price-range-option[data-filter]')
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

    context.applyFilter = applyFilter;

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
    bindCurrencyHook();
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
  api.orderStayCards = orderStayCards;
  api.nightlyAmount = nightlyAmount;
  window.PriceRangeSidebar = api;
})();
