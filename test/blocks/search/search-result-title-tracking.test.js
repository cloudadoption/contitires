/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * One result row exactly as `blocks/search/search.js` builds it: an
 * `article.search-result` holding an `h2.search-result-title` whose only child
 * is the link. The wrappers matter, because the block's rules are scoped
 * `main .search .search-result-title`.
 */
const RESULT_ROW = `
  <main><div class="section search-container"><div>
    <div class="search block">
      <div class="search-results-wrapper search-band">
        <ul class="search-results"><li>
          <article class="search-result">
            <h2 class="search-result-title"><a href="/learn/how-long-does-a-tire-last">How Long Does a Tire Last?</a></h2>
            <div class="search-result-content"><p>an excerpt</p></div>
          </article>
        </li></ul>
      </div>
    </div>
  </div></div></main>`;

/**
 * fonts.css is left out on purpose, the same as the empty-state suite: it
 * fetches Stag Sans from continentaltire.com and nothing below reads a px width
 * that depends on which font loaded.
 */
const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/search/search.css">
</head><body class="appear">${RESULT_ROW}</body></html>`;

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
 * Live tracks this title at a flat 0.25px, and it does it on the ANCHOR. Its
 * `h2` carries `0.5px` below 1025 and `normal` above, and that step reaches no
 * glyph: live's h2 has zero direct text nodes and every character is inside the
 * link. Measured on continentaltire.com/search?keywords=tire at 375, 900, 1024,
 * 1025, 1200 and 1440, ten results on both sides at every one.
 *
 * So the assertions read the anchor. An assertion on the `h2` would pass on a
 * page where no glyph moved, which is the shape that let the #407 cascade defect
 * through a green suite.
 *
 * One declaration and no media query where live has three, for two reasons: two
 * of live's three are inert on live's own page, and a single base rule with
 * nothing competing cannot be defeated by source order. (#424)
 */
describe('Search result title, live tracks the link at a flat 0.25px', () => {
  [375, 1024, 1025, 1440].forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      before(async () => { doc = await renderAt(width); });
      after(() => doc.defaultView.frameElement.remove());

      // styles.css holds `body` at `display: none` until `body.appear`, so a
      // document missing that class measures zero everywhere and reads like a
      // rule that did not apply
      it('renders into a laid-out document at the width asked for', () => {
        expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        const link = doc.querySelector('.search-result-title a');
        expect(link.getBoundingClientRect().width, 'a laid-out link has a width').to.be.above(0);
      });

      it('tracks the link the glyphs are in', () => {
        const link = doc.querySelector('.search-result-title a');
        expect(doc.defaultView.getComputedStyle(link).letterSpacing).to.equal('0.25px');
      });
    });
  });
});
