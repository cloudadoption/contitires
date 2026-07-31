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
const TECHNOLOGY_LABEL = /^technology$/i;

/**
 * The rebate, on the 19 of 46 product pages live shows one. Campaign copy with
 * an end date, so it is authored rather than built and an author takes an
 * expired offer down by deleting two paragraphs.
 *
 * Live puts the flag above the title and the sentence with its Offer details
 * link under the store CTA, those two paired in a row. The link before the
 * title is the flag and the one after it opens the row, which is what tells
 * them apart. A cell with no title gets neither.
 * @param {Element} cell The hero's copy cell
 */
function decorateRebate(cell) {
  const kids = [...cell.children];
  const titleAt = kids.findIndex((el) => el.tagName === 'H1');
  if (titleAt < 0) return;

  kids.forEach((el, at) => {
    if (!el.querySelector('a[href="/promotion"]')) return;
    if (at < titleAt) {
      el.classList.add('product-hero-rebate');
      return;
    }
    const sentence = kids[at - 1];
    if (!sentence || sentence.tagName !== 'P') return;
    const row = document.createElement('div');
    row.className = 'product-hero-offer';
    sentence.replaceWith(row);
    row.append(sentence, el);
  });
}

/**
 * Names the trailing groups of the product hero column so the stylesheet can
 * rule them off, and gives each Best for entry its badge.
 *
 * Each group is found by what stands above it rather than by position: the plan
 * summary follows the link to /warranty, the Best for and Technology lists follow
 * their words. An author who writes none of them gets none of them, and 12 of the
 * 45 product pages carry no Technology group. (#367)
 * @param {Element} block The block
 */
function decorateProductHero(block) {
  const cell = block.querySelector(':scope > div > div:last-child');
  if (cell) decorateRebate(cell);

  block.querySelectorAll('ul').forEach((list) => {
    const above = list.previousElementSibling;
    if (!above) return;

    if (above.querySelector('a[href="/warranty"]')) {
      above.classList.add('product-hero-plan-link');
      list.classList.add('product-hero-plan');
      return;
    }

    if (TECHNOLOGY_LABEL.test(above.textContent.trim())) {
      above.classList.add('product-hero-technology-label');
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

// The surface the red tests call. Built in the next commit.
/* eslint-disable no-unused-vars, no-empty-function */
export async function addTechnologyTooltips(block) {}
/* eslint-enable no-unused-vars, no-empty-function */

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
