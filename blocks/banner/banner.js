import { getMetadata } from '../../scripts/aem.js';

/**
 * How the page stands in the trail: the name it gives itself, or its document
 * title minus the site suffix. Live names a page there the way its navigation
 * names it, which is not always the title.
 */
function currentLabel() {
  return getMetadata('breadcrumb')
    || (document.title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
}

/** A path segment as live names it in the trail: words, first one capitalised. */
function sectionLabel(segment) {
  const words = segment.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds the trail that sits above the band title, matching live: two steps,
 * the section the page is under and the page itself, no Home. A page at the
 * root has no section to name, and live gives it no trail.
 * @param {string} path the page's path
 * @param {string} label the current page's label
 * @returns {HTMLElement|null} the trail, or null where live shows none
 */
export function buildBreadcrumb(path, label) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const [section] = segments;

  const nav = document.createElement('nav');
  nav.className = 'banner-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');

  const root = document.createElement('li');
  const link = document.createElement('a');
  link.href = `/${section}`;
  link.textContent = sectionLabel(section);
  root.append(link);

  const current = document.createElement('li');
  const span = document.createElement('span');
  span.setAttribute('aria-current', 'page');
  span.textContent = label;
  current.append(span);

  ol.append(root, current);
  nav.append(ol);
  return nav;
}

const HEADING = 'h1, h2, h3, h4, h5, h6';

/**
 * The band's title. The heading the author wrote is the one the page keeps, so
 * the served HTML carries it. The band is the page title, so a lower rank is
 * read up to h1 the way the footer reads its group headings to h2. A cell of
 * plain text still gets a heading built from it.
 * @param {Element} row the first authored row
 * @returns {Element} the title
 */
function buildTitle(row) {
  const authored = row ? row.querySelector(HEADING) : null;
  let heading = authored;
  if (!heading || heading.tagName !== 'H1') {
    heading = document.createElement('h1');
    if (authored) {
      if (authored.id) heading.id = authored.id;
      heading.append(...authored.childNodes);
    } else if (row) {
      heading.textContent = row.textContent.trim();
    }
  }
  heading.className = 'banner-title';
  return heading;
}

/**
 * A line under the title, from the authored paragraph or the cell's own text.
 * @param {Element} row an authored row after the first
 * @returns {Element|null} the line, or null where the row is empty
 */
function buildLine(row) {
  if (!row.textContent.trim()) return null;
  let line = row.querySelector('p');
  if (!line) {
    line = document.createElement('p');
    line.textContent = row.textContent.trim();
  }
  line.className = 'banner-text';
  return line;
}

/**
 * Standalone page banner: the dark title band live opens these pages with.
 * The first authored cell is the title, an optional second cell the line
 * under it. The trail comes from the path.
 * @param {Element} block the banner block
 */
export default function decorate(block) {
  const [first, ...rest] = [...block.children];
  const heading = buildTitle(first);
  const lines = rest.map(buildLine).filter(Boolean);

  block.textContent = '';
  block.append(heading, ...lines);

  const crumb = buildBreadcrumb(window.location.pathname, currentLabel());
  if (crumb) block.prepend(crumb);
}
