/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The empty state exactly as blocks/search/search.js buildNoResults() leaves it:
 * a centred div holding one h2 and one .button anchor, inside the search block.
 */
const EMPTY_STATE = `
  <main><div class="section search-container"><div>
    <div class="search block">
      <div class="search-no-results">
        <h2>You have stumped us. No results.</h2>
        <a class="button" href="/search">Search again</a>
      </div>
    </div>
  </div></div></main>`;

/**
 * styles/fonts.css is NOT linked here on purpose: it fetches Stag Sans from
 * continentaltire.com, which would put a network round trip inside the suite.
 * Nothing below reads a px width that depends on which font loaded.
 */
const DOC = `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/search/search.css">
</head><body class="appear">${EMPTY_STATE}</body></html>`;

/**
 * Renders the empty state in an iframe of the given width, so the block's media
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

/** The rendered width of `16ch` in the heading's own font, whichever font that is. */
function sixteenCh(h2) {
  const probe = h2.ownerDocument.createElement('div');
  probe.style.cssText = 'width:16ch;position:absolute;visibility:hidden';
  h2.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
}

/**
 * Renders once per width and hands each case its own document, with the two
 * controls every case needs: the viewport is the one asked for, and the heading
 * has a height. styles.css:192 holds `body` at `display: none` until
 * `body.appear`, so a document that misses that class measures zero everywhere
 * and reads exactly like a gap of zero.
 */
function atWidths(widths, run) {
  widths.forEach((width) => {
    describe(`at ${width}`, () => {
      let doc;
      before(async () => { doc = await renderAt(width); });
      after(() => doc.defaultView.frameElement.remove());

      it('renders into a laid-out document at the width asked for', () => {
        expect(doc.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        const heading = doc.querySelector('.search-no-results h2');
        expect(heading.getBoundingClientRect().height, 'a laid-out heading has a height')
          .to.be.above(0);
      });

      run(() => doc, width);
    });
  });
}

/**
 * Live caps this heading with `max-width: 16ch` on `.site-search__no-results h2`,
 * under no media query, so the cap follows the font size across live's own step.
 * Ours capped at `11em`, which re-derives from whatever the size becomes: #405
 * moved the size 28 to 30 and 42 to 50, and the large cap went 462px to 550px as
 * a side effect. The unit is the durable half of #415.
 *
 * Asserted against a rendered `16ch` rather than a px, because `ch` is the advance
 * of the font's own zero. Stag Sans Thin measures 639/1000, so live's 16ch is
 * 306.7px at 30px and 511.2px at 50px, and our h2 resolves to the same weight 300
 * and the same font file. The suite renders in a fallback font, so a px assertion
 * would pin that fallback instead of the rule.
 */
describe('Search empty state, the heading cap (#415)', () => {
  atWidths([375, 768, 769, 900, 1440], (docOf) => {
    it('caps the heading at live\'s 16ch, not at an em multiple of its own size', () => {
      const h2 = docOf().querySelector('.search-no-results h2');
      const cap = parseFloat(docOf().defaultView.getComputedStyle(h2).maxWidth);
      expect(cap, 'rendered cap against a rendered 16ch')
        .to.be.closeTo(sixteenCh(h2), 0.01);
    });
  });
});

/**
 * Live steps the gap under this heading 20px to 28px at its own 768, on
 * `.site-search__no-results > * + *` as a `margin-top`. Ours was 32px at every
 * width with no step at all, so the delta is 12px small and 4px large, and
 * across 600 to 768 there was no step where live has one (#416).
 *
 * MEASURED AS THE RENDERED GAP RATHER THAN AS A DECLARATION, which guardrail 5
 * asks for: what renders under a heading is the LARGER of the two adjacent
 * margins and not their sum. Here the `.button` anchor is `display: inline-flex`
 * with `margin: 0`, so it is an atomic inline in an anonymous block that has no
 * margin of its own, and no line-box leading shows above it either. That makes
 * the rendered gap the heading's own margin-bottom. Live reaches the same number
 * from the other side, `margin: 0 auto` on the heading and the gap as a
 * margin-top on the anchor, because vertical margins on an atomic inline size
 * the line box. Both mechanisms render alike, which is why this stays on the
 * heading rather than importing live's `> * + *` for a container our own JS
 * gives exactly two children.
 */
describe('Search empty state, the gap under the heading (#416)', () => {
  const GAP = {
    375: 20, 768: 20, 769: 28, 900: 28, 1440: 28,
  };

  atWidths([375, 768, 769, 900, 1440], (docOf, width) => {
    it(`leaves live's ${GAP[width]}px under the heading, as rendered`, () => {
      const doc = docOf();
      const h2 = doc.querySelector('.search-no-results h2');
      const again = doc.querySelector('.search-no-results a.button');
      const gap = again.getBoundingClientRect().top - h2.getBoundingClientRect().bottom;
      expect(gap, 'rendered gap, heading bottom to button top')
        .to.be.closeTo(GAP[width], 0.01);
    });
  });
});
