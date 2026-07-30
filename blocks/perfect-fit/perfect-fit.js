import { createOptimizedPicture, decorateIcons, loadCSS } from '../../scripts/aem.js';
import {
  SPECS_COLUMNS, missingColumns, sizesBySlug, sheetRows,
} from '../../scripts/products.js';
import { renderName } from '../../scripts/product-name.js';

/**
 * "Find your perfect fit:" bar plus its tire-finder modal. The three items
 * open the modal on a matching tab (By Vehicle / By Tire Size / By Plate).
 * Each tab searches the real product catalogue in /products.json and lists
 * the matching tires.
 */

// the two sheets the finder reads: the products sheet for what a tire is, the
// specs sheet for which sizes it comes in. The workbook's third sheet, catalog,
// belongs to the listing. The sheet API serves 1000 rows to a request that
// names no limit and the specs sheet is longer than that, so ask for all of it.
const PRODUCTS_URL = '/products.json?sheet=products';
const SPECS_URL = '/products.json?sheet=specs&limit=10000';

const TABS = [
  { id: 'vehicle', label: 'By Vehicle' },
  { id: 'tire-size', label: 'By Tire Size' },
  { id: 'plate', label: 'By Plate' },
];

// icon injected per item, by position (the plate tab uses the license-plate
// icon). Injecting keeps the labels plain text in the authored content.
const TAB_ICONS = ['vehicle', 'tire-size', 'license-plate'];

// A small curated vehicle set. Each model maps to a coarse class that lines
// up with the vehicleTypes recorded in products.json.
const VEHICLES = {
  Chevrolet: { 'Silverado 1500': 'truck', Equinox: 'crossover', Malibu: 'car' },
  Ford: { 'F-150': 'truck', Explorer: 'suv', Escape: 'crossover' },
  Toyota: { RAV4: 'crossover', Camry: 'car', Tacoma: 'truck' },
  BMW: { X5: 'suv', '3 Series': 'car', X3: 'crossover' },
  Honda: { 'CR-V': 'crossover', Civic: 'car', Pilot: 'suv' },
  Tesla: { 'Model 3': 'car', 'Model Y': 'crossover' },
};
const STATES = ['California', 'Florida', 'Illinois', 'New York', 'Ohio', 'Texas'];

function range(start, end) {
  const out = [];
  for (let n = start; n <= end; n += 1) out.push(n);
  return out;
}
const YEARS = range(2015, 2026).reverse();

// --- pure data helpers (exported for tests) ---

/** Parses "225/45ZR17" into its width, aspect and rim, or null. */
export function parseSize(str) {
  const m = String(str).toUpperCase().match(/^(\d{3})\/(\d{2})Z?R(\d{2})$/);
  return m ? { width: m[1], aspect: m[2], rim: m[3] } : null;
}

/** Builds cascading width / aspect / rim option lists from every size. */
export function sizeOptions(products) {
  const widths = new Set();
  const aspectsByWidth = {};
  const rimsByWidthAspect = {};
  products.forEach((product) => (product.sizes || []).forEach((size) => {
    const parsed = parseSize(size);
    if (!parsed) return;
    widths.add(parsed.width);
    if (!aspectsByWidth[parsed.width]) aspectsByWidth[parsed.width] = new Set();
    aspectsByWidth[parsed.width].add(parsed.aspect);
    const key = `${parsed.width}/${parsed.aspect}`;
    if (!rimsByWidthAspect[key]) rimsByWidthAspect[key] = new Set();
    rimsByWidthAspect[key].add(parsed.rim);
  }));
  const num = (a, b) => Number(a) - Number(b);
  const sortEntries = (obj) => Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, [...v].sort(num)]),
  );
  return {
    widths: [...widths].sort(num),
    aspectsByWidth: sortEntries(aspectsByWidth),
    rimsByWidthAspect: sortEntries(rimsByWidthAspect),
  };
}

/** All products available in the exact width / aspect / rim size. */
export function findBySize(products, { width, aspect, rim }) {
  return products.filter((product) => (product.sizes || []).some((size) => {
    const parsed = parseSize(size);
    return parsed && parsed.width === width && parsed.aspect === aspect && parsed.rim === rim;
  }));
}

/** All products whose vehicleTypes match a coarse vehicle class keyword. */
export function findByVehicleClass(products, vehicleClass) {
  if (!vehicleClass) return [];
  return products.filter((product) => (product.vehicleTypes || []).some(
    (type) => type.toLowerCase().includes(vehicleClass),
  ));
}

// --- DOM helpers ---

function createField(tag, name, labelText) {
  const wrapper = document.createElement('div');
  wrapper.className = 'perfect-fit-field';
  const id = `perfect-fit-${name}`;
  // live reads the field name inside the control while it is empty, then floats
  // it above once a value lands
  const label = document.createElement('label');
  label.className = 'perfect-fit-field-label';
  label.setAttribute('for', id);
  label.textContent = labelText;
  const field = document.createElement(tag);
  field.id = id;
  field.name = name;
  wrapper.append(label, field);
  return { wrapper, field };
}

function fillSelect(select, values, placeholder) {
  const ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  ph.disabled = true;
  ph.selected = true;
  select.replaceChildren(ph, ...values.map((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    return opt;
  }));
}

function searchButton() {
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary perfect-fit-search';
  // sentence case in the DOM, uppercased in CSS, as live does it
  button.textContent = 'See tires that fit';
  button.disabled = true;
  return button;
}

/** Live's terms sentence, shown above the call to action on every tab. */
function termsNote() {
  const note = document.createElement('p');
  note.className = 'perfect-fit-terms';
  const link = document.createElement('a');
  link.href = '/legal';
  link.textContent = 'Terms of Use';
  note.append(
    'By selecting "See Tires That Fit" I confirm that I have read the Tire Selector ',
    link,
    ' and I accept the terms.',
  );
  return note;
}

/**
 * Tracks which controls hold a value: the field name floats above a filled
 * control, and the call to action waits for the whole form.
 */
function wireFormState(form) {
  const button = form.querySelector('.perfect-fit-search');
  const fields = [...form.querySelectorAll('select, input')];
  const update = () => {
    fields.forEach((field) => field.closest('.perfect-fit-field')
      .classList.toggle('perfect-fit-field-filled', !!field.value));
    button.disabled = fields.some((field) => !field.value);
  };
  form.addEventListener('change', update);
  form.addEventListener('input', update);
  update();
}

/**
 * Assembles one tab's form: live's question, the fields, the terms sentence,
 * and the call to action.
 */
function buildForm(tabId, headingText, fields, onSubmit) {
  const form = document.createElement('form');
  form.className = `perfect-fit-form perfect-fit-form-${tabId}`;
  const heading = document.createElement('h2');
  heading.id = `perfect-fit-heading-${tabId}`;
  heading.className = 'perfect-fit-question';
  heading.textContent = headingText;
  const grid = document.createElement('div');
  grid.className = 'perfect-fit-fields';
  grid.append(...fields);
  form.append(heading, grid, termsNote(), searchButton());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit();
  });
  return form;
}

function productCard(product) {
  const card = document.createElement('a');
  card.className = 'perfect-fit-result';
  card.href = `/tires/${product.slug}`;
  const media = document.createElement('div');
  media.className = 'perfect-fit-result-media';
  if (product.image) {
    media.append(createOptimizedPicture(product.image, product.name, false, [{ width: '400' }]));
  }
  const body = document.createElement('div');
  body.className = 'perfect-fit-result-body';
  // h3, one level under the h2 question the panel above these results asks.
  const heading = document.createElement('h3');
  // the name carries a superscript on ten of the 46 products. The sheet holds it
  // in a nameHtml cell beside the plain name, which is what the image alt takes.
  heading.append(renderName(product.nameHtml || product.name));
  const meta = document.createElement('p');
  meta.textContent = [product.category, product.season].filter(Boolean).join(' · ');
  body.append(heading, meta);
  card.append(media, body);
  return card;
}

function renderResults(container, products) {
  const count = document.createElement('p');
  count.className = 'perfect-fit-result-count';
  if (!products.length) {
    count.textContent = 'No matching tires found. Try another combination.';
    container.replaceChildren(count);
    return;
  }
  count.textContent = `${products.length} matching ${products.length === 1 ? 'tire' : 'tires'}`;
  const list = document.createElement('div');
  list.className = 'perfect-fit-results-list';
  products.forEach((product) => list.append(productCard(product)));
  container.replaceChildren(count, list);
}

function buildTireSizeForm(products, onResults) {
  const opts = sizeOptions(products);
  const width = createField('select', 'width', 'Width');
  fillSelect(width.field, opts.widths, 'Width');
  const aspect = createField('select', 'aspect', 'Aspect Ratio');
  fillSelect(aspect.field, [], 'Aspect Ratio');
  aspect.field.disabled = true;
  const rim = createField('select', 'rim', 'Rim Diameter');
  fillSelect(rim.field, [], 'Rim Diameter');
  rim.field.disabled = true;

  width.field.addEventListener('change', () => {
    fillSelect(aspect.field, opts.aspectsByWidth[width.field.value] || [], 'Aspect Ratio');
    aspect.field.disabled = false;
    fillSelect(rim.field, [], 'Rim Diameter');
    rim.field.disabled = true;
  });
  aspect.field.addEventListener('change', () => {
    fillSelect(rim.field, opts.rimsByWidthAspect[`${width.field.value}/${aspect.field.value}`] || [], 'Rim Diameter');
    rim.field.disabled = false;
  });

  const form = buildForm(
    'tire-size',
    "What's your tire size?",
    [width.wrapper, aspect.wrapper, rim.wrapper],
    () => onResults(findBySize(products, {
      width: width.field.value, aspect: aspect.field.value, rim: rim.field.value,
    })),
  );
  wireFormState(form);
  return form;
}

// live orders the vehicle fields make, model, year
function buildVehicleForm(products, onResults) {
  const make = createField('select', 'make', 'Make');
  fillSelect(make.field, Object.keys(VEHICLES), 'Make');
  const model = createField('select', 'model', 'Model');
  fillSelect(model.field, [], 'Model');
  model.field.disabled = true;
  const year = createField('select', 'year', 'Year');
  fillSelect(year.field, YEARS, 'Year');
  make.field.addEventListener('change', () => {
    fillSelect(model.field, Object.keys(VEHICLES[make.field.value] || {}), 'Model');
    model.field.disabled = false;
  });
  const form = buildForm(
    'vehicle',
    'What are you driving?',
    [make.wrapper, model.wrapper, year.wrapper],
    () => {
      const vehicleClass = (VEHICLES[make.field.value] || {})[model.field.value];
      onResults(findByVehicleClass(products, vehicleClass));
    },
  );
  wireFormState(form);
  return form;
}

function buildPlateForm(products, onResults) {
  const plate = createField('input', 'plate', 'License Plate');
  plate.field.type = 'text';
  plate.field.autocomplete = 'off';
  plate.field.placeholder = 'License Plate';
  const state = createField('select', 'state', 'State');
  fillSelect(state.field, STATES, 'State');
  const form = buildForm(
    'plate',
    'Enter your license plate.',
    [plate.wrapper, state.wrapper],
    // plate lookup is not wired to a registration service, so recommend the
    // all-weather touring range as a sensible default
    () => onResults(products.filter((product) => /all-season|all-weather/i.test(product.season || ''))),
  );
  wireFormState(form);
  return form;
}

const FORM_BUILDERS = {
  vehicle: buildVehicleForm,
  'tire-size': buildTireSizeForm,
  plate: buildPlateForm,
};

/** Keyboard-focusable elements in `container`, ignoring hidden tab panels. */
function getFocusable(container) {
  return [...container.querySelectorAll('a[href], button, input, select, textarea')]
    .filter((el) => !el.disabled && el.tabIndex !== -1 && !el.closest('[hidden]'));
}

/**
 * Builds the tire-finder modal (overlay, tabs, one search form per tab) and
 * wires its interactions. Detached from the DOM; the caller appends `overlay`.
 * @returns {{ overlay: Element, open: Function }}
 */
function buildModal(products) {
  const overlay = document.createElement('div');
  overlay.className = 'perfect-fit-overlay';
  overlay.hidden = true;

  const dialog = document.createElement('div');
  dialog.className = 'perfect-fit-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  // focus lands here on open, so the dialog announces its question and no
  // control opens wearing a focus ring
  dialog.tabIndex = -1;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'perfect-fit-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';

  const band = document.createElement('div');
  band.className = 'perfect-fit-band';

  const tablist = document.createElement('div');
  tablist.className = 'perfect-fit-tablist';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Find your perfect fit');

  const panelsWrapper = document.createElement('div');
  panelsWrapper.className = 'perfect-fit-panels';

  const tabs = {};
  const panels = {};

  TABS.forEach(({ id, label }) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `perfect-fit-tab-${id}`;
    tab.className = 'perfect-fit-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', `perfect-fit-panel-${id}`);
    tab.tabIndex = -1;
    tab.textContent = label;
    tablist.append(tab);
    tabs[id] = tab;

    const panel = document.createElement('div');
    panel.id = `perfect-fit-panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.hidden = true;

    const results = document.createElement('div');
    results.className = 'perfect-fit-results';
    panel.append(FORM_BUILDERS[id](products, (found) => renderResults(results, found)), results);
    panelsWrapper.append(panel);
    panels[id] = panel;
  });

  band.append(tablist);
  dialog.append(closeButton, band, panelsWrapper);
  overlay.append(dialog);

  let lastTrigger = null;

  function switchTab(tabId) {
    TABS.forEach(({ id }) => {
      const selected = id === tabId;
      tabs[id].setAttribute('aria-selected', String(selected));
      tabs[id].tabIndex = selected ? 0 : -1;
      panels[id].hidden = !selected;
    });
    // the visible panel's question names the dialog
    dialog.setAttribute('aria-labelledby', `perfect-fit-heading-${tabId}`);
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove('perfect-fit-modal-open');
    if (lastTrigger) lastTrigger.focus();
  }

  function open(tabId, trigger) {
    lastTrigger = trigger;
    switchTab(tabId);
    overlay.hidden = false;
    document.body.classList.add('perfect-fit-modal-open');
    dialog.focus();
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusable(dialog);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  TABS.forEach(({ id }) => tabs[id].addEventListener('click', () => switchTab(id)));
  tablist.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const ids = TABS.map(({ id }) => id);
    const current = ids.findIndex((id) => tabs[id] === document.activeElement);
    if (current === -1) return;
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = ids[(current + delta + ids.length) % ids.length];
    event.preventDefault();
    switchTab(next);
    tabs[next].focus();
  });

  return { overlay, open };
}

/** Splits a comma-joined sheet cell, tolerating a cell that is already a list. */
function listCell(value) {
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return value || [];
}

/**
 * Which sizes each product comes in, read from the specs sheet. That sheet is
 * the one source: the products sheet also carries a comma-joined sizes cell,
 * derived from this and out of date the moment either is edited alone. Issue
 * #122.
 * @returns {Promise<Map<string, Array<string>>|null>} null when the sheet
 * cannot be read, which leaves the caller the stale cell to fall back on
 */
async function loadSpecSizes() {
  try {
    const resp = await fetch(SPECS_URL);
    if (!resp.ok) return null;
    const rows = sheetRows(await resp.json(), 'specs');
    const missing = missingColumns(rows, SPECS_COLUMNS);
    if (missing.length) {
      // eslint-disable-next-line no-console
      console.error(`perfect-fit: the specs sheet has no ${missing.join(' and no ')} column, so the finder is reading the products.sizes cell instead`);
      return null;
    }
    return sizesBySlug(rows);
  } catch (e) {
    return null;
  }
}

/** Reads the tire catalogue. Returns an empty list when the sheet is missing. */
async function loadProducts() {
  try {
    const [resp, specSizes] = await Promise.all([fetch(PRODUCTS_URL), loadSpecSizes()]);
    if (!resp.ok) return [];
    const json = await resp.json();
    // support all three shapes: a single-sheet response (data), the whole
    // multi-sheet workbook (products.data), and the legacy single-object
    // file ({ products: [...] }).
    const rows = sheetRows(json, 'products').length
      ? sheetRows(json, 'products')
      : (json.products || []);
    const products = rows.map((product) => ({
      ...product,
      sizes: specSizes ? (specSizes.get(product.slug) || []) : listCell(product.sizes),
      vehicleTypes: listCell(product.vehicleTypes),
    }));
    // a product the specs sheet has no row for is searchable by vehicle and not
    // by size, and that is worth saying: it means a size nobody can spec
    const unspecced = specSizes ? products.filter((p) => !p.sizes.length).map((p) => p.slug) : [];
    if (unspecced.length) {
      // eslint-disable-next-line no-console
      console.warn(`perfect-fit: the specs sheet has no rows for ${unspecced.join(', ')}, so those tires answer no size search`);
    }
    return products;
  } catch (e) {
    return [];
  }
}

// The finder also opens from the header, the footer and the product pages, so
// one modal per page is shared between the bar and those triggers.
let finder = null;

/**
 * Opens the tire finder from a control outside the bar. On a page that carries
 * no bar the modal gets a section of its own, because the block styles reach
 * it through `main .section`.
 * @param {string} tabId the tab to open
 * @param {Element} [trigger] the control that opened it, refocused on close
 */
export async function openTireFinder(tabId, trigger) {
  if (!finder || !finder.overlay.isConnected) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/perfect-fit/perfect-fit.css`);
    finder = buildModal(await loadProducts());
    const host = document.createElement('div');
    host.className = 'section perfect-fit-host';
    // a section caps and pads its first level at the content width, so the
    // overlay sits a level below it, where a block's markup would sit
    const wrapper = document.createElement('div');
    wrapper.append(finder.overlay);
    host.append(wrapper);
    document.querySelector('main').append(host);
  }
  finder.open(tabId, trigger);
}

/**
 * The card variant: live's product page offers the same three searches in a
 * white card in the hero. It renders in the eager phase of every product page,
 * so it builds no modal and reads no catalogue. The shared trigger contract
 * carries the click, and the modal is built on the first one.
 * @param {Element} block the perfect-fit block
 */
function decorateCard(block) {
  const question = block.querySelector('p');
  const heading = document.createElement('h2');
  heading.className = 'perfect-fit-card-heading';
  if (question) heading.append(...question.childNodes);

  const list = document.createElement('ul');
  list.className = 'perfect-fit-card-list';
  TABS.forEach(({ id, label }, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'perfect-fit-item';
    button.dataset.tireFinder = id;
    const icon = document.createElement('span');
    icon.className = `icon icon-${TAB_ICONS[index]}`;
    const text = document.createElement('span');
    text.className = 'perfect-fit-card-label';
    text.textContent = label;
    button.append(icon, text);
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  });
  decorateIcons(list);

  block.replaceChildren(heading, list);
}

/**
 * "Find your perfect fit:" bar: a label plus a row of shortcut buttons. Each
 * opens the tire-finder modal on the matching tab.
 *
 * The bar is the third section of the homepage, and loadSections reaches the
 * six under it only once this returns, so it reads no catalogue and builds no
 * modal. Both wait for the first click, as they do for the card. Issue #111.
 * @param {Element} block the perfect-fit block
 */
export default function decorate(block) {
  if (block.classList.contains('card')) {
    decorateCard(block);
    return;
  }

  const [labelRow, itemsRow] = [...block.children];
  const label = labelRow ? labelRow.querySelector('p') : null;
  if (label) label.className = 'perfect-fit-label';

  const list = document.createElement('ul');
  list.className = 'perfect-fit-items';
  const cells = itemsRow ? [...itemsRow.children] : [];
  cells.forEach((cell, index) => {
    const tabId = (TABS[index] || TABS[0]).id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'perfect-fit-item';
    button.dataset.tab = tabId;
    // inject the search icon unless the content already carries one, so the
    // labels round-trip as plain text in DA without a raw :token: in the editor
    const iconName = TAB_ICONS[index];
    if (iconName && !cell.querySelector('.icon')) {
      const icon = document.createElement('span');
      icon.className = `icon icon-${iconName}`;
      cell.prepend(icon);
    }
    while (cell.firstElementChild) button.append(cell.firstElementChild);
    decorateIcons(button);
    button.addEventListener('click', () => openTireFinder(tabId, button));
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  });

  const children = label ? [label, list] : [list];
  block.replaceChildren(...children);
}
