/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The left column as `decorate` in blocks/tire-listing/tire-listing.js leaves
 * it: a toggle and the filter panel inside an `aside`, beside the results.
 */
const LAYOUT = `
  <div class="tire-listing block">
    <div class="tire-listing-layout">
      <aside class="tire-listing-side">
        <button type="button" class="tire-listing-toggle button secondary" aria-expanded="false" aria-controls="tire-listing-panel">Show filter</button>
        <div class="tire-listing-panel" id="tire-listing-panel">
          <form class="tire-listing-filters">
            <h2 id="tire-listing-filters-title">Filter Tires By</h2>
            <fieldset><legend>Driving Condition</legend><ul><li><input type="checkbox" id="c" value="Touring"><label for="c">Touring</label></li></ul></fieldset>
            <button type="button" class="tire-listing-reset">Reset filter</button>
            <button type="button" class="tire-listing-apply button primary">Apply</button>
          </form>
        </div>
      </aside>
      <div class="tire-listing-results">
        <div class="tire-listing-header">
          <div class="tire-listing-status" role="status"><h2 class="tire-listing-count" tabindex="-1">46 Results</h2></div>
          <div class="tire-listing-tools"><button type="button" class="tire-listing-print">Print results</button></div>
        </div>
        <ul class="tire-listing-cards"><li class="tire-listing-card">a card</li></ul>
      </div>
    </div>
  </div>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/tire-listing/tire-listing.css">
</head><body class="appear"><main><div class="section"><div>${LAYOUT}</div></div></main></body></html>`;

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
 * Live swaps its filter toggle for an open sidebar at 769. Ours held the toggle
 * to 900, so across 769 to 899 we drew a control live has already replaced.
 * Read off live's own stylesheet on 2026-08-02, every one of them capped at
 * `max-width: 768`:
 *
 *     .tire-listing-page__columns { display: block; padding: var(--space-80) 0 }
 *     .tire-listing-page__columns > * { display: grid;
 *       grid-template-columns: 250px 1fr; grid-column-gap: 130px }
 *     .tire-listing-page__left { padding-left: var(--space-20) }
 *     .tire-listing-page__right { padding-right: var(--space-20) }
 *     .container { padding: 0 var(--container-padding, var(--space-16)) }
 *
 * with `display: block`, `padding-left: 0`, `padding-right: 0`, `padding: 38px 0`
 * and `padding: 0 20px` respectively under the cap. Measured on /tires in #533:
 * live's `.tire-listing-page__left button` is 114x32 at 768 and 0x0 at 769,
 * ours was 114x37 at 768, 769 AND 899, and 0x0 only from 900.
 *
 * The five rules move together because the panel is `display: none` at the base,
 * so a toggle hidden without the panel opened leaves the filters unreachable.
 * The 48px column gap and the 1200 step that widens it to live's 130 are not
 * touched here: that pair is its own reading.
 */
describe('Tire listing sidebar, live opens it at 769 (#533)', () => {
  [768, 769, 899, 900].forEach((width) => {
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
        expect(doc.querySelector('.tire-listing-card').getBoundingClientRect().height).to.be.above(0);
      });

      const open = width >= 769;

      it(`${open ? 'collapses' : 'draws'} the toggle`, () => {
        const box = doc.querySelector('.tire-listing-toggle').getBoundingClientRect();
        if (open) {
          expect(box.width, 'toggle width').to.equal(0);
          expect(box.height, 'toggle height').to.equal(0);
        } else {
          expect(box.width, 'toggle width').to.be.above(0);
          expect(box.height, 'toggle height').to.be.above(0);
        }
      });

      it(`${open ? 'collapses' : 'draws'} the apply button the toggle pairs with`, () => {
        const apply = doc.querySelector('.tire-listing-apply');
        expect(win.getComputedStyle(apply).display).to.equal(open ? 'none' : 'inline-flex');
      });

      it(`leaves the filters ${open ? 'reachable in an open panel' : 'behind the toggle'}`, () => {
        const panel = doc.querySelector('.tire-listing-panel');
        const style = win.getComputedStyle(panel);
        expect(style.display, 'panel display').to.equal(open ? 'block' : 'none');
        if (open) {
          expect(style.position, 'panel position').to.equal('static');
          expect(panel.getBoundingClientRect().height, 'panel height').to.be.above(0);
        }
      });

      it(`runs the layout as ${open ? 'two columns' : 'one'}`, () => {
        const layout = doc.querySelector('.tire-listing-layout');
        const tracks = win.getComputedStyle(layout).gridTemplateColumns.split(' ');
        expect(win.getComputedStyle(layout).display).to.equal(open ? 'grid' : 'block');
        if (open) {
          expect(tracks, 'two tracks').to.have.length(2);
          expect(tracks[0], 'live\'s 250px form track').to.equal('250px');
        }
      });

      it(`${open ? 'insets' : 'does not inset'} the two columns by live's 20px`, () => {
        const side = win.getComputedStyle(doc.querySelector('.tire-listing-side'));
        const results = win.getComputedStyle(doc.querySelector('.tire-listing-results'));
        expect(side.paddingLeft, 'side inset').to.equal(open ? '20px' : '0px');
        expect(results.paddingRight, 'results inset').to.equal(open ? '20px' : '0px');
      });

      it(`aligns the filters heading ${open ? 'left' : 'centre'}`, () => {
        const heading = doc.querySelector('.tire-listing-filters h2');
        expect(win.getComputedStyle(heading).textAlign).to.equal(open ? 'left' : 'center');
      });

      it(`pads the page ${open ? '80px' : '38px'} top and bottom`, () => {
        const style = win.getComputedStyle(doc.querySelector('.tire-listing'));
        expect(style.paddingTop, 'page padding top').to.equal(open ? '80px' : '38px');
        expect(style.paddingLeft, 'container gutter').to.equal(open ? '16px' : '20px');
      });
    });
  });
});
