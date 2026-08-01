/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/**
 * The finder card's three glyphs draw at the wrong size.
 *
 * Live puts each one in a 32 by 32 box: a `<svg width=32 height=32>` holding a
 * sprite symbol, so `preserveAspectRatio` fits the drawing inside the box and
 * centres it. The three symbols have three different viewBoxes, 32x17 for the
 * vehicle, 28x28 for the tire and 30x18 for the plate, and the box hides that:
 * all three occupy the same 32 by 32 on live.
 *
 * Ours pins the HEIGHT at 26 and leaves the width to the drawing, so the three
 * come out at three different widths and none of them at live's size. Measured
 * at 1440 on /vancontact-as-ultra, live against the published host:
 *
 *     glyph          live box   ours
 *     vehicle        32 x 32    48.9 x 26
 *     tire           32 x 32    26 x 26
 *     license plate  32 x 32    43.3 x 26
 *
 * The FILES are already live's own drawings: `icons/vehicle.svg`,
 * `icons/tire-size.svg` and `icons/license-plate.svg` carry the same viewBox
 * and the same markup as `#vehicle-outline`, `#tire-outline` and
 * `#license-outline` in live's sprite, byte for byte. Only the box is ours.
 *
 * The numbers are read with `getBoundingClientRect` at a real viewport rather
 * than off the declarations, because a declared value cannot see a rule beaten
 * by specificity. Issue #439.
 */
describe('Perfect fit card, live\'s 32 by 32 icon box', () => {
  const BOX = 32;
  let sheets;
  let block;

  /**
   * The card as the product hero builds it, decorated and laid out. Nothing
   * below waits for the drawings to arrive, because in live's shape the box is
   * the card's and not the drawing's: an unloaded glyph occupies the same 32
   * by 32 as a loaded one.
   */
  async function build() {
    document.body.innerHTML = `
      <main><div class="section"><div class="perfect-fit-wrapper">
        <div class="perfect-fit card block">
          <div><div><p>Does this tire fit? Check now:</p></div></div>
        </div>
      </div></div></main>`;
    const el = document.querySelector('.perfect-fit.card');
    await decorate(el);
    return el;
  }

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
    block = await build();
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((sheet) => !sheets.includes(sheet));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  it('gives every glyph live\'s 32 by 32 box', () => {
    const icons = [...block.querySelectorAll('.perfect-fit-card-list .icon')];
    expect(icons.length, 'the card offers three searches').to.equal(3);
    const boxes = icons.map((icon) => {
      const r = icon.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    expect(boxes).to.eql([`${BOX}x${BOX}`, `${BOX}x${BOX}`, `${BOX}x${BOX}`]);
  });

  it('fits each drawing inside that box rather than stretching it', () => {
    const imgs = [...block.querySelectorAll('.perfect-fit-card-list .icon img')];
    expect(imgs.length, 'every glyph is drawn').to.equal(3);
    imgs.forEach((img) => {
      const r = img.getBoundingClientRect();
      expect(`${Math.round(r.width)}x${Math.round(r.height)}`).to.equal(`${BOX}x${BOX}`);
      // live's svg fits its viewBox into the box and centres it, which is what
      // contain does; fill would stretch the 32x17 vehicle to a square
      expect(getComputedStyle(img).objectFit).to.equal('contain');
    });
  });

  it('leaves each search live\'s 58px tall', () => {
    // 32 box + 4 gap + the label's 22px line box, and live measures 58
    const items = [...block.querySelectorAll('.perfect-fit-item')];
    expect(items.map((item) => Math.round(item.getBoundingClientRect().height)))
      .to.eql([58, 58, 58]);
  });
});
