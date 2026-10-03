const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function matches(node, selector) {
  if (selector.indexOf('data-hotel-config') !== -1) {
    return node.tag === 'script' && node.attributes && Object.prototype.hasOwnProperty.call(node.attributes, 'data-hotel-config');
  }
  if (selector.startsWith('#')) {
    return node.id === selector.slice(1);
  }
  if (selector.startsWith('.')) {
    return String(node.className || '').split(/\s+/).includes(selector.slice(1));
  }
  const attr = /\[([^\]]+)="([^"]+)"\]/.exec(selector);
  if (attr) {
    const fromAttribute = node.attributes && node.attributes[attr[1]] === attr[2];
    const fromProperty = node[attr[1]] === attr[2];
    return Boolean(fromAttribute || fromProperty);
  }
  return false;
}

function createDocument(root) {
  const byId = {};
  function make(tag) {
    const node = {
      tag,
      id: '',
      className: '',
      textContent: '',
      value: '',
      style: {},
      dataset: {},
      children: [],
      parentElement: null,
      get parentNode() { return this.parentElement; },
      attributes: {},
      get nextSibling() {
        if (!this.parentElement) return null;
        const index = this.parentElement.children.indexOf(this);
        return this.parentElement.children[index + 1] || null;
      },
      appendChild(child) {
        if (child.parentElement) {
          child.parentElement.children = child.parentElement.children.filter((item) => item !== child);
        }
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      insertBefore(child, reference) {
        if (reference && reference.parentElement !== this) {
          throw new Error('insertBefore reference is not a child of this node');
        }
        if (child.parentElement) {
          child.parentElement.children = child.parentElement.children.filter((item) => item !== child);
        }
        child.parentElement = this;
        if (!reference) {
          this.children.push(child);
        } else {
          this.children.splice(this.children.indexOf(reference), 0, child);
        }
        return child;
      },
      insertAdjacentElement(position, child) {
        if (position === 'afterend' && this.parentElement) {
          this.parentElement.insertBefore(child, this.nextSibling);
        }
        return child;
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
        if (name === 'id') {
          this.id = String(value);
          byId[this.id] = this;
        }
        if (name === 'href') this.href = String(value);
      },
      getAttribute(name) {
        return this.attributes[name];
      },
      listeners: {},
      addEventListener(type, handler) {
        this.listeners[type] = this.listeners[type] || [];
        this.listeners[type].push(handler);
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
      querySelectorAll(selector) {
        const found = [];
        const walk = (current) => {
          current.children.forEach((child) => {
            if (matches(child, selector)) found.push(child);
            walk(child);
          });
        };
        walk(this);
        return found;
      },
      closest(selector) {
        let current = this;
        while (current) {
          if (matches(current, selector)) return current;
          current = current.parentElement;
        }
        return null;
      }
    };
    Object.defineProperty(node, 'innerHTML', {
      set(value) {
        if (value === '') node.children = [];
      },
      get() {
        return node.textContent;
      }
    });
    return node;
  }

  const detail = make('div');
  detail.className = 'hotel-detail';
  const price = make('div');
  price.className = 'price';
  price.dataset.rateValue = '0.11';
  price.dataset.rateCurrency = 'ETH';
  price.dataset.rateDecimals = '2';
  price.textContent = '0.11 ETH / night';
  const summary = make('div');
  summary.className = 'booking-summary';
  const button = make('a');
  button.className = 'confirm-button';
  button.textContent = 'Pay Now';
  const config = make('script');
  config.setAttribute('type', 'application/json');
  config.setAttribute('data-hotel-config', 'true');
  config.textContent = JSON.stringify({
    rooms: [{ id: 'nybyen', label: 'Nybyen Lodge Room', nightlyRate: 0.11, default: true }],
    addons: [{ id: 'spa', label: 'Lodge spa evening', price: 0.012, billing: 'per-night' }]
  });
  detail.appendChild(price);
  detail.appendChild(config);
  detail.appendChild(summary);
  detail.appendChild(button);
  root.appendChild(detail);

  return {
    readyState: 'complete',
    body: root,
    getElementById(id) { return byId[id] || null; },
    querySelector(selector) { return root.querySelector(selector); },
    querySelectorAll(selector) { return root.querySelectorAll(selector); },
    createElement: make,
    addEventListener() {}
  };
}

test('hotel page lists crypto and fiat in one pay-with menu', () => {
  const root = {
    children: [],
    appendChild(child) { this.children.push(child); child.parentElement = this; },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const found = [];
      const walk = (current) => {
        (current.children || []).forEach((child) => {
          if (matches(child, selector)) found.push(child);
          walk(child);
        });
      };
      walk(this);
      return found;
    }
  };
  const document = createDocument(root);
  const context = {
    window: {},
    document,
    console,
    location: { pathname: '/funken-lodge.html' },
    sessionStorage: { getItem() { return null; }, setItem() {} }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/payment-currencies.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/hotel-booking-summary.js'), 'utf8'), context);

  const detail = document.querySelector('.hotel-detail');
  const menu = detail.querySelector('#payment-currency');
  assert.ok(menu);
  assert.equal(detail.querySelector('#fiat-currency'), null);
  assert.equal(detail.querySelectorAll('.confirm-button').length, 1);
  assert.equal(detail.querySelector('.price-fiat'), null);
  assert.match(menu.querySelector('[value="ETH"]').textContent, /ETH/);
  assert.match(menu.querySelector('[value="EUR"]').textContent, /EUR/);
  assert.equal(detail.querySelector('.price').textContent, '0.11 ETH / night');
  assert.match(detail.querySelector('.confirm-button').textContent, /Pay with ETH/);
  assert.match(detail.querySelector('.room-option__rate').textContent, /ETH/);
  assert.match(detail.querySelector('.addon-option__rate').textContent, /ETH/);

  menu.value = 'EUR';
  const change = menu.listeners && menu.listeners.change && menu.listeners.change[0];
  assert.equal(typeof change, 'function');
  change();
  assert.match(detail.querySelector('.price').textContent, /289\.14 EUR/);
  assert.match(detail.querySelector('.confirm-button').textContent, /Pay with EUR/);
  assert.match(detail.querySelector('.room-option__rate').textContent, /EUR/);
  assert.match(detail.querySelector('.addon-option__rate').textContent, /EUR/);
  assert.equal(detail.querySelectorAll('.confirm-button').length, 1);
});
