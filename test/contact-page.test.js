const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const http = require('http');

const root = path.join(__dirname, '..');
const ContactForm = require('../assets/contact-form');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-contact-'));
process.env.CONTACT_DATA_DIR = dataDir;
process.env.CONTACT_RATE_LIMIT_DISABLED = '1';

const contactRouter = require('../routes/contact');

let server;
let base;

before(() => new Promise((resolve, reject) => {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', contactRouter);
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', () => {
    base = 'http://127.0.0.1:' + server.address().port;
    resolve();
  });
  server.on('error', reject);
}));

after(() => new Promise((resolve, reject) => {
  server.close((error) => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
}));

function formSlice(html) {
  const start = html.indexOf('<form id="contact-form"');
  const end = html.indexOf('</form>');
  assert.ok(start !== -1 && end > start, 'contact page should include the question form');
  return html.slice(start, end);
}

test('contact page lets a booker classify a question and send it', () => {
  const html = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  const form = formSlice(html);
  const selectAt = form.indexOf('id="question-category"');
  const sendAt = form.indexOf('id="contact-send"');

  assert.ok(selectAt !== -1, 'classification dropdown should be in the form');
  assert.ok(sendAt > selectAt, 'Send should be the last action, after the classification dropdown');
  assert.match(form, /<select[^>]*name="category"/);
  assert.match(form, /<option value="booking"/);
  assert.match(form, /<option value="change-cancel"/);
  assert.match(form, /<option value="payment"/);
  assert.match(form, /<option value="property"/);
  assert.match(form, /<option value="account"/);
  assert.match(form, /<option value="other"/);
  assert.match(form, />Send</);
  assert.match(html, /nav-box-right" href="contact\.html"/);
  assert.match(html, /aria-current="page"/);
  assert.equal(form.includes('type="reset"'), false);
});

test('primary navigation Contact links open the contact page', () => {
  const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
  pages.forEach((fileName) => {
    const html = fs.readFileSync(path.join(root, fileName), 'utf8');
    if (!html.includes('nav-box-right')) return;
    assert.match(html, /class="nav-box nav-box-right"[^>]*href="contact\.html"/, `${fileName} Contact item should open contact.html`);
    assert.equal(html.includes('href="#contact"'), false, `${fileName} should not keep a bare #contact nav target`);
    assert.equal(html.includes('href="index.html#contact"'), false, `${fileName} should not send Contact back to the homepage`);
  });
});

test('classification is required before a question can be stored', () => {
  const missing = ContactForm.validate({
    name: 'Ada Guest',
    email: 'ada@example.com',
    category: '',
    message: 'Can I change the dates of my stay?'
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.code, 'category');

  const accepted = ContactForm.validate({
    name: 'Ada Guest',
    email: 'Ada@Example.com',
    category: 'change-cancel',
    message: 'Can I move my stay from Friday to Sunday?',
    bookingReference: 'BH-10482'
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.value.email, 'ada@example.com');
  assert.equal(accepted.value.category, 'change-cancel');
});

test('POST /api/contact stores a classified question and rejects an empty category', async () => {
  const rejected = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Guest',
      email: 'ada@example.com',
      category: 'not-a-category',
      message: 'This category should not be accepted.'
    })
  });
  const rejectedBody = await rejected.json();
  assert.equal(rejected.status, 400);
  assert.equal(rejectedBody.code, 'category');

  const created = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ada Guest',
      email: 'ada@example.com',
      category: 'payment',
      message: 'The crypto payment page did not show a confirmation.',
      bookingReference: 'BH-88'
    })
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.ok, true);
  assert.ok(createdBody.id);

  const stored = JSON.parse(fs.readFileSync(path.join(dataDir, 'contact-messages.json'), 'utf8'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].category, 'payment');
  assert.equal(stored[0].email, 'ada@example.com');
  assert.equal(stored[0].id, createdBody.id);
});
