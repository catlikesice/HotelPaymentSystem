const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/price-range-sidebar.js'), 'utf8');

function loadSidebar() {
  const sandbox = {
    console,
    Intl,
    document: {
      readyState: 'loading',
      addEventListener() {},
      getElementById() {
        return null;
      },
      documentElement: { lang: 'en' },
      querySelectorAll() {
        return [];
      },
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.PriceRangeSidebar;
}

function card(amounts, text) {
  return {
    querySelector(selector) {
      if (selector !== '.price') return null;
      return {
        dataset: amounts,
        textContent: text || '',
      };
    },
  };
}

test('orders stays from much to little, or from little to much', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.08', btc: '0.0013', usdt: '228' }, '0.08 ETH / night'),
    card({ eth: '0.09', btc: '0.0015', usdt: '256' }, '0.09 ETH / night'),
    card({ eth: '0.07', btc: '0.0012', usdt: '200' }, '0.07 ETH / night'),
  ];

  function amounts(direction) {
    return Array.prototype.map
      .call(api.orderStayCards(stays, direction, 'ETH'), (stay) => stay.querySelector('.price').dataset.eth)
      .join(',');
  }

  assert.equal(amounts('much'), '0.09,0.08,0.07');
  assert.equal(amounts('little'), '0.07,0.08,0.09');
  assert.equal(amounts(null), '0.08,0.09,0.07');
});

test('keeps the original order when nightly rates match', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.07' }, '0.07 ETH / night'),
    card({ eth: '0.09' }, '0.09 ETH / night'),
    card({ eth: '0.07' }, '0.07 ETH / night'),
  ];

  const much = api.orderStayCards(stays, 'much', 'ETH');
  assert.equal(much[0], stays[1]);
  assert.equal(much[1], stays[0]);
  assert.equal(much[2], stays[2]);
});

test('uses the selected currency, then the price shown on the card', () => {
  const api = loadSidebar();
  const stays = [
    card({ eth: '0.02', btc: '0.003' }, '9.50 SOL total for 2 nights (4.75 SOL/night)'),
    card({ eth: '0.08', btc: '0.001' }, '1.20 SOL / night'),
  ];

  function labels(direction, currency, read) {
    return Array.prototype.map
      .call(api.orderStayCards(stays, direction, currency), read)
      .join('|');
  }

  assert.equal(
    labels('much', 'BTC', (stay) => stay.querySelector('.price').dataset.btc),
    '0.003|0.001'
  );
  assert.equal(
    labels('little', 'SOL', (stay) => stay.querySelector('.price').textContent),
    '1.20 SOL / night|9.50 SOL total for 2 nights (4.75 SOL/night)'
  );
});

test('puts stays without a price after priced stays', () => {
  const api = loadSidebar();
  const priced = card({ eth: '0.04' }, '0.04 ETH / night');
  const unpriced = card({}, 'Ask the hotel');
  const much = api.orderStayCards([unpriced, priced], 'much', 'ETH');
  assert.equal(much[0], priced);
  assert.equal(much[1], unpriced);
});

test('city listings expose much and little without treating them as budget tiers', () => {
  assert.match(source, /data-price-order/);
  assert.match(source, /dataset\.order = key/);
  assert.match(source, /querySelectorAll\('\.price-range-option\[data-filter\]'\)/);
  assert.match(source, /orderOptions:\s*\{\s*much: "Much",\s*little: "Little",/s);
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.price-range-options--order\s*\{[^}]*flex-direction:\s*row/s);
});
