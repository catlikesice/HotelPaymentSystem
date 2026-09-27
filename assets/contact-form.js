/**
 * Booker contact form: classify a question, then send it.
 * Shared by the contact page and POST /api/contact.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ContactForm = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CATEGORIES = ['booking', 'change-cancel', 'payment', 'property', 'account', 'other'];
  var STORAGE_KEY = 'bh_contact_messages';

  var COPY = {
    en: {
      title: 'Contact',
      lead: 'Send a question about a stay. Choose how you want it classified, then write to the team.',
      name: 'Name',
      email: 'Email',
      category: 'Classify your question',
      categoryPlaceholder: 'Choose a category',
      bookingReference: 'Booking reference',
      bookingHint: 'Optional. Add it if this is about a stay you already booked.',
      message: 'Your question',
      messagePlaceholder: 'Tell us what you need help with',
      send: 'Send',
      sending: 'Sending...',
      success: 'Your message has been sent. We will reply to the email you provided.',
      savedLocally: 'We could not reach the server. Your message is saved in this browser — try Send again when you are connected.',
      categories: {
        booking: 'Booking a stay',
        'change-cancel': 'Changing or cancelling a booking',
        payment: 'Payment',
        property: 'A hotel or destination',
        account: 'My account',
        other: 'Something else'
      },
      errors: {
        name: 'Please enter your name.',
        email: 'Please enter a valid email address.',
        category: 'Choose how to classify your question.',
        message: 'Please describe your question.',
        bookingReference: 'Booking reference is too long.',
        rate: 'Please wait a moment before sending another message.',
        send: 'Your message could not be sent. Please try again.'
      }
    },
    ru: {
      title: 'Контакты',
      lead: 'Отправьте вопрос о проживании. Выберите, как его классифицировать, и напишите команде.',
      name: 'Имя',
      email: 'Эл. почта',
      category: 'Классификация вопроса',
      categoryPlaceholder: 'Выберите категорию',
      bookingReference: 'Номер бронирования',
      bookingHint: 'Необязательно. Укажите, если вопрос касается уже оформленной поездки.',
      message: 'Ваш вопрос',
      messagePlaceholder: 'Опишите, с чем нужна помощь',
      send: 'Отправить',
      sending: 'Отправка...',
      success: 'Сообщение отправлено. Мы ответим на указанный адрес электронной почты.',
      savedLocally: 'Не удалось связаться с сервером. Сообщение сохранено в этом браузере — нажмите «Отправить» ещё раз, когда появится соединение.',
      categories: {
        booking: 'Бронирование проживания',
        'change-cancel': 'Изменение или отмена бронирования',
        payment: 'Оплата',
        property: 'Отель или направление',
        account: 'Мой аккаунт',
        other: 'Другое'
      },
      errors: {
        name: 'Введите ваше имя.',
        email: 'Введите действительный адрес электронной почты.',
        category: 'Выберите, как классифицировать вопрос.',
        message: 'Опишите ваш вопрос.',
        bookingReference: 'Номер бронирования слишком длинный.',
        rate: 'Подождите немного, прежде чем отправлять ещё одно сообщение.',
        send: 'Не удалось отправить сообщение. Попробуйте ещё раз.'
      }
    },
    sv: {
      title: 'Kontakt',
      lead: 'Skicka en fråga om en vistelse. Välj hur du vill klassificera den och skriv till teamet.',
      name: 'Namn',
      email: 'E-post',
      category: 'Klassificera din fråga',
      categoryPlaceholder: 'Välj en kategori',
      bookingReference: 'Bokningsreferens',
      bookingHint: 'Valfritt. Ange den om frågan gäller en vistelse du redan har bokat.',
      message: 'Din fråga',
      messagePlaceholder: 'Berätta vad du behöver hjälp med',
      send: 'Skicka',
      sending: 'Skickar...',
      success: 'Ditt meddelande har skickats. Vi svarar till den e-postadress du angav.',
      savedLocally: 'Servern gick inte att nå. Meddelandet sparades i den här webbläsaren — tryck på Skicka igen när du är ansluten.',
      categories: {
        booking: 'Boka en vistelse',
        'change-cancel': 'Ändra eller avboka en bokning',
        payment: 'Betalning',
        property: 'Ett hotell eller en destination',
        account: 'Mitt konto',
        other: 'Något annat'
      },
      errors: {
        name: 'Ange ditt namn.',
        email: 'Ange en giltig e-postadress.',
        category: 'Välj hur frågan ska klassificeras.',
        message: 'Beskriv din fråga.',
        bookingReference: 'Bokningsreferensen är för lång.',
        rate: 'Vänta en stund innan du skickar ett nytt meddelande.',
        send: 'Meddelandet kunde inte skickas. Försök igen.'
      }
    },
    de: {
      title: 'Kontakt',
      lead: 'Senden Sie eine Frage zu einem Aufenthalt. Wählen Sie, wie sie eingeordnet werden soll, und schreiben Sie an das Team.',
      name: 'Name',
      email: 'E-Mail',
      category: 'Frage einordnen',
      categoryPlaceholder: 'Kategorie wählen',
      bookingReference: 'Buchungsreferenz',
      bookingHint: 'Optional. Geben Sie sie an, wenn es um einen bereits gebuchten Aufenthalt geht.',
      message: 'Ihre Frage',
      messagePlaceholder: 'Beschreiben Sie, wobei Sie Hilfe brauchen',
      send: 'Senden',
      sending: 'Wird gesendet...',
      success: 'Ihre Nachricht wurde gesendet. Wir antworten an die angegebene E-Mail-Adresse.',
      savedLocally: 'Der Server war nicht erreichbar. Die Nachricht ist in diesem Browser gespeichert — tippen Sie erneut auf Senden, sobald eine Verbindung besteht.',
      categories: {
        booking: 'Aufenthalt buchen',
        'change-cancel': 'Buchung ändern oder stornieren',
        payment: 'Zahlung',
        property: 'Hotel oder Reiseziel',
        account: 'Mein Konto',
        other: 'Etwas anderes'
      },
      errors: {
        name: 'Bitte geben Sie Ihren Namen ein.',
        email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        category: 'Wählen Sie, wie Ihre Frage eingeordnet werden soll.',
        message: 'Bitte beschreiben Sie Ihre Frage.',
        bookingReference: 'Die Buchungsreferenz ist zu lang.',
        rate: 'Bitte warten Sie einen Moment, bevor Sie eine weitere Nachricht senden.',
        send: 'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'
      }
    }
  };

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function packFor(lang) {
    return COPY[lang] || COPY.en;
  }

  function messageFor(code, lang) {
    var pack = packFor(lang);
    return (pack.errors && pack.errors[code]) || COPY.en.errors[code] || COPY.en.errors.send;
  }

  function validate(input) {
    var body = input && typeof input === 'object' ? input : {};
    var name = text(body.name);
    var email = text(body.email).toLowerCase();
    var category = text(body.category);
    var message = text(body.message);
    var bookingReference = text(body.bookingReference);

    if (name.length < 2 || name.length > 120) {
      return { ok: false, code: 'name' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      return { ok: false, code: 'email' };
    }
    if (CATEGORIES.indexOf(category) === -1) {
      return { ok: false, code: 'category' };
    }
    if (message.length < 8 || message.length > 4000) {
      return { ok: false, code: 'message' };
    }
    if (bookingReference.length > 40) {
      return { ok: false, code: 'bookingReference' };
    }

    return {
      ok: true,
      value: {
        name: name,
        email: email,
        category: category,
        message: message,
        bookingReference: bookingReference
      }
    };
  }

  function lookup(pack, key) {
    if (!key) return '';
    var parts = key.split('.');
    var cursor = pack;
    for (var i = 0; i < parts.length; i += 1) {
      if (!cursor || typeof cursor !== 'object') return '';
      cursor = cursor[parts[i]];
    }
    return typeof cursor === 'string' ? cursor : '';
  }

  function currentLang() {
    var lang = '';
    if (typeof document !== 'undefined' && document.documentElement) {
      lang = document.documentElement.lang || '';
    }
    if (COPY[lang]) return lang;
    if (typeof window !== 'undefined' && window.LanguagePreferences && typeof window.LanguagePreferences.getPreferredLanguage === 'function') {
      var preferred = window.LanguagePreferences.getPreferredLanguage();
      if (COPY[preferred]) return preferred;
    }
    return 'en';
  }

  function applyCopy(lang) {
    if (typeof document === 'undefined') return;
    var pack = packFor(COPY[lang] ? lang : 'en');
    var nodes = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.closest && node.closest('.site-nav')) return;
      var value = lookup(pack, node.getAttribute('data-i18n'));
      if (value) node.textContent = value;
    });
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    Array.prototype.forEach.call(placeholders, function (node) {
      var value = lookup(pack, node.getAttribute('data-i18n-placeholder'));
      if (value) node.setAttribute('placeholder', value);
    });
  }

  function fieldFor(form, code) {
    if (code === 'name') return form.elements.name;
    if (code === 'email') return form.elements.email;
    if (code === 'category') return form.elements.category;
    if (code === 'bookingReference') return form.elements.bookingReference;
    if (code === 'message') return form.elements.message;
    return null;
  }

  function setStatus(status, message, kind) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('auth-status--error', 'auth-status--success');
    if (kind === 'error') status.classList.add('auth-status--error');
    if (kind === 'success') status.classList.add('auth-status--success');
  }

  function clearInvalid(form) {
    Array.prototype.forEach.call(form.elements, function (element) {
      if (element && element.removeAttribute) element.removeAttribute('aria-invalid');
    });
  }

  function prefill(form) {
    var user = null;
    if (typeof window !== 'undefined' && window.AuthClient && typeof window.AuthClient.getUser === 'function') {
      user = window.AuthClient.getUser();
    }
    if (!user) return;
    if (form.elements.name && !form.elements.name.value && user.name) {
      form.elements.name.value = user.name;
    }
    if (form.elements.email && !form.elements.email.value && user.email) {
      form.elements.email.value = user.email;
    }
  }

  function rememberLocally(value) {
    try {
      var existing = [];
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
      existing.push({
        name: value.name,
        email: value.email,
        category: value.category,
        message: value.message,
        bookingReference: value.bookingReference,
        savedAt: new Date().toISOString()
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-20)));
    } catch (error) {
      // Private mode or a full disk should not block the status message.
    }
  }

  function bind(form) {
    if (!form || form.dataset.contactBound === 'true') return;
    form.dataset.contactBound = 'true';

    var status = document.getElementById('contact-status');
    var submitBtn = form.querySelector('[type="submit"]');

    prefill(form);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var lang = currentLang();
      var pack = packFor(lang);
      clearInvalid(form);

      var result = validate({
        name: form.elements.name && form.elements.name.value,
        email: form.elements.email && form.elements.email.value,
        category: form.elements.category && form.elements.category.value,
        message: form.elements.message && form.elements.message.value,
        bookingReference: form.elements.bookingReference && form.elements.bookingReference.value
      });

      if (!result.ok) {
        setStatus(status, messageFor(result.code, lang), 'error');
        var field = fieldFor(form, result.code);
        if (field) {
          field.setAttribute('aria-invalid', 'true');
          if (typeof field.focus === 'function') field.focus();
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = pack.sending;
      }

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.value)
      }).then(function (response) {
        return response.json().catch(function () { return null; }).then(function (payload) {
          return { ok: response.ok, status: response.status, payload: payload };
        });
      }).then(function (response) {
        if (!response.ok) {
          var code = (response.payload && response.payload.code) || 'send';
          setStatus(status, messageFor(code, currentLang()), 'error');
          return;
        }
        form.reset();
        prefill(form);
        applyCopy(currentLang());
        setStatus(status, packFor(currentLang()).success, 'success');
      }).catch(function () {
        rememberLocally(result.value);
        setStatus(status, packFor(currentLang()).savedLocally, 'error');
      }).then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = packFor(currentLang()).send;
        }
      });
    });
  }

  function init() {
    applyCopy(currentLang());
    var form = document.getElementById('contact-form');
    if (form) bind(form);
  }

  if (typeof document !== 'undefined') {
    var languageEventName = (typeof window !== 'undefined' && window.LanguagePreferences && window.LanguagePreferences.CHANGE_EVENT) || 'preferredLanguageChange';
    document.addEventListener(languageEventName, function (event) {
      var lang = event && event.detail && event.detail.lang;
      applyCopy(lang || currentLang());
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }

  return {
    CATEGORIES: CATEGORIES,
    COPY: COPY,
    validate: validate,
    messageFor: messageFor,
    applyCopy: applyCopy,
    bind: bind
  };
});
