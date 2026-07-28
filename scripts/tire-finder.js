/**
 * The tire finder opens from more than the perfect-fit bar. Live offers it in
 * the header submenu, in the footer column and on every product page, and each
 * of those is a control that opens the modal rather than a link to a page.
 * This module holds the contract those places share: mark a control with
 * `data-tire-finder="<tab>"` and a click opens the finder on that tab. The
 * product pages get theirs from the card the hero builds, in perfect-fit.js.
 */

// live names the same three searches differently in the header and the footer
const FINDER_TABS = {
  'by vehicle': 'vehicle',
  'by tire size': 'tire-size',
  'by tire': 'tire-size',
  'by plate': 'plate',
  'by license plate': 'plate',
};

const SEARCH_HEADING = /^search for tire$/i;

/**
 * Turns an authored link into a finder trigger. The control opens the finder
 * where it stands and navigates nowhere, so it is a button, as live's own is.
 * Whatever the page draws the link as comes with it, so a trigger standing
 * among CTAs keeps its pill.
 * @param {Element} link the authored link
 * @param {string} tab the tab to open
 * @returns {Element} the trigger
 */
export function toFinderTrigger(link, tab) {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.dataset.tireFinder = tab;
  if (link.className) trigger.className = link.className;
  trigger.append(...link.childNodes);
  link.replaceWith(trigger);
  return trigger;
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
      if (tab) triggers.push(toFinderTrigger(link, tab));
    });
  });
  return triggers;
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
