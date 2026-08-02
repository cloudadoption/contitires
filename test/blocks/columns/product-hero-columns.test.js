/* eslint-disable no-unused-expressions */
/* global describe it after */

import { expect } from '@esm-bundle/chai';

/** A 1x1 PNG, so the photograph draws as a square at whatever width it is given. */
const TILE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

/**
 * A product hero as the pipeline and the block leave it: the photograph cell
 * first, the copy cell second, in the section container the page gives it. The
 * copy is one of the 45 pages' own, long enough that the column runs past the
 * photograph, which is the case the alignment is about.
 */
const HERO = `
  <main><div class="section columns-container"><div class="columns-wrapper">
    <div class="columns product-hero block columns-2-cols">
      <div>
        <div class="columns-img-col"><p><picture><img src="${TILE}" alt="4x4 Contact"></picture></p></div>
        <div>
          <p class="product-hero-rebate"><em><a href="/promotion" class="button secondary">$110 Rebate Offer</a></em></p>
          <h1>4x4 Contact</h1>
          <p>The 4x4 Contact is a premium, all-season touring tire for crossovers,
            light trucks and SUVs. Designed for luxury vehicle applications, this
            Original Equipment tire comes with Self Supporting Runflat options.</p>
          <p><strong><a href="/store-finder" class="button">Find a store</a></strong></p>
          <div class="product-hero-offer">
            <p>Get a $110 Continental Tire Prepaid Mastercard&reg; by mail when you
              purchase a set of 4 qualifying Continental Tires through August 31, 2026.</p>
            <p><em><a href="/promotion" class="button secondary">Offer details</a></em></p>
          </div>
          <p class="product-hero-plan-link"><a href="/warranty">Total Confidence Plan</a></p>
          <ul class="product-hero-plan">
            <li>60 Day Trial</li><li>3 Year Roadside Assistance</li>
            <li>12 Month Road Hazard Coverage</li>
          </ul>
          <p class="product-hero-best-for-label"><strong>Best for</strong></p>
          <ul class="product-hero-best-for">
            <li>Crossover</li><li>Light Truck/SUV</li><li>Original Equipment</li>
            <li>Electric Vehicles</li><li>Touring</li><li>All-Season</li>
          </ul>
          <p class="product-hero-technology-label"><strong>Technology</strong></p>
          <ul class="product-hero-technology"><li>Self Supporting Runflat*</li></ul>
        </div>
      </div>
    </div>
  </div></div></main>`;

const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/columns/columns.css">
</head><body class="appear">${HERO}</body></html>`;

/** Renders the hero in an iframe of the given width, tall enough not to scroll. */
async function renderAt(width) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:3000px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = DOC;
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  const img = doc.querySelector('.columns.product-hero img');
  if (!img.complete) await new Promise((r) => { img.addEventListener('load', r, { once: true }); });
  const box = (selector) => {
    const r = doc.querySelector(selector).getBoundingClientRect();
    return {
      top: Math.round(r.top),
      left: Math.round(r.left),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  return {
    doc,
    row: box('.columns.product-hero > div'),
    photo: box('.columns.product-hero > div > div:first-child'),
    copy: box('.columns.product-hero > div > div:last-child'),
    h1: box('.columns.product-hero h1'),
  };
}

/*
 * Live's product hero, read off continentaltire.com/tires/4x4contact in headless
 * Chrome at 1440, 1200, 1025 and 769.
 *
 * `.tire-page__top` is a flex row with NO align-items, so both columns start at
 * the row's top. `.tire-page__top-right`, the copy, is `flex: 0 1 22rem` with
 * `min-width: 22rem`, a fixed 352px at live's 16px root; `.tire-page__top-left`,
 * the photographs, is `flex: 1` with `margin-right: var(--space-38)`, 38px. So
 * the copy column is the constant and the photographs take what is left: 746 of
 * 1136 at 1440 and at 1200, 603 of 993 at 1025, 347 of 737 at 769.
 *
 * Ours gave both cells `flex: 1` and centred them, which put two 588 halves at
 * 1440 and started the photograph 180px BELOW the h1 where live starts it 38px
 * above. (#321)
 */
describe('product hero, the photograph column takes what the copy leaves (#321)', () => {
  const frames = [];
  after(() => frames.forEach((f) => f.remove()));

  /** live's copy column, 22rem at its own 16px root */
  const COPY = 352;
  /** live's `margin-right: var(--space-38)` between the two columns */
  const GAP = 38;

  [769, 1025, 1200, 1440].forEach((width) => {
    it(`holds the copy to live's 352 and starts both columns level at ${width}`, async () => {
      const at = await renderAt(width);
      frames.push(at.doc.defaultView.frameElement);
      expect(at.doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);

      expect(at.copy.w, "live's fixed copy column").to.equal(COPY);
      expect(at.photo.w, 'the photographs take what is left of the row')
        .to.equal(at.row.w - GAP - COPY);
      expect(at.copy.h, 'the copy runs past the photograph, so alignment shows')
        .to.be.greaterThan(at.photo.h);
      expect(at.photo.top, 'both columns start at the row top').to.equal(at.copy.top);
      expect(at.photo.top, 'and the photograph starts above the title')
        .to.be.below(at.h1.top);
    });
  });

  // At 1200 our container is 1136 wide, which is live's own content width at
  // 1200 and at 1440, so live's own numbers apply here without waiting for
  // #219 to narrow our 1200 container to live's 1136.
  it("lands on live's own 746 and 352 where the two containers agree", async () => {
    const at = await renderAt(1200);
    frames.push(at.doc.defaultView.frameElement);

    expect(at.row.w, "live's content width").to.equal(1136);
    expect(at.photo.w, "live's photograph column").to.equal(746);
    expect(at.photo.left, "at live's own offset").to.equal(32);
    expect(at.copy.w, "live's copy column").to.equal(352);
    expect(at.copy.left, 'live puts the copy 38 past the photographs').to.equal(816);
  });
});
