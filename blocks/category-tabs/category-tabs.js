/**
 * Marks the tab whose href matches the current path as the active category,
 * matching live's highlighted tab on a category page.
 * @param {Element} list the tab <ul>
 * @param {string} currentPath the current page path
 */
export function markActive() {}

/**
 * Category tab bar: a horizontal, scrollable row of section links. The
 * authored list is reused as-is; this tags it for styling and highlights the
 * current category.
 * @param {Element} block the category-tabs block
 */
export default function decorate(block) {
  const list = block.querySelector('ul');
  if (list) list.classList.add('category-tabs-list');
}
