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
  const products = sheetRows(productsJson, 'products');
  const specs = sheetRows(specsJson, 'specs');

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

try {
  await checkProducts();
} catch (error) {
  note('products', error.message);
}

if (problems.length) {
  console.log(`\n${problems.length} broken:\n`);
  problems.forEach((line) => console.log(`  ${line}`));
  process.exit(1);
}
console.log('\nevery contract holds');
