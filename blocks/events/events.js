import { decorateIcons } from '../../scripts/aem.js';

// the pill's three lines, told apart by what they hold rather than by the
// order the author wrote them in
const YEAR = /^\d{4}$/;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DATE_RANGE = new RegExp(`^(${MONTHS.join('|')})[a-z]*\\.?\\s+\\d`, 'i');

const slugify = (value) => String(value).toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const splitList = (value) => String(value ?? '').split(',').map((p) => p.trim()).filter(Boolean);

/** An icon span for decorateIcons to fill in from /icons. */
function icon(name) {
  const span = document.createElement('span');
  span.className = `icon icon-${name}`;
  return span;
}

/**
 * Reads a cell's lines. The pipeline delivers a cell holding one paragraph as
 * bare text, so give that one an element to carry.
 * @param {Element} cell The authored cell
 * @returns {Element[]} The lines that hold something
 */
function lines(cell) {
  if (!cell) return [];
  if (!cell.firstElementChild && cell.textContent.trim()) {
    const line = document.createElement('p');
    line.append(...cell.childNodes);
    cell.append(line);
  }
  return [...cell.children].filter((el) => el.textContent.trim());
}

/**
 * Builds the orange band: live's date pill over the venue. The pin is chrome,
 * so the block draws it rather than the author.
 * @param {Element} cell The authored date cell
 * @returns {Element} The band
 */
function buildDate(cell) {
  const band = document.createElement('div');
  band.className = 'events-date';
  let day;
  let year;
  let range;
  const venues = [];
  lines(cell).forEach((line) => {
    const text = line.textContent.trim();
    if (!year && YEAR.test(text)) year = line;
    else if (!day && WEEKDAYS.includes(text.toLowerCase())) day = line;
    else if (!range && DATE_RANGE.test(text)) range = line;
    else venues.push(line);
  });

  if (day || year || range) {
    const pill = document.createElement('div');
    pill.className = 'events-pill';
    if (day || year) {
      const header = document.createElement('div');
      header.className = 'events-pill-header';
      if (day) {
        day.className = 'events-day';
        header.append(day);
      }
      if (year) {
        year.className = 'events-year';
        header.append(year);
      }
      pill.append(header);
    }
    if (range) {
      range.className = 'events-range';
      pill.append(range);
    }
    band.append(pill);
  }

  venues.forEach((venue) => {
    venue.className = 'events-location';
    const pin = document.createElement('span');
    pin.className = 'icon icon-pin-outline';
    venue.prepend(pin);
    band.append(venue);
  });
  return band;
}

/**
 * Builds the detail column: the name, the description, and a footer holding
 * the category and the details link.
 * @param {Element} cell The authored detail cell
 * @param {Element} categoryCell The authored category cell
 * @returns {Element} The column
 */
function buildDetail(cell, categoryCell) {
  const detail = document.createElement('div');
  detail.className = 'events-detail';
  const parts = lines(cell);
  const name = parts.find((el) => /^H[1-6]$/.test(el.tagName));
  // a link that is all its paragraph holds is the call to action; one inside a
  // sentence stays part of the description
  const cta = parts.find((el) => {
    const link = el.querySelector('a[href]');
    return link && el.textContent.trim() === link.textContent.trim();
  });
  if (name) {
    name.classList.add('events-name');
    detail.append(name);
  }
  const body = parts.filter((el) => el !== name && el !== cta);
  if (body.length) {
    const description = document.createElement('div');
    description.className = 'events-description';
    description.append(...body);
    detail.append(description);
  }

  const [category] = lines(categoryCell);
  if (category || cta) {
    const footer = document.createElement('div');
    footer.className = 'events-footer';
    if (category) {
      category.className = 'events-category';
      footer.append(category);
    }
    if (cta) {
      cta.className = 'events-cta';
      cta.querySelector('a').classList.add('button');
      footer.append(cta);
    }
    detail.append(footer);
  }
  return detail;
}

/**
 * The month a card's pill names, read back off the pill so an author can write
 * the lines in any order. An event whose pill names no month belongs to no
 * month, and shows whenever no month is checked.
 * @param {Element} card a built card
 * @returns {{slug: string, label: string, order: number}|null}
 */
function monthOf(card) {
  const range = card.querySelector('.events-range');
  const year = card.querySelector('.events-year');
  if (!range || !year) return null;
  const month = MONTHS.indexOf(range.textContent.trim().slice(0, 3).toLowerCase());
  const number = Number(year.textContent.trim());
  if (month < 0 || !number) return null;
  return {
    slug: `${MONTHS[month]}-${number}`,
    label: `${MONTH_NAMES[month]} ${number}`,
    order: number * 12 + month,
  };
}

/**
 * The day a card's pill stops being about, read back off the pill the way the
 * month is so an author can write the lines in any order. `Aug 06-09` ends on
 * the 9th and a single day ends on itself, which is what makes a multi-day event
 * halfway through still upcoming. The separator in the authored sheet is an en
 * dash, so the day is the last number rather than anything after a hyphen, and
 * the month is the last month named, for a range crossing into the next one.
 * An event whose pill names no date cannot be shown to be over and has none.
 * @param {Element} card a built card
 * @returns {Date|null}
 */
export function endOf(card) {
  const range = card.querySelector('.events-range');
  const year = card.querySelector('.events-year');
  if (!range || !year) return null;
  const text = range.textContent.trim().toLowerCase();
  const months = [...text.matchAll(/[a-z]+/g)]
    .map((match) => MONTHS.indexOf(match[0].slice(0, 3)))
    .filter((month) => month >= 0);
  const days = text.match(/\d+/g);
  const number = Number(year.textContent.trim());
  if (!months.length || !days || !number) return null;
  // a range naming one month whose end day falls before its start day runs into
  // the next one, `Aug 29-02`. The sheet holds no such row today, and reading
  // that as Aug 2 would drop an event still going on. Month 12 rolls the year.
  const crosses = months.length === 1 && days.length > 1
    && Number(days.at(-1)) < Number(days[0]);
  return new Date(number, months.at(-1) + (crosses ? 1 : 0), Number(days.at(-1)));
}

/**
 * The filter a URL asks for. Slugs rather than labels, so the reader works
 * without the calendar in hand. Live's own parameters are Drupal term ids
 * (`event_type[162]`), which say nothing without live's taxonomy, and its
 * filter is a form rather than a set of links, so no such URL is published
 * anywhere to keep working.
 * @param {string} search the location search
 * @returns {{types: string[], months: string[]}}
 */
export function stateFromSearch(search) {
  const params = new URLSearchParams(search);
  return { types: splitList(params.get('type')), months: splitList(params.get('month')) };
}

/**
 * The search a filter has, empty when nothing is checked. Every other
 * parameter the URL arrived with is kept, so a campaign link to the calendar
 * still says where the reader came from after they check a box.
 * @param {{types: string[], months: string[]}} state the checked slugs
 * @param {string} search the search the URL already has
 * @returns {string}
 */
export function searchFromState({ types = [], months = [] } = {}, search = '') {
  const params = new URLSearchParams(search);
  params.delete('type');
  params.delete('month');
  const kept = params.toString();
  const parts = kept ? [kept] : [];
  if (types.length) parts.push(`type=${types.join(',')}`);
  if (months.length) parts.push(`month=${months.join(',')}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Live's two fieldsets, built from the calendar rather than from a vocabulary:
 * the types the events carry, alphabetically as live lists them, and the
 * months they fall in, in calendar order. Built once and never re-rendered, so
 * focus survives a change.
 * @param {Array<Object>} events the built events
 * @param {Function} onChange
 * @param {Function} onReset
 * @returns {HTMLFormElement}
 */
function buildFilter(events, onChange, onReset) {
  const types = [...new Map(events.filter((e) => e.type)
    .map((e) => [e.type.slug, e.type])).values()]
    .sort((a, b) => a.label.localeCompare(b.label));
  const months = [...new Map(events.filter((e) => e.month)
    .map((e) => [e.month.slug, e.month])).values()]
    .sort((a, b) => a.order - b.order);

  const form = document.createElement('form');
  form.className = 'events-filter';
  form.addEventListener('submit', (event) => event.preventDefault());

  const heading = document.createElement('h2');
  heading.textContent = 'Filter Events By';
  form.append(heading);

  [{ key: 'type', legend: 'Event type', options: types },
    { key: 'month', legend: 'Event Date', options: months }].forEach((group) => {
    if (!group.options.length) return;
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.legend;
    const list = document.createElement('ul');
    group.options.forEach((option) => {
      const item = document.createElement('li');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = group.key;
      input.value = option.slug;
      input.id = `events-${group.key}-${option.slug}`;
      input.addEventListener('change', onChange);
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = option.label;
      item.append(input, label);
      list.append(item);
    });
    fieldset.append(legend, list);
    form.append(fieldset);
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'events-reset';
  reset.append(icon('reset'), 'Reset filter');
  reset.addEventListener('click', onReset);

  // live's Apply posts the form; here the calendar has already moved, so this
  // one only closes the panel it opened over the page
  const apply = document.createElement('button');
  apply.type = 'button';
  apply.className = 'events-apply button primary';
  apply.textContent = 'Apply';

  form.append(reset, apply);
  return form;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'events-list';

  // midnight, so an event ending today is still on
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = [...block.children].map((row) => {
    const cells = [...row.children];
    const card = document.createElement('li');
    card.append(buildDate(cells[0]), buildDetail(cells[1], cells[2]));
    const category = card.querySelector('.events-category');
    const label = category && category.textContent.trim();
    return {
      card,
      type: label ? { slug: slugify(label), label } : null,
      month: monthOf(card),
      end: endOf(card),
    };
    // live drops an event once it is over, and the authored rows stay as they
    // are: they are the history. Dropped here rather than at render, because the
    // month facet is built from these same entries and the two have to agree
    // about what past means.
  }).filter((event) => !(event.end && event.end < today));

  events.forEach((event) => list.append(event.card));

  const state = stateFromSearch(window.location.search);

  const status = document.createElement('div');
  status.className = 'events-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const count = document.createElement('h2');
  count.className = 'events-count';
  status.append(count);

  let rendered = false;
  // a render that came FROM the history writes nothing back to it: pushing the
  // state Back just restored puts the entry straight back on the stack, and the
  // reader can never leave the page
  const render = (writeHistory = true) => {
    let left = 0;
    events.forEach((event) => {
      // a box in one fieldset is OR with its neighbours, and the two fieldsets
      // are AND, which is what live's own result counts show
      const type = !state.types.length || (event.type && state.types.includes(event.type.slug));
      const month = !state.months.length
        || (event.month && state.months.includes(event.month.slug));
      event.card.hidden = !(type && month);
      if (type && month) left += 1;
    });
    count.textContent = `${left} ${left === 1 ? 'Result' : 'Results'}`;

    if (!writeHistory) return;
    const url = `${window.location.pathname}${searchFromState(state, window.location.search)}`;
    const wasRendered = rendered;
    rendered = true;
    // a URL that already says this needs no history entry at all
    if (url === `${window.location.pathname}${window.location.search}`) return;
    // the first render only normalizes the URL, so Back still leaves the page
    if (wasRendered) window.history.pushState({}, '', url);
    else window.history.replaceState({}, '', url);
  };

  const onChange = () => {
    ['type', 'month'].forEach((key) => {
      state[`${key}s`] = [...block.querySelectorAll(`.events-filter input[name="${key}"]:checked`)]
        .map((input) => input.value);
    });
    render();
  };

  const onReset = () => {
    block.querySelectorAll('.events-filter input:checked').forEach((input) => {
      input.checked = false;
    });
    state.types = [];
    state.months = [];
    render();
  };

  const filter = buildFilter(events, onChange, onReset);

  const panel = document.createElement('div');
  panel.className = 'events-panel';
  panel.id = 'events-panel';
  panel.append(filter);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'events-toggle button secondary';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  toggle.textContent = 'Show filter';

  const side = document.createElement('aside');
  side.className = 'events-side';
  side.append(toggle, panel);

  const results = document.createElement('div');
  results.className = 'events-results';
  results.append(status, list);

  const layout = document.createElement('div');
  layout.className = 'events-layout';
  layout.append(side, results);
  block.replaceChildren(layout);

  // restore the filter the URL asked for, now that the boxes exist
  [...filter.querySelectorAll('input')].forEach((input) => {
    input.checked = state[`${input.name}s`].includes(input.value);
  });

  const close = () => {
    block.classList.remove('events-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.removeProperty('overflow');
    toggle.focus();
  };
  toggle.addEventListener('click', () => {
    block.classList.add('events-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const first = panel.querySelector('input');
    if (first) first.focus();
  });
  filter.querySelector('.events-apply').addEventListener('click', close);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && block.classList.contains('events-open')) close();
  });

  window.addEventListener('popstate', () => {
    const next = stateFromSearch(window.location.search);
    state.types = next.types;
    state.months = next.months;
    filter.querySelectorAll('input').forEach((input) => {
      input.checked = state[`${input.name}s`].includes(input.value);
    });
    render(false);
  });

  render();
  decorateIcons(block);
}
