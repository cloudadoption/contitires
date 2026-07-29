import { decorateIcons } from '../../scripts/aem.js';

// The Best for entries a product page can carry, and the badge each one draws.
// Live gives every entry a 30px line icon; the same drawings are in /icons as
// the badge-*.svg set the tire listing already uses. Every value in the
// catalog's bestFor column across the 46 products resolves here. (#241)
const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const BEST_FOR_BADGES = [
  'All-Season', 'All-Terrain', 'All-Weather', 'Crossover', 'Electric Vehicles', 'Fleet',
  'Light Truck/SUV', 'Original Equipment', 'Passenger', 'Summer', 'Touring',
  'Ultra-High Performance', 'Winter',
].reduce((map, label) => ({ ...map, [label.toLowerCase()]: `badge-${slugify(label)}` }), {});

const BEST_FOR_LABEL = /^best for$/i;

/**
 * Names the two trailing groups of the product hero column so the stylesheet
 * can rule them off, and gives each Best for entry its badge.
 *
 * Both groups are found by what stands above them rather than by position: the
 * plan summary follows the link to /warranty, the Best for list follows the
 * words. An author who writes neither gets neither.
 * @param {Element} block The block
 */
function decorateProductHero(block) {
  block.querySelectorAll('ul').forEach((list) => {
    const above = list.previousElementSibling;
    if (!above) return;

    if (above.querySelector('a[href="/warranty"]')) {
      above.classList.add('product-hero-plan-link');
      list.classList.add('product-hero-plan');
      return;
    }

    if (!BEST_FOR_LABEL.test(above.textContent.trim())) return;
    above.classList.add('product-hero-best-for-label');
    list.classList.add('product-hero-best-for');
    list.querySelectorAll(':scope > li').forEach((item) => {
      const badge = BEST_FOR_BADGES[item.textContent.trim().toLowerCase()];
      if (!badge) return;
      const icon = document.createElement('span');
      icon.className = `icon icon-${badge}`;
      item.prepend(icon);
    });
  });
  decorateIcons(block);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (block.classList.contains('product-hero')) decorateProductHero(block);
}
