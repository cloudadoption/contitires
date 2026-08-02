/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { buildFooterContent, setFooterDisclosures } from '../../../blocks/footer/footer.js';

/*
 * The footer's column rows sat 32px apart where live's sit 50. Measured on
 * live and on this tree on 2026-08-02, on /tires/vancontact-winter, reading
 * the rendered rows rather than the declarations:
 *
 *     width   live row gap   ours before
 *      1440   50             32
 *       900   50             32   two rows, so the 50 is what a reader sees
 *
 * THE COLUMN GAP IS NOT PART OF THIS. Live's is 60 and ours is 32, and that
 * difference is what lets six of our tracks fit at 1184 where live needs 1260.
 * It belongs to the column-band decision recorded in docs/parity-with-live.md,
 * so it is guarded here rather than changed.
 *
 * Below 769 the columns become live's stacked disclosure rows, which set
 * `gap: 0` and space themselves with their own dividers. The row gap does not
 * reach there and must not start to.
 *
 * COMPUTED AT A WIDTH, NOT DECLARED. The gap is controlled by media queries
 * either side of it, so reading cssRules would report what is written rather
 * than what wins.
 */

/** Live's row gap between footer column rows. */
const LIVE_ROW_GAP = 50;

/** Our column gutter, which the column-band decision keeps at 32. */
const OUR_COLUMN_GAP = 32;

/** Where our six-column layout starts, which this must not move. */
const SIX_COLUMN_FROM = 1184;

function buildFragment() {
  const fragment = document.createElement('div');
  const group = (heading, links) => `
    <h3>${heading}</h3>
    <ul>${links.map((l) => `<li><a href="/${l}">${l}</a></li>`).join('')}</ul>`;
  fragment.innerHTML = [
    group('Stay In Touch', ['Find Store', 'Contact']),
    group('Search For Tire', ['By Vehicle', 'By Size']),
    group('Our Tires', ['Passenger', 'Truck']),
    group('Why Continental', ['Technology', 'Safety']),
    group('Contact Us', ['Customer Care', 'Warranty']),
    group('Company Info', ['Brand', 'Careers']),
  ].join('');
  return fragment;
}

/** Mounts the real footer content and applies the disclosure state for `w`. */
function mount(w) {
  document.body.innerHTML = '<footer class="footer block"></footer>';
  const footer = document.querySelector('footer');
  footer.append(buildFooterContent(buildFragment()));
  const links = footer.querySelector('.footer-links');
  // decorate() drives this off `(width < 769px)`; mirror it so the fixture is
  // in the same state the page is at this width
  setFooterDisclosures(links, w < 769);
  if (links.getBoundingClientRect().height === 0) {
    throw new Error('the footer fixture rendered with no box, so nothing here was measured');
  }
  return links;
}

const rowGapOf = (el) => Math.round(parseFloat(getComputedStyle(el).rowGap) || 0);
const colGapOf = (el) => Math.round(parseFloat(getComputedStyle(el).columnGap) || 0);

/** The gap a reader sees: the first vertical space between two rows. */
function renderedRowGap(el) {
  const kids = [...el.children]
    .map((k) => k.getBoundingClientRect())
    .filter((b) => b.width > 0);
  for (let i = 0; i < kids.length - 1; i += 1) {
    if (kids[i + 1].top > kids[i].bottom - 0.5) {
      return Math.round(kids[i + 1].top - kids[i].bottom);
    }
  }
  return null;
}

describe('Footer, the column rows take live\'s 50px gap (#138)', () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
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
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  [1440, 900].forEach((w) => {
    it(`sets the row gap to live's ${LIVE_ROW_GAP} at ${w}`, async () => {
      await setViewport({ width: w, height: 900 });
      expect(rowGapOf(mount(w))).to.equal(LIVE_ROW_GAP);
    });
  });

  /*
   * 900 is three columns and the fixture carries six groups, so there are two
   * rows and the gap is a space a reader can see rather than a property.
   */
  it(`puts ${LIVE_ROW_GAP}px between the two rows at 900`, async () => {
    await setViewport({ width: 900, height: 900 });
    const links = mount(900);
    expect(renderedRowGap(links), 'a second row exists to measure against').to.not.be.null;
    expect(renderedRowGap(links)).to.equal(LIVE_ROW_GAP);
  });

  /*
   * The gutter is the column-band decision's number, not this fix's. It fails
   * if the row gap is written as the `gap` shorthand, which takes the column
   * gap with it and moves the width at which six tracks fit.
   */
  [1440, 900].forEach((w) => {
    it(`leaves the column gutter at ${OUR_COLUMN_GAP} at ${w}`, async () => {
      await setViewport({ width: w, height: 900 });
      expect(colGapOf(mount(w))).to.equal(OUR_COLUMN_GAP);
    });
  });

  /*
   * Live's stacked footer below 600 spaces its disclosure rows with their own
   * dividers, so the columns' gap is 0 there and a row gap must not leak in.
   */
  it('leaves the stacked rows at 0 at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const links = mount(375);
    expect(links.classList.contains('footer-links-stacked'), 'the stacked layout applies').to.be.true;
    expect(rowGapOf(links)).to.equal(0);
  });

  /*
   * The six-column width is the deviation recorded in docs/parity-with-live.md:
   * live goes to six at 1091 and overflows its own container to do it, ours
   * waits until all six fit. A change to the gutter moves this silently, so it
   * is asserted on both sides of the edge.
   */
  it(`still turns six columns on at ${SIX_COLUMN_FROM} and not before`, async () => {
    await setViewport({ width: SIX_COLUMN_FROM - 1, height: 900 });
    const below = getComputedStyle(mount(SIX_COLUMN_FROM - 1)).gridTemplateColumns.trim().split(/\s+/).length;
    await setViewport({ width: SIX_COLUMN_FROM, height: 900 });
    const at = getComputedStyle(mount(SIX_COLUMN_FROM)).gridTemplateColumns.trim().split(/\s+/).length;
    expect(below, `three columns at ${SIX_COLUMN_FROM - 1}`).to.equal(3);
    expect(at, `six columns at ${SIX_COLUMN_FROM}`).to.equal(6);
  });
});
