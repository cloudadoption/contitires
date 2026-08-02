/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * Live turns the finder bar into a row at 769 and this stylesheet does it at
 * 900, so between 769 and 899 our bar is the 124 column where live's is the 56
 * row. Read off live's own stylesheet rather than a browser:
 *
 *     .store-finder-nav-banner__item     flex-direction: column   max-width: 768px
 *     .store-finder-nav-banner__items    flex-direction: column   max-width: 768px
 *     .store-finder-nav-banner           padding: var(--space-12) 0   base
 *     .store-finder-nav-banner           padding: var(--space-22) 0   max-width: 768px
 *
 * and confirmed in the browser on `/`, live against this tree:
 *
 *     width   live bar   live item   ours bar   ours item
 *      768    124        52 column   124        52 column
 *      769     56        32 row      124        52 column
 *      800     56        32 row      124        52 column
 *      900     56        32 row       56        32 row
 *
 * THE DIRECTION AND THE PADDING ARE ONE CHANGE. `.perfect-fit-item`'s direction
 * and `.perfect-fit`'s own row padding are in two separate 900 queries, and live
 * steps both at 768/769. Moving one alone would flip the bar to a row at one
 * width and give it its row padding at another.
 *
 * THE SELECTOR REACHES THREE AUTHORED SHAPES and the step was measured on each
 * before it moved, rather than scoped on a guess:
 *
 *     shape    ours 768     ours 800     ours 900   live 768   live 800
 *     bar      124          124          56         124        56
 *     strip    70.19        70.19        50         50         50
 *     card     132          132          132        not read   not read
 *
 * So the strip moves TOWARD live in the band: live's listing page carries a
 * different component, `div.tire-listing-page__find-perfect-fit`, which is 50
 * tall at 768 and at 800 with no step of its own, and ours reads 50 once the
 * item is a row. The card cannot be reached at all, because
 * `.perfect-fit.card .perfect-fit-item` sets `flex-direction: column` at 0-3-0
 * and out-specifies the query. Both are pinned below so neither can drift.
 *
 * THESE ARE COMPUTED VALUES AT A WIDTH. A media query beaten by a base rule
 * reads correct in the CSSOM and never reaches the page, which is #466's shape.
 * Issue #505.
 */

/** Live's bar either side of its own step, and ours at the old one. */
const LIVE = {
  768: { bar: 124, item: 52, dir: 'column' },
  769: { bar: 56, item: 32, dir: 'row' },
  900: { bar: 56, item: 32, dir: 'row' },
};

/** The listing strip, which the step reaches and improves. */
const STRIP = {
  768: { bar: 70.19, item: 44.19, dir: 'column' },
  769: { bar: 50, item: 24, dir: 'row' },
  900: { bar: 50, item: 24, dir: 'row' },
};

/** The product hero's card, which the step cannot reach at any width. */
const CARD = { bar: 132, item: 58, dir: 'column' };

const round = (n) => Math.round(n * 100) / 100;
const rect = (el) => round(el.getBoundingClientRect().height);

/**
 * One authored shape, decorated by the block itself so the fixture cannot drift
 * from what it builds.
 * @param {string} classes the block's authored classes
 * @param {string} heading the bar's heading, or '' for the listing strip
 * @param {string[]} items the shortcut labels
 * @returns {string} the decorated `<main>`
 */
function shape(classes, heading, items) {
  const host = document.createElement('div');
  host.innerHTML = `
    <main><div class="section black perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit ${classes} block">
        <div><div>${heading ? `<p>${heading}</p>` : ''}</div></div>
        <div>${items.map((item) => `<div><p>${item}</p></div>`).join('')}</div>
      </div>
    </div></div></main>`;
  decorate(host.querySelector('.perfect-fit.block'));
  return host.innerHTML;
}

const BAR = () => shape('', 'Find your perfect fit:', ['By Vehicle', 'By Tire Size', 'By Plate']);
const LISTING = () => shape('', '', ['Find your perfect fit']);
const PRODUCT_CARD = () => shape('card', 'Does this tire fit? Check now:', []);

const doc = (body) => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/perfect-fit/perfect-fit.css">
</head><body class="appear">${body}</body></html>`;

/**
 * Renders one fixture at one width, so both sides of the step are read in one
 * run without moving the runner's own viewport.
 * @param {number} width the viewport width to render at
 * @param {string} body the markup to render
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width, body) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc(body);
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

describe('Perfect fit, live steps the bar at 769 (#505)', () => {
  describe('the homepage bar', () => {
    Object.entries(LIVE).forEach(([width, want]) => {
      describe(`at ${width}`, () => {
        let settled;
        before(async () => { settled = await renderAt(Number(width), BAR()); });
        after(() => settled.defaultView.frameElement.remove());

        /* styles.css holds `body` at `display: none` until `.appear`, and an
           undisplayed body reads 0 everywhere, which compares as not-equal
           without announcing that nothing was measured. */
        it('renders into a laid-out document at the width asked for', () => {
          expect(settled.defaultView.innerWidth, 'iframe viewport').to.equal(Number(width));
          expect(rect(settled.querySelector('.perfect-fit')), 'the bar').to.be.greaterThan(0);
        });

        it(`is live's ${want.bar}px bar`, () => {
          expect(rect(settled.querySelector('.perfect-fit'))).to.equal(want.bar);
        });

        it(`runs its shortcuts as a ${want.dir} at live's ${want.item}px`, () => {
          const item = settled.querySelector('.perfect-fit-item');
          expect(settled.defaultView.getComputedStyle(item).flexDirection).to.equal(want.dir);
          expect(rect(item)).to.equal(want.item);
        });

        /* THE DIRECTION AND THE PADDING STEP TOGETHER. A bar that is a row on
           22px of padding is 76 rather than 56, so this fails if only one of
           the two queries moves. */
        it(`pads the bar the way live pads a ${want.dir}`, () => {
          const bar = settled.defaultView.getComputedStyle(settled.querySelector('.perfect-fit'));
          const pad = want.dir === 'row' ? '12px' : '22px';
          expect([bar.paddingTop, bar.paddingBottom]).to.eql([pad, pad]);
        });
      });
    });
  });

  /*
   * The listing pages' single CTA. The step reaches it, and live's counterpart
   * there is 50 tall at 768 and at 800 alike, so a row from 769 moves it toward
   * live rather than away. Its 70.19 below the step is live's 50 too and that is
   * a separate defect, pinned here so this change cannot be read as fixing it.
   */
  describe('the listing pages\' single-CTA strip', () => {
    Object.entries(STRIP).forEach(([width, want]) => {
      it(`is ${want.bar} on a ${want.dir} item at ${width}`, async () => {
        const settled = await renderAt(Number(width), LISTING());
        expect(!!settled.querySelector('.perfect-fit-label'), 'the strip has no heading').to.be.false;
        expect(rect(settled.querySelector('.perfect-fit')), 'the strip').to.equal(want.bar);
        const item = settled.querySelector('.perfect-fit-item');
        expect(settled.defaultView.getComputedStyle(item).flexDirection).to.equal(want.dir);
        expect(rect(item), 'its item').to.equal(want.item);
        settled.defaultView.frameElement.remove();
      });
    });
  });

  /*
   * The product hero's card, which the step must not reach at any width.
   * `.perfect-fit.card .perfect-fit-item` sets column at 0-3-0 and out-specifies
   * the query, so this passes before the change as well as after it. Its break
   * is removing that declaration.
   */
  describe('the product hero\'s card', () => {
    [768, 769, 900].forEach((width) => {
      it(`is untouched at ${width}`, async () => {
        const settled = await renderAt(width, PRODUCT_CARD());
        const item = settled.querySelector('.perfect-fit-item');
        expect(settled.defaultView.getComputedStyle(item).flexDirection, 'the card stacks')
          .to.equal(CARD.dir);
        expect(rect(item), 'its search').to.equal(CARD.item);
        expect(rect(settled.querySelector('.perfect-fit.card')), 'the card').to.equal(CARD.bar);
        settled.defaultView.frameElement.remove();
      });
    });
  });
});
