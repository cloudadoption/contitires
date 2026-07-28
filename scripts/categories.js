/*
 * The learn categories.
 *
 * An article carries one of these as its Category metadata, and a listing
 * filters the query index by the same string. The two ends are free text in DA,
 * so a typo at either end drops articles out of a page that still looks
 * finished. This is the list both ends are read against, by the article-cards
 * block at render time and by tools/authoring-check.mjs over the index.
 *
 * Adding a category means a row here and a page at its path, and the tab bar on
 * /learn wants a link to it. Issue #124.
 */

/** Every category an article can carry, and the page that lists it. */
export const CATEGORIES = [
  { name: 'Tire Tips', path: '/learn/tips' },
  { name: 'Technology', path: '/learn/technology' },
  { name: 'News', path: '/learn/news-and-events' },
];

/** The names alone, in the order the hub bands take them. */
export function categoryNames() {
  return CATEGORIES.map((category) => category.name);
}

/**
 * Whether a category is one a page publishes under. Empty is known: a band that
 * names no category asks for every article. The comparison ignores case and
 * surrounding space, the way the listing's own filter does.
 * @param {string} name the category as it was authored
 * @returns {boolean}
 */
export function isKnownCategory(name) {
  const wanted = String(name || '').trim().toLowerCase();
  if (!wanted) return true;
  return CATEGORIES.some((category) => category.name.toLowerCase() === wanted);
}
