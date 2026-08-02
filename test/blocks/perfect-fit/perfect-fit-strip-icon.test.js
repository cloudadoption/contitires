/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * The "Find your perfect fit" strip under the hero on /tires and the eleven
 * category pages draws a car in front of its label. Live draws a tire behind it.
 *
 * Live's strip is `<con-find-perfect-fit-button>`, and its render is
 * `<button class="link-button"><span>{label}</span> {icon("tire-outline",
 * "icon--md")}</button>`, so the glyph is the button's LAST child. Measured at
 * 1440 on /tires/touring, live against the published host:
 *
 *     live   label span 625.5 to 780.5, then the icon 790.5 to 814.5, 24 x 24
 *     ours   icon 614.6 to 646.6, 32 x 17, then the label 654.6 to 825.4
 *
 * The glyph is `tire-size`, not the `tire` the issue names: live's symbol is
 * `#tire-outline`, and `icons/tire-size.svg` carries live's viewBox 0 0 28 28
 * and both of its path `d` strings, while `icons/tire.svg` is an unrelated
 * 12 x 12 drawing live does not use here.
 *
 * `TAB_ICONS` is right for the finder's three tabs and for the homepage bar,
 * which authors three cells and wants a glyph each. The strip authors one cell
 * that is none of the three and takes index 0, the vehicle. The last test
 * guards the bar, since that is what a fix aimed at the strip can break.
 *
 * The cells hold bare text on the published host and `decorateBlock` wraps each
 * in a `<p>` before `decorate` runs, so the fixtures author the `<p>`. Positions
 * come from `getBoundingClientRect` at a real viewport rather than off the
 * declarations. Issue #267.
 */
describe('Perfect fit strip, live\'s tire glyph behind the label', () => {
  let sheets;

  /** The listing-page strip: an empty label row and one item cell. */
  function buildStrip() {
    document.body.innerHTML = `
      <main><div class="section dark full-width perfect-fit-container">
        <div class="perfect-fit-wrapper">
          <div class="perfect-fit block">
            <div><div></div></div>
            <div><div><p>Find your perfect fit</p></div></div>
          </div>
        </div>
      </div></main>`;
    return document.querySelector('.perfect-fit.block');
  }

  /** The homepage bar: a label and three cells, one glyph each. */
  function buildBar() {
    document.body.innerHTML = `
      <main><div class="section black perfect-fit-container">
        <div class="perfect-fit-wrapper">
          <div class="perfect-fit block">
            <div><div><p>Find your perfect fit:</p></div></div>
            <div>
              <div><p>By Vehicle</p></div>
              <div><p>By Tire Size</p></div>
              <div><p>By Plate</p></div>
            </div>
          </div>
        </div>
      </div></main>`;
    return document.querySelector('.perfect-fit.block');
  }

  /**
   * Decorated and laid out. Nothing below waits for a drawing to arrive: what
   * these read is which side of the label the glyph is on, and the injected
   * `img` carries width and height attributes, so an unloaded glyph occupies a
   * box on the same side as a loaded one. `loading="lazy"` on a page the runner
   * keeps in the background can leave a drawing pending for the whole run.
   */
  async function render(build) {
    const block = build();
    await decorate(block);
    return block;
  }

  const glyphOf = (icon) => new URL(icon.querySelector('img').src).pathname;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    await setViewport({ width: 1440, height: 900 });
    sheets = await Promise.all(['/styles/styles.css', '/blocks/perfect-fit/perfect-fit.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((sheet) => !sheets.includes(sheet));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  it('draws live\'s tire rather than a car', async () => {
    const block = await render(buildStrip);
    const icons = [...block.querySelectorAll('.perfect-fit-item .icon')];
    expect(icons.length, 'the strip offers one search').to.equal(1);
    expect(glyphOf(icons[0])).to.equal('/icons/tire-size.svg');
  });

  it('sets the glyph behind the label, where live has it', async () => {
    const block = await render(buildStrip);
    const item = block.querySelector('.perfect-fit-item');
    const icon = item.querySelector('.icon').getBoundingClientRect();
    const label = item.querySelector('p').getBoundingClientRect();
    expect(icon.width, 'the glyph occupies a box').to.be.greaterThan(0);
    expect(Math.round(icon.left)).to.be.greaterThan(Math.round(label.right));
  });

  it('leaves the homepage bar\'s three glyphs in front of their labels', async () => {
    const block = await render(buildBar);
    const items = [...block.querySelectorAll('.perfect-fit-item')];
    expect(items.length, 'the bar offers three searches').to.equal(3);
    expect(items.map((item) => glyphOf(item.querySelector('.icon'))))
      .to.eql(['/icons/vehicle.svg', '/icons/tire-size.svg', '/icons/license-plate.svg']);
    items.forEach((item) => {
      const icon = item.querySelector('.icon').getBoundingClientRect();
      const label = item.querySelector('p').getBoundingClientRect();
      expect(Math.round(icon.right)).to.be.at.most(Math.round(label.left));
    });
  });
});
