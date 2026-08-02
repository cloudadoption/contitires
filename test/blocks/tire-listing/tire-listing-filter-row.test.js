/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';

/**
 * Below 769 live puts the filter control and the results count on ONE LINE, and
 * we stack them. #460 records the mechanism, `margin-top: -33px` on live's
 * `.tire-listing-page__results-header`, and the number is live's rather than
 * ours: live's filter column is 114x32 with no bottom margin, and ours is a
 * 114x37 button carrying `margin-bottom: 20px`. So the arrangement is what has
 * to match and the value is derived from our own boxes.
 *
 * Measured on `/tires` and `/tires/winter`, live against the published host,
 * through `capture.sh --probe` on 2026-08-02:
 *
 *     side   width  filter control        results count          same line
 *     live   375    114x32 at 20,390      168x32 at 188,389      yes
 *     live   768    114x32 at 20,390      364x32 at 384,389      yes
 *     live   769    0x0, the sidebar is open instead             n/a
 *     ours   375    114x37 at 20,450      104x32 at 251,507      no
 *     ours   768    114x37 at 20,450      ...                    no
 *
 * `.tire-listing-page__results-header` APPEARS IN OUR REPO ONCE, IN A COMMENT.
 * Our counterpart is `.tire-listing-header`, established by measuring both
 * documents rather than by the class name: a selector that matches nothing
 * returns nothing, which reads exactly like a zero.
 *
 * The block is on 12 published pages, `/tires` and its eleven category pages,
 * counted by the selector over all 328 indexed paths.
 *
 * THE PULL IS ON THE HEADER BECAUSE THAT IS THE BOX LIVE MOVES. The same margin
 * on the status lands the count, the print row and the cards on the same pixels,
 * because the header is a flex column and a negative margin on its first item
 * takes the second one with it. Measured at 375 both ways. The header's own
 * border box is what differs, 287x83 at 38 against 287x26 at 95, and live's
 * results header is the first shape.
 *
 * So the 20px assertion below does NOT separate the two mechanisms and is not
 * offered as if it did. It pins live's own gap against a later change to the
 * tools margin, which is what turns it red.
 *
 * The hit test is the same kind of guard. Covering the button costs it nothing,
 * because inline-level content paints above a later sibling block's background.
 */

const LAYOUT = `
  <div class="tire-listing block">
    <div class="tire-listing-layout">
      <aside class="tire-listing-side">
        <button type="button" class="tire-listing-toggle button secondary" aria-expanded="false">Show filter</button>
        <div class="tire-listing-panel" id="tire-listing-panel"></div>
      </aside>
      <div class="tire-listing-results">
        <div class="tire-listing-header">
          <div class="tire-listing-status" role="status"><h2 class="tire-listing-count" tabindex="-1">46 Results</h2></div>
          <div class="tire-listing-tools">
            <button type="button" class="tire-listing-print">Print results</button>
            <div class="tire-listing-sort"><label for="s">Sort by:</label><select id="s"><option>Featured</option></select></div>
          </div>
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
 * Renders the layout in an iframe of the given width, so the block's media
 * queries resolve against a viewport this test chooses rather than the runner's.
 * A declaration read cannot see this defect: the pull lives in a query and the
 * boxes it moves are decided by the cascade.
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the iframe's settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:1400px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = DOC;
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  return doc;
}

const boxOf = (doc, sel) => {
  const el = doc.querySelector(sel);
  if (!el) throw new Error(`${sel} is not in this fixture, so nothing was measured`);
  return el.getBoundingClientRect();
};

describe('Tire listing, the filter control and the results count share a line below 769 (#460)', () => {
  [375, 599, 768].forEach((width) => {
    it(`puts the count on the toggle's line at ${width}, where live does`, async () => {
      const doc = await renderAt(width);
      const toggle = boxOf(doc, '.tire-listing-toggle');
      const count = boxOf(doc, '.tire-listing-count');
      expect(
        Math.abs(count.top - toggle.top),
        `count top ${Math.round(count.top)}, toggle top ${Math.round(toggle.top)}`,
      ).to.be.at.most(8);
    });

    it(`leaves the toggle clickable at ${width}`, async () => {
      // the header's box covers the button once it is pulled, so this reads
      // whether that costs the click. It does not, and the assertion records it
      const doc = await renderAt(width);
      const toggle = doc.querySelector('.tire-listing-toggle');
      const b = toggle.getBoundingClientRect();
      const hit = doc.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      expect(hit === toggle || toggle.contains(hit), `the point hit ${hit && hit.className}`).to.be.true;
    });
  });

  [375, 599, 768].forEach((width) => {
    it(`keeps live's 20px between the count and the print row at ${width}`, async () => {
      // the reading that decides WHERE the pull goes: live's count-to-tools gap
      // is 20px and so is ours, so the two rows move together or not at all
      const doc = await renderAt(width);
      const count = boxOf(doc, '.tire-listing-count');
      const tools = boxOf(doc, '.tire-listing-tools');
      expect(Math.round(tools.top - count.bottom)).to.equal(20);
    });
  });

  it('leaves the count below the toggle at 769, where live opens the sidebar instead', async () => {
    // above the step live's toggle is 0x0 and its own header margin is 0, so the
    // pull is confined to the widths that stack
    const doc = await renderAt(769);
    const header = doc.querySelector('.tire-listing-header');
    expect(doc.defaultView.getComputedStyle(header).marginTop).to.equal('0px');
  });
});

/**
 * #453 says the card media is 100px below 769 where live draws 170px at every
 * width, and the two numbers are different boxes. Live's `.tire-teaser__left`
 * is a 170px slot holding a 100x100 image; ours is a 100px box holding the same
 * 100x100 image, and the image lands on the same pixel on both sides:
 *
 *     width  live image            ours image
 *     375    100x100 at x=138      100x100 at x=138
 *     599    100x100 at x=250      100x100 at x=250
 *     768    100x100 at x=334      100x100 at x=334
 *     769    170x170 at x=520      170x170 at x=...
 *
 * So nothing renders differently and there is no fix here. These assertions are
 * the guard against the change #453's body asks for, which would take our image
 * to 170 where live's is 100.
 */
describe('Tire listing, the card image against live\'s own (#453)', () => {
  const CARD = `
    <div class="tire-listing block">
      <ul class="tire-listing-cards">
        <li class="tire-listing-card">
          <div class="tire-listing-card-media">
            <a href="/tires/procontact-tx10" tabindex="-1" aria-hidden="true">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3C/svg%3E" alt="" width="220" height="220">
            </a>
          </div>
          <div class="tire-listing-card-body"><h3 class="tire-listing-card-title">ProContact TX10</h3></div>
        </li>
      </ul>
    </div>`;
  const CARD_DOC = `<!DOCTYPE html><html><head>
    <link rel="stylesheet" href="/styles/styles.css">
    <link rel="stylesheet" href="/blocks/tire-listing/tire-listing.css">
  </head><body class="appear"><main><div class="section"><div>${CARD}</div></div></main></body></html>`;

  async function renderCard(width) {
    const frame = document.createElement('iframe');
    frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
    document.body.append(frame);
    await new Promise((resolve) => {
      frame.addEventListener('load', resolve, { once: true });
      frame.srcdoc = CARD_DOC;
    });
    const doc = frame.contentDocument;
    await doc.fonts.ready;
    return doc;
  }

  [375, 599, 768].forEach((width) => {
    it(`draws the tire at live's 100px at ${width}`, async () => {
      const doc = await renderCard(width);
      const img = doc.querySelector('.tire-listing-card-media img').getBoundingClientRect();
      expect(Math.round(img.width)).to.equal(100);
    });
  });

  it('takes live\'s 170px at 769', async () => {
    const doc = await renderCard(769);
    const img = doc.querySelector('.tire-listing-card-media img').getBoundingClientRect();
    expect(Math.round(img.width)).to.equal(170);
  });
});
