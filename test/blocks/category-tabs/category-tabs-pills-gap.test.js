/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/category-tabs/category-tabs.js';

/**
 * The three Learn news pages carry TWO category-tabs blocks in one section: the
 * base tab bar, then the pill row under it. Ours put no air between them, so
 * the pills sat against the tab bar and its rule.
 *
 * Live's pill row is its own element, `div.nav-subtabs`, and it is the element
 * that carries the gap: `margin-top: 38px`. Read off continentaltire.com
 * /learn/news-and-events on 2026-08-03, from the bottom of `.nav-tabs` to the
 * top of `.nav-subtabs`:
 *
 *   1440   368 -> 406   38
 *   1024   283 -> 321   38
 *    769   319 -> 357   38
 *    375   339 -> 377   38
 *
 * One value at every width, so no breakpoint. /learn/news reads the same 38 at
 * 1440. Below live's own breakpoint the row holds a select rather than the
 * pills, and that select takes the same 38 from the tab bar, so the number is
 * the row's rather than the pills'.
 *
 * Ours read 0 at 1440 on the published page, wrapper to wrapper and row to row.
 *
 * Only `pills` moves. The base strip on /learn, /learn/tips, /learn/technology,
 * /learn/product-highlights and /experience/soccer, the `compact` strip on the
 * three /experience pages and the `jump` strip on /cruisingthecontinentalus all
 * stand alone in their section, and a top margin there would push the row off
 * live's y.
 */
const TABS = [
  { href: '/learn/tips', text: 'Tire tips' },
  { href: '/learn/technology', text: 'Technology' },
  { href: '/learn/news-and-events', text: 'News' },
];
const PILLS = [
  { href: '/learn/news-and-events', text: 'Everything' },
  { href: '/learn/news', text: 'News' },
  { href: '/learn/corporate', text: 'Corporate' },
];

const row = (items) => `<div><div>
  <ul>${items.map((i) => `<li><a href="${i.href}">${i.text}</a></li>`).join('')}</ul>
</div></div>`;

/** the news pages: base tab bar and pill row, two blocks in one section */
function buildNewsHeader() {
  document.body.innerHTML = `
    <main><div class="section category-tabs-container">
      <div class="category-tabs-wrapper">
        <div class="category-tabs block">${row(TABS)}</div>
      </div>
      <div class="category-tabs-wrapper">
        <div class="category-tabs pills block">${row(PILLS)}</div>
      </div>
    </div></main>`;
  document.querySelectorAll('.category-tabs.block').forEach((b) => decorate(b));
  return {
    tabs: document.querySelector('.category-tabs.block:not(.pills)'),
    pills: document.querySelector('.category-tabs.pills'),
  };
}

/** a page whose section holds one strip and nothing else */
function buildLoneStrip(variant) {
  document.body.innerHTML = `
    <main><div class="section category-tabs-container">
      <div class="category-tabs-wrapper">
        <div class="category-tabs ${variant} block">${row(TABS)}</div>
      </div>
    </div></main>`;
  const block = document.querySelector('.category-tabs.block');
  decorate(block);
  return block;
}

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

const gapBetween = (above, below) => below.getBoundingClientRect().top
  - above.getBoundingClientRect().bottom;

describe("Category tabs, the pill row's gap from the tab bar above it", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/blocks/category-tabs/category-tabs.css');
    // the page stays hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  [1440, 1024, 769, 375].forEach((width) => {
    it(`leaves live's 38px between the two rows at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      const { tabs, pills } = buildNewsHeader();
      expect(gapBetween(tabs, pills), 'block to block').to.be.closeTo(38, 0.5);
      expect(
        gapBetween(tabs.querySelector('ul'), pills.querySelector('ul')),
        'row to row',
      ).to.be.closeTo(38, 0.5);
    });
  });

  it('takes the gap from the pill row itself, the way live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    const { tabs, pills } = buildNewsHeader();
    expect(getComputedStyle(pills).marginTop).to.equal('38px');
    expect(getComputedStyle(tabs).marginBottom, 'nothing added under the tab bar').to.equal('0px');
  });

  it('keeps the tab bar at the top of its section', async () => {
    await setViewport({ width: 1440, height: 900 });
    const { tabs } = buildNewsHeader();
    const section = document.querySelector('.section.category-tabs-container');
    expect(
      tabs.getBoundingClientRect().top - section.getBoundingClientRect().top,
      'the row that opens the section stays flush with it',
    ).to.be.closeTo(0, 0.5);
  });

  ['', 'compact', 'jump'].forEach((variant) => {
    it(`adds nothing above a lone ${variant || 'base'} strip`, async () => {
      await setViewport({ width: 1440, height: 900 });
      const block = buildLoneStrip(variant);
      expect(getComputedStyle(block).marginTop).to.equal('0px');
    });
  });
});
