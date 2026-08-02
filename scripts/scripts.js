import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';
import { initFinderTriggers, markFinderTriggers, toFinderTrigger } from './tire-finder.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

// block-library sample pages (/tools/sidekick/blocks/<name>) render in the DA
// library preview iframe; keep them to the block itself by not loading the
// site header and footer there, and by reserving no room for either
const isBlockPreview = window.location.pathname.startsWith('/tools/sidekick/blocks/');

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

// live's question above the three searches in the product hero card
const FINDER_CARD_QUESTION = 'Does this tire fit? Check now:';

/**
 * Product pages author one "Find your size" link into the hero. Live offers
 * the three searches there instead, in a card. Build the card from the link.
 *
 * Live stands the card directly under the title, above the description and
 * everything below it, and the authored link is last. The card's position is
 * the template's rather than the author's, because the card is built rather
 * than authored, so it goes where live puts it. A cell with no title keeps the
 * card where the link stood. (#241)
 * @param {Element} main The container element
 */
function buildFinderCardAutoBlocks(main) {
  main.querySelectorAll('.columns.product-hero a[href="/perfect-fit"]').forEach((link) => {
    const p = link.closest('p');
    if (!p || p.textContent.trim() !== link.textContent.trim()) return;
    const card = buildBlock('perfect-fit', FINDER_CARD_QUESTION);
    card.classList.add('card');
    const title = p.parentElement.querySelector(':scope > h1');
    if (title) {
      p.remove();
      title.after(card);
    } else {
      p.replaceWith(card);
    }
  });
}

/**
 * Product pages author the tire's photographs into the hero's image cell, one
 * per paragraph, with the YouTube link beside the still that stands for the
 * video. Live shows them as a viewer rather than a stack, so where there is
 * more than one, build it.
 *
 * It is built rather than authored because EDS carries no block inside a block
 * cell: written as one, the pipeline hands it back as these paragraphs. The 30
 * pages still shipping the single image they were migrated with keep the plain
 * hero they have.
 *
 * Runs after decorateBlocks, which is what decorates the hero around it:
 * decorating a block wraps any cell not starting with a paragraph or a picture
 * in one, so a viewer built before that would sit inside a paragraph of its
 * own. decorateNestedBlocks then decorates it.
 * @param {Element} main The container element
 */
function buildProductViewer(main) {
  main.querySelectorAll('.columns.product-hero > div > div').forEach((cell) => {
    const media = [...cell.children].filter((el) => el.querySelector('picture, a[href]'));
    // the copy cell holds links of its own, so a viewer needs the photographs
    if (media.filter((el) => el.querySelector('picture')).length < 2) return;

    const rows = media.map((el) => [
      { elems: [el.querySelector('picture')] },
      { elems: [el.querySelector('a[href]')] },
    ]);
    const viewer = buildBlock('media-gallery', rows);
    viewer.classList.add('product');
    cell.replaceChildren(viewer);
  });
}

/**
 * Gathers the sections a page tabbed into one tabs block. A section names its
 * tab with `Tab` in its section metadata, which the pipeline delivers as an
 * attribute, and adds `Column: Sidebar` to stand beside the rest of that tab
 * rather than in it. Sections carrying no `Tab` are left where they are.
 *
 * `Tabs` names the bar's variant and `Selected` the tab the page opens on.
 *
 * The panels are sections rather than cells an author wrote, because EDS
 * carries no block inside a block cell and every panel here holds one.
 *
 * Runs after decorateBlocks, so the blocks inside a panel are decorated before
 * they move; loadSection finds a block anywhere under the section. The block
 * is decorated before it is filled, because decorating one wraps any cell not
 * starting with a paragraph or a picture in a paragraph.
 * @param {Element} main The container element
 */
function buildTabs(main) {
  const tabbed = [...main.querySelectorAll(':scope > .section[data-tab]')];
  if (!tabbed.length) return;

  const order = [];
  const groups = new Map();
  let selected;
  const variants = new Set();
  tabbed.forEach((section) => {
    const name = section.dataset.tab.trim();
    if (!groups.has(name)) {
      groups.set(name, { body: [], aside: [] });
      order.push(name);
    }
    if (section.dataset.tabs) variants.add(section.dataset.tabs.trim());
    if (section.dataset.selected) selected = order.indexOf(name);
    const side = /sidebar/i.test(section.dataset.column || '');
    // a section's children are the wrappers decorateSections grouped its
    // content into; a cell holds the content itself, the way one an author
    // wrote holds it
    const content = [...section.children].flatMap((wrapper) => [...wrapper.children]);
    groups.get(name)[side ? 'aside' : 'body'].push(...content);
  });

  const section = document.createElement('div');
  section.className = 'section';
  section.dataset.sectionStatus = 'initialized';
  section.style.display = 'none';
  const wrapper = document.createElement('div');
  const block = document.createElement('div');
  block.className = ['tabs', ...variants].join(' ');
  if (selected !== undefined) block.dataset.selected = String(selected);

  const cells = order.map((name) => {
    const row = document.createElement('div');
    const heading = document.createElement('div');
    heading.textContent = name;
    row.append(heading);
    const { body, aside } = groups.get(name);
    const filled = [document.createElement('div')];
    if (aside.length) filled.push(document.createElement('div'));
    row.append(...filled);
    block.append(row);
    return { body, aside, filled };
  });

  wrapper.append(block);
  section.append(wrapper);
  tabbed[0].before(section);
  tabbed.forEach((old) => old.remove());
  decorateBlock(block);
  cells.forEach(({ body, aside, filled }) => {
    filled[0].append(...body);
    if (filled[1]) filled[1].append(...aside);
  });
}

/**
 * Decorates the blocks the platform does not reach. `decorateBlocks` reads a
 * section's own children, so a block nested inside another block is decorated
 * here: the finder card in the product hero, and the image viewer in the cell
 * beside it. `loadSection` then finds them like any other block.
 * @param {Element} main The container element
 */
function decorateNestedBlocks(main) {
  main.querySelectorAll('.perfect-fit.card:not(.block), .media-gallery:not(.block)')
    .forEach(decorateBlock);
}

/**
 * Builds the article sidebar: a share block, and under it any related-articles
 * block an editor authored. Live carries the sharebar on every article, and it
 * needs no author input, so it is built rather than authored on each of the
 * 200-odd pages.
 *
 * Both blocks go in one wrapper, because the section is a grid and a wrapper
 * is a grid item. Two wrappers put the list in a row of its own, and that row
 * starts below the row holding the body, which is the whole article. (#193)
 *
 * Runs after decorateSections, which is what makes the wrappers, and before
 * decorateBlocks, which reads blocks one level under the section.
 * @param {Element} main The container element
 */
function buildArticleSidebar(main) {
  if (!document.body.classList.contains('article')) return;
  // fragment.js decorates each fragment it loads with this same function, and
  // the header loads the nav that way. Only the page's own main gets a sidebar.
  if (main !== document.querySelector('main')) return;
  if (main.querySelector('.share')) return;

  // the first section is the title; the body is the one that follows it
  const body = [...main.children].find((section, i) => i > 0 && !section.querySelector('.metadata'));
  if (!body) return;

  const sidebar = document.createElement('div');
  const share = document.createElement('div');
  share.className = 'share';
  sidebar.append(share);

  const related = body.querySelector('.related-articles');
  if (related) {
    const wrapper = related.parentElement;
    sidebar.append(related);
    if (!wrapper.children.length) wrapper.remove();
  }
  body.append(sidebar);
}

/**
 * Builds the partner sidebar. On a partner page everything that is not the
 * gallery stands in one column beside it, which is how live draws it: the
 * logo, the title, the sharebar, then the copy. One element is what holds
 * that column to a single grid row; three grid items spanning the gallery's
 * rows share its height out between them instead, which puts the sharebar a
 * third of the way down the page.
 *
 * Runs after decorateBlocks, which reads blocks one level under the section,
 * so the sharebar is already decorated when it moves. loadSection finds a
 * block anywhere under the section, so the extra level costs it nothing.
 * @param {Element} main The container element
 */
function buildPartnerSidebar(main) {
  main.querySelectorAll('.section.partner').forEach((section) => {
    const gallery = section.querySelector(':scope > div:has(.media-gallery)');
    if (!gallery || section.querySelector('.partner-sidebar')) return;
    const sidebar = document.createElement('div');
    sidebar.className = 'partner-sidebar';
    [...section.children].filter((el) => el !== gallery).forEach((el) => sidebar.append(el));
    section.append(sidebar);
  });
}

/**
 * Splits a two-column band into its two columns. Live pairs the /events Social
 * gallery and its News list inside one black band, gallery left and list right.
 *
 * The authored contract: a `two-columns` section holds two blocks. The first
 * block and the content above it stand in the left column; the second block,
 * the heading directly above it and anything after it stand in the right.
 *
 * Each column is ONE element, which is what holds it to a single grid row. Grid
 * items spanning the gallery's rows share its height out between them instead,
 * which is what put the partner sharebar a third of the way down the page.
 *
 * Runs after decorateBlocks, so a wrapper already names the block it holds.
 * loadSection finds a block anywhere under the section, so the extra level
 * costs it nothing.
 * @param {Element} main The container element
 */
function buildTwoColumnBands(main) {
  main.querySelectorAll('.section.two-columns').forEach((section) => {
    if (section.querySelector(':scope > .section-columns')) return;
    const children = [...section.children];
    const blocks = children.filter((el) => el.querySelector(':scope > .block'));
    if (blocks.length < 2) return;

    let split = children.indexOf(blocks[1]);
    if (split > 1 && children[split - 1].classList.contains('default-content-wrapper')) split -= 1;

    const columns = document.createElement('div');
    columns.className = 'section-columns';
    [children.slice(0, split), children.slice(split)].forEach((part) => {
      const column = document.createElement('div');
      column.className = 'section-column';
      part.forEach((el) => column.append(el));
      columns.append(column);
    });
    section.append(columns);
  });
}

/**
 * Ends a product page with the rating band, the way live ends one with its
 * reviews section. A product page is one carrying the product hero or the
 * specs band: 44 of the 46 carry both, /tires/purecontact-ls and
 * /tires/truecontact-tour have no specs band, and /vancontact-as-ultra has no
 * hero variant. The product is the page's own last path segment, which is the
 * catalog slug on all 46.
 *
 * It is built rather than authored because the band takes no authored input:
 * the heading is fixed and the score and the count come from the catalog
 * sheet, keyed by a slug the page's path already carries. Authoring it would
 * put the same inert block on all 46 pages for an author to maintain and never
 * edit, and a slug held twice is what #122 had to undo. Issue #268.
 * @param {Element} main The container element
 */
function buildTireRating(main) {
  if (!main.querySelector('.columns.product-hero, .tire-specs')) return;
  if (main.querySelector('.tire-rating')) return;
  const slug = window.location.pathname.replace(/\/$/, '').split('/').pop();
  const section = document.createElement('div');
  section.append(buildBlock('tire-rating', [[slug]]));
  main.append(section);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
    buildFinderCardAutoBlocks(main);
    buildTireRating(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

// live's promo pages offer the finder where a link to the finder page is
// authored: beside the store link in the marquee, and again above the terms.
// Live's control is a button, and it opens By Vehicle from every one of them.
const FINDER_CTA = 'a.button[href="/perfect-fit"]';
const FINDER_TAB = 'vehicle';

/**
 * Turns the promo pages' authored finder CTAs into controls that open the
 * finder where they stand. Elsewhere /perfect-fit is a page, and a link to it
 * stays a link.
 *
 * Runs after decorateButtons, which is what makes these links buttons.
 * @param {Element} main The container element
 */
function buildFinderTriggers(main) {
  if (document.body.classList.contains('promo')) {
    main.querySelectorAll(FINDER_CTA).forEach((link) => toFinderTrigger(link, FINDER_TAB));
  }
  // /tire-finder offers the three searches in its body, the same list the
  // header and the footer author. It is read behind the template rather than
  // on every main, because loadFragment runs decorateMain over the footer
  // before footer.js sees it, and the footer's authored hrefs stay authored.
  if (document.body.classList.contains('finder')) markFinderTriggers(main);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  buildArticleSidebar(main);
  decorateBlocks(main);
  buildPartnerSidebar(main);
  buildTwoColumnBands(main);
  buildProductViewer(main);
  buildTabs(main);
  decorateNestedBlocks(main);
  decorateButtons(main);
  buildFinderTriggers(main);
}

// a template names a stylesheet of its own under /styles. The promo pages are
// one template on live too, which is where their band treatments belong rather
// than in the stylesheet every page pays for.
const TEMPLATES = ['article', 'promo', 'crew', 'documents', 'finder'];

/**
 * Loads the stylesheet this page's template needs. Returns a promise that
 * settles once the stylesheet is in effect, so the reveal can wait on it.
 * @returns {Promise} resolves when the template's styles are loaded
 */
export function loadTemplateStyles() {
  const template = TEMPLATES.find((name) => document.body.classList.contains(name));
  if (!template) return Promise.resolve();
  return loadCSS(`${window.hlx.codeBasePath}/styles/${template}.css`);
}

/**
 * Reveals the page, once the template's stylesheet is in effect. The stylesheet
 * sets an article's whole layout, so revealing first paints it at the default
 * page width and then reflows it.
 * @param {Promise} templateStyles the template's stylesheet
 */
export async function revealPage(templateStyles) {
  await templateStyles;
  document.body.classList.add('appear');
}

/**
 * Whether the eager phase requests fonts.css, which decides whether a page
 * paints in Stag or paints in the fallback and changes into Stag.
 * @returns {boolean}
 */
export function loadsFontsEagerly() {
  /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
  return window.innerWidth >= 900 || !!sessionStorage.getItem('fonts-loaded');
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // start the template's stylesheet now, so it downloads alongside decoration
  const templateStyles = loadTemplateStyles();
  if (isBlockPreview) document.body.classList.add('block-preview');
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await revealPage(templateStyles);
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (loadsFontsEagerly()) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const header = doc.querySelector('header');
  if (header && !isBlockPreview) loadHeader(header);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  const footer = doc.querySelector('footer');
  if (footer && !isBlockPreview) loadFooter(footer);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  initFinderTriggers(doc);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
