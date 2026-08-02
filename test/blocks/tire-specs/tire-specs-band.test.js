/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The specifications band, edge to edge and pure black, the way live paints it.
 *
 * Ours drew an inset card: the block carried `background-color:
 * var(--conti-dark-black)`, which is #1d1d1d, and the section container held it
 * off the viewport edge, so the page showed a dark grey panel with a white
 * gutter each side and 40px of white above and below it. Read on the published
 * host at 1440 on /tires/extremecontact-sport-02: the band sat at x=152 and
 * 1136 wide inside a 1440 viewport, sampling rgb(29, 29, 29).
 *
 * Live's band is `.tire-specs { --background-color: #000000; background-color:
 * var(--background-color); color: var(--white); padding: var(--space-60)
 * var(--space-38) }`, and it hangs off `.tire-page__bottom` with no container
 * between them, so the black runs the full width of the viewport and the band
 * touches the copy above it and the warranty band below it. #1d1d1d is live's
 * own `--dark-black`, which live uses elsewhere and NOT here.
 *
 * The CONTENT keeps the page container it was given at #219: 1136 inside 16 at
 * 1440, 335 inside 20 at 375. Only the paint moves. Live insets this band's own
 * content differently again (its `.container--wide` caps at 1390), and that is
 * not this change.
 *
 * The gutter colour is read with `elementFromPoint` and the nearest painted
 * ancestor rather than off a declaration, because which element carries the
 * black is an implementation detail and the reader only sees the colour at the
 * viewport edge. Rendered boxes at a real width, in the iframe idiom
 * test/styles/page-container.test.js uses.
 */

/** The three widths: live's own two steps and the desktop the band was read at. */
const WIDTHS = [375, 768, 1440];

/** A product page down to the three bands that meet at the specifications band. */
const doc = () => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/columns/columns.css">
  <link rel="stylesheet" href="/blocks/tire-specs/tire-specs.css">
</head><body class="appear"><main>
  <div class="section columns-container" id="hero"><div class="columns-wrapper">
    <div class="columns product-hero block"><div>
      <div><p>a photograph</p></div>
      <div><h1>ExtremeContact Sport02</h1><p>A summer ultra-high performance tire.</p></div>
    </div></div>
  </div></div>
  <div class="section tire-specs-container" id="specs"><div class="tire-specs-wrapper">
    <div class="tire-specs block"><h2>ExtremeContact Sport02 <span>Specifications</span></h2></div>
  </div></div>
  <div class="section dark" id="warranty"><div class="default-content-wrapper">
    <h2>Confidence on the road</h2>
  </div></div>
</main></body></html>`;

/**
 * Renders the page at one width, so every width is read in one run without
 * moving the runner's own viewport.
 * @param {number} width the viewport width to render at
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:1600px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc();
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

/**
 * The colour a reader sees at a point: the first ancestor of whatever is there
 * that paints a background of its own.
 * @param {Window} view the iframe's window
 * @param {Document} settled the iframe's document
 * @param {number} x the point's x
 * @param {number} y the point's y
 * @returns {string} the computed background colour behind the point
 */
function paintedAt(view, settled, x, y) {
  let el = settled.elementFromPoint(x, y);
  while (el) {
    const bg = view.getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    el = el.parentElement;
  }
  return 'nothing';
}

describe("The specifications band, live's full-bleed black", () => {
  WIDTHS.forEach((width) => {
    describe(`at ${width}`, () => {
      let settled;
      let view;
      let band;
      let section;

      before(async () => {
        settled = await renderAt(width);
        view = settled.defaultView;
        band = settled.querySelector('.tire-specs');
        section = settled.querySelector('#specs');
      });

      after(() => settled.defaultView.frameElement.remove());

      /* styles.css holds `body` at `display: none` until `.appear`, and an
         undisplayed box reads 0 everywhere, which compares as not-equal without
         announcing that nothing was measured. */
      it('renders into a laid-out document at the width asked for', () => {
        expect(view.innerWidth, 'iframe viewport').to.equal(width);
        expect(band.getBoundingClientRect().height, 'the band').to.be.greaterThan(0);
      });

      it('paints the band from edge to edge, with no gutter either side', () => {
        const box = section.getBoundingClientRect();
        expect(Math.round(box.left), 'the left edge').to.equal(0);
        expect(Math.round(box.width), 'the width').to.equal(width);
      });

      it("samples live's pure black in both gutters", () => {
        const box = band.getBoundingClientRect();
        const y = Math.round(box.top + box.height / 2);
        expect(paintedAt(view, settled, 2, y), 'the left gutter').to.equal('rgb(0, 0, 0)');
        expect(paintedAt(view, settled, width - 3, y), 'the right gutter').to.equal('rgb(0, 0, 0)');
      });

      it('paints no card of its own inside that band', () => {
        expect(view.getComputedStyle(band).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
      });

      it('touches the copy above it and the warranty band below it', () => {
        const above = settled.querySelector('#hero').getBoundingClientRect();
        const below = settled.querySelector('#warranty').getBoundingClientRect();
        const box = section.getBoundingClientRect();
        expect(Math.round(box.top - above.bottom), 'the white above').to.equal(0);
        expect(Math.round(below.top - box.bottom), 'the white below').to.equal(0);
      });

      // #219's container, which this change leaves alone
      it('keeps the content on the page container it was given', () => {
        const inner = settled.querySelector('.tire-specs-wrapper');
        const cs = view.getComputedStyle(inner);
        const content = inner.getBoundingClientRect().width
          - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        expect(Math.round(content)).to.equal({ 375: 335, 768: 728, 1440: 1136 }[width]);
      });
    });
  });
});
