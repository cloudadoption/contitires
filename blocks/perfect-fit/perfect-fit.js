/**
 * "Find your perfect fit:" bar plus its tire-finder modal. The bar's three
 * items open the modal on a matching tab (By Vehicle / By Tire Size / By
 * Plate); each tab is a simple, non-functional sample search form.
 */

const TABS = [
  { id: 'vehicle', label: 'By Vehicle' },
  { id: 'tire-size', label: 'By Tire Size' },
  { id: 'plate', label: 'By Plate' },
];

function range(start, end, step = 1) {
  const values = [];
  for (let n = start; n <= end; n += step) values.push(n);
  return values;
}

const YEARS = range(2015, 2026).reverse();
const MAKES = ['Chevrolet', 'Ford', 'Toyota', 'BMW', 'Honda'];
const WIDTHS = range(185, 315, 10);
const ASPECT_RATIOS = range(40, 75, 5);
const RIM_DIAMETERS = range(15, 22);
const STATES = ['California', 'Florida', 'Illinois', 'New York', 'Ohio', 'Texas'];

/**
 * Builds a labelled `<select>` or `<input>` field.
 * @returns {{ wrapper: Element, field: Element }}
 */
function createField(tag, id, labelText) {
  const wrapper = document.createElement('div');
  wrapper.className = 'perfect-fit-field';
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  const field = document.createElement(tag);
  field.id = id;
  field.name = id;
  wrapper.append(label, field);
  return { wrapper, field };
}

/** Fills a `<select>` with a disabled placeholder plus one option per value. */
function populateSelect(select, values, placeholder) {
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  select.append(placeholderOption, ...values.map((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    return option;
  }));
}

function buildSearchButton() {
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  button.textContent = 'Search';
  return button;
}

function buildForm(fields) {
  const form = document.createElement('form');
  form.className = 'perfect-fit-form';
  form.action = '/tires';
  form.append(...fields, buildSearchButton());
  return form;
}

function buildVehicleForm() {
  const year = createField('select', 'perfect-fit-year', 'Year');
  populateSelect(year.field, YEARS, 'Select year');
  const make = createField('select', 'perfect-fit-make', 'Make');
  populateSelect(make.field, MAKES, 'Select make');
  const model = createField('select', 'perfect-fit-model', 'Model');
  populateSelect(model.field, [], 'Select...');
  const trim = createField('select', 'perfect-fit-trim', 'Trim');
  populateSelect(trim.field, [], 'Select...');
  return buildForm([year.wrapper, make.wrapper, model.wrapper, trim.wrapper]);
}

function buildTireSizeForm() {
  const width = createField('select', 'perfect-fit-width', 'Width');
  populateSelect(width.field, WIDTHS, 'Select width');
  const aspectRatio = createField('select', 'perfect-fit-aspect-ratio', 'Aspect Ratio');
  populateSelect(aspectRatio.field, ASPECT_RATIOS, 'Select ratio');
  const rim = createField('select', 'perfect-fit-rim', 'Rim Diameter');
  populateSelect(rim.field, RIM_DIAMETERS, 'Select diameter');
  return buildForm([width.wrapper, aspectRatio.wrapper, rim.wrapper]);
}

function buildPlateForm() {
  const plate = createField('input', 'perfect-fit-plate', 'License Plate');
  plate.field.type = 'text';
  plate.field.autocomplete = 'off';
  const state = createField('select', 'perfect-fit-state', 'State');
  populateSelect(state.field, STATES, 'Select state');
  return buildForm([plate.wrapper, state.wrapper]);
}

/** Keyboard-focusable elements in `container`, ignoring hidden tab panels. */
function getFocusable(container) {
  const candidates = [...container.querySelectorAll('button, input, select, textarea')];
  return candidates.filter((el) => (
    !el.disabled && el.tabIndex !== -1 && !el.closest('[hidden]')
  ));
}

/**
 * Builds the tire-finder modal (overlay, tabs, one form per tab) and wires
 * its interactions. Detached from the DOM; the caller appends `overlay`.
 * @returns {{ overlay: Element, open: Function }}
 */
function buildModal() {
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

  const forms = {
    vehicle: buildVehicleForm,
    'tire-size': buildTireSizeForm,
    plate: buildPlateForm,
  };
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
    panel.append(forms[id]());
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
    const focusable = getFocusable(panels[tabId]);
    (focusable[0] || closeButton).focus();
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  dialog.addEventListener('submit', (event) => event.preventDefault());
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

  TABS.forEach(({ id }) => {
    tabs[id].addEventListener('click', () => switchTab(id));
  });
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
 * "Find your perfect fit:" bar: a label followed by a row of icon+label
 * shortcut buttons. Each button opens the tire-finder modal on the matching
 * tab. Authoring is unchanged: first row is the label, second row's cells
 * are the items.
 * @param {Element} block the perfect-fit block
 */
export default function decorate(block) {
  const [labelRow, itemsRow] = [...block.children];

  const label = labelRow ? labelRow.querySelector('p') : null;
  if (label) label.className = 'perfect-fit-label';

  const modal = buildModal();

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
