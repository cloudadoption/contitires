import { decorateIcons } from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/products.json?sheet=catalog';
const DEFAULT_PAGE_SIZE = 10;
const SUPPORT_PHONE = '800-847-3349';

/**
 * The three filter groups live renders, with the operator live applies inside
 * each one. Checked Vehicle Type boxes are intersected; Driving Condition and
 * Weather Condition are unioned. The groups are always intersected with each
 * other. Verified against live's own result counts.
 */
export const FACET_GROUPS = [
  {
    key: 'vehicle',
    legend: 'Vehicle Type',
    operator: 'and',
    labels: ['Fleet', 'Passenger', 'Crossover', 'Light Truck/SUV', 'Original Equipment'],
  },
  {
    key: 'condition',
    legend: 'Driving Condition',
    operator: 'or',
    labels: ['Ultra-High Performance', 'Touring', 'All-Terrain'],
  },
  {
    key: 'weather',
    legend: 'Weather Condition',
    operator: 'or',
    labels: ['All-Season', 'All-Weather', 'Summer', 'Winter'],
  },
];

const SORTS = [
  { key: 'featured', label: 'Featured', legacy: 'field_weight_value' },
  { key: 'rating', label: 'Highest rated', legacy: 'field_bv_overall_value' },
  { key: 'az', label: 'A-Z', legacy: 'title' },
];

/** Drupal term ids, so the deep links live hands out keep working. */
const LEGACY_TERMS = {
  'tire_[154]': 'Fleet',
  'tire_[11]': 'Passenger',
  'tire_[141]': 'Crossover',
  'tire_[10]': 'Light Truck/SUV',
  'tire_[9]': 'Original Equipment',
  'tire_category_conditions[13]': 'Ultra-High Performance',
  'tire_category_conditions[14]': 'Touring',
  'tire_category_conditions[84]': 'All-Terrain',
  'tire_category_weather[134]': 'All-Season',
  'tire_category_weather[155]': 'All-Weather',
  'tire_category_weather[135]': 'Summer',
  'tire_category_weather[136]': 'Winter',
};

const ALL_LABELS = FACET_GROUPS.flatMap((group) => group.labels);
const groupOf = (label) => FACET_GROUPS.find((group) => group.labels.includes(label));
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const labelBySlug = new Map(ALL_LABELS.map((label) => [slugify(label), label]));

// badge label -> icon file in /icons. "Electric Vehicles" is a badge live shows
// on 39 of 46 tires without giving it a checkbox, so it is here but not a facet.
const BADGE_ICONS = Object.fromEntries(
  [...ALL_LABELS, 'Electric Vehicles'].map((label) => [label, `badge-${slugify(label)}`]),
);

const emptySelection = () => Object.fromEntries(FACET_GROUPS.map((group) => [group.key, []]));

/** An icon span for decorateIcons to fill in from /icons. */
function icon(name) {
  const span = document.createElement('span');
  span.className = `icon icon-${name}`;
  return span;
}

/** Splits a ", "-delimited sheet cell, tolerating a missing space or a trailing comma. */
const splitList = (value) => String(value ?? '').split(',').map((part) => part.trim()).filter(Boolean);

/**
 * Reads the authored config off the block, by cell shape rather than position:
 * a cell starting with "/" is the catalog source, an all-digits cell is the page
 * size, anything else is a facet to pre-select. Every cell is optional.
 * @param {Element} block the tire-listing block
 * @returns {{source: string, pageSize: number, facet: string}}
 */
export function parseConfig(block) {
  const config = { source: DEFAULT_SOURCE, pageSize: DEFAULT_PAGE_SIZE, facet: '' };
  [...block.querySelectorAll(':scope > div > div')]
    .map((cell) => cell.textContent.trim())
    .filter(Boolean)
    .forEach((text) => {
      if (text.startsWith('/')) config.source = text;
      else if (/^\d+$/.test(text)) config.pageSize = Number(text);
      else config.facet = text;
    });
  return config;
}

/**
 * Normalizes catalog sheet rows. `bestFor` carries both the badges a card shows
 * and, for the labels that are facets, which filter groups the tire belongs to.
 * @param {Object|Array} sheet the sheet response, or its data array
 * @returns {Array<Object>} normalized rows
 */
export function parseRows(sheet) {
  const rows = Array.isArray(sheet) ? sheet : (sheet?.data ?? []);
  return rows.map((row) => {
    const badges = splitList(row.bestFor);
    const facets = Object.fromEntries(FACET_GROUPS.map(
      (group) => [group.key, badges.filter((badge) => group.labels.includes(badge))],
    ));
    const promo = String(row.promo ?? '').trim();
    const name = String(row.name ?? '').trim();
    return {
      slug: String(row.slug ?? '').trim(),
      name,
      nameHtml: String(row.nameHtml ?? '').trim() || name,
      path: String(row.path ?? '').trim(),
      image: String(row.image ?? '').trim(),
      description: String(row.description ?? '').trim(),
      badges,
      facets,
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviews, 10) || 0,
      // parseFloat, not Number: the sheet serves an unweighted row as '', and
      // Number('') is 0, which would sort it first instead of last
      weight: parseFloat(row.weight),
      isNew: !/^(|false|no|0)$/i.test(String(row.isNew ?? '').trim()),
      promo: promo ? { text: promo, href: String(row.promoPath ?? '').trim() } : null,
    };
  });
}

/**
 * Applies a facet selection, matching live: intersect inside Vehicle Type,
 * union inside the other two groups, intersect across groups.
 * @param {Array<Object>} rows normalized rows
 * @param {Object} selection facet labels picked per group key
 * @returns {Array<Object>}
 */
export function filterRows(rows, selection = {}) {
  return rows.filter((row) => FACET_GROUPS.every((group) => {
    const picked = (selection[group.key] || []).filter((label) => group.labels.includes(label));
    if (!picked.length) return true;
    const has = row.facets[group.key] || [];
    return group.operator === 'and'
      ? picked.every((label) => has.includes(label))
      : picked.some((label) => has.includes(label));
  }));
}

/**
 * Sorts a copy of the rows. Every sort ends on the name, so the order is total
 * and a row can never move between pages.
 * @param {Array<Object>} rows normalized rows
 * @param {string} key one of featured, rating, az
 * @returns {Array<Object>} a new array
 */
export function sortRows(rows, key) {
  const byName = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'en');
  const weightOf = (row) => (Number.isNaN(row.weight) ? Infinity : row.weight);
  const comparators = {
    featured: (a, b) => weightOf(a) - weightOf(b) || byName(a, b),
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews
      || weightOf(a) - weightOf(b) || byName(a, b),
    az: byName,
  };
  return [...rows].sort(comparators[key] || comparators.featured);
}

/**
 * Cuts rows into a page, clamping a page number outside the range.
 * @param {Array<Object>} rows the rows to page over
 * @param {number} page the requested 1-based page
 * @param {number} pageSize rows per page
 * @returns {{page: number, pageCount: number, total: number, first: number,
 *   last: number, items: Array<Object>}}
 */
export function paginate(rows, page, pageSize) {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return {
    page: current,
    pageCount,
    total,
    first: total ? start + 1 : 0,
    last: start + items.length,
    items,
  };
}

/**
 * Reads listing state out of a query string. Understands both the readable
 * params this block writes and the Drupal term-id params live deep-links with.
 * @param {string} search a location.search value
 * @returns {{selection: Object, sort: string, page: number}}
 */
export function stateFromSearch(search) {
  const params = new URLSearchParams(search);
  const selection = emptySelection();
  const legacy = [...params.keys()].some((key) => key.startsWith('tire_') || key === 'sort_by');

  if (legacy) {
    params.forEach((value, key) => {
      const label = LEGACY_TERMS[key];
      if (label) selection[groupOf(label).key].push(label);
    });
  } else {
    FACET_GROUPS.forEach((group) => {
      splitList(params.get(group.key)).forEach((slug) => {
        const label = labelBySlug.get(slug);
        if (label && groupOf(label).key === group.key) selection[group.key].push(label);
      });
    });
  }

  const sortParam = legacy ? params.get('sort_by') : params.get('sort');
  const sort = SORTS.find((s) => (legacy ? s.legacy : s.key) === sortParam);
  // live's page param is zero-based, ours is one-based
  const page = parseInt(params.get('page'), 10);
  return {
    selection,
    sort: sort ? sort.key : SORTS[0].key,
    page: Number.isNaN(page) ? 1 : Math.max(1, legacy ? page + 1 : page),
  };
}

/**
 * Writes listing state as a query string, omitting anything at its default.
 * @param {{selection: Object, sort: string, page: number}} state
 * @returns {string} a leading-"?" query string, or '' when everything is default
 */
export function searchFromState({ selection = {}, sort = SORTS[0].key, page = 1 } = {}) {
  const parts = FACET_GROUPS
    .filter((group) => (selection[group.key] || []).length)
    .map((group) => `${group.key}=${selection[group.key].map(slugify).join(',')}`);
  if (sort !== SORTS[0].key) parts.push(`sort=${sort}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Builds a product name for display, keeping the superscript ten of the live
 * names carry and dropping every other tag, since the name comes from a sheet.
 * @param {string} html the authored name markup
 * @returns {DocumentFragment}
 */
export function renderName(html) {
  const fragment = document.createDocumentFragment();
  const parsed = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  const copy = (source, target) => {
    [...source.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SUP') {
          const sup = document.createElement('sup');
          copy(node, sup);
          target.append(sup);
        } else {
          copy(node, target);
        }
      }
    });
  };
  copy(parsed.body, fragment);
  return fragment;
}

/** A five-star widget filled to the rating, plus the count, plus a text equivalent. */
function ratingWidget(row) {
  const wrapper = document.createElement('p');
  wrapper.className = 'tire-listing-rating';

  const stars = document.createElement('span');
  stars.className = 'tire-listing-stars';
  stars.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  fill.className = 'tire-listing-stars-fill';
  fill.style.width = `${(Math.min(Math.max(row.rating, 0), 5) / 5) * 100}%`;
  stars.append(fill);

  const count = document.createElement('span');
  count.className = 'tire-listing-reviews';
  count.setAttribute('aria-hidden', 'true');
  count.textContent = `${row.reviews} ${row.reviews === 1 ? 'Review' : 'Reviews'}`;

  const text = document.createElement('span');
  text.className = 'sr-only';
  text.textContent = `Rated ${row.rating} out of 5 from ${row.reviews} reviews`;

  wrapper.append(stars, count, text);
  return wrapper;
}

/** One result card, mirroring live's tire-teaser. */
function buildCard(row) {
  const card = document.createElement('li');
  card.className = 'tire-listing-card';

  if (row.promo) {
    const flag = document.createElement(row.promo.href ? 'a' : 'span');
    flag.className = 'tire-listing-promo';
    if (row.promo.href) flag.href = row.promo.href;
    flag.textContent = row.promo.text;
    card.append(flag);
  }

  const media = document.createElement('div');
  media.className = 'tire-listing-card-media';
  const mediaLink = document.createElement('a');
  mediaLink.href = row.path;
  mediaLink.tabIndex = -1;
  mediaLink.setAttribute('aria-hidden', 'true');
  if (row.image) {
    const img = document.createElement('img');
    img.src = row.image;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 220;
    img.height = 220;
    mediaLink.append(img);
  }
  media.append(mediaLink);

  const body = document.createElement('div');
  body.className = 'tire-listing-card-body';

  const title = document.createElement('h3');
  title.className = 'tire-listing-card-title';
  const titleLink = document.createElement('a');
  titleLink.href = row.path;
  if (row.isNew) {
    const flag = document.createElement('span');
    flag.className = 'tire-listing-new';
    flag.textContent = 'New';
    titleLink.append(flag);
  }
  const nameSpan = document.createElement('span');
  nameSpan.append(renderName(row.nameHtml));
  titleLink.append(nameSpan);
  title.append(titleLink);

  const badges = document.createElement('ul');
  badges.className = 'tire-listing-badges';
  row.badges.forEach((label) => {
    const item = document.createElement('li');
    item.className = 'tire-listing-badge';
    if (BADGE_ICONS[label]) item.append(icon(BADGE_ICONS[label]));
    const text = document.createElement('span');
    text.className = 'tire-listing-badge-label';
    text.textContent = label;
    item.append(text);
    badges.append(item);
  });

  const description = document.createElement('p');
  description.className = 'tire-listing-card-desc';
  description.textContent = row.description;

  const cta = document.createElement('a');
  cta.className = 'tire-listing-cta button secondary';
  cta.href = row.path;
  cta.append('See Details');
  const ctaFor = document.createElement('span');
  ctaFor.className = 'sr-only';
  ctaFor.textContent = ` for ${row.name}`;
  cta.append(ctaFor);

  body.append(title, ratingWidget(row), badges, description, cta);
  card.append(media, body);
  return card;
}

/** The three checkbox groups. Built once and never re-rendered, so focus survives. */
function buildFilters(onChange, onReset) {
  const form = document.createElement('form');
  form.className = 'tire-listing-filters';
  form.addEventListener('submit', (e) => e.preventDefault());

  const heading = document.createElement('h2');
  heading.id = 'tire-listing-filters-title';
  heading.textContent = 'Filter Tires By';
  form.append(heading);

  FACET_GROUPS.forEach((group) => {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.legend;
    const list = document.createElement('ul');
    group.labels.forEach((label) => {
      const item = document.createElement('li');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = label;
      input.id = `tire-listing-${group.key}-${slugify(label)}`;
      input.addEventListener('change', onChange);
      const text = document.createElement('label');
      text.htmlFor = input.id;
      text.textContent = label;
      item.append(input, text);
      list.append(item);
    });
    fieldset.append(legend, list);
    form.append(fieldset);
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'tire-listing-reset';
  reset.append(icon('reset'), 'Reset filter');
  reset.addEventListener('click', onReset);

  const apply = document.createElement('button');
  apply.type = 'button';
  apply.className = 'tire-listing-apply button primary';
  apply.textContent = 'Apply';

  form.append(reset, apply);
  return form;
}

/** The results header: count, print, sort. */
function buildHeader(onSort) {
  const header = document.createElement('div');
  header.className = 'tire-listing-header';

  const status = document.createElement('div');
  status.className = 'tire-listing-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const count = document.createElement('h2');
  count.className = 'tire-listing-count';
  count.tabIndex = -1;
  status.append(count);

  const tools = document.createElement('div');
  tools.className = 'tire-listing-tools';

  const print = document.createElement('button');
  print.type = 'button';
  print.className = 'tire-listing-print';
  print.append(icon('print'), 'Print results');
  print.addEventListener('click', () => window.print());

  const sortWrap = document.createElement('div');
  sortWrap.className = 'tire-listing-sort';
  const sortLabel = document.createElement('label');
  sortLabel.htmlFor = 'tire-listing-sort';
  sortLabel.textContent = 'Sort by:';
  const select = document.createElement('select');
  select.id = 'tire-listing-sort';
  SORTS.forEach(({ key, label }) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = label;
    select.append(option);
  });
  select.addEventListener('change', onSort);
  sortWrap.append(sortLabel, select);

  tools.append(print, sortWrap);
  header.append(status, tools);
  return header;
}

/** The pager: live's summary line plus numbered pages. */
function buildPager(view, onPage) {
  const pager = document.createElement('div');
  pager.className = 'tire-listing-pager';

  const summary = document.createElement('p');
  summary.className = 'tire-listing-summary';
  const range = document.createElement('b');
  range.textContent = `${view.first}-${view.last}`;
  summary.append(range, ` of ${view.total} results`);
  pager.append(summary);

  if (view.pageCount < 2) return pager;

  const nav = document.createElement('nav');
  nav.className = 'tire-listing-pages';
  nav.setAttribute('aria-label', 'Pagination');
  const link = (page, text, extraClass = '') => {
    const a = document.createElement('a');
    a.className = `tire-listing-page${extraClass}`;
    a.href = '#';
    a.dataset.page = page;
    a.textContent = text;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      onPage(page);
    });
    return a;
  };

  if (view.page > 1) nav.append(link(view.page - 1, 'Prev'));
  for (let page = 1; page <= view.pageCount; page += 1) {
    if (page === view.page) {
      const current = document.createElement('span');
      current.className = 'tire-listing-page tire-listing-page-active';
      current.setAttribute('aria-current', 'page');
      current.textContent = page;
      nav.append(current);
    } else {
      nav.append(link(page, page));
    }
  }
  if (view.page < view.pageCount) nav.append(link(view.page + 1, 'Next'));

  pager.append(nav);
  return pager;
}

/** Live's no-results card. */
function buildEmpty(onReset) {
  const empty = document.createElement('div');
  empty.className = 'tire-listing-empty';

  const heading = document.createElement('p');
  heading.className = 'tire-listing-empty-title';
  heading.textContent = 'No match found.';

  const body = document.createElement('p');
  body.append('Call and we\'ll see if we can help. ');
  const phone = document.createElement('a');
  phone.href = `tel:${SUPPORT_PHONE}`;
  phone.textContent = SUPPORT_PHONE;
  body.append(phone);

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'tire-listing-empty-reset button secondary';
  reset.textContent = 'Reset filter';
  reset.addEventListener('click', onReset);

  empty.append(heading, body, reset);
  return empty;
}

/**
 * Tire listing: the filterable tire catalog behind /tires and the category
 * pages under it. One fetch of the catalog sheet, then every filter, sort and
 * page change is local. State lives in the URL, so a filtered listing can be
 * linked and the browser's Back button works.
 * @param {Element} block the tire-listing block
 */
export default async function decorate(block) {
  const { source, pageSize, facet } = parseConfig(block);

  let rows = [];
  try {
    const response = await fetch(source);
    if (response.ok) rows = parseRows(await response.json());
  } catch (e) {
    rows = [];
  }
  if (!rows.length) {
    block.textContent = '';
    return;
  }

  const state = stateFromSearch(window.location.search);
  // a category page pre-selects its facet, unless the URL already says otherwise
  const preset = ALL_LABELS.find((label) => label.toLowerCase() === facet.toLowerCase());
  if (preset && !FACET_GROUPS.some((group) => state.selection[group.key].length)) {
    state.selection[groupOf(preset).key] = [preset];
  }

  const cards = document.createElement('ul');
  cards.className = 'tire-listing-cards';
  const pagerSlot = document.createElement('div');
  pagerSlot.className = 'tire-listing-pager-slot';

  // assigned below; render needs it for the empty state, it needs render back
  let onReset = () => {};

  let rendered = false;
  const render = () => {
    const matched = sortRows(filterRows(rows, state.selection), state.sort);
    const view = paginate(matched, state.page, pageSize);
    state.page = view.page;

    block.querySelector('.tire-listing-count').textContent = `${view.total} ${view.total === 1 ? 'Result' : 'Results'}`;
    cards.replaceChildren(...view.items.map(buildCard));
    pagerSlot.replaceChildren(view.total ? buildPager(view, (page) => {
      state.page = page;
      render();
      block.querySelector('.tire-listing-count').focus();
    }) : buildEmpty(() => onReset()));
    decorateIcons(cards);

    // the first render only normalizes the URL, so Back still leaves the page
    const url = `${window.location.pathname}${searchFromState(state)}`;
    if (rendered) window.history.pushState({}, '', url);
    else window.history.replaceState({}, '', url);
    rendered = true;
  };

  const onChange = () => {
    const checked = [...block.querySelectorAll('.tire-listing-filters input:checked')]
      .map((input) => input.value);
    FACET_GROUPS.forEach((group) => {
      state.selection[group.key] = checked.filter((label) => group.labels.includes(label));
    });
    state.page = 1;
    render();
  };

  onReset = () => {
    block.querySelectorAll('.tire-listing-filters input:checked').forEach((input) => {
      input.checked = false;
    });
    state.selection = emptySelection();
    state.sort = SORTS[0].key;
    state.page = 1;
    block.querySelector('.tire-listing-sort select').value = state.sort;
    render();
  };

  const onSort = (event) => {
    state.sort = event.target.value;
    state.page = 1;
    render();
  };

  const filters = buildFilters(onChange, onReset);
  const header = buildHeader(onSort);

  const panel = document.createElement('div');
  panel.className = 'tire-listing-panel';
  panel.append(filters);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'tire-listing-toggle button secondary';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'tire-listing-panel');
  toggle.textContent = 'Show filter';
  panel.id = 'tire-listing-panel';

  const side = document.createElement('aside');
  side.className = 'tire-listing-side';
  side.append(toggle, panel);

  const results = document.createElement('div');
  results.className = 'tire-listing-results';
  results.append(header, cards, pagerSlot);

  const layout = document.createElement('div');
  layout.className = 'tire-listing-layout';
  layout.append(side, results);
  block.replaceChildren(layout);

  // restore the state the URL asked for, now that the controls exist
  FACET_GROUPS.forEach((group) => state.selection[group.key].forEach((label) => {
    const input = filters.querySelector(`input[value="${label}"]`);
    if (input) input.checked = true;
  }));
  header.querySelector('select').value = state.sort;

  const closeFilters = () => {
    block.classList.remove('tire-listing-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.removeProperty('overflow');
    toggle.focus();
  };
  toggle.addEventListener('click', () => {
    block.classList.add('tire-listing-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    panel.querySelector('input').focus();
  });
  panel.querySelector('.tire-listing-apply').addEventListener('click', closeFilters);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && block.classList.contains('tire-listing-open')) closeFilters();
  });

  window.addEventListener('popstate', () => {
    const next = stateFromSearch(window.location.search);
    state.selection = next.selection;
    state.sort = next.sort;
    state.page = next.page;
    filters.querySelectorAll('input').forEach((input) => {
      input.checked = (state.selection[groupOf(input.value).key] || []).includes(input.value);
    });
    header.querySelector('select').value = state.sort;
    render();
  });

  render();
  decorateIcons(block);
}
