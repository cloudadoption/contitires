import { decorateIcons } from '../../scripts/aem.js';
import { TECHNOLOGY_COLUMNS, missingColumns, sheetRows } from '../../scripts/products.js';

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

// The Technology entries and the drawing each one takes, the same shape as
// Best for above. These are live's own SVG files, downloaded from
// /sites/default/files/images/tire_feature/field_svg/ rather than redrawn
// (guardrail 8). Live serves 15 URLs across the 34 product pages that carry the
// group, and three pairs are byte-identical, so 12 files cover 14 names.
//
// This map is a NAME TO ASSET binding rather than copy, which is why it is here
// and the descriptions are in the sheet: an author never edits it and cannot
// use it. (#380)
const TECHNOLOGY_ICONS = [
  '3-Peak Mountain Snowflake', 'ContiSeal*', 'ContiSilent*', 'EcoPlus',
  'Ice Grip Certified', 'PolarPlus', 'QuickView Indicators',
  'Self Supporting Runflat*', 'SportPlus', 'TractionPlus', 'Treadwear Indicators',
].reduce((map, name) => ({ ...map, [name.toLowerCase()]: `tech-${slugify(name)}` }), {
  // one drawing, which live serves at three URLs, one per variant
  'tuned performance indicators (dw)': 'tech-tuned-performance-indicators',
  'tuned performance indicators (dws)': 'tech-tuned-performance-indicators',
  'tuned performance indicators (srs)': 'tech-tuned-performance-indicators',
});

const TECHNOLOGY_SHEET_URL = '/products.json?sheet=technology&limit=100';

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
      list.classList.add('product-hero-technology');
      list.querySelectorAll(':scope > li').forEach((item) => {
        const drawing = TECHNOLOGY_ICONS[item.textContent.trim().toLowerCase()];
        if (!drawing) return;
        const icon = document.createElement('span');
        icon.className = `icon icon-${drawing}`;
        item.prepend(icon);
      });
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

/* Live collapses both trailing groups below its own 768 step and draws them
   open with no control above it. Bracketed on /tires/crosscontact-lx25: 61px
   with no row at 767 and 768, 258px and 144px with their rows at 769. (#432) */
const NARROW_MEDIA_QUERY = '(width <= 768px)';

// created on first use rather than at import, so every page that authors a plain
// two-column row does not read the viewport for a hero it does not have
let narrowQuery;
function narrow() {
  if (!narrowQuery) narrowQuery = window.matchMedia(NARROW_MEDIA_QUERY);
  return narrowQuery;
}

/* the label element and the list it introduces, in the order live rules them
   off. The plan summary is not here: live leaves it outside con-details. */
const HERO_GROUPS = [
  ['.product-hero-best-for-label', '.product-hero-best-for'],
  ['.product-hero-technology-label', '.product-hero-technology'],
];

let groups = 0;

/**
 * Moves a label's own words into a button that shows and hides its list. A real
 * button gets Enter and Space from the browser, so there is no keydown handler
 * to keep in step with the markup, and live's own handler sits on a custom
 * element no keyboard reaches. The footer's disclosures are built this way.
 * @param {Element} label the label element, which keeps its place and its rule
 * @param {Element} list the list it introduces
 */
function collapseGroup(label, list) {
  if (label.querySelector('.product-hero-group-toggle')) return;
  if (!list.id) {
    groups += 1;
    list.id = `product-hero-group-${groups}`;
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'product-hero-group-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', list.id);
  toggle.append(...label.childNodes);
  label.append(toggle);
  label.classList.add('product-hero-collapsible');
  list.hidden = true;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    list.hidden = expanded;
  });
}

/**
 * Puts the label's words back where they were and draws the list again.
 * @param {Element} label the label element
 * @param {Element} list the list it introduces
 */
function restoreGroup(label, list) {
  const toggle = label.querySelector('.product-hero-group-toggle');
  if (!toggle) return;
  toggle.replaceWith(...toggle.childNodes);
  label.classList.remove('product-hero-collapsible');
  list.hidden = false;
}

/**
 * Closes the hero column's trailing groups into disclosures, or opens them.
 *
 * A group a reader left closed opens again on the way up, because above live's
 * step there is no control to reopen it with.
 * @param {Element} block the product hero block
 * @param {boolean} collapsed whether the groups should be disclosure rows
 */
export function setHeroDisclosures(block, collapsed) {
  HERO_GROUPS.forEach(([labelSelector, listSelector]) => {
    const label = block.querySelector(labelSelector);
    const list = block.querySelector(listSelector);
    if (!label || !list) return;
    if (collapsed) collapseGroup(label, list);
    else restoreGroup(label, list);
  });
}

let tips = 0;

/** Resolves once the page has loaded, so a tooltip never races LCP. */
function whenLoaded() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
}

/**
 * Hangs live's question mark off each Technology row, opening the item's
 * description.
 *
 * Live wraps the row in a `con-tooltip` custom element with a click handler on
 * it, so a keyboard reaches none of them. This is a button with aria-expanded,
 * the same divergence tire-features made on live's rings.
 *
 * An item the sheet has no row for keeps its drawing and gets no question mark,
 * because there is nothing to open.
 * @param {Element} list the Technology list
 * @returns {Promise<void>} once the sheet has been read and the rows built
 */
async function buildTips(list) {
  let rows;
  try {
    const resp = await fetch(TECHNOLOGY_SHEET_URL);
    if (!resp.ok) return;
    rows = sheetRows(await resp.json());
  } catch (e) {
    return;
  }
  if (missingColumns(rows, TECHNOLOGY_COLUMNS).length) return;

  const byName = new Map(rows
    .filter((row) => row.name)
    .map((row) => [String(row.name).trim().toLowerCase(), {
      text: String(row.description || ''),
      logo: String(row.logo || '').trim(),
      list: String(row.shape || '').trim().toLowerCase() === 'list',
    }]));

  list.querySelectorAll(':scope > li').forEach((item) => {
    const name = item.textContent.trim();
    const row = byName.get(name.toLowerCase());
    if (!row) return;
    tips += 1;
    const id = `product-hero-tip-${tips}`;

    const tip = document.createElement('div');
    tip.className = 'product-hero-technology-tip';
    tip.id = id;
    tip.hidden = true;
    // six of the 14 open with a logo above the words. No width or height: each
    // file is intrinsically 215px wide at live's own height, and the tip is
    // hidden until the button is pressed, so nothing shifts on load.
    if (row.logo) {
      const logo = document.createElement('img');
      logo.className = 'product-hero-technology-logo';
      logo.src = row.logo;
      logo.loading = 'lazy';
      // decorative: the technology name is in the row beside it
      logo.alt = '';
      tip.append(logo);
    }
    const lines = row.text.split('\n').map((line) => line.trim()).filter(Boolean);
    // four of the 14 are a bulleted list on live and the rest are paragraphs,
    // the qualifier its own. The sheet says which, in a column rather than a
    // marker inside the words: the content bus is one bus for every branch, so
    // a marker in the description would render on main too.
    if (row.list) {
      const items = document.createElement('ul');
      lines.forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        items.append(li);
      });
      tip.append(items);
    } else {
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        tip.append(p);
      });
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-hero-technology-help';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id);
    const glyph = document.createElement('span');
    glyph.className = 'icon icon-tech-question';
    const said = document.createElement('span');
    said.className = 'sr-only';
    // textContent, not innerHTML: the name is authored and an author can type a <
    said.textContent = `About ${name}`;
    button.append(glyph, said);
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', open ? 'false' : 'true');
      tip.hidden = open;
    });

    item.append(button, tip);
  });
  decorateIcons(list);
}

const started = new WeakMap();

/**
 * The tooltip half of the Technology group, which loads in the LAZY phase.
 *
 * No reader of the products workbook fetches it whole, every one asks for a
 * single sheet by name, so there is no request in flight to ride along on. A
 * tooltip is not LCP content, so it waits for the load event instead.
 *
 * Called twice it returns the first call's promise rather than fetching again,
 * so the deferred call and a direct one are the same piece of work.
 * @param {Element} block the product hero block
 * @returns {Promise<void>} once the rows carry their tooltips
 */
export async function addTechnologyTooltips(block) {
  // the call is deferred to the load event, and a block taken out of the
  // document before then has nothing left to fill
  if (!block.isConnected) return undefined;
  const list = block.querySelector('.product-hero-technology');
  if (!list) return undefined;
  if (!started.has(list)) started.set(list, buildTips(list));
  return started.get(list);
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

  if (block.classList.contains('product-hero')) {
    decorateProductHero(block);
    setHeroDisclosures(block, narrow().matches);
    narrow().addEventListener('change', () => setHeroDisclosures(block, narrow().matches));
    // not awaited: the hero is the first section, so awaiting a fetch here
    // would put the tooltip in front of LCP
    whenLoaded().then(() => addTechnologyTooltips(block));
  }
}
