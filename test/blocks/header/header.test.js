/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import {
  addHamburger, buildUtilityNav, isMegaMenu, DESKTOP_MEDIA_QUERY,
} from '../../../blocks/header/header.js';

/** Index of the first child carrying `className` in an element's children. */
function childIndex(el, className) {
  return [...el.children].findIndex((c) => c.classList.contains(className));
}

/** Builds a top-level nav <li> from an inner-HTML string. */
function navItem(html) {
  const ul = document.createElement('ul');
  ul.innerHTML = `<li>${html}</li>`;
  return ul.firstElementChild;
}

describe('Header utility nav', () => {
  before(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });

  it('renders the pill label before its icon, so the icon sits after the label', () => {
    const wrapper = buildUtilityNav();
    const pill = wrapper.querySelector('a.nav-tools-utility-item-pill');
    expect(pill, 'a pill utility item exists').to.exist;
    const labelIdx = childIndex(pill, 'nav-tools-utility-label');
    const iconIdx = childIndex(pill, 'icon');
    expect(labelIdx, 'label present').to.be.greaterThan(-1);
    expect(iconIdx, 'icon present').to.be.greaterThan(-1);
    expect(labelIdx, 'label comes before the icon').to.be.lessThan(iconIdx);
  });

  it('renders non-pill items with the icon before the label', () => {
    const wrapper = buildUtilityNav();
    const nonPill = [...wrapper.querySelectorAll('a.nav-tools-utility-item')]
      .find((a) => !a.classList.contains('nav-tools-utility-item-pill'));
    expect(nonPill, 'a non-pill utility item exists').to.exist;
    const labelIdx = childIndex(nonPill, 'nav-tools-utility-label');
    const iconIdx = childIndex(nonPill, 'icon');
    expect(iconIdx, 'icon comes before the label').to.be.lessThan(labelIdx);
  });
});

describe('Header desktop breakpoint', () => {
  // The desktop nav needs 1180px of horizontal room (measured on production:
  // 32px padding + 150px brand + 24px gap + 707px sections + 24px gap + 211px
  // tools + 32px padding). Engaging it below that scrolls every page
  // sideways, so it starts at the project's 1200px desktop breakpoint.
  it('switches to the desktop nav at 1200px', () => {
    expect(DESKTOP_MEDIA_QUERY).to.equal('(min-width: 1200px)');
  });

  it('hides the hamburger at the same width the script calls desktop', async () => {
    const res = await fetch('/blocks/header/header.css');
    expect(res.ok, 'header.css is served').to.be.true;
    const sheet = new CSSStyleSheet();
    await sheet.replace(await res.text());
    const hamburgerRule = [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSMediaRule)
      .find((rule) => [...rule.cssRules].some((r) => r.selectorText?.includes('.nav-hamburger')
        && r.style.display === 'none'));
    expect(hamburgerRule, 'a media query hides the hamburger').to.exist;
    const cssWidth = Number(hamburgerRule.conditionText.match(/(\d+)px/)[1]);
    const jsWidth = Number(DESKTOP_MEDIA_QUERY.match(/(\d+)px/)[1]);
    expect(cssWidth, 'header.css and header.js agree').to.equal(jsWidth);
  });
});

describe('Header mobile toggle', () => {
  /** A decorated nav before the toggle is added: brand, sections, tools. */
  function buildNav() {
    const nav = document.createElement('nav');
    nav.innerHTML = `<div class="section nav-brand"></div>
      <div class="section nav-sections"></div>
      <div class="section nav-tools"></div>`;
    return nav;
  }

  /** The nav's children, named by the nav-* class each one carries. */
  function order(nav) {
    return [...nav.children]
      .map((c) => [...c.classList].find((n) => n.startsWith('nav-')));
  }

  it('places the toggle after the brand, so the logo comes first', () => {
    const nav = buildNav();
    addHamburger(nav, () => {});
    expect(order(nav)).to.eql(['nav-brand', 'nav-hamburger', 'nav-sections', 'nav-tools']);
  });

  it('starts the nav when authors omit the brand', () => {
    const nav = document.createElement('nav');
    nav.innerHTML = '<div class="section nav-sections"></div>';
    addHamburger(nav, () => {});
    expect(order(nav)).to.eql(['nav-hamburger', 'nav-sections']);
  });

  it('runs the callback when its button is clicked', () => {
    const nav = buildNav();
    let clicks = 0;
    const hamburger = addHamburger(nav, () => { clicks += 1; });
    hamburger.querySelector('button').click();
    expect(clicks, 'the click reached the callback').to.equal(1);
  });
});

describe('Header mobile layout order', () => {
  // The live site puts the logo at the left edge and the toggle at the right.
  // Below the desktop breakpoint our nav is a grid, so the named areas decide
  // what a mobile viewer sees.
  let sheet;

  before(async () => {
    const res = await fetch('/blocks/header/header.css');
    sheet = new CSSStyleSheet();
    await sheet.replace(await res.text());
  });

  /** Area names in the first row of a selector's grid template. */
  function firstRowAreas(selector) {
    const norm = (s) => (s || '').replaceAll('"', "'");
    const rule = [...sheet.cssRules]
      .find((r) => norm(r.selectorText) === norm(selector));
    expect(rule, `${selector} is styled`).to.exist;
    const template = rule.style.getPropertyValue('grid-template')
      || rule.style.getPropertyValue('grid-template-areas');
    expect(template, `${selector} names its grid areas`).to.match(/["']/);
    return template.split(/["']/)[1].trim().split(/\s+/);
  }

  it('puts the brand left of the toggle in the collapsed header', () => {
    const areas = firstRowAreas('header nav');
    expect(areas.indexOf('brand'), 'brand comes first')
      .to.be.lessThan(areas.indexOf('hamburger'));
  });

  it('keeps that order when the drawer is open', () => {
    const areas = firstRowAreas('header nav[aria-expanded=\'true\']');
    expect(areas.indexOf('brand'), 'brand comes first')
      .to.be.lessThan(areas.indexOf('hamburger'));
  });
});

describe('Header mega-menu detection', () => {
  // a multi-column drop with sub-lists, like Tires/Experience
  const tires = navItem(`<p><a href="/tires">Tires</a></p>
    <ul>
      <li><p><a href="/tires/category">By Category</a></p><ul><li><a href="/tires/all-season">All Season</a></li></ul></li>
      <li><p><a href="/tires/vehicle">By Vehicle</a></p><ul><li><a href="/tires/passenger">Passenger</a></li></ul></li>
    </ul>`);

  // Learn reshaped into heading-only columns (each column is a paragraph link)
  const learnReshaped = navItem(`<p><a href="/learn">Learn</a></p>
    <ul>
      <li><p><a href="/learn/tips">Tire Tips</a></p></li>
      <li><p><a href="/learn/technology">Technology</a></p></li>
      <li><p><a href="/learn/news-and-events">News</a></p></li>
    </ul>`);

  // Stores: a single heading column with a sub-list
  const stores = navItem(`<p><a href="/Store-finder">Stores</a></p>
    <ul>
      <li><p><strong>Stores near</strong></p><ul><li><a href="/Store-finder">See more locations</a></li></ul></li>
    </ul>`);

  // a flat bullet list of bare links, no paragraph headings
  const flatDrop = navItem(`<p><a href="/learn">Learn</a></p>
    <ul>
      <li><a href="/learn/tips">Tire Tips</a></li>
      <li><a href="/learn/technology">Technology</a></li>
    </ul>`);

  const plainLink = navItem('<a href="/offers">Offers</a>');

  it('tags a single-column dropdown with a heading (Stores) as a mega-menu', () => {
    expect(isMegaMenu(stores)).to.be.true;
  });

  it('tags multi-column dropdowns (Tires, reshaped Learn) as mega-menus', () => {
    expect(isMegaMenu(tires)).to.be.true;
    expect(isMegaMenu(learnReshaped)).to.be.true;
  });

  it('tags any dropdown as a mega-menu, even a flat link list', () => {
    expect(isMegaMenu(flatDrop)).to.be.true;
  });

  it('does not tag a plain link with no dropdown', () => {
    expect(isMegaMenu(plainLink)).to.be.false;
  });
});
