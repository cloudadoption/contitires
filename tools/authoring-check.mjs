#!/usr/bin/env node
/* eslint-disable no-console -- printing what it found is the whole job */

/*
 * Reads the published site against the authoring contracts the README states,
 * and names every place an edit has broken one.
 *
 *   node tools/authoring-check.mjs
 *   node tools/authoring-check.mjs --host https://main--contitires--cloudadoption.aem.page
 *
 * Exits non-zero when anything is broken, so it can gate a content change.
 *
 * Both contracts it reads fail SILENTLY in the browser: a renamed column empties
 * a spec panel, a mistyped category empties a listing, and neither says why on a
 * page nobody is looking at. Issues #122 and #124.
 */

import {
  SPECS_COLUMNS, missingColumns, sizeKey, sizesBySlug, sheetRows,
} from '../scripts/products.js';
import { CATEGORIES, categoryNames, isKnownCategory } from '../scripts/categories.js';

const LIVE = 'https://main--contitires--cloudadoption.aem.live';
const hostArg = process.argv.indexOf('--host');
const HOST = hostArg > -1 ? process.argv[hostArg + 1] : LIVE;

const problems = [];
const note = (contract, line) => problems.push(`${contract}: ${line}`);

/** Reads one JSON path off the host. A body that is not JSON is a problem too. */
async function read(path) {
  const resp = await fetch(`${HOST}${path}`);
  if (!resp.ok) throw new Error(`${path} answered ${resp.status}`);
  return resp.json();
}

/*
 * The products workbook. The specs sheet is the one source of which sizes a
 * product comes in; the products sheet's sizes cell is derived from it. Issue
 * #122.
 */
async function checkProducts() {
  const [productsJson, specsJson] = await Promise.all([
    read('/products.json?sheet=products'),
    read('/products.json?sheet=specs&limit=10000'),
  ]);
  const products = sheetRows(productsJson);
  const specs = sheetRows(specsJson);

  const missing = missingColumns(specs, SPECS_COLUMNS);
  if (missing.length) {
    note('products', `the specs sheet has no ${missing.join(' and no ')} column, so no product page can list a size`);
    return;
  }

  const bySlug = sizesBySlug(specs);
  const orphans = [...bySlug.keys()].filter((slug) => !products.some((p) => p.slug === slug));
  if (orphans.length) {
    note('products', `the specs sheet carries rows for ${orphans.join(', ')}, which the products sheet does not list`);
  }

  products.forEach((product) => {
    const derived = bySlug.get(product.slug) || [];
    if (!derived.length) {
      note('products', `${product.slug} has no rows in the specs sheet, so its page lists no specs and no size search finds it`);
      return;
    }
    const cell = String(product.sizes || '').split(',').map((s) => s.trim()).filter(Boolean)
      .map(sizeKey);
    const onlyInCell = cell.filter((size) => !derived.includes(size));
    const onlyInSheet = derived.filter((size) => !cell.includes(size));
    if (onlyInCell.length) {
      note('products', `${product.slug} sizes holds ${onlyInCell.join(', ')}, which no specs row backs`);
    }
    if (onlyInSheet.length) {
      note('products', `${product.slug} sizes is short of ${onlyInSheet.length} size(s) the specs sheet carries: ${onlyInSheet.slice(0, 6).join(', ')}${onlyInSheet.length > 6 ? ', ...' : ''}`);
    }
  });

  console.log(`products: ${products.length} products, ${specs.length} spec rows, ${bySlug.size} products with sizes`);
}

/*
 * The learn categories. An article's Category metadata and a listing's Category
 * cell are free text at both ends, so a typo at either drops articles out of a
 * page that still looks finished. Issue #124.
 */
async function checkCategories() {
  const index = await read('/learn/query-index.json?limit=1000');
  const rows = index.data || [];
  const listings = CATEGORIES.map((category) => category.path);

  const counts = new Map(categoryNames().map((name) => [name, 0]));
  rows.forEach((row) => {
    const value = String(row.category || '').trim();
    // the three listing pages are indexed too, and carry no category of their own
    if (!value) {
      if (!listings.includes(row.path)) {
        note('categories', `${row.path} carries no category, so only an unfiltered list shows it`);
      }
      return;
    }
    if (!isKnownCategory(value)) {
      note('categories', `${row.path} carries "${value}", which is not one of ${categoryNames().join(', ')}`);
      return;
    }
    const name = categoryNames().find((known) => known.toLowerCase() === value.toLowerCase());
    if (name !== value) {
      note('categories', `${row.path} carries "${value}", which the vocabulary writes as "${name}"`);
    }
    counts.set(name, counts.get(name) + 1);
  });

  counts.forEach((count, name) => {
    if (!count) note('categories', `no article carries "${name}", so its page lists nothing`);
  });

  await Promise.all(CATEGORIES.map(async (category) => {
    const resp = await fetch(`${HOST}${category.path}`);
    if (!resp.ok) {
      note('categories', `${category.name} lists on ${category.path}, which answers ${resp.status}`);
      return;
    }
    const asked = [...(await resp.text()).matchAll(/<div class="article-cards[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)]
      .map((match) => match[1].replace(/<[^>]+>/g, ' ').trim());
    if (!asked.some((text) => text.toLowerCase().includes(category.name.toLowerCase()))) {
      note('categories', `${category.path} has no article-cards block asking for "${category.name}"`);
    }
  }));

  const named = [...counts.entries()].map(([name, count]) => `${name} ${count}`).join(', ');
  console.log(`categories: ${rows.length} indexed rows, ${named}`);
}

try {
  await checkProducts();
} catch (error) {
  note('products', error.message);
}

try {
  await checkCategories();
} catch (error) {
  note('categories', error.message);
}

if (problems.length) {
  console.log(`\n${problems.length} broken:\n`);
  problems.forEach((line) => console.log(`  ${line}`));
  process.exit(1);
}
console.log('\nevery contract holds');
