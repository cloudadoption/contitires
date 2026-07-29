import { SPECS_COLUMNS, missingColumns } from '../../scripts/products.js';
import { renderName } from '../../scripts/product-name.js';

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
 * Live's band, the same on a product with 119 sizes as on one with none: the
 * heading, the line above the picker, the picker under its label, the hint, the
 * chosen size's specs, and the link to the full sheet. Only the picker's
 * contents differ between the two. Read off continentaltire.com at 1440x1000
 * with the profile's storage cleared and the cache bypassed, in the settled
 * state: 428 tall with nothing chosen, 788 once a size is picked, and the
 * sentence on screen either way.
 *
 * It is built before the sheet lands, and the sheet only fills the picker, so
 * nothing in the band moves late.
 * @param {Element} block the tire-specs block
 * @param {Element} heading the heading the block was decorated with
 * @param {string} slug the product slug
 * @returns {{select: HTMLSelectElement, panel: HTMLElement}} the picker and the
 * panel its choice fills
 */
function band(block, heading, slug) {
  const status = document.createElement('p');
  status.className = 'tire-specs-status';
  status.textContent = 'Make a selection below to view tire specifications.';

  const select = document.createElement('select');
  select.className = 'tire-specs-select';
  select.id = 'tire-specs-size';
  const placeholder = document.createElement('option');
  placeholder.textContent = 'Select a size';
  placeholder.value = '';
  select.append(placeholder);

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

  const panel = document.createElement('div');
  panel.className = 'tire-specs-panel';

  const viewAll = document.createElement('a');
  viewAll.className = 'tire-specs-view-all';
  viewAll.href = `/tires/${slug}/specs`;
  viewAll.textContent = 'View all sizes & specs';

  block.replaceChildren(heading, status, field, hint, panel, viewAll);
  return { select, panel };
}

/**
 * Puts the product's sizes in the picker and shows the one a reader chooses.
 * A product the sheet has no rows for gets live's own answer in the picker, and
 * nothing else about the band changes.
 * @param {HTMLSelectElement} select the picker
 * @param {HTMLElement} panel the panel a choice fills
 * @param {Array<{size: string, specs: Object}>} sizes the product's sizes
 */
function offerSizes(select, panel, sizes) {
  if (!sizes.length) {
    const none = document.createElement('option');
    none.textContent = 'No results found';
    none.value = '';
    none.disabled = true;
    select.append(none);
    return;
  }
  sizes.forEach((entry, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = entry.size;
    select.append(option);
  });
  select.addEventListener('change', () => {
    const entry = sizes[Number(select.value)];
    panel.replaceChildren(...(entry ? [specGrid(entry)] : []));
  });
}

/**
 * Fills the picker once the sheet has landed.
 * @param {Element} block the tire-specs block
 * @param {Element} heading the heading the block was decorated with
 * @param {HTMLSelectElement} select the picker
 * @param {HTMLElement} panel the panel a choice fills
 * @param {{sizes?: Array<{size: string, specs: Object}>, error?: string}} result
 */
function fill(block, heading, select, panel, result) {
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

  offerSizes(select, panel, result.sizes || []);
}

/**
 * Tire specifications: live's band, with a size picker that shows a size's
 * specs once a reader chooses one. The product is identified by a slug authored
 * in the block, falling back to the last path segment. Per-size specs come
 * from the /products.json workbook, or the legacy product-specs.json.
 *
 * The sheet is 827KB over 1656 rows, and a product page carries three more
 * sections under this block, which loadSections reaches only once this returns.
 * So the band is drawn here in full and the sheet only fills the picker, which
 * moves nothing. Issues #111 and #314.
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
  // the name carries a superscript on ten of the 46 products, so the h1 is read
  // as markup: textContent flattened the mark even where the page had it
  const name = document.querySelector('main h1');
  if (name) {
    heading.append(renderName(name.innerHTML.trim()));
    heading.append(' ');
  }
  heading.append(eyebrow);

  const { select, panel } = band(block, heading, slug);
  loadSizes(slug)
    .catch(() => ({ sizes: [] }))
    .then((result) => fill(block, heading, select, panel, result));
}
