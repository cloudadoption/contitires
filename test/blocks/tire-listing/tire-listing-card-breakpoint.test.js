/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * One result card as `buildCard` in blocks/tire-listing/tire-listing.js leaves
 * it: a media column and a body holding the title, the rating, the badges, the
 * description and the CTA.
 */
const CARD = `
  <div class="tire-listing block">
    <ul class="tire-listing-cards">
      <li class="tire-listing-card">
        <div class="tire-listing-card-media">
          <a href="/tires/procontact-tx10" tabindex="-1" aria-hidden="true">
            <img src="/tire.png" alt="" loading="lazy" width="220" height="220">
          </a>
        </div>
        <div class="tire-listing-card-body">
          <h3 class="tire-listing-card-title"><a href="/tires/procontact-tx10">
            <span>ProContact TX10</span></a></h3>
          <div class="tire-listing-rating"><span>4.6</span></div>
          <ul class="tire-listing-badges">
            <li class="tire-listing-badge"><span class="tire-listing-badge-label">Passenger</span></li>
          </ul>
          <p class="tire-listing-card-desc">An all-season tire.</p>
          <a class="tire-listing-cta button secondary" href="/tires/procontact-tx10">See Details</a>
        </div>
      </li>
    </ul>
  </div>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/tire-listing/tire-listing.css">
</head><body class="appear"><main><div class="section"><div>${CARD}</div></div></main></body></html>`;

/**
 * Renders the card in an iframe of the given width, so the block's media
 * queries resolve against a viewport this test chooses rather than the runner's.
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
 * Live's card is a ROW by default and turns into a COLUMN under its own
 * `max-width: 768`, where it scopes twelve `tire-teaser` rules. Ours was written
 * the other way round, a column at the base turning into a row and a grid, and
 * it turned at the site's 600. So between 600 and 768 the two cards were
 * different shapes, and 375, 900 and 1440 all miss that band.
 *
 * The twelve were verified rather than re-scraped: live's stylesheet holds 27
 * `tire-teaser` rules, 13 under no media query, 12 under `max-width: 768`, one
 * at 1024 and one in print, counted with a brace walker so a multi-line selector
 * list cannot collapse to its last line.
 *
 * The values on both sides already agreed. Our small card carries live's small
 * padding, its centring and its 100px image; our large card carries live's base
 * padding, its 170px media column and its 28px gutter. Only the boundary moved.
 *
 * 769 rather than 768, because `max-width: N` and `min-width: N` BOTH match at
 * N: live's column form applies at exactly 768, so ours must start the row form
 * one pixel above it. 768 is iPad portrait, so the off-by-one lands on a real
 * device. 600 and 768 are in the sweep for that reason. (#423)
 */
describe('tire listing card, live\'s column-to-row step (#423)', () => {
  const SHAPE = {
    375: 'column', 600: 'column', 768: 'column', 769: 'row', 900: 'row', 1440: 'row',
  };

  Object.keys(SHAPE).map(Number).forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      before(async () => { doc = await renderAt(width); });
      after(() => doc.defaultView.frameElement.remove());

      const style = (sel) => doc.defaultView.getComputedStyle(doc.querySelector(sel));

      it('renders into a laid-out document at the width asked for', () => {
        expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        const card = doc.querySelector('.tire-listing-card');
        expect(card.getBoundingClientRect().height, 'a laid-out card has a height')
          .to.be.above(0);
      });

      it(`stacks the card as a ${SHAPE[width]}, as live does`, () => {
        expect(style('.tire-listing-card').flexDirection).to.equal(SHAPE[width]);
      });

      it(`lays the body out as ${SHAPE[width] === 'row' ? 'a grid' : 'a flex column'}`, () => {
        expect(style('.tire-listing-card-body').display)
          .to.equal(SHAPE[width] === 'row' ? 'grid' : 'flex');
      });

      // live centres the title under 768 and leaves it alone above, so the
      // override belongs on the same boundary as the rest of the card
      it(`centres the title: ${SHAPE[width] === 'row' ? 'no' : 'yes'}`, () => {
        expect(style('.tire-listing-card-title').textAlign)
          .to.equal(SHAPE[width] === 'row' ? 'left' : 'center');
      });

      // the media column is live's 170px beside the body above the step and its
      // 100px image above the body below it
      it(`gives the media column live's ${SHAPE[width] === 'row' ? '170px gutter' : 'no gutter'}`, () => {
        expect(style('.tire-listing-card-media').marginRight)
          .to.equal(SHAPE[width] === 'row' ? '28px' : '0px');
      });
    });
  });
});
