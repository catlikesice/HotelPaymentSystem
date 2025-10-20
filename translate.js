#!/usr/bin/env node
/**
 * translate.js
 *
 * Scans HTML and JS files, translates user-facing strings from English to target languages,
 * and writes localized copies under dist/<lang>/...
 *
 * WARNING: This script performs textual replacement. Review outputs and test carefully.
 *
 * Configuration via environment variables:
 * - TRANSLATE_API_URL: translation endpoint (default: https://libretranslate.com/translate)
 * - TRANSLATE_API_KEY: optional API key for the translation service
 * - TARGET_LANGS: comma-separated list (default: "lv,ru")
 *
 * Usage:
 *   npm run translate
 *
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const axios = require('axios');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');

const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const PROJECT_ROOT = process.cwd();
const OUT_DIR = path.join(PROJECT_ROOT, 'dist');
const CACHE_FILE = path.join(PROJECT_ROOT, '.translation-cache.json');

// Config
const TRANSLATE_API_URL = process.env.TRANSLATE_API_URL || 'https://libretranslate.com/translate';
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY || '';
const TARGET_LANGS = (process.env.TARGET_LANGS || 'lv,ru').split(',').map(s => s.trim()).filter(Boolean);

// File globs (ignore node_modules and dist)
const FILE_GLOBS = [
  '**/*.html',
  '**/*.js'
];
const IGNORE = ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/.github/**'];

// Attributes in HTML to translate
const HTML_ATTRS_TO_TRANSLATE = new Set(['alt', 'title', 'placeholder', 'aria-label', 'value', 'label']);

// Utilities
async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function isWhitespaceOnly(str) {
  return /^\s*$/.test(str);
}

// Translation function with caching
async function makeTranslator() {
  const cache = await loadCache();

  async function translateText(text, target) {
    if (!text || isWhitespaceOnly(text)) return text;
    const key = `${target}::${text}`;
    if (cache[key]) return cache[key];

    // Prepare request for LibreTranslate-compatible API
    try {
      const payload = {
        q: text,
        source: 'en',
        target,
        format: 'text'
      };
      if (TRANSLATE_API_KEY) payload.api_key = TRANSLATE_API_KEY;

      const res = await axios.post(TRANSLATE_API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });

      // LibreTranslate returns { translatedText: "..." } typically
      let translated;
      if (res.data && typeof res.data === 'object') {
        translated = res.data.translatedText || res.data.result || res.data.translation || '';
      } else {
        translated = String(res.data);
      }

      // Fallback if API returns array or other structure
      if (!translated && typeof res.data === 'string') translated = res.data;

      // Trim to avoid restoring extraneous whitespace — keep original leading/trailing
      // preserve surrounding whitespace
      const leading = text.match(/^\s*/)[0] || '';
      const trailing = text.match(/\s*$/)[0] || '';
      translated = leading + translated + trailing;

      cache[key] = translated;
      await saveCache(cache);
      // be polite
      await new Promise(r => setTimeout(r, 100)); // tiny delay
      return translated;
    } catch (err) {
      console.error('Translation API error for text:', text.slice(0, 100), '->', err.message || err);
      throw err;
    }
  }

  return translateText;
}

// HTML translation
async function translateHtmlFile(filePath, translateText, targetLang, outBase) {
  const content = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(content, { decodeEntities: false });

  // Walk text nodes
  function translateNodes(elem) {
    elem.contents().each(function () {
      const node = this;
      if (node.type === 'text') {
        const raw = node.data;
        if (!isWhitespaceOnly(raw)) {
          // Skip if parent is script/style
          const parentName = node.parent && node.parent.tagName ? node.parent.tagName.toLowerCase() : '';
          if (parentName !== 'script' && parentName !== 'style') {
            // translate and replace
            translateText(raw, targetLang)
              .then(translated => {
                node.data = translated;
              })
              .catch(e => {
                // keep original on error
              });
          }
        }
      } else if (node.type === 'tag') {
        // translate attributes
        const attribs = node.attribs || {};
        for (const attrName of Object.keys(attribs)) {
          if (HTML_ATTRS_TO_TRANSLATE.has(attrName)) {
            const rawAttr = attribs[attrName];
            if (!isWhitespaceOnly(rawAttr)) {
              // capturing closure variables
              translateText(rawAttr, targetLang)
                .then(translated => {
                  $(node).attr(attrName, translated);
                })
                .catch(() => {});
            }
          }
        }
        // Recurse
        translateNodes($(node));
      }
    });
  }

  // Collect translation promises to await them (we will rebuild using the cache)
  const textNodes = [];
  const attrNodes = [];

  // Instead of relying on immediate replacements above, collect strings first to better batch/cache
  $('*').each((i, el) => {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'script' || tag === 'style') return;
    // text children
    $(el)
      .contents()
      .filter(function () {
        return this.type === 'text' && !isWhitespaceOnly(this.data);
      })
      .each(function () {
        textNodes.push({ node: this, text: this.data });
      });

    // attributes
    for (const attrName of Object.keys(el.attribs || {})) {
      if (HTML_ATTRS_TO_TRANSLATE.has(attrName)) {
        const val = el.attribs[attrName];
        if (!isWhitespaceOnly(val)) attrNodes.push({ el, attrName, text: val });
      }
    }
  });

  // Create unique list to translate
  const uniqueTexts = Array.from(new Set([...textNodes.map(t => t.text), ...attrNodes.map(a => a.text)]));

  // Translate each unique text in sequence to be polite to free endpoints
  for (const raw of uniqueTexts) {
    try {
      const translated = await translateText(raw, targetLang);
      // Apply to nodes and attributes
      textNodes.filter(t => t.text === raw).forEach(t => {
        t.node.data = translated;
      });
      attrNodes.filter(a => a.text === raw).forEach(a => {
        $(a.el).attr(a.attrName, translated);
      });
    } catch (e) {
      // on error skip
    }
  }

  // Output
  const outPath = path.join(outBase, path.relative(PROJECT_ROOT, filePath));
  await mkdirp(path.dirname(outPath));
  await fs.writeFile(outPath, $.html(), 'utf8');
  console.log(`[HTML] ${filePath} -> ${outPath}`);
}

// JS translation: replace simple string literals and template literals with no expressions
async function translateJsFile(filePath, translateText, targetLang, outBase) {
  const src = await fs.readFile(filePath, 'utf8');
  let ast;
  try {
    ast = babelParser.parse(src, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'typescript']
    });
  } catch (e) {
    console.error('Failed to parse JS (skipping):', filePath, e.message);
    // fallback: copy file as-is
    const outPath = path.join(outBase, path.relative(PROJECT_ROOT, filePath));
    await mkdirp(path.dirname(outPath));
    await fs.writeFile(outPath, src, 'utf8');
    return;
  }

  // Collect strings to translate
  const literalNodes = [];

  traverse(ast, {
    StringLiteral(pathNode) {
      // Heuristics: avoid import/require paths and object property keys
      const parent = pathNode.parent;
      // skip import declarations: import x from "module"
      if (parent && (parent.type === 'ImportDeclaration' || parent.type === 'ExportAllDeclaration' || parent.type === 'ExportNamedDeclaration')) return;
      // skip require("module")
      if (parent && parent.type === 'CallExpression' && parent.callee.name === 'require') return;
      // skip if key in object property like { "key": value } and it's not used as a value
      if (parent && parent.type === 'ObjectProperty' && parent.key === pathNode.node && !parent.computed && !parent.shorthand && parent.value !== pathNode.node) {
        // This is an object key — probably not user-facing; skip
        return;
      }
      // Probably safe to translate
      literalNodes.push({ node: pathNode.node, path: pathNode });
    },
    TemplateLiteral(pathNode) {
      // Only translate template literals without expressions: `Hello world`
      if (pathNode.node.expressions && pathNode.node.expressions.length === 0) {
        const raw = pathNode.node.quasis.map(q => q.value.cooked).join('');
        literalNodes.push({ node: pathNode.node, path: pathNode, isTemplate: true, raw });
      }
    }
  });

  // Unique texts
  const uniqueTexts = Array.from(new Set(literalNodes.map(n => n.isTemplate ? n.raw : n.node.value)));

  // Translate sequentially
  const translations = {};
  for (const text of uniqueTexts) {
    try {
      const translated = await translateText(text, targetLang);
      translations[text] = translated;
    } catch (e) {
      translations[text] = text; // fallback to original
    }
  }

  // Apply replacements
  literalNodes.forEach(item => {
    const original = item.isTemplate ? item.raw : item.node.value;
    const translated = translations[original] || original;
    if (item.isTemplate) {
      // Replace template literal with a string literal
      item.path.replaceWith(babelParser.parseExpression(JSON.stringify(translated)));
    } else {
      item.path.replaceWith(babelParser.parseExpression(JSON.stringify(translated)));
    }
  });

  const output = generate(ast, { compact: false }).code;
  const outPath = path.join(outBase, path.relative(PROJECT_ROOT, filePath));
  await mkdirp(path.dirname(outPath));
  await fs.writeFile(outPath, output, 'utf8');
  console.log(`[JS] ${filePath} -> ${outPath}`);
}

// Orchestrator
(async function main() {
  console.log('Starting translation run...');
  console.log(`API: ${TRANSLATE_API_URL} | Targets: ${TARGET_LANGS.join(',')}`);
  const translateText = await makeTranslator();

  // Find files
  const files = new Set();
  for (const pattern of FILE_GLOBS) {
    const matches = glob.sync(pattern, { cwd: PROJECT_ROOT, absolute: true, ignore: IGNORE });
    for (const m of matches) files.add(m);
  }
  const fileList = Array.from(files);
  if (fileList.length === 0) {
    console.log('No files found to translate (patterns: ', FILE_GLOBS, '). Exiting.');
    return;
  }
  console.log(`Found ${fileList.length} files.`);

  for (const lang of TARGET_LANGS) {
    const outBase = path.join(OUT_DIR, lang);
    // Ensure clean language directory
    await fs.remove(outBase);
    for (const filePath of fileList) {
      const ext = path.extname(filePath).toLowerCase();
      try {
        if (ext === '.html') {
          await translateHtmlFile(filePath, translateText, lang, outBase);
        } else if (ext === '.js') {
          await translateJsFile(filePath, translateText, lang, outBase);
        } else {
          // copy as-is
          const outPath = path.join(outBase, path.relative(PROJECT_ROOT, filePath));
          await mkdirp(path.dirname(outPath));
          await fs.copyFile(filePath, outPath);
        }
      } catch (e) {
        console.error('Error processing', filePath, e);
      }
    }
  }

  console.log('Translation run complete. Check the dist/ directory.');
})();
