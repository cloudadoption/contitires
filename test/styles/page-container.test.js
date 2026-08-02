/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * The container every page hangs off, and the two numbers live pads it with.
 *
 * Live's is `.container { margin: 0 auto; max-width: 73rem; width: 100%;
 * padding: 0 1rem }` under a global `* { box-sizing: border-box }`, with the
 * padding going to 1.25rem under `max-width: 768px`. `html { font-size: 100% }`,
 * so 73rem is 1168 and the 1168 INCLUDES the padding: 1136 of content.
 *
 * Read off both rendered pages at five widths, ours on the published host and
 * live on continentaltire.com, same path:
 *
 *   width   ours outer/pad/content/left      live outer/pad/content/left
 *     375   375  / 24 /  327 /  24           375  / 20 /  335 /  20
 *     768   768  / 24 /  720 /  24           768  / 20 /  728 /  20
 *     769   769  / 24 /  721 /  24           769  / 16 /  737 /  16
 *     900   900  / 32 /  836 /  32           900  / 16 /  868 /  16
 *    1440   1264 / 32 / 1200 / 120           1168 / 16 / 1136 / 152
 *
 * So ours is 64px wider of content at 1440 and 4 to 16px narrower a side at
 * every width, and it steps at 900 where live steps at 769. Three things are
 * one change: the box model, the cap and where the padding steps. Fixing the cap
 * alone in a content box leaves the padding outside it and the outer at 1200
 * plus the padding.
 *
 * THE SIDE INSET IS LOAD-BEARING, so this narrows it and does not remove it.
 * #477 took the specs band's own 24px away and the wrapper's padding is now the
 * only thing holding that band off the viewport edge.
 *
 * TWO SURFACES HAD LIVE'S NUMBERS LOCALLY and had to lose them in the same pass:
 * `.cards.members` and `.cards.teaser` each capped this same div at 1136 with
 * 20/16 of padding. In a content box that was live's measure; against a
 * border-box 1168 it caps the content at 1104. The last block here is that
 * dependency, executable, so neither can come back.
 *
 * These are RENDERED boxes at a real width. A declared max-width cannot show
 * whether the padding is inside or outside it, which is the whole defect here.
 * Issues #219, #99.
 */

/** Live's container, measured: content width and where the content starts. */
const LIVE = {
  375: { content: 335, left: 20, pad: '20px' },
  768: { content: 728, left: 20, pad: '20px' },
  769: { content: 737, left: 16, pad: '16px' },
  900: { content: 868, left: 16, pad: '16px' },
  1440: { content: 1136, left: 152, pad: '16px' },
};

/** An ordinary section, and the two bands that carried live's numbers alone. */
const doc = () => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/cards/cards.css">
</head><body class="appear"><main>
  <div class="section" id="plain"><div class="default-content-wrapper">
    <h2>Everything you need, all in one spot.</h2>
    <p>An ordinary band, which takes the page container and nothing else.</p>
  </div></div>
  <div class="section black cards-container" id="members"><div class="cards-wrapper">
    <div class="cards members block"><div><div><p>Kevin</p></div></div></div>
  </div></div>
  <div class="section cards-container" id="teaser"><div class="cards-wrapper">
    <div class="cards teaser block"><div><div><p>Find your fit</p></div></div></div>
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
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc();
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

/** The width inside a box's padding, and the x its content starts at. */
function inside(view, el) {
  const cs = view.getComputedStyle(el);
  const box = el.getBoundingClientRect();
  const left = parseFloat(cs.paddingLeft);
  return {
    outer: Math.round(box.width),
    content: Math.round(box.width - left - parseFloat(cs.paddingRight)),
    left: Math.round(box.left + left),
    pad: cs.paddingLeft,
  };
}

describe("The page container, live's 1136 inside 16 (#219)", () => {
  Object.entries(LIVE).forEach(([width, want]) => {
    describe(`at ${width}`, () => {
      let settled;
      let view;
      let wrapper;

      before(async () => {
        settled = await renderAt(Number(width));
        view = settled.defaultView;
        wrapper = settled.querySelector('#plain > div');
      });

      after(() => settled.defaultView.frameElement.remove());

      /* styles.css holds `body` at `display: none` until `.appear`, and an
         undisplayed box reads 0 everywhere, which compares as not-equal without
         announcing that nothing was measured. */
      it('renders into a laid-out document at the width asked for', () => {
        expect(view.innerWidth, 'iframe viewport').to.equal(Number(width));
        expect(wrapper.getBoundingClientRect().width, 'the wrapper').to.be.greaterThan(0);
      });

      it(`hands a band live's ${want.content}px of content`, () => {
        expect(inside(view, wrapper).content).to.equal(want.content);
      });

      it(`starts that content at live's x=${want.left}`, () => {
        expect(inside(view, wrapper).left).to.equal(want.left);
      });

      it(`pads the page live's ${want.pad}, and keeps a side inset`, () => {
        const cs = view.getComputedStyle(wrapper);
        expect(`${cs.paddingLeft} ${cs.paddingRight}`).to.equal(`${want.pad} ${want.pad}`);
        expect(parseFloat(cs.paddingLeft), 'never zero: #477 leans on it')
          .to.be.greaterThan(0);
      });

      // the cap is live's OUTER measure, so the padding has to sit inside it
      it("counts the padding inside live's 1168 cap", () => {
        expect(view.getComputedStyle(wrapper).boxSizing).to.equal('border-box');
        expect(inside(view, wrapper).outer).to.equal(Math.min(1168, Number(width)));
      });

      // the two bands that used to cap this div themselves, which would now
      // subtract live's padding a second time
      it('leaves the members and teaser bands on the same measure', () => {
        ['#members > div', '#teaser > div'].forEach((selector) => {
          const band = inside(view, settled.querySelector(selector));
          expect(band.content, selector).to.equal(want.content);
          expect(band.left, `${selector} left`).to.equal(want.left);
        });
      });
    });
  });

  // live steps at its own 768/769 boundary, and this stylesheet used to step at
  // a 900 that live carries once in 982 queries
  describe('where the padding steps', () => {
    let narrow;
    let wide;

    before(async () => {
      narrow = await renderAt(768);
      wide = await renderAt(769);
    });

    after(() => {
      narrow.defaultView.frameElement.remove();
      wide.defaultView.frameElement.remove();
    });

    it("moves across live's 768/769 and not across 900", async () => {
      const at = (d) => d.defaultView
        .getComputedStyle(d.querySelector('#plain > div')).paddingLeft;
      expect(at(narrow), 'at 768').to.equal('20px');
      expect(at(wide), 'at 769').to.equal('16px');

      const [before, after] = await Promise.all([renderAt(899), renderAt(900)]);
      expect(at(before), 'at 899').to.equal(at(after));
      before.defaultView.frameElement.remove();
      after.defaultView.frameElement.remove();
    });
  });
});
