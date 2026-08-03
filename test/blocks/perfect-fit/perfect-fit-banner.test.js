/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * The banner variant, which is what live offers on /all-new-securecontact-aw.
 *
 * Live runs TWO finder components, and the difference is not a width. The
 * homepage, /ev-compatible and /smart-choice carry `store-finder-nav-banner`,
 * the 56px black strip this block already reproduces. /all-new-securecontact-aw
 * carries `find-your-perfect-fit-banner`, a band of its own: #1d1d1d under a 2px
 * yellow rule, a 24px title over three bordered boxes, and the page's two calls
 * to action inside the same band. Censused over the 31 top-level live paths, so
 * the strip is on three of them and the band on one.
 *
 * Probed on continentaltire.com/all-new-securecontact-aw at 1440x900:
 *
 *     band       1440 x 326.8   padding 38px 0, bg rgb(29,29,29), border-top
 *                               2px rgb(255,165,0)
 *     container  1168 x 248.8   padding 0 16px, gap 20, column
 *     title       311.91 x 32   24px/32px, weight 300, ls 2.88px, uppercase
 *     options    1136 x 124     gap 20, row
 *     option      240 x 124     padding 20, gap 4, border 2px rgb(255,165,0),
 *                               radius 12px, column
 *     icon         60 x 60      white
 *     label       74.11 x 16    12px/16px, weight 400, ls 1.25px, uppercase
 *
 * The 375 numbers are read off live's own stylesheet rather than probed,
 * `themes/custom/nextcontinental/dist/css/styles.css` under
 * `@media screen and (max-width: 768px)`: the options turn into a column, the
 * option goes to `width: 100%; max-width: 280px` on `padding: 12px 20px 16px`
 * and `gap: 8px`, and the icon box halves to 40. 2 + 12 + 40 + 8 + 16 + 16 + 2
 * is its 96.
 *
 * THE BASE BAR FLIPS TO A ROW AT 769 AND THE BAND DOES NOT. Live's band is a
 * column at every width, title over options over the calls to action, so the
 * variant has to hold the column against `.perfect-fit`'s own `(width >= 769px)`
 * rule. The last test guards the strip that rule is for.
 *
 * The two calls to action stay plain links rather than live's pills. They are
 * two links in one authored paragraph, and `decorateButtons` in `scripts.js`
 * buttonizes a link only when it is the paragraph's whole text, so that is a
 * `scripts.js` question and not this block's. Issue #85.
 */

/** Live's band at 1440, probed. */
const LIVE_ROW = {
  bandPadding: '38px 0px',
  bandBackground: 'rgb(29, 29, 29)',
  bandBorderTop: '2px',
  yellow: 'rgb(255, 165, 0)',
  gap: '20px',
  option: { w: 240, h: 124 },
  icon: 60,
  labelHeight: 16,
  radius: '12px',
};

/** Live's band at 375, off live's stylesheet. */
const LIVE_COLUMN = {
  option: { w: 280, h: 96 },
  icon: 40,
};

const round = (n) => Math.round(n * 100) / 100;
const box = (el) => {
  const r = el.getBoundingClientRect();
  return { w: round(r.width), h: round(r.height) };
};

/**
 * The block as `perfect-fit.js` builds it, serialized, so the fixture cannot
 * drift away from what the block produces.
 * @param {string} variant extra classes on the block, e.g. 'banner'
 * @returns {string} the decorated `<main>`
 */
function markup(variant) {
  const host = document.createElement('div');
  host.innerHTML = `
    <main><div class="section perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit ${variant} block">
        <div><div><p>Find your perfect fit</p></div></div>
        <div>
          <div><p>By Vehicle</p></div>
          <div><p>By Tire Size</p></div>
          <div><p>By Plate</p></div>
        </div>
      </div>
    </div>
    <div class="default-content-wrapper">
      <p><a href="/Store-finder">Find a dealer</a> <a href="/tires/securecontact-aw">Learn More</a></p>
    </div></div></main>`;
  decorate(host.querySelector('.perfect-fit.block'));
  return host.innerHTML;
}

const doc = (body) => `<!DOCTYPE html><html><head>
  <link rel="stylesheet" href="/styles/styles.css">
  <link rel="stylesheet" href="/blocks/perfect-fit/perfect-fit.css">
</head><body class="appear">${body}</body></html>`;

/**
 * Renders one fixture at one width in an iframe, so both widths can be read in
 * one run without moving the runner's own viewport.
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

describe('Perfect fit banner, live\'s band on /all-new-securecontact-aw', () => {
  const frames = [];
  let wide;
  let narrow;

  before(async () => {
    wide = await renderAt(1440, markup('banner'));
    narrow = await renderAt(375, markup('banner'));
    frames.push(...document.querySelectorAll('iframe'));
  });

  after(() => frames.forEach((frame) => frame.remove()));

  it('paints the section as live\'s band, #1d1d1d under a 2px yellow rule', () => {
    const section = wide.querySelector('main .section');
    const style = wide.defaultView.getComputedStyle(section);
    expect(style.backgroundColor).to.equal(LIVE_ROW.bandBackground);
    expect(style.borderTopWidth).to.equal(LIVE_ROW.bandBorderTop);
    expect(style.borderTopColor).to.equal(LIVE_ROW.yellow);
    expect(style.padding).to.equal(LIVE_ROW.bandPadding);
  });

  it('stays a column at 1440, where the strip turns into a row', () => {
    const block = wide.querySelector('.perfect-fit.banner');
    const style = wide.defaultView.getComputedStyle(block);
    expect(style.flexDirection).to.equal('column');
    expect(style.rowGap).to.equal(LIVE_ROW.gap);
  });

  it('boxes each search at live\'s 240 by 124, 2px yellow on a 12px radius', () => {
    const items = [...wide.querySelectorAll('.perfect-fit-item')];
    expect(items).to.have.length(3);
    items.forEach((item) => {
      expect(box(item)).to.deep.equal(LIVE_ROW.option);
      const style = wide.defaultView.getComputedStyle(item);
      expect(style.flexDirection).to.equal('column');
      expect(style.borderTopWidth).to.equal(LIVE_ROW.bandBorderTop);
      expect(style.borderTopColor).to.equal(LIVE_ROW.yellow);
      expect(style.borderTopLeftRadius).to.equal(LIVE_ROW.radius);
    });
    expect(wide.defaultView.getComputedStyle(wide.querySelector('.perfect-fit-items')).columnGap)
      .to.equal(LIVE_ROW.gap);
  });

  it('draws each glyph in live\'s 60px box over a 12 on 16 label', () => {
    const icon = wide.querySelector('.perfect-fit-item .icon');
    expect(box(icon)).to.deep.equal({ w: LIVE_ROW.icon, h: LIVE_ROW.icon });
    const label = wide.querySelector('.perfect-fit-item p');
    const style = wide.defaultView.getComputedStyle(label);
    expect(style.fontSize).to.equal('12px');
    expect(style.lineHeight).to.equal('16px');
    expect(round(label.getBoundingClientRect().height)).to.equal(LIVE_ROW.labelHeight);
  });

  it('stacks the three at 375 on live\'s 280 by 96 box and a 40px glyph', () => {
    const items = [...narrow.querySelectorAll('.perfect-fit-item')];
    expect(box(items[0])).to.deep.equal(LIVE_COLUMN.option);
    expect(narrow.defaultView.getComputedStyle(narrow.querySelector('.perfect-fit-items'))
      .flexDirection).to.equal('column');
    expect(box(narrow.querySelector('.perfect-fit-item .icon')))
      .to.deep.equal({ w: LIVE_COLUMN.icon, h: LIVE_COLUMN.icon });
  });

  it('leaves the strip a row at 1440, on no band of its own', async () => {
    const plain = await renderAt(1440, markup(''));
    frames.push(...document.querySelectorAll('iframe'));
    const view = plain.defaultView;
    expect(view.getComputedStyle(plain.querySelector('.perfect-fit')).flexDirection)
      .to.equal('row');
    expect(view.getComputedStyle(plain.querySelector('main .section')).backgroundColor)
      .to.not.equal(LIVE_ROW.bandBackground);
  });
});
