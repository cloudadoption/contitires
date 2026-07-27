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
import { initFinderTriggers } from './tire-finder.js';

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
 * @param {Element} main The container element
 */
function buildFinderCardAutoBlocks(main) {
  main.querySelectorAll('.columns.product-hero a[href="/perfect-fit"]').forEach((link) => {
    const p = link.closest('p');
    if (!p || p.textContent.trim() !== link.textContent.trim()) return;
    const card = buildBlock('perfect-fit', FINDER_CARD_QUESTION);
    card.classList.add('card');
    p.replaceWith(card);
  });
}

/**
 * Decorates the blocks the platform does not reach. `decorateBlocks` reads a
 * section's own children, so a block nested inside another block, such as the
 * finder card in the product hero, is decorated here. `loadSection` then finds
 * it like any other block.
 * @param {Element} main The container element
 */
function decorateNestedBlocks(main) {
  main.querySelectorAll('.perfect-fit.card:not(.block)').forEach(decorateBlock);
}

/**
 * Puts a share block in an article's body section. Live carries the sharebar
 * on every article, and it needs no author input, so it is built rather than
 * authored on each of the 200-odd pages. Any authored related-articles block
 * already sits in that section, and the two make up the sidebar.
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

  const share = document.createElement('div');
  share.className = 'share';
  body.append(share);
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
    buildArticleSidebar(main);
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

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateNestedBlocks(main);
  decorateButtons(main);
}

/**
 * Loads the stylesheet this page's template needs. Returns a promise that
 * settles once the stylesheet is in effect, so the reveal can wait on it.
 * @returns {Promise} resolves when the template's styles are loaded
 */
export function loadTemplateStyles() {
  if (!document.body.classList.contains('article')) return Promise.resolve();
  return loadCSS(`${window.hlx.codeBasePath}/styles/article.css`);
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
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
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
