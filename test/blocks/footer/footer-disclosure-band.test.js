/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/footer/footer.js';

/*
 * Live holds its footer columns as collapsed disclosure rows to 768 and opens
 * them at 769. Ours opened them at 600, so the 600-768 band showed two open
 * columns and a side-by-side legal bar where live shows one collapsed stack.
 * Measured on continentaltire.com and on main, /tires/vancontact-winter,
 * 2026-08-02:
 *
 *     width   live footer   lists hidden   legal bar   ours before
 *      600    704          4 of 7          stacked     1087, 0 hidden, row
 *      700    704          4 of 7          stacked     1064, 0 hidden, row
 *      768    704          4 of 7          stacked     1042, 0 hidden, row
 *      769    783          0 of 7          row         1044, 0 hidden, row
 *
 * So live is SHORTER at 768 than at 769 and ours was the same height either
 * side, which is the tell that the boundary was in the wrong place.
 *
 * THIS DRIVES THE REAL ENTRY POINT. The collapse is a JavaScript decision and
 * the row layout is a CSS one, and the defect was that they agreed with each
 * other at the wrong width. A test that passed the collapsed flag in by hand
 * would assert only the CSS half, so this calls decorate() and lets the
 * block's own media query read the viewport.
 */

/** Where live opens its footer columns. Below this they are disclosure rows. */
const COLUMNS_FROM = 769;

const FIXTURE = '/test/blocks/footer/mock-footer-columns';

/** Loads the footer the way a page does, at the current viewport. */
async function mount() {
  document.body.innerHTML = '<footer><div class="footer block"></div></footer>';
  const block = document.querySelector('.footer.block');
  await decorate(block);
  const links = block.querySelector('.footer-links');
  expect(links, 'the footer fixture decorated').to.exist;
  if (links.getBoundingClientRect().height === 0) {
    throw new Error('the footer rendered with no box, so nothing here was measured');
  }
  return block;
}

const box = (el) => el.getBoundingClientRect();

/** The lists of the plain link columns, the ones live collapses. */
const navLists = (block) => [...block.querySelectorAll('.footer-links-group ul')]
  .filter((ul) => !ul.querySelector('.icon'));

/** Two boxes read as one row when their horizontal ranges do not overlap. */
function sideBySide(a, b) {
  const [x, y] = [box(a), box(b)];
  return y.left >= x.right - 2 || x.left >= y.right - 2;
}

describe(`Footer, the columns open at ${COLUMNS_FROM} the way live's do (#138)`, () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    const meta = document.createElement('meta');
    meta.name = 'footer';
    meta.content = FIXTURE;
    document.head.append(meta);
    sheets = await Promise.all(['/styles/styles.css', '/blocks/footer/footer.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    // styles.css hides the body until `.appear`, and an undisplayed body gives
    // every element a 0 box, which compares as not-equal without saying so
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.head.querySelector('meta[name="footer"]')?.remove();
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  /*
   * 768 is live's last collapsed width. Ours opened here, which is the whole
   * of the band.
   */
  it(`collapses the link columns at ${COLUMNS_FROM - 1}`, async () => {
    await setViewport({ width: COLUMNS_FROM - 1, height: 900 });
    const block = await mount();
    expect(block.querySelector('.footer-links').classList.contains('footer-links-stacked'), 'the stacked layout applies').to.be.true;
    const open = navLists(block).filter((ul) => box(ul).height > 0);
    expect(open.map((ul) => ul.previousElementSibling?.textContent.trim()), 'no link column list is open').to.eql([]);
  });

  /*
   * Collapsed rows run one under the other. Two open columns put two headings
   * on the same line, which is what a reader saw in this band.
   */
  it(`gives each link column its own row at ${COLUMNS_FROM - 1}`, async () => {
    await setViewport({ width: COLUMNS_FROM - 1, height: 900 });
    const block = await mount();
    const rows = [...block.querySelectorAll('.footer-links-collapsible h2')]
      .map((h) => Math.round(box(h).top));
    expect(rows.length, 'the fixture has link columns to collapse').to.be.at.least(4);
    expect(new Set(rows).size, 'one heading per row').to.equal(rows.length);
  });

  /*
   * Live stacks the copyright above the legal links to 768 and sets them side
   * by side from 769. Ours went side by side from 600.
   */
  it(`stacks the legal bar at ${COLUMNS_FROM - 1}`, async () => {
    await setViewport({ width: COLUMNS_FROM - 1, height: 900 });
    const block = await mount();
    const copy = block.querySelector('.footer-bottom p');
    const legal = block.querySelector('.footer-bottom ul');
    expect(copy, 'the fixture has a copyright line').to.exist;
    expect(legal, 'the fixture has a legal link list').to.exist;
    expect(sideBySide(copy, legal), 'the copyright and the legal links are not on one line').to.be.false;
  });

  it(`opens the link columns at ${COLUMNS_FROM}`, async () => {
    await setViewport({ width: COLUMNS_FROM, height: 900 });
    const block = await mount();
    expect(block.querySelector('.footer-links').classList.contains('footer-links-stacked'), 'the stacked layout is off').to.be.false;
    const closed = navLists(block).filter((ul) => box(ul).height === 0);
    expect(closed, 'every link column list is open').to.eql([]);
  });

  it(`sets the legal bar on one line at ${COLUMNS_FROM}`, async () => {
    await setViewport({ width: COLUMNS_FROM, height: 900 });
    const block = await mount();
    const copy = block.querySelector('.footer-bottom p');
    const legal = block.querySelector('.footer-bottom ul');
    expect(sideBySide(copy, legal), 'the copyright and the legal links share a line').to.be.true;
  });

  /*
   * The direction live runs in, and the one number that does not depend on the
   * fixture's own copy: collapsed rows are shorter than open columns, so the
   * footer grows across the boundary rather than staying flat through it.
   */
  it(`leaves the footer shorter at ${COLUMNS_FROM - 1} than at ${COLUMNS_FROM}`, async () => {
    await setViewport({ width: COLUMNS_FROM - 1, height: 900 });
    const collapsed = Math.round(box(await mount()).height);
    await setViewport({ width: COLUMNS_FROM, height: 900 });
    const open = Math.round(box(await mount()).height);
    expect(collapsed, `${collapsed} collapsed against ${open} open`).to.be.below(open);
  });
});
