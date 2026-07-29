import { SPECS_COLUMNS, missingColumns } from '../../scripts/products.js';

// ask for the specs sheet alone: the workbook also carries the products and
// catalog sheets, which a product page never reads
const SPECS_URL = '/products.json?sheet=specs';
const LEGACY_SPECS_URL = '/product-specs.json';
// the sheet API serves 1000 rows to a request that names no limit, and the
// specs sheet is longer than that. Ask for the whole sheet in one request.
const PAGE_SIZE = 10000;

/**
 * Reads every row of a sheet. The response reports the row count, so a page
 * shorter than the sheet is followed by another read from where it ended.
 * @param {string} url the sheet URL, already carrying its query
 * @returns {Promise<Array<Object>|null>} the rows, or null for a sheet with none
 */
async function loadRows(url) {
  const rows = [];
  let total = 0;
  do {
    // eslint-disable-next-line no-await-in-loop
    const resp = await fetch(`${url}&limit=${PAGE_SIZE}&offset=${rows.length}`);
    if (!resp.ok) break;
    // eslint-disable-next-line no-await-in-loop
    const data = await resp.json();
    const page = data.data || (data.specs && data.specs.data);
    if (!page || !page.length) break;
    rows.push(...page);
    total = Number(data.total) || rows.length;
  } while (rows.length < total);
  return rows.length ? rows : null;
}

/**
 * Loads one product's per-size specs. Reads the DA sheet first: its rows are a
 * flat list keyed by slug, each carrying the spec fields in column order. A
 * single-sheet response puts them at data, a whole workbook at specs.data.
 * Falls back to the legacy /product-specs.json shape
 * ({ slug: [{ size, specs }] }) when neither has rows.
 *
 * A sheet that has rows and not the columns this reads is a broken contract,
 * not a product without sizes, so it comes back as an error the band shows.
 * Renaming either column in DA used to leave every product page with an empty
 * selector and nothing said. Issue #122.
 * @param {string} slug the product slug
 * @returns {Promise<{sizes?: Array<{size: string, specs: Object}>, error?: string}>}
 */
async function loadSizes(slug) {
  const rows = await loadRows(SPECS_URL);
  if (rows) {
    const missing = missingColumns(rows, SPECS_COLUMNS);
    if (missing.length) {
      return { error: `the specs sheet has no ${missing.join(' and no ')} column` };
    }
    return {
      sizes: rows
        .filter((row) => row.slug === slug)
        .map((row) => {
          const specs = { ...row };
          delete specs.slug;
          delete specs.size;
          return { size: row.size, specs };
        }),
    };
  }
  const legacy = await fetch(LEGACY_SPECS_URL);
  if (!legacy.ok) return { sizes: [] };
  const legacyData = await legacy.json();
  return { sizes: legacyData[slug] || [] };
}

/**
 * Builds a definition list of one size's spec fields, matching the live
 * per-size spec sheet.
 * @param {{size: string, specs: Object}} entry one size and its specs
 * @returns {HTMLDListElement}
 */
function specGrid(entry) {
  const dl = document.createElement('dl');
  dl.className = 'tire-specs-grid';
  Object.entries(entry.specs).forEach(([key, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  });
  return dl;
}

/**
 * Fills the band with the size selector and the selected size's spec sheet,
 * once the sheet has landed.
 * @param {Element} block the tire-specs block
 * @param {Element} heading the heading the block was decorated with
 * @param {{sizes?: Array<{size: string, specs: Object}>, error?: string}} result
 */
function fill(block, heading, result) {
  // a sheet the block cannot read is an authoring mistake, and it is the whole
  // catalogue's, so say which column is gone rather than blank every page
  if (result.error) {
    // eslint-disable-next-line no-console
    console.error(`tire-specs: ${result.error}`);
    const message = document.createElement('p');
    message.className = 'tire-specs-error';
    message.textContent = `Specifications are unavailable: ${result.error}.`;
    block.replaceChildren(heading, message);
    return;
  }

  const sizes = result.sizes || [];
  const count = document.createElement('p');
  count.className = 'tire-specs-count';

  // Six of the 46 products have no rows anywhere in the sheet. Live has none
  // for them either and still renders this band, the same 428px tall as a
  // product with 49 sizes, so the band stays and says what is there. Taking it
  // out lost the reader a section live keeps, and it collapsed the room the
  // stylesheet had already reserved, which are one defect rather than two.
  //
  // Live fills the empty band with the same "make a selection" line, an empty
  // picker, a "find size by vehicle or plate" hint and a link to a /specs page.
  // A picker with nothing in it is a control that does nothing, and neither a
  // vehicle nor a plate finds a size here, so this states the fact and offers
  // the one search that does. (#242, folding in #232)
  if (!sizes.length) {
    count.textContent = 'No sizes are listed for this tire.';
    const help = document.createElement('p');
    help.className = 'tire-specs-help';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'button secondary';
    trigger.dataset.tireFinder = 'tire-size';
    trigger.textContent = 'Search by tire size';
    help.append(trigger);
    block.replaceChildren(heading, count, help);
    return;
  }

  count.textContent = `${sizes.length} sizes available. Select a size to see its specs.`;

  const select = document.createElement('select');
  select.className = 'tire-specs-select';
  select.setAttribute('aria-label', 'Select a tire size');
  sizes.forEach((entry, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = entry.size;
    select.append(option);
  });

  const panel = document.createElement('div');
  panel.className = 'tire-specs-panel';
  const render = (i) => panel.replaceChildren(specGrid(sizes[i]));
  select.addEventListener('change', () => render(Number(select.value)));
  render(0);

  block.replaceChildren(heading, count, select, panel);
}

/**
 * Tire specifications: a size selector plus the selected size's spec sheet,
 * matching the live product page. The product is identified by a slug authored
 * in the block, falling back to the last path segment. Per-size specs come
 * from the /products.json workbook, or the legacy product-specs.json.
 *
 * The sheet is 827KB over 1656 rows, and a product page carries three more
 * sections under this block, which loadSections reaches only once this returns.
 * So the band is headed here and filled when the sheet lands, and the
 * stylesheet holds the room the filled sheet takes. Issue #111.
 * @param {Element} block the tire-specs block
 */
export default function decorate(block) {
  const authored = block.textContent.trim();
  const slug = authored || window.location.pathname.replace(/\/$/, '').split('/').pop();

  const heading = document.createElement('h2');
  heading.textContent = 'Specifications';
  block.replaceChildren(heading);

  loadSizes(slug)
    .catch(() => ({ sizes: [] }))
    .then((result) => fill(block, heading, result));
}
