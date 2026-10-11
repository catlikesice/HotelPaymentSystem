const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'culture-blog.html'), 'utf8');

const parents = [
  'Places',
  'Stay Picks',
  'Journey Currents',
  'Bulletin',
  'Getting Ready',
  'Token Payments'
];

const children = [
  'Nordic Cities',
  'Baltic Coast',
  'Highland Routes',
  'Island Hops',
  'Choosing a Room',
  'Offbeat Lodgings',
  'Traveling with Children',
  'High-End Hideaways',
  'Greener Getaways',
  'Travel and Technology',
  'Trend Digests',
  'Trips that Work',
  'Next Wave Travel',
  'Your Kind of Trip',
  'From the Desk',
  'Hospitality Wire',
  'Northern Notes',
  'Air Ticket Know-How',
  'Itinerary Kits',
  'Wallet-Wise Trips',
  'Field Shortcuts',
  'First Journey',
  'On-the-Ground Advice',
  'Checkout with Crypto',
  'Wallets for Travelers',
  'Coins We Accept'
];

const travalaLabels = [
  'destinations',
  'accommodation guides',
  'hotel guides',
  'unique stays',
  'family-friendly hotels',
  'family friendly hotels',
  'luxury hotels',
  'travel trends',
  'sustainable travel',
  'ai in travel',
  'travel trends reports',
  'work & travel',
  'work and travel',
  'future of travel',
  'travel style',
  'news',
  'travel planning',
  'flight booking tips',
  'trip planning tools',
  'budget travel tips',
  'travel hacks',
  'travel for beginners',
  'travel tips',
  'crypto'
];

function topicNav(source) {
  const start = source.indexOf('<nav class="blog-topics"');
  const end = source.indexOf('</nav>', start);
  assert.ok(start !== -1 && end > start, 'blog topic nav should be present');
  return source.slice(start, end);
}

test('blog topic bar uses original headings in the same groups', () => {
  const nav = topicNav(html);
  parents.forEach((label) => {
    assert.match(nav, new RegExp('>' + label + '<'), `missing parent heading ${label}`);
  });
  children.forEach((label) => {
    assert.match(nav, new RegExp('>' + label + '<'), `missing child heading ${label}`);
  });

  const labels = Array.from(nav.matchAll(/>([^<]+)</g), (match) => match[1].trim().toLowerCase())
    .filter(Boolean);
  travalaLabels.forEach((label) => {
    assert.equal(labels.includes(label), false, `topic bar should not copy “${label}”`);
  });
});

test('blog topics filter stories and keep every language label', () => {
  assert.match(html, /data-topics="places baltic-coast"/);
  assert.match(html, /data-topics="stay-picks offbeat-lodgings"/);
  assert.match(html, /data-topics="journey-currents greener-getaways"/);
  assert.match(html, /data-topics="bulletin hospitality-wire"/);
  assert.match(html, /data-topics="getting-ready first-journey"/);
  assert.match(html, /data-topics="token-payments checkout-with-crypto"/);
  assert.match(html, /function applyBlogFilter/);
  assert.match(html, /id="blog-filter-clear"/);
  assert.match(html, /id="blog-empty"/);

  assert.match(html, /topic-places": "Места"/);
  assert.match(html, /topic-stay-picks": "Boendeval"/);
  assert.match(html, /topic-token-payments": "Token-Zahlungen"/);
  assert.match(html, /topic-bulletin": "Сводка"/);
  assert.match(html, /topic-getting-ready": "Inför resan"/);
});
