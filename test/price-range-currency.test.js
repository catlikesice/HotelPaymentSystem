const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function createDocument(initialCurrency) {
  const listeners = {};

  function Element(tag) {
    this.tag = tag;
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.value = '';
    const rawDataset = {};
    const self = this;
    this.dataset = new Proxy(rawDataset, {
      get(target, prop) {
        return target[prop];
      },
      set(target, prop, value) {
        target[prop] = value == null ? '' : String(value);
        const attr = 'data-' + String(prop).replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
        self.attributes[attr] = target[prop];
        return true;
      }
    });
    this.classList = {
      remove() {},
      toggle(name, on) {
        const classes = new Set(self.className.split(/\s+/).filter(Boolean));
        if (on) classes.add(name);
        else classes.delete(name);
        self.className = Array.from(classes).join(' ');
      }
    };
  }

  Element.prototype.setAttribute = function (name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = String(value);
    }
  };
  Element.prototype.getAttribute = function (name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  };
  Element.prototype.removeAttribute = function (name) {
    delete this.attributes[name];
  };
  Element.prototype.addEventListener = function () {};
  Element.prototype.appendChild = function (child) {
    if (child.parentNode) {
      const index = child.parentNode.children.indexOf(child);
      if (index >= 0) child.parentNode.children.splice(index, 1);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  };
  Element.prototype.insertBefore = function (child, ref) {
    if (child.parentNode) {
      const index = child.parentNode.children.indexOf(child);
      if (index >= 0) child.parentNode.children.splice(index, 1);
    }
    child.parentNode = this;
    const at = ref ? this.children.indexOf(ref) : -1;
    if (at < 0) this.children.push(child);
    else this.children.splice(at, 0, child);
    return child;
  };
  Object.defineProperty(Element.prototype, 'firstChild', {
    get() {
      return this.children[0] || null;
    }
  });

  function classesOf(node) {
    return String(node.className || '').split(/\s+/).filter(Boolean);
  }

  function matchesSimple(node, selector) {
    const parts = selector.match(/[a-zA-Z][\w-]*|\.[_a-zA-Z][\w-]*|\[[^\]]+\]/g);
    if (!parts) return false;
    return parts.every((part) => {
      if (part.charAt(0) === '.') return classesOf(node).includes(part.slice(1));
      if (part.charAt(0) === '[') {
        const body = part.slice(1, -1);
        const eq = body.indexOf('=');
        if (eq === -1) return Object.prototype.hasOwnProperty.call(node.attributes, body);
        let expected = body.slice(eq + 1);
        if (expected.charAt(0) === '"' && expected.charAt(expected.length - 1) === '"') {
          expected = expected.slice(1, -1);
        }
        return node.attributes[body.slice(0, eq)] === expected;
      }
      return node.tag === part;
    });
  }

  function matches(node, selector) {
    const chain = selector.trim().split(/\s+/);
    let current = node;
    for (let i = chain.length - 1; i >= 0; i -= 1) {
      if (i === chain.length - 1) {
        if (!matchesSimple(current, chain[i])) return false;
      } else {
        let ancestor = current.parentNode;
        let found = false;
        while (ancestor) {
          if (matchesSimple(ancestor, chain[i])) {
            current = ancestor;
            found = true;
            break;
          }
          ancestor = ancestor.parentNode;
        }
        if (!found) return false;
      }
    }
    return true;
  }

  function walk(node, visit) {
    (node.children || []).forEach((child) => {
      visit(child);
      walk(child, visit);
    });
  }

  Element.prototype.querySelector = function (selector) {
    let found = null;
    walk(this, (node) => {
      if (!found && matches(node, selector)) found = node;
    });
    return found;
  };
  Element.prototype.querySelectorAll = function (selector) {
    const found = [];
    walk(this, (node) => {
      if (matches(node, selector)) found.push(node);
    });
    return found;
  };

  function hotelCard(amounts) {
    const card = new Element('div');
    card.className = 'hotel-card';
    const price = new Element('div');
    price.className = 'price';
    price.dataset.eth = amounts.eth;
    price.dataset.btc = amounts.btc;
    price.dataset.usdt = amounts.usdt;
    price.textContent = amounts.eth + ' ETH / night';
    card.appendChild(price);
    return card;
  }

  const body = new Element('body');
  const currency = new Element('select');
  currency.id = 'currency';
  currency.value = initialCurrency;

  const container = new Element('div');
  container.className = 'booking-container';
  const list = new Element('div');
  list.className = 'hotel-list';
  [
    { eth: '0.025', btc: '0.0004', usdt: '71' },
    { eth: '0.03', btc: '0.0005', usdt: '86' },
    { eth: '0.04', btc: '0.0007', usdt: '114' }
  ].forEach((amounts) => list.appendChild(hotelCard(amounts)));
  container.appendChild(list);
  body.appendChild(container);
  body.appendChild(currency);

  const document = {
    readyState: 'complete',
    documentElement: { lang: 'en' },
    createElement(tag) {
      return new Element(tag);
    },
    getElementById(id) {
      if (id === 'currency') return currency;
      let found = null;
      walk(body, (node) => {
        if (!found && node.id === id) found = node;
      });
      return found;
    },
    querySelector(selector) {
      return body.querySelector(selector);
    },
    querySelectorAll(selector) {
      return body.querySelectorAll(selector);
    },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    }
  };

  return { document, currency, listeners, body };
}

function hintText(body, key) {
  const hint = body.querySelector('[data-range-hint="' + key + '"]');
  assert.ok(hint, 'missing hint for ' + key);
  return hint.textContent;
}

function loadSidebar(initialCurrency) {
  const { document, currency, listeners, body } = createDocument(initialCurrency);
  let priceUpdates = 0;
  const context = {
    console,
    Intl,
    document,
    sessionStorage: {
      getItem() { return null; },
      setItem() {}
    },
    updatePrices() {
      priceUpdates += 1;
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/payment-currencies.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8'), context);
  return { context, currency, listeners, body, priceUpdates: () => priceUpdates };
}

test('left sidebar ranges use the currency the customer already chose', () => {
  const { body } = loadSidebar('EUR');
  const cheap = hintText(body, 'cheap');
  const mid = hintText(body, 'midrange');
  const luxury = hintText(body, 'luxury');

  assert.equal(cheap, 'Up to 78.51 EUR');
  assert.equal(mid, '78.51 - 91.69 EUR');
  assert.equal(luxury, 'Above 91.69 EUR');
  assert.equal(cheap.includes('ETH') || cheap.includes('USDT'), false);
});

test('changing the currency updates the left sidebar to that currency', () => {
  const { body, currency, listeners, context, priceUpdates } = loadSidebar('ETH');

  assert.equal(hintText(body, 'cheap'), 'Up to 0.03 ETH');
  assert.equal(hintText(body, 'midrange'), '0.03 - 0.035 ETH');
  assert.equal(hintText(body, 'luxury'), 'Above 0.035 ETH');
  assert.equal(hintText(body, 'cheap').includes('USDT'), false);

  currency.value = 'BTC';
  listeners.change.forEach((fn) => fn({ target: currency }));
  assert.equal(hintText(body, 'cheap'), 'Up to 0.0005 BTC');
  assert.equal(hintText(body, 'luxury'), 'Above 0.0006 BTC');
  assert.equal(hintText(body, 'cheap').includes('ETH'), false);

  currency.value = 'SEK';
  context.updatePrices();
  assert.equal(priceUpdates(), 1);
  assert.equal(hintText(body, 'cheap'), 'Up to 896.00 SEK');
  assert.equal(hintText(body, 'midrange'), '896.00 - 1046.50 SEK');
  assert.equal(hintText(body, 'luxury'), 'Above 1046.50 SEK');
});
