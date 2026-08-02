/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * The "Find your perfect fit:" bar is shorter than live's above the breakpoint
 * and taller below it. Measured 2026-08-02 on `/`, live against this tree:
 *
 *     width   box     live                      ours
 *      1440   bar     56, padding 12/12         47.19, padding 14/14
 *      1440   item    32, row                   19.19, row
 *       375   bar     124, padding 22/22        118.56, padding 16/16
 *       375   item    52, column                59.38, column
 *
 * LIVE DECLARES NEITHER 32 NOR 52. Its item is a 32 by 32 icon box beside a
 * 12px label on a 12px line box: 32 above the breakpoint where the two sit in a
 * row, and 32 + 8 + 12 below it where the label stacks under the icon. Its bar
 * is that list plus its own padding, 12 either side at 1440 and 22 at 375, and
 * below the breakpoint the heading joins the column: 22 + 12 + 16 + 52 + 22.
 * The 16 is the list's own `margin-top` under live's `h2`, and it is the last
 * unaccounted part of live's 124.
 *
 * OURS MISSES ON THREE PROPERTIES AND THE FONT SIZE IS NOT ONE OF THEM. The
 * icon box is 17 where live's is 32. The label is already 12px, from
 * `.perfect-fit-items p`, but on a 19.2px line box it inherits because that rule
 * sets no `line-height`. And the padding is 14 where live's is 12, which is the
 * 4px between a 32px icon in our padding, 60, and live's bar, 56.
 *
 * At 375 our label WRAPS to two lines where live's runs on one, which is 19 of
 * the 7.38 our item is taller. Live's row has 303px for 270.2px of items;
 * ours has 279 for 302.2, because our column gap is 32 where live's is 16 and
 * our bar pads 24 either side inside the section's own 24. So the wrap is a
 * width, and a 12px line box on a wrapped label gives 24 rather than 12.
 *
 * THESE ARE COMPUTED VALUES AT A WIDTH. Both bar heights are decided by a media
 * query, and a test reading declarations passes a rule beaten by a later one.
 * Issue #176.
 */

/** Live's bar above its item breakpoint, at 1440 and 900. */
const LIVE_ROW = {
  bar: 56, item: 32, icon: 32, label: 12, heading: 12,
};

/** Live's bar at 375, where the icon stacks over the label. */
const LIVE_COLUMN = {
  bar: 124, list: 52, item: 52, icon: 32, label: 12, heading: 12, iconGap: 8, headingGap: 16,
};

/**
 * The listing pages' single-CTA strip as it reads today, which this change must
 * not reach. Its 44.19 at 375 is a 17px glyph over a 19.19 label, and neither
 * number was measured against live's listing pages in this slice, so both are
 * pinned rather than moved.
 */
const LISTING_STRIP = { 1440: 50, 375: 70.19, icon: 17 };

const round = (n) => Math.round(n * 100) / 100;
const height = (el) => round(el.getBoundingClientRect().height);

/**
 * The bar as `perfect-fit.js` builds it, serialized. Building it rather than
 * writing the decorated markup by hand keeps the fixture from drifting away
 * from what the block produces.
 * @param {string} heading the bar's heading, or '' for the listing strip
 * @param {string[]} items the shortcut labels
 * @returns {string} the decorated `<main>`
 */
function barMarkup(heading, items) {
  const host = document.createElement('div');
  host.innerHTML = `
    <main><div class="section black perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit block">
        <div><div>${heading ? `<p>${heading}</p>` : ''}</div></div>
        <div>${items.map((item) => `<div><p>${item}</p></div>`).join('')}</div>
      </div>
    </div></div></main>`;
  decorate(host.querySelector('.perfect-fit.block'));
  return host.innerHTML;
}

const HOMEPAGE_BAR = () => barMarkup('Find your perfect fit:', ['By Vehicle', 'By Tire Size', 'By Plate']);
const LISTING_BAR = () => barMarkup('', ['Find your perfect fit']);

const doc = (body) => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/perfect-fit/perfect-fit.css">
</head><body class="appear">${body}</body></html>`;

/**
 * Renders one fixture at one width in an iframe, so several widths can be read
 * in one run without moving the runner's own viewport.
 * @param {number} width the viewport width to render at
 * @param {string} body the markup to render
 * @returns {Promise<Document>} the settled document
 */
async function renderAt(width, body) {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:900px;border:0;position:absolute;left:-9999px`;
  document.body.append(frame);
  await new Promise((resolve) => {
    frame.addEventListener('load', resolve, { once: true });
    frame.srcdoc = doc(body);
  });
  const settled = frame.contentDocument;
  await settled.fonts.ready;
  return settled;
}

/** The width the label would take on one line, in the label's own font. */
function oneLineWidth(label) {
  const settled = label.ownerDocument;
  const cs = settled.defaultView.getComputedStyle(label);
  const probe = settled.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
  probe.style.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.textTransform = cs.textTransform;
  probe.textContent = label.textContent;
  settled.body.append(probe);
  const w = round(probe.getBoundingClientRect().width);
  probe.remove();
  return w;
}

describe('Perfect fit bar, live\'s 56 and 124 (#176)', () => {
  /* 1440 and 900 are both above our item breakpoint, where live's bar is 56. */
  [1440, 900].forEach((width) => {
    describe(`at ${width}, the icon is the row`, () => {
      let settled;
      before(async () => { settled = await renderAt(width, HOMEPAGE_BAR()); });
      after(() => settled.defaultView.frameElement.remove());

      /* styles.css holds `body` at `display: none` until `body.appear`, and an
         undisplayed body reads 0 everywhere, which compares as not-equal
         without announcing that nothing was measured. */
      it('renders into a laid-out document at the width asked for', () => {
        expect(settled.defaultView.innerWidth, 'iframe viewport').to.equal(width);
        expect(height(settled.querySelector('.perfect-fit')), 'the bar').to.be.greaterThan(0);
      });

      it(`takes live's ${LIVE_ROW.bar}px bar`, () => {
        expect(height(settled.querySelector('.perfect-fit'))).to.equal(LIVE_ROW.bar);
      });

      it(`gives every shortcut live's ${LIVE_ROW.item}px row`, () => {
        const items = [...settled.querySelectorAll('.perfect-fit-item')];
        expect(items, 'the bar offers three searches').to.have.length(3);
        expect(items.map(height)).to.eql([LIVE_ROW.item, LIVE_ROW.item, LIVE_ROW.item]);
      });

      it(`draws every glyph in live's ${LIVE_ROW.icon} by ${LIVE_ROW.icon} box`, () => {
        const icons = [...settled.querySelectorAll('.perfect-fit-items .icon')];
        expect(icons).to.have.length(3);
        icons.forEach((icon) => {
          const r = icon.getBoundingClientRect();
          expect(`${round(r.width)}x${round(r.height)}`).to.equal(`${LIVE_ROW.icon}x${LIVE_ROW.icon}`);
        });
      });

      it(`sets the label on live's ${LIVE_ROW.label}px line box`, () => {
        const labels = [...settled.querySelectorAll('.perfect-fit-item p')];
        expect(labels).to.have.length(3);
        expect(labels.map(height)).to.eql([LIVE_ROW.label, LIVE_ROW.label, LIVE_ROW.label]);
      });

      it(`sets the heading on live's ${LIVE_ROW.heading}px line box`, () => {
        expect(height(settled.querySelector('.perfect-fit-label'))).to.equal(LIVE_ROW.heading);
      });

      /* the half that can pass without meaning anything: a 56px bar is 56
         whether the icon grew or the padding did. This is what fails when the
         bar is reached for directly rather than through the box inside it. */
      it('takes that height from the icon rather than from a height or a padding', () => {
        const item = settled.querySelector('.perfect-fit-item');
        const icon = item.querySelector('.icon');
        expect(height(item), 'the item is the icon it holds').to.equal(height(icon));
        expect(height(settled.querySelector('.perfect-fit-items')), 'the list is that item')
          .to.equal(LIVE_ROW.item);
        const bar = settled.defaultView.getComputedStyle(settled.querySelector('.perfect-fit'));
        expect([bar.paddingTop, bar.paddingBottom], 'live pads the bar 12 either side')
          .to.eql(['12px', '12px']);
      });
    });
  });

  describe('at 375, the icon stacks over the label', () => {
    let settled;
    before(async () => { settled = await renderAt(375, HOMEPAGE_BAR()); });
    after(() => settled.defaultView.frameElement.remove());

    it('renders into a laid-out document at the width asked for', () => {
      expect(settled.defaultView.innerWidth, 'iframe viewport').to.equal(375);
      expect(height(settled.querySelector('.perfect-fit')), 'the bar').to.be.greaterThan(0);
    });

    it(`takes live's ${LIVE_COLUMN.bar}px bar`, () => {
      expect(height(settled.querySelector('.perfect-fit'))).to.equal(LIVE_COLUMN.bar);
    });

    it(`gives every shortcut live's ${LIVE_COLUMN.item}px column`, () => {
      const items = [...settled.querySelectorAll('.perfect-fit-item')];
      expect(items).to.have.length(3);
      expect(items.map(height)).to.eql([LIVE_COLUMN.item, LIVE_COLUMN.item, LIVE_COLUMN.item]);
    });

    it(`draws every glyph in live's ${LIVE_COLUMN.icon} by ${LIVE_COLUMN.icon} box`, () => {
      const icons = [...settled.querySelectorAll('.perfect-fit-items .icon')];
      expect(icons).to.have.length(3);
      icons.forEach((icon) => {
        const r = icon.getBoundingClientRect();
        expect(`${round(r.width)}x${round(r.height)}`)
          .to.equal(`${LIVE_COLUMN.icon}x${LIVE_COLUMN.icon}`);
      });
    });

    /* THE WRAP IS THE 375 CASE. A 12px line box on a label that turns over
       gives 24, so this fails loudly rather than through the bar's total. */
    it('keeps every label on one line, as live does', () => {
      const labels = [...settled.querySelectorAll('.perfect-fit-item p')];
      labels.forEach((label) => {
        expect(round(label.getBoundingClientRect().width), `"${label.textContent}" has room for one line`)
          .to.be.at.least(oneLineWidth(label));
        expect(height(label), `"${label.textContent}" is one 12px line`).to.equal(LIVE_COLUMN.label);
      });
    });

    it(`stacks the label live's ${LIVE_COLUMN.iconGap}px under the icon`, () => {
      const item = settled.querySelector('.perfect-fit-item');
      const icon = item.querySelector('.icon').getBoundingClientRect();
      const label = item.querySelector('p').getBoundingClientRect();
      expect(round(label.top - icon.bottom)).to.equal(LIVE_COLUMN.iconGap);
    });

    it(`sets the list live's ${LIVE_COLUMN.headingGap}px under the heading`, () => {
      const heading = settled.querySelector('.perfect-fit-label').getBoundingClientRect();
      const list = settled.querySelector('.perfect-fit-items').getBoundingClientRect();
      expect(height(settled.querySelector('.perfect-fit-label')), 'the heading')
        .to.equal(LIVE_COLUMN.heading);
      expect(round(list.top - heading.bottom)).to.equal(LIVE_COLUMN.headingGap);
    });

    /* the same guard as above, from the other side: 124 is also what a bar
       with a 24px padding and a wrapped label reads. */
    it('composes that 124 from live\'s own parts', () => {
      const list = settled.querySelector('.perfect-fit-items');
      expect(height(list), 'the list').to.equal(LIVE_COLUMN.list);
      const bar = settled.defaultView.getComputedStyle(settled.querySelector('.perfect-fit'));
      expect([bar.paddingTop, bar.paddingBottom], 'live pads the bar 22 either side')
        .to.eql(['22px', '22px']);
    });
  });

  /*
   * The listing pages author the bar as a single CTA with no heading, and live
   * renders that strip at half the homepage bar's height. Every value above is
   * read off the homepage bar, so none of them may reach this one.
   */
  describe('the listing pages\' single-CTA strip is left alone', () => {
    [1440, 375].forEach((width) => {
      it(`holds the strip at ${LISTING_STRIP[width]} with its ${LISTING_STRIP.icon}px glyph at ${width}`, async () => {
        const settled = await renderAt(width, LISTING_BAR());
        expect(!!settled.querySelector('.perfect-fit-label'), 'the strip has no heading').to.be.false;
        expect(height(settled.querySelector('.perfect-fit')), 'the strip').to.equal(LISTING_STRIP[width]);
        expect(height(settled.querySelector('.perfect-fit-items .icon')), 'its glyph')
          .to.equal(LISTING_STRIP.icon);
        settled.defaultView.frameElement.remove();
      });
    });
  });
});
