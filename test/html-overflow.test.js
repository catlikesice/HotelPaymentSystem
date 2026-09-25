const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skipDirs = new Set(['node_modules', '.git']);

function listHtmlPages() {
  const pages = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name) || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name.endsWith('.html')) {
        pages.push(full);
      }
    }
  }
  walk(root);
  return pages.sort();
}

test('site HTML documents declare a mobile viewport', () => {
  const fragments = new Set(['widget-modal.html', 'customer client.html']);
  listHtmlPages().forEach((filePath) => {
    const name = path.basename(filePath);
    if (fragments.has(name)) return;
    const html = fs.readFileSync(filePath, 'utf8');
    if (!/<html[\s>]/i.test(html) || !/<head[\s>]/i.test(html)) return;
    assert.match(
      html,
      /<meta\s+name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i,
      `${path.relative(root, filePath)} should include a device-width viewport`
    );
  });
});

test('culture blog copy stays inside the centered column', () => {
  const html = fs.readFileSync(path.join(root, 'culture-blog.html'), 'utf8');
  const mainStart = html.indexOf('<main class="content culture-blog"');
  const mainEnd = html.indexOf('</main>');
  assert.ok(mainStart !== -1 && mainEnd > mainStart, 'blog page should wrap copy in the centered main column');
  const main = html.slice(mainStart, mainEnd);
  assert.match(main, /class="blog-intro"/);
  assert.match(main, /class="blog-posts"/);
  assert.match(main, /class="blog-post"/);
  assert.match(main, /id="contact" class="blog-contact"/);
  assert.equal(main.includes('<footer'), false, 'footer stays outside the article column');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.culture-blog\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.culture-blog \.blog-post\s*\{[^}]*text-align:\s*center/s);
  assert.match(css, /\.culture-blog \.blog-posts\s*\{[^}]*max-width:\s*min\(860px,\s*100%\)/s);
});

test('short pages pin the footer to the bottom of the viewport', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /body:not\(\.portal-open\)\s*\{[^}]*display:\s*flex/s);
  assert.match(css, /body:not\(\.portal-open\)\s*\{[^}]*min-height:\s*100dvh/s);
  assert.match(
    css,
    /body:not\(\.portal-open\)\s*>\s*:not\(footer\):has\(\+ footer\)\s*\{[^}]*flex:\s*1 0 auto/s
  );
  const register = fs.readFileSync(path.join(root, 'register.html'), 'utf8');
  assert.match(register, /<footer>/);
  assert.equal(register.includes('class="portal-open"'), false);
});

test('shared stylesheet contains overflow containment for cards, images, and URLs', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /width:\s*min\(100%,\s*300px\)/);
  assert.match(css, /minmax\(min\(100%,\s*16rem\)/);
});
