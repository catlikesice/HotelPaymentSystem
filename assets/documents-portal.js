(function () {
  function visibleRoots() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-document-root]')).filter(function (root) {
      const dashboard = root.closest('.portal');
      return dashboard && !dashboard.hidden;
    });
  }

  function setStatus(root, message, kind) {
    const status = root.querySelector('[data-document-status]');
    if (!status) {
      return;
    }
    status.textContent = message || '';
    status.className = 'auth-status' + (kind ? ' auth-status--' + kind : '');
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

  function kindLabel(value) {
    if (window.DocumentRecords && typeof window.DocumentRecords.kindLabel === 'function') {
      return window.DocumentRecords.kindLabel(value);
    }
    return value || '';
  }

  function formatWhen(iso) {
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function documentCard(record, deleted) {
    const card = createEl('article', 'portal-document');
    card.appendChild(createEl('p', 'portal-kicker', kindLabel(record.kind)));
    card.appendChild(createEl('h3', 'portal-booking__title', record.title));
    const meta = [];
    if (record.reference) {
      meta.push(record.reference);
    }
    const when = formatWhen(deleted ? record.deletedAt : record.createdAt);
    if (when) {
      meta.push(deleted ? 'Removed ' + when : 'Saved ' + when);
    }
    if (meta.length) {
      card.appendChild(createEl('p', 'portal-booking__meta', meta.join(' · ')));
    }
    if (record.note) {
      card.appendChild(createEl('p', 'portal-booking__detail', record.note));
    }
    const actions = createEl('div', 'portal-property__actions');
    const button = createEl('button', 'btn btn--secondary', deleted ? 'Bring back' : 'Remove');
    button.type = 'button';
    button.setAttribute(deleted ? 'data-document-restore' : 'data-document-remove', record.id);
    actions.appendChild(button);
    card.appendChild(actions);
    return card;
  }

  function renderList(mount, documents, emptyText, deleted) {
    if (!mount) {
      return;
    }
    clearNode(mount);
    if (!documents.length) {
      const empty = createEl('div', 'portal-empty');
      empty.appendChild(createEl('p', '', emptyText));
      mount.appendChild(empty);
      return;
    }
    documents.forEach(function (record) {
      mount.appendChild(documentCard(record, deleted));
    });
  }

  function load(root) {
    const auth = window.AuthClient;
    const activeMount = root.querySelector('[data-document-list]');
    const deletedMount = root.querySelector('[data-document-deleted]');
    if (!auth || typeof auth.listDocuments !== 'function') {
      renderList(activeMount, [], 'Account tools failed to load. Please refresh the page.', false);
      renderList(deletedMount, [], 'Removed documents will appear here.', true);
      return Promise.resolve();
    }
    return Promise.all([
      auth.listDocuments(),
      auth.listDocuments({ deleted: true })
    ]).then(function (results) {
      const active = results[0] && Array.isArray(results[0].documents) ? results[0].documents : [];
      const removed = results[1] && Array.isArray(results[1].documents) ? results[1].documents : [];
      renderList(activeMount, active, 'No documents saved yet.', false);
      renderList(deletedMount, removed, 'Nothing removed. Documents you delete stay here until you bring them back.', true);
    }).catch(function (error) {
      renderList(activeMount, [], 'Unable to load documents.', false);
      renderList(deletedMount, [], '', true);
      setStatus(root, error && error.message ? error.message : 'Unable to load documents.', 'error');
    });
  }

  function readPayload(form) {
    return {
      title: form.title ? form.title.value : '',
      kind: form.kind ? form.kind.value : 'other',
      reference: form.reference ? form.reference.value : '',
      note: form.note ? form.note.value : ''
    };
  }

  function resetForm(form) {
    if (!form) {
      return;
    }
    form.reset();
    if (form.kind) {
      form.kind.value = 'other';
    }
  }

  function bind(root) {
    if (root.getAttribute('data-bound') === 'true') {
      return;
    }
    root.setAttribute('data-bound', 'true');

    const form = root.querySelector('[data-document-form]');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const auth = window.AuthClient;
        const submit = form.querySelector('button[type="submit"]');
        if (!auth || typeof auth.createDocument !== 'function') {
          setStatus(root, 'Account tools failed to load. Please refresh the page.', 'error');
          return;
        }
        const payload = readPayload(form);
        const user = typeof auth.getUser === 'function' ? auth.getUser() : null;
        if (window.DocumentRecords && user && user.id) {
          try {
            window.DocumentRecords.createRecord(user.id, payload);
          } catch (error) {
            setStatus(root, error.message, 'error');
            return;
          }
        }
        if (submit) {
          submit.disabled = true;
        }
        setStatus(root, 'Saving document…', '');
        auth.createDocument(payload).then(function () {
          resetForm(form);
          setStatus(root, 'Document saved.', 'success');
          return load(root);
        }).catch(function (error) {
          setStatus(root, error && error.message ? error.message : 'Unable to save the document.', 'error');
        }).then(function () {
          if (submit) {
            submit.disabled = false;
          }
        });
      });
    }

    root.addEventListener('click', function (event) {
      const remove = event.target.closest('[data-document-remove]');
      const restore = event.target.closest('[data-document-restore]');
      const auth = window.AuthClient;
      if (remove) {
        const title = remove.closest('.portal-document');
        const name = title ? title.querySelector('.portal-booking__title') : null;
        const label = name && name.textContent ? name.textContent : 'this document';
        if (!window.confirm('Remove ' + label + ' from your account? You can bring it back later.')) {
          return;
        }
        if (!auth || typeof auth.deleteDocument !== 'function') {
          return;
        }
        auth.deleteDocument(remove.getAttribute('data-document-remove')).then(function () {
          setStatus(root, 'Document removed. You can bring it back from Removed.', 'success');
          return load(root);
        }).catch(function (error) {
          setStatus(root, error && error.message ? error.message : 'Unable to remove that document.', 'error');
        });
        return;
      }
      if (!restore || !auth || typeof auth.restoreDocument !== 'function') {
        return;
      }
      auth.restoreDocument(restore.getAttribute('data-document-restore')).then(function () {
        setStatus(root, 'Document restored.', 'success');
        return load(root);
      }).catch(function (error) {
        setStatus(root, error && error.message ? error.message : 'Unable to bring that document back.', 'error');
      });
    });
  }

  function refresh() {
    visibleRoots().forEach(function (root) {
      bind(root);
      load(root);
    });
  }

  window.DocumentsPortal = {
    refresh: refresh
  };
})();
