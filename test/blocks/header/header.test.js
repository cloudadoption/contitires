/* eslint-disable no-unused-expressions */
/* global describe it before afterEach */

import { expect } from '@esm-bundle/chai';
import {
  addHamburger, buildSearch, buildUtilityNav, hasOwnPromoBar, isMegaMenu,
  wireNavDisclosures, DESKTOP_MEDIA_QUERY,
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
  // Live engages its desktop nav at 1025px and compresses the bar to fit:
  // the utility items drop to 30px icons, and the sections row reflows when
  // a label no longer fits. Measured on live at 1025, the bar is 88px tall
  // with the Smart Choice label on two lines, and 72px from 1080 up.
  it('switches to the desktop nav at 1025px, where live does', () => {
    expect(DESKTOP_MEDIA_QUERY).to.equal('(min-width: 1025px)');
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

describe('Header mobile bar', () => {
  // Live renders a 45px bar below its desktop breakpoint and a 72px bar above
  // it, with the logo at 134px and 186px. Ours ran 72px at every width, which
  // put 27px of extra chrome above the fold on every mobile page.
  let globalSheet;
  let headerSheet;

  before(async () => {
    globalSheet = new CSSStyleSheet();
    await globalSheet.replace(await (await fetch('/styles/styles.css')).text());
    headerSheet = new CSSStyleSheet();
    await headerSheet.replace(await (await fetch('/blocks/header/header.css')).text());
  });

  /** The value a property takes in the rule matching `selector`. */
  function value(sheet, selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules];
    const rule = [...rules].reverse().find((r) => r.selectorText === selector
      && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const desktopWidth = () => DESKTOP_MEDIA_QUERY.match(/(\d+)px/)[1];

  it('reserves live\'s 45px bar below the desktop breakpoint', () => {
    expect(value(globalSheet, ':root', '--nav-height')).to.equal('45px');
  });

  it('gives the bar its 72px back at the desktop breakpoint', () => {
    expect(value(globalSheet, ':root', '--nav-height', desktopWidth())).to.equal('72px');
  });

  it('renders the logo at live\'s 134px on mobile', () => {
    expect(value(headerSheet, 'header nav .nav-brand img', 'width')).to.equal('134px');
  });
});

describe('Header compressed band', () => {
  // Between the desktop breakpoint and 1170px live shows both utility items as
  // 30px icons, and gives the Chat now pill its label back at 1170.
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/header/header.css')).text());
  });

  /** Media rules whose condition names `width`. */
  function at(width) {
    return [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
      && r.conditionText.includes(`${width}px`));
  }

  it('holds the pill to an icon while the bar is compressed', () => {
    const shown = at(DESKTOP_MEDIA_QUERY.match(/(\d+)px/)[1])
      .flatMap((r) => [...r.cssRules])
      .filter((r) => r.selectorText?.includes('.nav-tools-utility-item-pill')
        && r.selectorText?.includes('.nav-tools-utility-label'))
      .find((r) => r.style.display && r.style.display !== 'none');
    expect(shown, 'no rule shows the pill label at the breakpoint').to.not.exist;
  });

  it('gives the pill its label back at 1170, as live does', () => {
    const rules = at(1170).flatMap((r) => [...r.cssRules])
      .filter((r) => r.selectorText?.includes('.nav-tools-utility-item-pill'));
    expect(rules.length, 'the pill label returns at 1170').to.be.greaterThan(0);
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

describe('Header promo ribbon', () => {
  // Live puts the rebate ribbon above the header on every page but the
  // homepage, which authors its own promo bar below the hero. The header
  // renders the shared ribbon only for pages that carry none.
  /** A page whose main holds the given inner HTML. */
  function page(html) {
    const root = document.createElement('div');
    root.innerHTML = `<header></header><main>${html}</main>`;
    return root;
  }

  it('leaves the ribbon to the header when the page authors no promo bar', () => {
    expect(hasOwnPromoBar(page('<div class="section"><p>Tires</p></div>'))).to.be.false;
  });

  it('yields to a promo bar the page authors itself', () => {
    expect(hasOwnPromoBar(page('<div class="section"><div class="promo-bar"></div></div>'))).to.be.true;
  });

  it('ignores a promo bar that is already in the header', () => {
    const root = document.createElement('div');
    root.innerHTML = '<header><div class="promo-bar"></div></header><main></main>';
    expect(hasOwnPromoBar(root)).to.be.false;
  });
});

describe('Header promo ribbon layout', () => {
  // The ribbon rides inside the sticky wrapper above the nav, so the header
  // has to reserve its height from the first paint. The mega-menu panel drops
  // from the bottom of that wrapper, so it reserves the same height again.
  let headerRule;
  let ownPromoRule;
  let panelRule;
  let previewRule;
  let ribbonRule;

  before(async () => {
    const global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    headerRule = [...global.cssRules].find((rule) => rule.selectorText === 'header');
    ownPromoRule = [...global.cssRules]
      .find((rule) => rule.selectorText?.includes(':has(main .promo-bar)'));
    previewRule = [...global.cssRules]
      .find((rule) => rule.selectorText?.includes('.block-preview'));

    const header = new CSSStyleSheet();
    await header.replace(await (await fetch('/blocks/header/header.css')).text());
    const selector = 'header nav .nav-sections .default-content-wrapper > ul > li.nav-mega > ul';
    panelRule = [...header.cssRules]
      .filter((rule) => rule instanceof CSSMediaRule)
      .flatMap((rule) => [...rule.cssRules])
      .find((rule) => rule.selectorText === selector && rule.style.position === 'fixed');
    ribbonRule = [...header.cssRules]
      .find((rule) => rule.selectorText?.includes('.nav-wrapper .promo-bar-bar'));
  });

  it('reserves the ribbon height on top of the nav height', () => {
    expect(headerRule, 'the header reserves its own height').to.exist;
    expect(headerRule.style.height).to.contain('--nav-height');
    expect(headerRule.style.height).to.contain('--promo-bar-height');
  });

  it('reserves nothing on pages that author their own promo bar', () => {
    expect(ownPromoRule, 'pages with their own promo bar are styled').to.exist;
    expect(ownPromoRule.style.getPropertyValue('--promo-bar-height').trim()).to.equal('0px');
  });

  it('reserves nothing on block-library previews, which load no header', () => {
    expect(previewRule, 'block-library previews are styled').to.exist;
    expect(previewRule.style.getPropertyValue('--promo-bar-height').trim()).to.equal('0px');
  });

  it('gives the ribbon the height the page reserved for it', () => {
    expect(ribbonRule, 'the ribbon row is styled in the header').to.exist;
    expect(ribbonRule.style.height).to.equal('var(--promo-bar-height)');
  });

  it('drops the mega-menu panel to the bottom of the header', () => {
    expect(panelRule, 'the open panel is styled').to.exist;
    expect(panelRule.style.top).to.equal(headerRule.style.height);
  });
});

describe('Header mega-menu panel width', () => {
  // The open panel is fixed and spans the viewport, with padding that pushes
  // its columns onto the 1264px container. Padding must count inside that
  // width, or the panel runs past the right edge and clips its last column.
  let panelRule;

  before(async () => {
    const res = await fetch('/blocks/header/header.css');
    const sheet = new CSSStyleSheet();
    await sheet.replace(await res.text());
    const selector = 'header nav .nav-sections .default-content-wrapper > ul > li.nav-mega > ul';
    panelRule = [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSMediaRule)
      .flatMap((rule) => [...rule.cssRules])
      .find((rule) => rule.selectorText === selector && rule.style.position === 'fixed');
    expect(panelRule, 'the open panel is styled').to.exist;
  });

  it('spans the viewport and pads its columns', () => {
    expect(panelRule.style.width, 'the panel spans its containing block').to.equal('100%');
    expect(panelRule.style.getPropertyValue('padding-inline'), 'the panel pads its columns')
      .to.not.equal('');
  });

  it('counts that padding inside the width', () => {
    expect(panelRule.style.boxSizing).to.equal('border-box');
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

describe('Header search form', () => {
  /** The nav-tools section as authors leave it, with the :search: icon. */
  function navTools() {
    const div = document.createElement('div');
    div.className = 'nav-tools';
    div.innerHTML = '<p><span class="icon icon-search"></span></p>';
    return div;
  }

  it('sends live\'s keywords parameter to /search', () => {
    const { panel } = buildSearch(navTools(), () => {});
    const form = panel.querySelector('form');
    expect(form.getAttribute('action')).to.equal('/search');
    expect(form.getAttribute('method')).to.equal('get');
    expect(form.querySelector('input[name="keywords"]'), 'input named keywords').to.exist;
    expect(form.querySelector('input[name="q"]'), 'no input named q').to.not.exist;
  });

  it('returns nothing when authors leave the search icon out', () => {
    const empty = document.createElement('div');
    expect(buildSearch(empty, () => {})).to.equal(null);
  });
});

describe('Header dropdown disclosures', () => {
  // openOnKeydown tested className for equality against 'nav-drop', so it
  // stopped firing the moment decorate added nav-mega, and aria-expanded never
  // left false. The state now lives on the link that already holds the item,
  // the way live holds it, so the browser does the focus work.
  function buildSections() {
    const sections = document.createElement('div');
    sections.className = 'nav-sections';
    sections.innerHTML = `
      <div class="default-content-wrapper">
        <ul>
          <li class="nav-drop nav-mega">
            <p><a href="/tires">Tires</a></p>
            <ul><li><a href="/tires/winter">Winter</a></li></ul>
          </li>
          <li class="nav-drop nav-mega">
            <p><a href="/stores">Stores</a></p>
            <ul><li><a href="/stores/near">Near me</a></li></ul>
          </li>
          <li><a href="/offers">Offers</a></li>
        </ul>
      </div>`;
    document.body.append(sections);
    return sections;
  }

  const items = (sections) => [...sections.querySelectorAll('.nav-drop')];
  const control = (item) => item.querySelector(':scope > p > a');

  afterEach(() => {
    document.querySelectorAll('body > .nav-sections').forEach((el) => el.remove());
  });

  it('makes each dropdown link the control for its own panel', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);

    items(sections).forEach((item) => {
      const link = control(item);
      const panel = item.querySelector(':scope > ul');
      expect(link.getAttribute('aria-haspopup')).to.equal('true');
      expect(panel.id, 'the panel is addressable').to.not.be.empty;
      expect(link.getAttribute('aria-controls')).to.equal(panel.id);
      expect(link.getAttribute('aria-expanded')).to.equal('false');
    });
  });

  it('leaves an item without a panel alone', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);

    const plain = sections.querySelector('a[href="/offers"]');
    expect(plain.hasAttribute('aria-expanded')).to.be.false;
    expect(plain.hasAttribute('aria-haspopup')).to.be.false;
  });

  it('gives no list item a tabindex, so the browser keeps the focus order', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);

    items(sections).forEach((item) => expect(item.hasAttribute('tabindex')).to.be.false);
  });

  it('reports the panel open while focus is inside the item', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);
    const [tires] = items(sections);

    control(tires).focus();
    expect(control(tires).getAttribute('aria-expanded')).to.equal('true');
  });

  it('reports it closed again when focus leaves the item', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);
    const [tires, stores] = items(sections);

    control(tires).focus();
    control(stores).focus();
    expect(control(tires).getAttribute('aria-expanded')).to.equal('false');
    expect(control(stores).getAttribute('aria-expanded')).to.equal('true');
  });

  it('follows the pointer the same way', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => true);
    const [tires] = items(sections);

    tires.dispatchEvent(new Event('pointerenter'));
    expect(control(tires).getAttribute('aria-expanded')).to.equal('true');
    tires.dispatchEvent(new Event('pointerleave'));
    expect(control(tires).getAttribute('aria-expanded')).to.equal('false');
  });

  it('stays closed where the flyout does not apply', () => {
    const sections = buildSections();
    wireNavDisclosures(sections, () => false);
    const [tires] = items(sections);

    tires.dispatchEvent(new Event('pointerenter'));
    expect(control(tires).getAttribute('aria-expanded')).to.equal('false');
  });
});
