import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import {
  PER_PAGE, search as searchIndex, queryTerms, stem,
} from '../../scripts/search.js';

const DEFAULT_SOURCE = '/query-index.json';

/** where an image the index holds as a Drupal path is served from */
const LIVE_ORIGIN = 'https://continentaltire.com';

/** words kept either side of a match, and how many snippets an excerpt holds */
const SNIPPET_WORDS = 8;
const MAX_SNIPPETS = 3;

/** page numbers the pager shows at once, as live shows them */
const PAGER_WINDOW = 9;
const ELLIPSIS = '…';

/** Drops the " | Continental Tire" suffix every indexed title carries. */
function cleanTitle(title) {
  return (title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
}

/**
 * The query and page live's URL carries.
 * @param {string} search a location search string
 * @returns {{query: string, page: number}} the query, and the zero-based page
 */
export function readParams(search) {
  const params = new URLSearchParams(search);
  const query = (params.get('keywords') || params.get('q') || '').trim();
  const page = parseInt(params.get('page'), 10);
  return { query, page: page > 0 ? page : 0 };
}

/**
 * The URL of one page of results, as live writes it.
 * @param {string} query the raw query
 * @param {number} page the zero-based page
 * @returns {string} a search string, with the first page left implicit
 */
export function pageUrl(query, page) {
  const params = new URLSearchParams({ keywords: query });
  if (page > 0) params.set('page', page);
  return `?${params}`;
}

/**
 * A body snippet around each match, the way live's highlighted excerpt reads.
 * Returns segments rather than markup, so the caller builds text nodes and an
 * indexed tag cannot become an element.
 * @param {string} text the text to excerpt
 * @param {string[]} terms the stemmed query terms
 * @returns {{text: string, mark: boolean}[]} the segments, empty when nothing matched
 */
export function excerpt(text, terms) {
  const source = String(text || '');
  const words = [...source.matchAll(/[a-z0-9]+/gi)];
  const wanted = new Set(terms);
  const hits = words
    .map((word, i) => (wanted.has(stem(word[0].toLowerCase())) ? i : -1))
    .filter((i) => i >= 0);
  if (!hits.length) return [];

  // merge the windows around neighboring hits, then keep the first few
  const ranges = [];
  hits.forEach((hit) => {
    const from = Math.max(0, hit - SNIPPET_WORDS);
    const to = Math.min(words.length - 1, hit + SNIPPET_WORDS);
    const last = ranges[ranges.length - 1];
    if (last && from <= last.to + 1) {
      last.to = Math.max(last.to, to);
      last.hits.push(hit);
    } else ranges.push({ from, to, hits: [hit] });
  });
  const kept = [];
  ranges.some((range) => {
    const room = MAX_SNIPPETS - kept.reduce((sum, r) => sum + r.hits.length, 0);
    if (room <= 0) return true;
    kept.push({ ...range, hits: range.hits.slice(0, room) });
    return false;
  });

  const segments = [];
  const push = (value, mark = false) => {
    if (!value) return;
    const last = segments[segments.length - 1];
    if (last && last.mark === mark) last.text += value;
    else segments.push({ text: value, mark });
  };
  const start = (i) => words[i].index;
  const end = (i) => words[i].index + words[i][0].length;

  kept.forEach((range, i) => {
    const opening = i === 0 ? range.from > 0 : true;
    if (opening) push(`${ELLIPSIS} `);
    let at = start(range.from);
    range.hits.forEach((hit) => {
      push(source.slice(at, start(hit)));
      push(words[hit][0], true);
      at = end(hit);
    });
    push(source.slice(at, end(Math.max(range.to, range.hits[range.hits.length - 1]))));
    if (i === kept.length - 1 && range.to < words.length - 1) push(` ${ELLIPSIS}`);
    else if (i < kept.length - 1) push(' ');
  });
  return segments;
}

/** The form live puts above its results, so a viewer can search again. */
function buildForm(query) {
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('action', '/search');
  form.setAttribute('method', 'get');

  const label = document.createElement('label');
  label.setAttribute('for', 'search-keywords');
  label.textContent = 'Site search';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'search-keywords';
  input.name = 'keywords';
  input.value = query;
  input.placeholder = 'Site search';
  input.required = true;

  const submit = document.createElement('button');
  submit.type = 'submit';
  // the icon carries the button below 600px, the label above it
  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  const caption = document.createElement('span');
  caption.className = 'search-form-label';
  caption.textContent = 'Search';
  submit.append(icon, caption);

  form.append(label, input, submit);
  decorateIcons(form);
  return form;
}

/** Drops the heading the indexed body repeats, so an excerpt starts at the text. */
function bodyText(row) {
  const body = String(row.body || '').trim();
  const title = cleanTitle(row.title);
  if (title && body.toLowerCase().startsWith(title.toLowerCase())) {
    return body.slice(title.length).trim();
  }
  return body;
}

/**
 * The thumbnail for a row, or null when it has none worth showing. An image the
 * index holds as a Drupal path is served by the live host, as it is everywhere
 * else in this POC; anything else is one of ours and gets optimized.
 */
function thumbnail(src) {
  if (!src || src.includes('/default-meta-image')) return null;
  if (src.startsWith('/sites/')) {
    const img = document.createElement('img');
    img.src = `${LIVE_ORIGIN}${src}`;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 152;
    img.height = 114;
    return img;
  }
  return createOptimizedPicture(src, '', false, [{ width: '750' }]);
}

/** One result: title link, optional 4:3 thumbnail, highlighted excerpt. */
function buildResult(row, terms) {
  const item = document.createElement('li');
  const article = document.createElement('article');
  article.className = 'search-result';

  const heading = document.createElement('h2');
  heading.className = 'search-result-title';
  const link = document.createElement('a');
  link.href = row.path;
  link.textContent = cleanTitle(row.title);
  heading.append(link);

  const content = document.createElement('div');
  content.className = 'search-result-content';

  const image = thumbnail(row.image);
  if (image) {
    const figure = document.createElement('div');
    figure.className = 'search-result-image';
    const thumb = document.createElement('a');
    thumb.href = row.path;
    thumb.setAttribute('tabindex', '-1');
    thumb.setAttribute('aria-hidden', 'true');
    thumb.append(image);
    figure.append(thumb);
    content.append(figure);
  }

  const summary = document.createElement('div');
  summary.className = 'search-result-excerpt';
  const body = excerpt(bodyText(row), terms);
  const segments = body.length ? body : excerpt(row.description, terms);
  if (segments.length) {
    segments.forEach(({ text, mark }) => {
      if (!mark) summary.append(text);
      else {
        const strong = document.createElement('strong');
        strong.textContent = text;
        summary.append(strong);
      }
    });
  } else summary.textContent = row.description || '';
  content.append(summary);

  article.append(heading, content);
  item.append(article);
  return item;
}

/** "1-10 of 24 results", then the numbered pages when there is more than one. */
function buildPager(query, { total, page, pages }) {
  const pager = document.createElement('div');
  pager.className = 'search-pager';

  const summary = document.createElement('div');
  summary.className = 'search-pager-summary';
  const range = document.createElement('b');
  range.textContent = `${page * PER_PAGE + 1}-${Math.min(total, (page + 1) * PER_PAGE)}`;
  summary.append(range, ` of ${total} results`);
  pager.append(summary);
  if (pages < 2) return pager;

  const nav = document.createElement('nav');
  nav.className = 'search-pager-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Pagination');

  if (page > 0) {
    const prev = document.createElement('a');
    prev.className = 'search-pager-step';
    prev.href = pageUrl(query, page - 1);
    prev.rel = 'prev';
    prev.textContent = 'Prev';
    nav.append(prev);
  }

  // a window of nine numbers, centred on the current page and clamped at both ends
  const first = Math.max(0, Math.min(page - Math.floor(PAGER_WINDOW / 2), pages - PAGER_WINDOW));
  const shown = Math.min(PAGER_WINDOW, pages);
  Array.from({ length: shown }, (unused, i) => first + i).forEach((i) => {
    if (i === page) {
      const current = document.createElement('span');
      current.className = 'search-pager-page search-pager-page-active';
      current.setAttribute('aria-current', 'page');
      current.title = 'Current page';
      const hidden = document.createElement('span');
      hidden.className = 'search-pager-hidden';
      hidden.textContent = 'Current page';
      current.append(hidden, `${i + 1}`);
      nav.append(current);
      return;
    }
    const link = document.createElement('a');
    link.className = 'search-pager-page';
    link.href = pageUrl(query, i);
    link.title = `Go to page ${i + 1}`;
    link.textContent = `${i + 1}`;
    nav.append(link);
  });

  if (page < pages - 1) {
    const next = document.createElement('a');
    next.className = 'search-pager-step';
    next.href = pageUrl(query, page + 1);
    next.rel = 'next';
    next.textContent = 'Next';
    nav.append(next);
  }

  pager.append(nav);
  return pager;
}

/** Live's empty state: one line and a way back to the form. */
function buildNoResults() {
  const empty = document.createElement('div');
  empty.className = 'search-no-results';
  const heading = document.createElement('h2');
  heading.textContent = 'You have stumped us. No results.';
  const again = document.createElement('a');
  again.className = 'button';
  again.href = '/search';
  again.textContent = 'Search again';
  empty.append(heading, again);
  return empty;
}

/**
 * Fetches the index and renders one page of results into the block.
 * @param {Element} block the search block
 * @param {string} source the index path
 * @param {string} query the raw query
 * @param {number} page the zero-based page
 */
async function fillResults(block, source, query, page) {
  const results = block.querySelector('.search-results-wrapper');
  let rows = [];
  try {
    const res = await fetch(source);
    if (res.ok) ({ data: rows = [] } = await res.json());
  } catch (e) {
    rows = [];
  }

  // BYOM cannot exclude a page in the index definition, so noindex is filtered here
  const indexed = rows.filter((row) => !String(row.robots || '').toLowerCase().includes('noindex'));
  const found = searchIndex(indexed, query, page);
  if (!found.total) {
    results.replaceChildren(buildNoResults());
    return;
  }

  const terms = queryTerms(query);
  const list = document.createElement('ul');
  list.className = 'search-results';
  found.results.forEach((row) => list.append(buildResult(row, terms)));
  results.replaceChildren(list, buildPager(query, found));
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const source = block.textContent.trim() || DEFAULT_SOURCE;
  const { query, page } = readParams(window.location.search);

  const form = document.createElement('div');
  form.className = 'search-form-wrapper';
  form.append(buildForm(query));

  const status = document.createElement('div');
  status.className = 'search-status';
  if (query) {
    const term = document.createElement('b');
    term.textContent = query;
    status.append('Site results for ', term);
  }

  const results = document.createElement('div');
  results.className = 'search-results-wrapper';

  block.replaceChildren(form, status, results);
  if (!query) return;

  // the index is 172.5 KB gzip, so it is fetched once the page has painted
  const fill = () => { fillResults(block, source, query, page); };
  if (document.readyState === 'complete') setTimeout(fill, 0);
  else window.addEventListener('load', fill, { once: true });
}
