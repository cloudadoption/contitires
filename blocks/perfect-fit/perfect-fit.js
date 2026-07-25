import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * "Find your perfect fit:" bar plus its tire-finder modal. The three items
 * open the modal on a matching tab (By Vehicle / By Tire Size / By Plate).
 * Each tab searches the real product catalogue in /products.json and lists
 * the matching tires.
 */

const PRODUCTS_URL = '/products.json';

const TABS = [
  { id: 'vehicle', label: 'By Vehicle' },
  { id: 'tire-size', label: 'By Tire Size' },
  { id: 'plate', label: 'By Plate' },
];

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
  const label = document.createElement('label');
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
  button.textContent = 'Search';
  return button;
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
  const heading = document.createElement('h4');
  heading.textContent = product.name;
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
  const form = document.createElement('form');
  form.className = 'perfect-fit-form';
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

  form.append(width.wrapper, aspect.wrapper, rim.wrapper, searchButton());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!width.field.value || !aspect.field.value || !rim.field.value) return;
    onResults(findBySize(products, {
      width: width.field.value, aspect: aspect.field.value, rim: rim.field.value,
    }));
  });
  return form;
}

function buildVehicleForm(products, onResults) {
  const form = document.createElement('form');
  form.className = 'perfect-fit-form';
  const year = createField('select', 'year', 'Year');
  fillSelect(year.field, YEARS, 'Year');
  const make = createField('select', 'make', 'Make');
  fillSelect(make.field, Object.keys(VEHICLES), 'Make');
  const model = createField('select', 'model', 'Model');
  fillSelect(model.field, [], 'Model');
  model.field.disabled = true;
  make.field.addEventListener('change', () => {
    fillSelect(model.field, Object.keys(VEHICLES[make.field.value] || {}), 'Model');
    model.field.disabled = false;
  });
  form.append(year.wrapper, make.wrapper, model.wrapper, searchButton());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const vehicleClass = (VEHICLES[make.field.value] || {})[model.field.value];
    onResults(findByVehicleClass(products, vehicleClass));
  });
  return form;
}

function buildPlateForm(products, onResults) {
  const form = document.createElement('form');
  form.className = 'perfect-fit-form';
  const plate = createField('input', 'plate', 'License Plate');
  plate.field.type = 'text';
  plate.field.autocomplete = 'off';
  const state = createField('select', 'state', 'State');
  fillSelect(state.field, STATES, 'State');
  form.append(plate.wrapper, state.wrapper, searchButton());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // plate lookup is not wired to a registration service, so recommend the
    // all-weather touring range as a sensible default
    onResults(products.filter((product) => /all-season|all-weather/i.test(product.season || '')));
  });
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
  dialog.setAttribute('aria-labelledby', 'perfect-fit-modal-title');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'perfect-fit-close';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '×';

  const title = document.createElement('h2');
  title.id = 'perfect-fit-modal-title';
  title.className = 'perfect-fit-modal-title';
  title.textContent = 'Find Your Perfect Fit';

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

  dialog.append(closeButton, title, tablist, panelsWrapper);
  overlay.append(dialog);

  let lastTrigger = null;

  function switchTab(tabId) {
    TABS.forEach(({ id }) => {
      const selected = id === tabId;
      tabs[id].setAttribute('aria-selected', String(selected));
      tabs[id].tabIndex = selected ? 0 : -1;
      panels[id].hidden = !selected;
    });
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
    (getFocusable(panels[tabId])[0] || closeButton).focus();
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

/**
 * "Find your perfect fit:" bar: a label plus a row of shortcut buttons. Each
 * opens the tire-finder modal on the matching tab. The catalogue is loaded
 * from /products.json once, up front.
 * @param {Element} block the perfect-fit block
 */
export default async function decorate(block) {
  const [labelRow, itemsRow] = [...block.children];
  const label = labelRow ? labelRow.querySelector('p') : null;
  if (label) label.className = 'perfect-fit-label';

  let products = [];
  try {
    const resp = await fetch(PRODUCTS_URL);
    if (resp.ok) ({ products = [] } = await resp.json());
  } catch (e) {
    products = [];
  }

  const modal = buildModal(products);

  const list = document.createElement('ul');
  list.className = 'perfect-fit-items';
  const cells = itemsRow ? [...itemsRow.children] : [];
  cells.forEach((cell, index) => {
    const tabId = (TABS[index] || TABS[0]).id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'perfect-fit-item';
    button.dataset.tab = tabId;
    while (cell.firstElementChild) button.append(cell.firstElementChild);
    button.addEventListener('click', () => modal.open(tabId, button));
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  });

  const children = label ? [label, list] : [list];
  block.replaceChildren(...children, modal.overlay);
}
