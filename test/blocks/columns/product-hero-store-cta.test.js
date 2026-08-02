/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The store control in the product hero, which live runs the width of the column
 * below its own 769.
 *
 * Live's is `<a class="btn btn--yellow">` in `.tire-page__description-cta`, and
 * `@media screen and (max-width: 768px) { .tire-page__description-cta .btn
 * { width: 100% } }`. That column is live's plain `.container`, 1168 capped with
 * 20px of padding under 769, so the control measures 335 at 375 and 728 at 768.
 * Above 769 live leaves it a pill in a centred block.
 *
 * Ours was a pill at every width: 144.7px, read on the published host at 1440 on
 * /tires/extremecontact-sport-02, and the same content-sized pill below 769
 * where live fills the column.
 *
 * The other control in the column keeps its own width. Live draws the rebate as
 * a small notched flag (#241), and the rule that fills the store control has to
 * stay off it.
 *
 * Rendered boxes at a real width, in the iframe idiom
 * test/styles/page-container.test.js uses, because the claim is a measured width
 * inside a media query and the declared-value reader in product-hero.test.js
 * drops media rules whole.
 */

/** Live's two steps below 769, and the two widths above it. */
const COLUMN = { 375: 335, 768: 728 };
const PILL = [769, 1440];

/** The hero as the page carries it: buttons already decorated, a rebate flag. */
const doc = () => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/columns/columns.css">
</head><body class="appear"><main>
  <div class="section columns-container"><div class="columns-wrapper">
    <div class="columns product-hero block"><div>
      <div><p>a photograph</p></div>
      <div>
        <p class="product-hero-rebate"><a class="button primary" href="/promotion">Get up to $70</a></p>
        <h1>ExtremeContact Sport02</h1>
        <p>A dynamic, summer ultra-high performance tire for passenger cars.</p>
        <p class="button-wrapper"><a class="button primary" href="/store-finder">Find a store</a></p>
        <p><a href="/warranty">Total Confidence Plan</a></p>
      </div>
    </div></div>
  </div></div>
</main></body></html>`;

/**
 * Renders the hero at one width, so every width is read in one run without
 * moving the runner's own viewport.
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:1200px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc();
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

const box = (settled, selector) => settled.querySelector(selector).getBoundingClientRect();
const STORE = '.columns.product-hero a.button[href="/store-finder"]';
const CELL = '.columns.product-hero > div > div:last-child';

describe('product hero, the store control live fills the column with', () => {
  Object.entries(COLUMN).forEach(([width, want]) => {
    describe(`at ${width}`, () => {
      let settled;

      before(async () => { settled = await renderAt(Number(width)); });
      after(() => settled.defaultView.frameElement.remove());

      /* styles.css holds `body` at `display: none` until `.appear`, and an
         undisplayed box reads 0 everywhere, which compares as not-equal without
         announcing that nothing was measured. */
      it('renders into a laid-out document at the width asked for', () => {
        expect(settled.defaultView.innerWidth, 'iframe viewport').to.equal(Number(width));
        expect(box(settled, STORE).height, 'the control').to.be.greaterThan(0);
      });

      it(`runs it live's ${want}px, the whole column`, () => {
        expect(Math.round(box(settled, STORE).width)).to.equal(want);
        expect(Math.round(box(settled, STORE).width), 'the column')
          .to.equal(Math.round(box(settled, CELL).width));
      });

      it('starts it where the column starts', () => {
        expect(Math.round(box(settled, STORE).left))
          .to.equal(Math.round(box(settled, CELL).left));
      });

      it('leaves the rebate flag its own width', () => {
        const flag = box(settled, '.product-hero-rebate a.button');
        expect(flag.width, 'the flag').to.be.lessThan(box(settled, CELL).width);
      });
    });
  });

  PILL.forEach((width) => {
    describe(`at ${width}`, () => {
      let settled;

      before(async () => { settled = await renderAt(width); });
      after(() => settled.defaultView.frameElement.remove());

      it('renders into a laid-out document at the width asked for', () => {
        expect(settled.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        expect(box(settled, STORE).height, 'the control').to.be.greaterThan(0);
      });

      it('leaves it the pill live leaves above 769', () => {
        const control = box(settled, STORE);
        expect(control.width, 'the control').to.be.lessThan(box(settled, CELL).width);
        expect(control.width, 'a pill, not a bar').to.be.lessThan(250);
      });
    });
  });
});
