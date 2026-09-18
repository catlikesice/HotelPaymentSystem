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

test('shared stylesheet contains overflow containment for cards, images, and URLs', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /width:\s*min\(100%,\s*300px\)/);
  assert.match(css, /minmax\(min\(100%,\s*16rem\)/);
});
