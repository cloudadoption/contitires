/**
 * The tire finder opens from more than the perfect-fit bar. Live offers it in
 * the header submenu, in the footer column and on every product page, and each
 * of those is a control that opens the modal rather than a link to a page.
 * This module holds the contract those places share: mark a control with
 * `data-tire-finder="<tab>"` and a click opens the finder on that tab.
 */

// live names the same three searches differently in the header and the footer
const FINDER_TABS = {
  'by vehicle': 'vehicle',
  'by tire size': 'tire-size',
  'by tire': 'tire-size',
  'by plate': 'plate',
  'by license plate': 'plate',
};

// the product pages send this at a page the site does not have. The redirects
// sheet answers the path, so the href is left as authored.
const PRODUCT_LINK = 'a[href="/perfect-fit"]';

const SEARCH_HEADING = /^search for tire$/i;

/**
 * Marks a link as a finder trigger. The link is left in place: header.css and
 * footer.css style these lists through their `a` selectors, so a button in its
 * place paints as a raw UA button. Live marks its footer links the same way.
 * @param {Element} link the authored link
 * @param {string} tab the tab to open
 * @returns {Element} the link
 */
function toTrigger(link, tab) {
  link.dataset.tireFinder = tab;
  return link;
}

/**
 * Turns a "Search for Tire" list into finder triggers, leaving any other item
 * in the same list alone.
 * @param {Element} root the container holding the list
 * @returns {Element[]} the triggers
 */
export function markFinderTriggers(root) {
  const triggers = [];
  root.querySelectorAll('ul').forEach((list) => {
    const heading = list.previousElementSibling;
    if (!heading || !SEARCH_HEADING.test(heading.textContent.trim())) return;
    [...list.querySelectorAll('a')].forEach((link) => {
      const tab = FINDER_TABS[link.textContent.trim().toLowerCase()];
      if (tab) triggers.push(toTrigger(link, tab));
    });
  });
  return triggers;
}

/**
 * Turns the product pages' "Find your size" link into a finder trigger.
 * @param {Element} main the page main
 * @returns {Element[]} the triggers
 */
export function markProductFinderLinks(main) {
  return [...main.querySelectorAll(PRODUCT_LINK)].map((link) => toTrigger(link, 'vehicle'));
}

/**
 * Listens for clicks on finder triggers. The block is imported on the first
 * click, so a page that never opens the finder never pays for it.
 * @param {Element|Document} root the listening root
 */
export function initFinderTriggers(root = document) {
  root.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-tire-finder]');
    if (!trigger) return;
    event.preventDefault();
    const { openTireFinder } = await import('../blocks/perfect-fit/perfect-fit.js');
    openTireFinder(trigger.dataset.tireFinder, trigger);
  });
}
