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
 * A control that opens the tire finder on one of its tabs, the way live's hint
 * does. The finder is a block of its own, so it loads on the click rather than
 * riding along with every product page.
 * @param {string} tab the finder tab to open
 * @returns {HTMLButtonElement}
 */
function finderButton(tab) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tire-specs-finder-link';
  button.dataset.tab = tab;
  button.textContent = tab;
  button.addEventListener('click', async () => {
    const { openTireFinder } = await import('../perfect-fit/perfect-fit.js');
    openTireFinder(tab, button);
  });
  return button;
}

/**
 * Live's own band on a product it has no sizes for: the heading, the line above
 * the picker, an empty picker, the hint under it and the link to the full size
 * and spec page. Read off continentaltire.com/tires/4x4sportcontact at
 * 1440x1000 with the profile's storage cleared, in the state a reader arrives
 * in. Its picker holds 0 options where the same band on
 * /tires/extremecontact-dws06-plus holds 119.
 * @param {Element} block the tire-specs block
 * @param {Element} heading the heading the block was decorated with
 * @param {string} slug the product slug
 */
function emptyState(block, heading, slug) {
  const status = document.createElement('p');
  status.className = 'tire-specs-status';
  status.textContent = 'Make a selection below to view tire specifications.';

  const select = document.createElement('select');
  select.className = 'tire-specs-select';
  select.id = 'tire-specs-size';
  ['Select a size', 'No results found'].forEach((text, i) => {
    const option = document.createElement('option');
    option.textContent = text;
    option.value = '';
    // the second is what the open picker reads, and there is nothing to take
    option.disabled = i > 0;
    select.append(option);
  });

  const label = document.createElement('label');
  label.className = 'tire-specs-label';
  label.htmlFor = select.id;
  label.textContent = 'Tire size';

  const field = document.createElement('div');
  field.className = 'tire-specs-field';
  field.append(label, select);

  const hint = document.createElement('p');
  hint.className = 'tire-specs-help';
  hint.append('Need Help? Find size by ', finderButton('vehicle'), ' or ', finderButton('plate'));

  const viewAll = document.createElement('a');
  viewAll.className = 'tire-specs-view-all';
  viewAll.href = `/tires/${slug}/specs`;
  viewAll.textContent = 'View all sizes & specs';

  // no sheet is coming, so the band stops holding the room one takes
  block.classList.add('tire-specs-empty');
  block.replaceChildren(heading, status, field, hint, viewAll);
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
 * @param {string} slug the product slug
 * @param {{sizes?: Array<{size: string, specs: Object}>, error?: string}} result
 */
function fill(block, heading, slug, result) {
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
  // nothing to show: live keeps its band and shows an empty picker in it
  if (!sizes.length) {
    emptyState(block, heading, slug);
    return;
  }

  const count = document.createElement('p');
  count.className = 'tire-specs-count';
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

  // live heads the band with the product's own name and the word after it,
  // tracked out: "4x4 SportContact SPECIFICATIONS". The name is already on the
  // page, in the hero's heading.
  const heading = document.createElement('h2');
  const eyebrow = document.createElement('span');
  eyebrow.textContent = 'Specifications';
  const name = document.querySelector('main h1');
  if (name) heading.append(`${name.textContent.trim()} `);
  heading.append(eyebrow);
  block.replaceChildren(heading);

  loadSizes(slug)
    .catch(() => ({ sizes: [] }))
    .then((result) => fill(block, heading, slug, result));
}
