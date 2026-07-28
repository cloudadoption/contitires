/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { markActive } from '../../../blocks/category-tabs/category-tabs.js';

/** A category-tabs list with the learn category links. */
function tabsList() {
  const ul = document.createElement('ul');
  ul.innerHTML = [
    '/learn/tips',
    '/learn/technology',
    '/learn/news-and-events',
    '/learn/product-highlights',
    '/ev-compatible',
  ].map((h) => `<li><a href="${h}">${h}</a></li>`).join('');
  return ul;
}

describe('Category tabs active state', () => {
  it('marks the tab matching the current path as current', () => {
    const list = tabsList();
    markActive(list, '/learn/technology');
    const active = list.querySelectorAll('.category-tab-active');
    expect(active).to.have.length(1);
    expect(active[0].getAttribute('href')).to.equal('/learn/technology');
    expect(active[0].getAttribute('aria-current')).to.equal('page');
  });

  it('marks no tab when the path matches none (e.g. the hub)', () => {
    const list = tabsList();
    markActive(list, '/learn');
    expect(list.querySelectorAll('.category-tab-active')).to.have.length(0);
  });

  it('ignores a trailing slash on the current path', () => {
    const list = tabsList();
    markActive(list, '/learn/tips/');
    const active = list.querySelectorAll('.category-tab-active');
    expect(active).to.have.length(1);
    expect(active[0].getAttribute('href')).to.equal('/learn/tips');
  });
});

/**
 * Live's category strip is one row at every width: it never wraps, it scrolls
 * when it does not fit, and it centres when it does. Read off
 * continentaltire.com/learn/tips at 375, 600, 700, 768, 769, 900 and 1440,
 * where the row is nowrap with overflow-x auto throughout.
 *
 * Ours had a max-width query at 700 that swapped a wrapping centred row in
 * above it. Issue #113.
 */
describe('Category tabs, the strip live runs at every width', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/category-tabs/category-tabs.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document.body.innerHTML = `
      <main><div class="section category-tabs-container"><div class="category-tabs-wrapper">
        <div class="category-tabs block"><div><div>${tabsList().outerHTML}</div></div></div>
      </div></div></main>`;
    document.querySelector('.category-tabs ul').className = 'category-tabs-list';
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  const list = () => document.querySelector('.category-tabs-list');
  const rows = () => new Set([...list().children]
    .map((li) => Math.round(li.getBoundingClientRect().top))).size;

  [375, 600, 700, 900, 1200].forEach((width) => {
    it(`keeps the tabs on one row at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      expect(rows()).to.equal(1);
      expect(getComputedStyle(list()).flexWrap).to.equal('nowrap');
    });
  });

  it('scrolls to the first tab where the row does not fit', async () => {
    await setViewport({ width: 375, height: 900 });
    const ul = list();
    expect(ul.scrollWidth, 'content wider than the strip').to.be.greaterThan(ul.clientWidth);
    expect(getComputedStyle(ul).overflowX).to.equal('auto');
    // a centred overflowing row clips its start out of reach
    const first = ul.firstElementChild.getBoundingClientRect();
    expect(Math.round(first.left)).to.equal(Math.round(ul.getBoundingClientRect().left));
  });

  it('centres the row where it fits', async () => {
    await setViewport({ width: 1200, height: 900 });
    const ul = list();
    const box = ul.getBoundingClientRect();
    const lead = ul.firstElementChild.getBoundingClientRect().left - box.left;
    const trail = box.right - ul.lastElementChild.getBoundingClientRect().right;
    expect(lead, 'leading gap').to.be.greaterThan(0);
    expect(Math.round(lead)).to.be.closeTo(Math.round(trail), 1);
  });
});
