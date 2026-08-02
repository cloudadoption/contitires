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
 * Aliases live's own fragment onto the section a year tab points into, so a
 * link shared from live ending `#year2021` lands where it did there. Live
 * carries the id on the section, `<section class="card-list" id="year2021">`,
 * where ours points at the pipeline's generated heading id. The alias is an
 * addition: the generated ids stay, so the authored anchors keep working.
 * @param {Element} list the tab <ul>
 */
export function aliasYearSections(list) {
  list.querySelectorAll('a[href^="#"]').forEach((a) => {
    const year = a.textContent.trim();
    if (!/^\d{4}$/.test(year)) return;
    const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    const section = target?.closest('.section');
    if (section && !section.id) section.id = `year${year}`;
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
  if (block.classList.contains('jump')) aliasYearSections(list);
}
