/** The current page's short name: its document title minus the site suffix. */
function currentLabel() {
  return (document.title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
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

/**
 * Standalone page banner: the dark title band live opens these pages with.
 * The first authored cell is the title, an optional second cell the line
 * under it. The trail comes from the path.
 * @param {Element} block the banner block
 */
export default function decorate(block) {
  const [title, ...rest] = [...block.children].map((row) => row.textContent.trim());
  block.textContent = '';

  const heading = document.createElement('h1');
  heading.className = 'banner-title';
  heading.textContent = title;
  block.append(heading);

  rest.filter(Boolean).forEach((line) => {
    const p = document.createElement('p');
    p.className = 'banner-text';
    p.textContent = line;
    block.append(p);
  });

  const crumb = buildBreadcrumb(window.location.pathname, currentLabel());
  if (crumb) block.prepend(crumb);
}
