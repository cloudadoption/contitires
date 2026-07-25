/**
 * Marks the tab whose href matches the current path as the active category,
 * matching live's highlighted tab on a category page.
 * @param {Element} list the tab <ul>
 * @param {string} currentPath the current page path
 */
export function markActive(list, currentPath) {
  const here = (currentPath || '').replace(/\/$/, '');
  list.querySelectorAll('a').forEach((a) => {
    const href = new URL(a.getAttribute('href'), 'https://contitires.example').pathname.replace(/\/$/, '');
    if (href && href === here) {
      a.classList.add('category-tab-active');
      a.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Category tab bar: a horizontal, scrollable row of section links. The
 * authored list is reused as-is; this tags it for styling and highlights the
 * current category.
 * @param {Element} block the category-tabs block
 */
export default function decorate(block) {
  const list = block.querySelector('ul');
  if (!list) return;
  list.classList.add('category-tabs-list');
  markActive(list, window.location.pathname);
}
