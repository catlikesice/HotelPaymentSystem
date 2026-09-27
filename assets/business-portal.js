(function () {
  let hashBound = false;
  const SECTIONS = ['overview', 'accommodation', 'profile'];

  function rootEl() {
    return document.getElementById('business-dashboard');
  }

  function setText(selector, value) {
    const root = rootEl();
    const el = root ? root.querySelector(selector) : null;
    if (el) {
      el.textContent = value == null ? '' : String(value);
    }
  }

  function setRow(field, value) {
    const root = rootEl();
    const row = root ? root.querySelector('[data-business-row="' + field + '"]') : null;
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

  function clearNode(node) {
    while (node && node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (text) {
      el.textContent = text;
    }
    return el;
  }

  function businessTypeLabel(value) {
    const labels = {
      'independent-hotel': 'Independent hotel',
      'hotel-chain': 'Hotel chain',
      'travel-agency': 'Travel agency',
      corporate: 'Corporate travel',
      other: 'Other'
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

  function typeLabel(value) {
    if (window.PropertyRecords && typeof window.PropertyRecords.typeLabel === 'function') {
      return window.PropertyRecords.typeLabel(value);
    }
    return value || '';
  }

  function currentSection() {
    const hash = (window.location.hash || '').replace('#', '');
    if (!hash || SECTIONS.indexOf(hash) === -1) {
      return 'accommodation';
    }
    return hash;
  }

  function showSection(name) {
    const root = rootEl();
    if (!root) {
      return;
    }
    const section = SECTIONS.indexOf(name) === -1 ? 'accommodation' : name;
    root.querySelectorAll('[data-portal-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-portal-panel') !== section;
    });
    root.querySelectorAll('[data-portal-section]').forEach(function (link) {
      const active = link.getAttribute('data-portal-section') === section;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function bindNav() {
    const root = rootEl();
    if (!root) {
      return;
    }
    const nav = root.querySelector('.portal-nav');
    if (!nav || nav.getAttribute('data-section-bound')) {
      return;
    }
    nav.setAttribute('data-section-bound', 'true');
    nav.addEventListener('click', function (event) {
      const link = event.target.closest('[data-portal-section]');
      if (!link || !nav.contains(link)) {
        return;
      }
      const section = link.getAttribute('data-portal-section');
      if (SECTIONS.indexOf(section) === -1) {
        return;
      }
      event.preventDefault();
      if (window.location.hash !== '#' + section) {
        window.location.hash = section;
      } else {
        showSection(section);
      }
    });
    if (!hashBound) {
      hashBound = true;
      window.addEventListener('hashchange', function () {
        if (!rootEl() || rootEl().hidden) {
          return;
        }
        showSection(currentSection());
      });
    }
  }

  function formEl() {
    return document.getElementById('property-form');
  }

  function setStatus(message, kind) {
    const status = document.getElementById('property-form-status');
    if (!status) {
      return;
    }
    status.textContent = message || '';
    status.className = 'auth-status' + (kind ? ' auth-status--' + kind : '');
  }

  function editingId() {
    const form = formEl();
    return form ? (form.getAttribute('data-property-id') || '') : '';
  }

  function setEditing(property) {
    const form = formEl();
    if (!form) {
      return;
    }
    const title = document.getElementById('property-form-title');
    const submit = document.getElementById('property-submit');
    const cancel = document.getElementById('property-cancel');
    if (property && property.id) {
      form.setAttribute('data-property-id', property.id);
      if (title) {
        title.textContent = 'Edit accommodation location';
      }
      if (submit) {
        submit.textContent = 'Update location';
      }
      if (cancel) {
        cancel.hidden = false;
      }
    } else {
      form.removeAttribute('data-property-id');
      if (title) {
        title.textContent = 'Add accommodation location';
      }
      if (submit) {
        submit.textContent = 'Save location';
      }
      if (cancel) {
        cancel.hidden = true;
      }
    }
  }

  function fillAddress(country, values) {
    const form = formEl();
    const countrySelect = form ? form.querySelector('#country') : null;
    const fieldsRoot = form ? form.querySelector('#address-fields') : null;
    if (!countrySelect || !fieldsRoot || !window.CountryAddress) {
      return;
    }
    countrySelect.value = country || '';
    window.CountryAddress.renderFields(fieldsRoot, countrySelect.value, values || {});
    fieldsRoot.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function resetForm() {
    const form = formEl();
    if (!form) {
      return;
    }
    form.reset();
    setEditing(null);
    fillAddress('', {});
    setStatus('', '');
  }

  function readPayload() {
    const form = formEl();
    const country = form.country ? String(form.country.value || '').trim() : '';
    const fieldsRoot = form.querySelector('#address-fields');
    const values = window.CountryAddress
      ? window.CountryAddress.collectValues(fieldsRoot)
      : {};
    const latitude = form.latitude ? String(form.latitude.value || '').trim() : '';
    const longitude = form.longitude ? String(form.longitude.value || '').trim() : '';
    return {
      name: form.companyName ? String(form.companyName.value || '').trim() : '',
      propertyType: form.propertyType ? String(form.propertyType.value || '').trim() : '',
      country: country,
      address: values,
      directions: form.directions ? String(form.directions.value || '').trim() : '',
      description: form.description ? String(form.description.value || '').trim() : '',
      phone: form.phone ? String(form.phone.value || '').trim() : '',
      website: form.website ? String(form.website.value || '').trim() : '',
      latitude: latitude,
      longitude: longitude
    };
  }

  function validatePayload(user, payload) {
    if (!window.PropertyRecords) {
      return;
    }
    const id = editingId();
    if (id) {
      window.PropertyRecords.updateRecord({
        id: id,
        userId: user.id,
        createdAt: new Date().toISOString()
      }, payload);
      return;
    }
    window.PropertyRecords.createRecord(user.id, payload);
  }

  function propertyCard(property) {
    const card = createEl('article', 'portal-property');
    card.appendChild(createEl('p', 'portal-booking__eyebrow', typeLabel(property.propertyType)));
    card.appendChild(createEl('h3', 'portal-booking__title', property.name));
    if (property.addressFormatted) {
      const address = createEl('p', 'account-address portal-booking__detail', property.addressFormatted);
      card.appendChild(address);
    }
    if (property.directions) {
      card.appendChild(createEl('p', 'portal-booking__detail', property.directions));
    }
    if (property.latitude != null && property.longitude != null) {
      card.appendChild(createEl(
        'p',
        'portal-booking__meta',
        'Map pin ' + property.latitude + ', ' + property.longitude
      ));
    }
    const contact = [property.phone, property.website].filter(Boolean).join(' · ');
    if (contact) {
      card.appendChild(createEl('p', 'portal-booking__meta', contact));
    }
    const actions = createEl('div', 'portal-property__actions');
    const edit = createEl('button', 'btn btn--secondary', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', function () {
      startEdit(property);
    });
    const remove = createEl('button', 'btn btn--secondary', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', function () {
      removeProperty(property);
    });
    actions.appendChild(edit);
    actions.appendChild(remove);
    card.appendChild(actions);
    return card;
  }

  function renderList(properties) {
    const mount = document.querySelector('#business-dashboard [data-property-list]');
    if (!mount) {
      return;
    }
    clearNode(mount);
    if (!properties.length) {
      const empty = createEl('div', 'portal-empty');
      empty.appendChild(createEl(
        'p',
        '',
        'No accommodation locations yet. Add the property name, local address, and how guests find it.'
      ));
      mount.appendChild(empty);
      return;
    }
    properties.forEach(function (property) {
      mount.appendChild(propertyCard(property));
    });
  }

  function renderStats(properties) {
    setText('[data-property-count]', String(properties.length));
    const places = [];
    properties.forEach(function (property) {
      const place = [property.city, property.country].filter(Boolean).join(', ');
      if (place && places.indexOf(place) === -1) {
        places.push(place);
      }
    });
    setText('[data-property-places]', places.length ? places.join(' · ') : 'No locations yet');
    const latest = properties[0];
    setText('[data-property-latest]', latest ? latest.name : '—');
    setText(
      '[data-property-latest-meta]',
      latest ? 'Most recent upload' : 'Save a location to see it here'
    );
  }

  function loadProperties() {
    const auth = window.AuthClient;
    if (!auth || typeof auth.listProperties !== 'function') {
      renderList([]);
      renderStats([]);
      return Promise.resolve([]);
    }
    return auth.listProperties().then(function (data) {
      const properties = data && Array.isArray(data.properties) ? data.properties : [];
      renderStats(properties);
      renderList(properties);
      return properties;
    }).catch(function (error) {
      renderStats([]);
      renderList([]);
      setStatus(error && error.message ? error.message : 'Unable to load accommodation locations.', 'error');
      return [];
    });
  }

  function startEdit(property) {
    const form = formEl();
    if (!form || !property) {
      return;
    }
    showSection('accommodation');
    if (window.location.hash !== '#accommodation') {
      window.location.hash = 'accommodation';
    }
    setEditing(property);
    if (form.companyName) {
      form.companyName.value = property.name || '';
    }
    if (form.propertyType) {
      form.propertyType.value = property.propertyType || '';
    }
    if (form.directions) {
      form.directions.value = property.directions || '';
    }
    if (form.description) {
      form.description.value = property.description || '';
    }
    if (form.phone) {
      form.phone.value = property.phone || '';
    }
    if (form.website) {
      form.website.value = property.website || '';
    }
    if (form.latitude) {
      form.latitude.value = property.latitude == null ? '' : String(property.latitude);
    }
    if (form.longitude) {
      form.longitude.value = property.longitude == null ? '' : String(property.longitude);
    }
    fillAddress(property.country, property.address || {});
    if (form.companyName) {
      form.companyName.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setStatus('', '');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function removeProperty(property) {
    const auth = window.AuthClient;
    if (!property || !auth || typeof auth.deleteProperty !== 'function') {
      return;
    }
    const confirmed = window.confirm('Remove ' + (property.name || 'this accommodation') + ' from your account?');
    if (!confirmed) {
      return;
    }
    auth.deleteProperty(property.id).then(function () {
      if (editingId() === property.id) {
        resetForm();
      }
      setStatus('Location removed.', 'success');
      return loadProperties();
    }).catch(function (error) {
      setStatus(error && error.message ? error.message : 'Unable to remove that location.', 'error');
    });
  }

  function bindForm() {
    const form = formEl();
    if (!form || form.getAttribute('data-bound') === 'true') {
      return;
    }
    form.setAttribute('data-bound', 'true');
    if (window.CountryAddress && typeof window.CountryAddress.bindForm === 'function') {
      window.CountryAddress.bindForm(form);
    }

    const addButton = document.getElementById('business-add-location');
    if (addButton) {
      addButton.addEventListener('click', function () {
        if (window.location.hash !== '#accommodation') {
          window.location.hash = 'accommodation';
        } else {
          showSection('accommodation');
        }
        const nameField = document.getElementById('companyName');
        if (nameField) {
          nameField.focus();
        }
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const auth = window.AuthClient;
      const user = auth && typeof auth.getUser === 'function' ? auth.getUser() : null;
      const submit = document.getElementById('property-submit');
      if (!auth || typeof auth.saveProperty !== 'function' || !user) {
        setStatus('Account tools failed to load. Please refresh the page.', 'error');
        return;
      }
      const payload = readPayload();
      const id = editingId();
      if (id) {
        payload.id = id;
      }
      try {
        validatePayload(user, payload);
      } catch (error) {
        setStatus(error.message, 'error');
        return;
      }
      if (submit) {
        submit.disabled = true;
      }
      setStatus('Saving location…', '');
      auth.saveProperty(payload).then(function () {
        resetForm();
        setStatus(id ? 'Location updated.' : 'Location saved.', 'success');
        return loadProperties();
      }).catch(function (error) {
        setStatus(error && error.message ? error.message : 'Unable to save the location.', 'error');
      }).then(function () {
        if (submit) {
          submit.disabled = false;
        }
      });
    });

    const cancel = document.getElementById('property-cancel');
    if (cancel) {
      cancel.addEventListener('click', function () {
        resetForm();
      });
    }
  }

  function fillProfile(user) {
    const firstName = String(user.name || '').trim().split(/\s+/)[0] || 'there';
    setText('[data-business-greeting]', 'Welcome, ' + firstName);
    setText('[data-business-company]', user.companyName || 'Your properties');
    setText('[data-business-name]', user.name || '');
    setText('[data-business-email]', user.email || '');
    setText('[data-business-created]', formatJoinedDate(user.createdAt));
    setText('[data-business-company-name]', user.companyName || '');
    setRow('businessType', businessTypeLabel(user.businessType));
    setRow('phone', user.phone);
    setRow('vatId', user.vatId);
    setRow('website', user.website);
    setRow('address', user.addressFormatted);
  }

  function render(user) {
    const root = rootEl();
    if (!root || !user || user.accountType !== 'business') {
      return;
    }
    bindNav();
    showSection(currentSection());
    fillProfile(user);
    bindForm();
    loadProperties();
  }

  window.BusinessPortal = {
    render: render
  };

  if (document.readyState !== 'loading') {
    const dashboard = rootEl();
    const user = window.AuthClient && typeof window.AuthClient.getUser === 'function'
      ? window.AuthClient.getUser()
      : null;
    if (dashboard && !dashboard.hidden && user && user.accountType === 'business') {
      render(user);
    }
  }
})();
