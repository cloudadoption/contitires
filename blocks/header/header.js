import { getMetadata, decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width. header.css switches the
// nav layout at the same width, so the two must move together.
export const DESKTOP_MEDIA_QUERY = '(min-width: 1200px)';
const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY);

// the rebate ribbon above the nav, authored once and shown site-wide. Live
// carries it on every page except the homepage, which authors its own promo
// bar below the hero.
const PROMO_BAR_PATH = '/fragments/promo-bar';

// utility row shown next to the search trigger. This is theme chrome, not
// part of the authored nav content, so it lives here rather than in nav.html.
const UTILITY_LINKS = [
  {
    label: 'Chat now',
    href: 'https://continentaltire.zendesk.com',
    icon: 'chat',
    external: true,
    pill: true,
  },
  {
    label: 'Customer support',
    href: '/customer-support',
    icon: 'help-outline',
  },
];

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Any top nav item that opens a dropdown becomes a full-width dark mega-menu,
 * matching the live site where every dropdown is a full-width panel. Only a
 * plain link (no dropdown) stays a plain item.
 * @param {Element} navSection a top-level nav <li>
 * @returns {boolean}
 */
export function isMegaMenu(navSection) {
  return !!navSection.querySelector(':scope > ul');
}

/**
 * Whether the page carries a promo bar of its own, which the header ribbon
 * would duplicate.
 * @param {Element|Document} root The page root
 * @returns {boolean}
 */
export function hasOwnPromoBar(root = document) {
  return !!root.querySelector('main .promo-bar');
}

/**
 * Loads the shared promo ribbon. Returns null when the page authors its own
 * promo bar, or when the fragment is missing.
 * @returns {Promise<Element|null>} the promo-bar block
 */
async function loadPromoBar() {
  if (hasOwnPromoBar()) return null;
  const fragment = await loadFragment(PROMO_BAR_PATH);
  return fragment ? fragment.querySelector('.promo-bar') : null;
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * Closes the site-search panel and resets the toggle button.
 * @param {Element} toggle The search toggle button
 * @param {Element} panel The search panel
 */
function closeSearch(toggle, panel) {
  toggle.setAttribute('aria-expanded', 'false');
  panel.hidden = true;
}

/**
 * Builds the Chat now / Customer support utility row. Static theme chrome,
 * not authored content.
 * @returns {Element} the utility nav wrapper
 */
export function buildUtilityNav() {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-tools-utility';
  const ul = document.createElement('ul');
  UTILITY_LINKS.forEach(({
    label, href, icon, external, pill,
  }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = pill ? 'nav-tools-utility-item nav-tools-utility-item-pill' : 'nav-tools-utility-item';
    a.href = href;
    a.title = label;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer nofollow';
    }
    a.innerHTML = pill
      ? `<span class="nav-tools-utility-label">${label}</span><span class="icon icon-${icon}"></span>`
      : `<span class="icon icon-${icon}"></span><span class="nav-tools-utility-label">${label}</span>`;
    li.append(a);
    ul.append(li);
  });
  wrapper.append(ul);
  decorateIcons(wrapper);
  return wrapper;
}

/**
 * Builds the mobile menu toggle and places it after the brand, matching the
 * order a viewer sees: logo at the left edge, toggle at the right.
 * @param {Element} nav The nav element
 * @param {Function} onToggle Called when the button is clicked
 * @returns {Element} the hamburger wrapper
 */
export function addHamburger(nav, onToggle) {
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', onToggle);
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) navBrand.after(hamburger);
  else nav.prepend(hamburger);
  return hamburger;
}

/**
 * Turns the authored :search: icon into a search trigger button and builds
 * the expandable search panel. Returns null when authors omit the icon.
 * @param {Element} navTools The nav-tools section
 * @param {Function} closeMenu Callback to force-close the mobile menu
 * @returns {{button: Element, panel: Element}|null}
 */
function buildSearch(navTools, closeMenu) {
  const icon = navTools.querySelector('.icon-search');
  if (!icon) return null;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-search-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Site search');
  button.append(icon);
  button.insertAdjacentHTML('beforeend', '<span class="nav-tools-utility-label">Site search</span>');

  const originalWrapper = navTools.querySelector('p');
  if (originalWrapper) originalWrapper.replaceWith(button);
  else navTools.append(button);

  const panel = document.createElement('div');
  panel.className = 'nav-search-panel';
  panel.hidden = true;
  panel.innerHTML = `<form class="nav-search-form" role="search" action="/search" method="get">
      <input type="search" name="q" placeholder="Search continentaltire.com" aria-label="Search continentaltire.com" required>
      <button type="submit">Search</button>
    </form>`;

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') {
      closeSearch(button, panel);
      return;
    }
    closeMenu();
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    panel.querySelector('input').focus();
  });

  panel.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeSearch(button, panel);
      button.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (button.contains(e.target) || panel.contains(e.target)) return;
    closeSearch(button, panel);
  });

  return { button, panel };
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const [fragment, promoBar] = await Promise.all([loadFragment(navPath), loadPromoBar()]);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('.button');
    if (brandLink) {
      brandLink.className = '';
      brandLink.closest('.button-container').className = '';
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      if (isMegaMenu(navSection)) navSection.classList.add('nav-mega');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // utility row (Chat now / Customer support) + search trigger, built from
  // the authored :search: icon plus static theme chrome
  const navTools = nav.querySelector('.nav-tools');
  let search = null;
  if (navTools) {
    navTools.prepend(buildUtilityNav());
    search = buildSearch(navTools, () => toggleMenu(nav, navSections, false));
  }

  // hamburger for mobile
  addHamburger(nav, () => {
    if (search) closeSearch(search.button, search.panel);
    toggleMenu(nav, navSections);
  });
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  // the ribbon rides with the nav so both stay pinned together
  if (promoBar) navWrapper.append(promoBar);
  navWrapper.append(nav);
  if (search) navWrapper.append(search.panel);
  block.append(navWrapper);
}
