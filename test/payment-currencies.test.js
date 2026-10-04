const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const PaymentCurrencies = require('../assets/payment-currencies');

test('fiat currencies convert from the USDT peg without changing crypto rates', () => {
  assert.equal(PaymentCurrencies.isFiat('EUR'), true);
  assert.equal(PaymentCurrencies.isFiat('ETH'), false);
  assert.equal(PaymentCurrencies.paymentMethodFor('GBP'), 'fiat');
  assert.equal(PaymentCurrencies.paymentMethodFor('BTC'), 'crypto');

  assert.equal(PaymentCurrencies.rates.ETH, 0.00035);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'USDT').value, 200);
  assert.equal(PaymentCurrencies.convert(200, 'USDT', 'EUR').value, 184);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'EUR').value, 184);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'USD').value, 200);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'GBP').value, 152);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'ISK').value, 27400);
  assert.equal(PaymentCurrencies.convert(0.07, 'ETH', 'ISK').decimals, 0);
  assert.equal(PaymentCurrencies.convert(184, 'EUR', 'ETH').currency, 'ETH');
});

function loadStayPricing() {
  const prices = [
    {
      dataset: { eth: '0.07', btc: '0.0012', usdt: '200' },
      textContent: '0.07 ETH / night',
      className: 'price',
      nextElementSibling: null,
      insertAdjacentElement(position, el) {
        if (position === 'afterend') {
          this.nextElementSibling = el;
        }
      }
    }
  ];
  const options = [
    { value: 'ETH', textContent: 'ETH (Ethereum)' },
    { value: 'BTC', textContent: 'BTC (Bitcoin)' },
    { value: 'USDT', textContent: 'USDT (Tether)' }
  ];
  const select = {
    value: 'ETH',
    dataset: {},
    children: options.slice(),
    querySelector(selector) {
      const match = /option\[value="([A-Z]+)"\]/.exec(selector);
      if (!match) return null;
      return options.find((option) => option.value === match[1]) || null;
    },
    appendChild(child) {
      this.children.push(child);
      (child.children || []).forEach((option) => options.push(option));
    },
    addEventListener() {}
  };
  const summary = {
    children: [],
    appendChild(child) { this.children.push(child); },
    querySelector() { return null; }
  };
  const byId = { currency: select };
  function createdElement(tag) {
    const el = {
      tag,
      label: '',
      value: '',
      textContent: '',
      className: '',
      style: {},
      children: [],
      setAttribute(name, value) {
        if (name === 'data-stay-duration') this.stay = value;
        if (name === 'aria-label') this.ariaLabel = value;
      },
      appendChild(child) {
        this.children.push(child);
      },
      addEventListener() {},
      querySelector(selector) {
        const match = /option\[value="([A-Z]+)"\]/.exec(selector || '');
        if (!match) return null;
        const stack = (this.children || []).slice();
        while (stack.length) {
          const node = stack.shift();
          if (node.value === match[1]) return node;
          if (node.children) stack.push.apply(stack, node.children);
        }
        return null;
      }
    };
    let currentId = '';
    Object.defineProperty(el, 'id', {
      configurable: true,
      get() { return currentId; },
      set(value) {
        currentId = value;
        byId[value] = el;
      }
    });
    return el;
  }
  const document = {
    readyState: 'complete',
    getElementById(id) {
      return byId[id] || null;
    },
    querySelector(selector) {
      return selector === '.currency-selector' ? summary : null;
    },
    querySelectorAll(selector) {
      return selector === '.price' ? prices : [];
    },
    createElement: createdElement,
    addEventListener() {}
  };
  const context = {
    window: {},
    document,
    console,
    sessionStorage: {
      getItem() { return null; },
      setItem() {}
    }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/payment-currencies.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/stay-pricing.js'), 'utf8'), context);
  return { context, select, options, prices };
}

test('city booking currency list prices a stay in crypto or fiat', () => {
  const { context, select, options, prices } = loadStayPricing();
  assert.equal(context.document.getElementById('fiat-currency'), null);
  assert.ok(options.some((option) => option.value === 'ETH'));
  assert.ok(options.some((option) => option.value === 'EUR'));
  assert.ok(options.some((option) => option.value === 'SEK'));

  select.value = 'EUR';
  context.window.updatePrices();
  assert.equal(prices[0].textContent, '184.00 EUR / night');
  assert.equal(prices[0].nextElementSibling, null);

  select.value = 'ETH';
  context.window.updatePrices();
  assert.equal(prices[0].textContent, '0.07 ETH / night');
});

test('hotel and checkout pages load shared fiat payment currencies', () => {
  const funken = fs.readFileSync(path.join(root, 'funken-lodge.html'), 'utf8');
  const scandic = fs.readFileSync(path.join(root, 'scandic-copenhagen.html'), 'utf8');
  const copenhagen = fs.readFileSync(path.join(root, 'copenhagen.html'), 'utf8');
  const checkout = fs.readFileSync(path.join(root, 'checkout.html'), 'utf8');

  assert.match(funken, /assets\/payment-currencies\.js"><\/script>\s*<script src="assets\/hotel-booking-summary\.js"/);
  assert.match(scandic, /assets\/payment-currencies\.js/);
  assert.match(copenhagen, /assets\/payment-currencies\.js"><\/script>\s*<script src="assets\/stay-pricing\.js"/);
  assert.match(checkout, /data-checkout-method/);
  assert.match(checkout, /assets\/payment-currencies\.js/);
  const summary = fs.readFileSync(path.join(root, 'assets/hotel-booking-summary.js'), 'utf8');
  assert.match(summary, /optionGroup\('Cryptocurrency'/);
  assert.match(summary, /optionGroup\('Fiat'/);
  assert.doesNotMatch(summary, /fiat-currency/);
  assert.match(fs.readFileSync(path.join(root, 'assets/checkout.js'), 'utf8'), /Confirm fiat payment/);
});
