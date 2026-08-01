/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The results header and the pager as `buildHeader` and `buildPager` in
 * blocks/tire-listing/tire-listing.js leave them.
 *
 * The SECOND pager is the one-page shape: `buildPager` returns before it appends
 * the nav when `view.pageCount < 2`, so the `.tire-listing-pager` element itself
 * is still there. Three of the twelve pages carrying this block are in that
 * state, all-terrain at 3 results, all-weather at 2 and winter at 6, so a rule
 * that reached the pager only where there is paging would be wrong on a quarter
 * of the population. (#429)
 */
const CHROME = `
  <div class="tire-listing block">
    <div class="tire-listing-results">
      <div class="tire-listing-header">
        <div class="tire-listing-status" role="status"><h2 class="tire-listing-count" tabindex="-1">46 Results</h2></div>
        <div class="tire-listing-tools">
          <button type="button" class="tire-listing-print">Print results</button>
        </div>
      </div>
      <ul class="tire-listing-cards"><li class="tire-listing-card">a card</li></ul>
      <div class="tire-listing-pager-slot">
        <div class="tire-listing-pager">
          <p class="tire-listing-summary"><b>1-10</b> of 46 results</p>
          <nav class="tire-listing-pages" aria-label="Pagination"><a class="tire-listing-page" href="#">1</a></nav>
        </div>
      </div>
      <div class="tire-listing-pager-slot" id="one-page">
        <div class="tire-listing-pager">
          <p class="tire-listing-summary"><b>1-3</b> of 3 results</p>
        </div>
      </div>
    </div>
  </div>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/tire-listing/tire-listing.css">
</head><body class="appear"><main><div class="section"><div>${CHROME}</div></div></main></body></html>`;

/**
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the iframe's settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:1200px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = DOC;
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  return doc;
}

/**
 * Live steps this chrome at 769, not at the site's 600, and it steps both
 * elements together. Measured on all twelve pages carrying the block, live and
 * main, at 599, 600, 768 and 769: live's header is a flex column at 768 and a
 * row at 769 on 12 of 12, and its pager is `block` at 768 and `flex` at 769 on
 * 12 of 12. Ours stepped both at 600 on 12 of 12. `max-width: 768` and
 * `min-width: N` both match at N, so live's cap means our step belongs at 769,
 * the same one-pixel overlap #405, #421 and #423 each landed on.
 *
 * The readings are `getComputedStyle` at a chosen viewport rather than declared
 * values: a media query adds no specificity, so a declaration can be present and
 * still lose to source order, which a declaration-reading helper cannot see.
 */
describe('Tire listing page chrome, live steps it at 769', () => {
  [599, 600, 768, 769].forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      let win;
      before(async () => { doc = await renderAt(width); win = doc.defaultView; });
      after(() => doc.defaultView.frameElement.remove());

      // styles.css holds `body` at `display: none` until `body.appear`, so a
      // document missing that class measures zero and reads like a rule that
      // did not apply
      it('renders into a laid-out document at the width asked for', () => {
        expect(win.innerWidth, 'iframe viewport').to.equal(width);
        expect(doc.querySelector('.tire-listing-header').getBoundingClientRect().height,
          'a laid-out header has a height').to.be.above(0);
      });

      const stepped = width >= 769;

      it(`lays the header out as a ${stepped ? 'row' : 'column'}`, () => {
        const header = doc.querySelector('.tire-listing-header');
        expect(win.getComputedStyle(header).flexDirection).to.equal(stepped ? 'row' : 'column');
      });

      it(`draws the pager as ${stepped ? 'flex' : 'block'}`, () => {
        const pager = doc.querySelector('.tire-listing-pager');
        expect(win.getComputedStyle(pager).display).to.equal(stepped ? 'flex' : 'block');
      });

      it('draws the one-page pager the same way, where there is nothing to page', () => {
        const pager = doc.querySelector('#one-page .tire-listing-pager');
        expect(pager.querySelector('.tire-listing-pages'), 'no nav on a single page').to.equal(null);
        expect(win.getComputedStyle(pager).display).to.equal(stepped ? 'flex' : 'block');
      });
    });
  });
});
