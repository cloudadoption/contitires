/* eslint-disable no-unused-expressions */
/* global describe it after */

import { expect } from '@esm-bundle/chai';

/**
 * A 215 by 50 PNG, which is the width every one of the six technology logos is
 * drawn at and one of the six heights. Inline so the test depends on no network
 * and no fixture file, and so `naturalWidth` is a real intrinsic value rather
 * than whatever a missing image resolves to.
 */
const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANcAAAAyCAIAAABAltnTAAAAoklEQVR4nO3SMQEAAAzCMKRP+mTAkSjo0Ry0pR0ALmRA2gHgQgakHQAuZEDaAeBCBqQdAC5kQNoB4EIGpB0ALmRA2gHgQgakHQAuZEDaAeBCBqQdAC5kQNoB4EIGpB0ALmRA2gHgQgakHQAuZEDaAeBCBqQdAC5kQNoB4EIGpB0ALmRA2gHgQgakHQAuZEDaAeBCBqQdAC5kQNoB4EIGpB0A9x72ALIJynvoAAAAAElFTkSuQmCC';

/**
 * The tooltip as `buildTips` leaves it once its control has been pressed: the
 * logo first, then the description.
 */
const HERO = `
  <main><div class="section"><div>
    <div class="columns product-hero block">
      <div><div><p><picture><img src="${LOGO}" alt="tire"></picture></p></div>
      <div>
        <h1>CrossContact LX25</h1>
        <p class="product-hero-technology-label">Technology</p>
        <ul class="product-hero-technology">
          <li>EcoPlus
            <div class="product-hero-technology-tip">
              <img class="product-hero-technology-logo" src="${LOGO}" alt="" loading="lazy">
              <ul><li>Saves fuel &amp; optimizes range</li></ul>
            </div>
          </li>
        </ul>
      </div></div>
    </div>
  </div></div></main>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/columns/columns.css">
</head><body class="appear">${HERO}</body></html>`;

/** Renders the hero in an iframe of the given width. */
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
  const img = doc.querySelector('.product-hero-technology-logo');
  if (!img.complete) await new Promise((r) => { img.addEventListener('load', r, { once: true }); });
  return doc;
}

/**
 * Live draws each tooltip logo at the size it was drawn, writing that width and
 * height on the image itself. Ours was stretched to the column by
 * `.columns img { width: 100% }`, which the logo rule never contested: it set
 * `max-width` and `height` and no `width`, so the block-wide declaration applied
 * unopposed. Measured on the deployed branch at 327, 851, 406 and 588 against an
 * intrinsic 215.
 *
 * THE ASSERTION IS ON THE RENDERED WIDTH AND NOT ON THE DECLARATION. A test
 * reading `width: auto` out of the stylesheet passes while the logo draws at
 * 851px, because the defect was never about what the rule says. A rendered width
 * can be any number; it can only equal `naturalWidth` when nothing stretched it.
 * (#411)
 */
describe('product hero, the technology tooltip logo is drawn at its own size (#411)', () => {
  const frames = [];
  after(() => frames.forEach((f) => f.remove()));

  [375, 899, 900, 1440].forEach((width) => {
    it(`draws the logo at its intrinsic width at ${width}`, async () => {
      const doc = await renderAt(width);
      frames.push(doc.defaultView.frameElement);
      const img = doc.querySelector('.product-hero-technology-logo');

      expect(img.naturalWidth, 'the image loaded, so the comparison means something')
        .to.be.above(0);
      expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);

      expect(Math.round(img.getBoundingClientRect().width), 'rendered against intrinsic')
        .to.equal(img.naturalWidth);
      expect(Math.round(img.getBoundingClientRect().height), 'and its own height')
        .to.equal(img.naturalHeight);
    });
  });
});
