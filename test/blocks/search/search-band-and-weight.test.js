/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/*
 * Two properties of the results page, measured live against main on 2026-08-02.
 *
 * #454. Live's result title renders at weight 700 and ours at 300, at 375, 1024,
 * 1025 and 1440. The weight does not step at 1025 on either side; only the size
 * does, 14 to 20. Live declares the weight NOWHERE: 279 rules in its own sheets
 * carry a `font-weight` and none matches the title or its anchor, so its 700 is
 * the browser's own h2 default left standing. Ours reads 300 because
 * `styles.css:258` sets `font-weight: 300` on h1 through h6, which reaches this
 * title. The anchor inherits on live, tested by direction rather than read:
 * setting live's h2 to 300 pulls the anchor with it, and setting the anchor
 * leaves the h2 at 700.
 *
 * #431. The band reserves height while the index is in flight, because
 * `fillResults` runs on the load event. `min-height: calc(100vh - 200px)` sits
 * on the CONTENT box, so the rendered band is the floor plus its own padding:
 * 612+24+48=684 at 375 and 800+40+64=904 at 1440, both exact, with the padding
 * stepping at `search.css:335` under `@media (width >= 600px)`.
 *
 * The floor is load-bearing. Its job is to hold the band's bottom edge at or
 * below the fold, so the footer starts out of view and anything landing later
 * moves nothing a reader can see. Live pays none of this because it renders its
 * results server-side; its own band is `min-height: 0` in every state.
 *
 * The reservation needed is `viewport - bandTop - padding`, which at the two
 * measured widths is 812-244-72=496 and 1000-315-104=581. `calc(100vh - 316px)`
 * gives exactly 496 at 812 and 684 at 1000, so 316 is the tightest constant that
 * satisfies both, with the narrow width binding.
 */

/** The band's top on the rendered page: header, promo bar, form and status. */
const BAND_TOP = { 375: 244, 1440: 315 };

/** The band's own vertical padding, which steps at 600 (`search.css:335`). */
const BAND_PADDING = { 375: 24 + 48, 1440: 40 + 64 };

const RESULTS = `
  <div class="search-results-wrapper search-band">
    <ul class="search-results">
      <li>
        <article class="search-result">
          <h2 class="search-result-title"><a href="/learn/how-long-does-a-tire-last">How Long Does a Tire Last?</a></h2>
          <div class="search-result-content"><p class="search-result-excerpt">A tire lasts as long as its tread.</p></div>
        </article>
      </li>
    </ul>
  </div>`;

/**
 * The page above the band, standing in for the header, the promo bar, the search
 * form and the status line. Its height is the measured `BAND_TOP` for the width,
 * so the band lands where it lands on the real page. A fixture without it puts
 * the band at the top of the viewport and the fold reading below means nothing.
 */
const DOC = (width) => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/search/search.css">
  <style>.chrome-above { height: ${BAND_TOP[width]}px; }</style>
</head><body class="appear">
  <main><div class="section search-container"><div>
    <div class="search block">
      <div class="chrome-above"></div>
      ${RESULTS}
    </div>
  </div></div></main>
</body></html>`;

/**
 * Renders the block in an iframe of the given viewport, so `100vh` resolves
 * against a height this test chooses rather than the runner's window.
 * @param {number} width the viewport width
 * @param {number} height the viewport height, which the floor is derived from
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width, height) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:${height}px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = DOC(width);
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  return doc;
}

const bandOf = (doc) => doc.querySelector('.search-results-wrapper.search-band');
const titleOf = (doc) => doc.querySelector('.search-result-title');
const styleOf = (doc, el) => doc.defaultView.getComputedStyle(el);

describe('Search results, the title carries live\'s weight (#454)', () => {
  [375, 1024, 1025, 1440].forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      before(async () => { doc = await renderAt(width, 900); });
      after(() => doc.defaultView.frameElement.remove());

      it('renders into a laid-out document at the width asked for', () => {
        expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        expect(titleOf(doc).getBoundingClientRect().height, 'a laid-out title has a height')
          .to.be.above(0);
      });

      it('reads live\'s 700 on the title', () => {
        expect(styleOf(doc, titleOf(doc)).fontWeight).to.equal('700');
      });

      it('reaches the anchor that holds every character of it', () => {
        const link = titleOf(doc).querySelector('a');
        expect(styleOf(doc, link).fontWeight, 'the link a reader actually reads').to.equal('700');
      });
    });
  });

  describe('where the weight is declared', () => {
    let doc;
    before(async () => { doc = await renderAt(1440, 900); });
    after(() => doc.defaultView.frameElement.remove());

    /*
     * Live's anchor inherits rather than declaring, so ours does too: one
     * declaration on the title reaches both. Tested by direction, because a
     * computed 700 on the anchor reads the same either way.
     */
    it('declares on the title and lets the anchor inherit, as live does', () => {
      const title = titleOf(doc);
      const link = title.querySelector('a');
      title.style.fontWeight = '300';
      expect(styleOf(doc, link).fontWeight, 'the anchor follows the title').to.equal('300');
      title.style.fontWeight = '';
      expect(styleOf(doc, link).fontWeight, 'and comes back with it').to.equal('700');
    });
  });
});

describe('Search results, the band reserves to the fold and no further (#431)', () => {
  describe('the floor scales with the viewport', () => {
    let short;
    let tall;
    before(async () => {
      short = await renderAt(375, 812);
      tall = await renderAt(375, 1000);
    });
    after(() => {
      short.defaultView.frameElement.remove();
      tall.defaultView.frameElement.remove();
    });

    /*
     * A floor pinned in px would read the same at both heights. The difference
     * is what says it is derived from the viewport, and it is asserted against
     * the two heights written into this test rather than against another
     * element on the page.
     */
    it('moves with the viewport height rather than sitting at a fixed px', () => {
      const floor = (doc) => parseFloat(styleOf(doc, bandOf(doc)).minHeight);
      expect(floor(tall) - floor(short), 'the floor tracks 100vh').to.equal(1000 - 812);
    });
  });

  /*
   * The invariant, not the constant. `316` is derived from a band top the page
   * chrome sets, and a test pinned to the number passes while the thing it
   * stands for breaks. So this asserts where the band's bottom edge lands.
   *
   * At 375 the reservation is exact: 244 + 496 + 72 is 812, the fold itself. So
   * the equality catches BOTH directions there, a floor too small to reach the
   * fold and a floor larger than the page needs.
   */
  describe('the band bottom against the fold', () => {
    [[375, 812], [1440, 1000]].forEach(([width, height]) => {
      describe(`at ${width}x${height}`, () => {
        let doc;
        before(async () => { doc = await renderAt(width, height); });
        after(() => doc.defaultView.frameElement.remove());

        it('renders the band under the page chrome above it', () => {
          expect(Math.round(bandOf(doc).getBoundingClientRect().top), 'the band top')
            .to.equal(BAND_TOP[width]);
        });

        it('holds the band\'s bottom at or below the fold', () => {
          const bottom = Math.round(bandOf(doc).getBoundingClientRect().bottom);
          expect(bottom, `the band bottom against a fold of ${height}`).to.be.at.least(height);
        });

        it('renders the band as the floor plus its own padding', () => {
          const band = bandOf(doc);
          const floor = parseFloat(styleOf(doc, band).minHeight);
          expect(Math.round(band.getBoundingClientRect().height))
            .to.equal(Math.round(floor) + BAND_PADDING[width]);
        });
      });
    });

    describe('at the narrow width the reservation is exact', () => {
      let doc;
      before(async () => { doc = await renderAt(375, 812); });
      after(() => doc.defaultView.frameElement.remove());

      /*
       * The one width where the two constraints meet, so the equality is the
       * assertion that a floor larger than the page needs also fails. The empty
       * dark this issue is about is exactly the distance between these two.
       */
      it('reserves to the fold and not past it', () => {
        expect(Math.round(bandOf(doc).getBoundingClientRect().bottom)).to.equal(812);
      });
    });
  });
});
