const LEARN_ROOT = { href: '/learn', label: 'Learn' };

/** The current page's short name: its document title minus the site suffix. */
function currentLabel() {
  return (document.title || '').replace(/\s*\|\s*Continental Tire\s*$/i, '').trim();
}

/**
 * Builds the "Learn / <current>" breadcrumb that sits above the banner title,
 * matching live. Two steps only, no Home.
 * @param {string} label the current page's label
 * @returns {HTMLElement}
 */
export function buildBreadcrumb(label) {
  const nav = document.createElement('nav');
  nav.className = 'banner-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');

  const root = document.createElement('li');
  const link = document.createElement('a');
  link.href = LEARN_ROOT.href;
  link.textContent = LEARN_ROOT.label;
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
 * Learn banner: a centered, image-less title band with the breadcrumb above
 * the uppercase title, matching the live /learn/<category> marquee. The title
 * is authored in the block; the breadcrumb's current label comes from the
 * page title.
 * @param {Element} block the banner block
 */
export default function decorate(block) {
  const titleText = block.textContent.trim();
  block.textContent = '';

  const heading = document.createElement('h1');
  heading.className = 'banner-title';
  heading.textContent = titleText;

  block.append(buildBreadcrumb(currentLabel()), heading);
}
