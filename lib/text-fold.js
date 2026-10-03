'use strict';

// Folding rules shared by the browser fallback and docs/sql/hotel-search.sql.
// SQLite has no unaccent and lower() is ASCII-only, so the SQL file applies
// fold_map with replace() instead of folding in application code first.

function normalizeResults(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/['’ʼ]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeHero(text) {
  return normalizeResults(text).replace(/\s+/g, ' ').trim();
}

function joinedSearchText(item) {
  return [
    item.name,
    item.city,
    item.country,
    item.description,
    item.price,
    item.type
  ].join(' ');
}

function searchText(item) {
  return normalizeResults(joinedSearchText(item));
}

function tokensFor(query) {
  const normalized = normalizeResults(String(query || '').trim())
    .replace(/[—–]/g, ' ');
  if (!normalized.trim()) {
    return [];
  }
  return normalized.split(/\s+/).filter(Boolean);
}

function foldMapEntries() {
  const entries = [];
  for (let codePoint = 1; codePoint <= 0x024F; codePoint += 1) {
    const character = String.fromCodePoint(codePoint);
    const folded = normalizeResults(character);
    if (folded !== character) {
      entries.push([character, folded]);
    }
  }
  // Apostrophes and primes sit outside the Latin blocks above.
  for (let codePoint = 0x2018; codePoint <= 0x2032; codePoint += 1) {
    const character = String.fromCodePoint(codePoint);
    const folded = normalizeResults(character);
    if (folded !== character) {
      entries.push([character, folded]);
    }
  }
  const modifierApostrophe = '\u02BC';
  const foldedModifier = normalizeResults(modifierApostrophe);
  if (foldedModifier !== modifierApostrophe) {
    entries.push([modifierApostrophe, foldedModifier]);
  }
  return entries;
}

function foldWalkSql(startExpression) {
  return `
WITH RECURSIVE
ordered AS (
  SELECT src, dst, row_number() OVER (ORDER BY src) AS n FROM fold_map
),
walk(i, value) AS (
  SELECT 0, ${startExpression}
  UNION ALL
  SELECT walk.i + 1, replace(walk.value, ordered.src, ordered.dst)
  FROM walk
  JOIN ordered ON ordered.n = walk.i + 1
)
SELECT value AS folded FROM walk WHERE i = (SELECT count(*) FROM fold_map)`;
}

const FOLD_SQL = foldWalkSql('?');

module.exports = {
  normalizeResults,
  normalizeHero,
  joinedSearchText,
  searchText,
  tokensFor,
  foldMapEntries,
  foldWalkSql,
  FOLD_SQL
};
