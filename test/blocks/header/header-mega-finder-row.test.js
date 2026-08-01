/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The mega panel's finder buttons sit in a row of their own height.
 *
 * A row in that panel is a list item whose height is its own line box: 18px
 * text at line-height 1.6, so 28.8. An authored link is inline, so its 7px
 * vertical padding overlaps the rows around it and leaves that 28.8 alone. A
 * finder button is inline-block, so the same padding joins the line box and
 * grows the row, which is why the button carried a smaller padding than the
 * links beside it.
 *
 * That smaller number was measured against the row as it renders today rather
 * than derived, and it is off in both directions. Measured at 1440 on the
 * published host, /vancontact-as-ultra, with the Tires panel open:
 *
 *     panel type scale   button row   link row
 *     14px, as shipped        29.39      28.8
 *     20px                    38         32
 *
 * So it is 0.59 out at the size it was tuned at and 6 out one type-scale move
 * later, with nothing to announce it.
 *
 * The rows are measured with `getBoundingClientRect` at 1440 with the panel
 * open, because this is a property of the line box and no declaration carries
 * it. Issue #440.
 */
describe('Header mega panel, the row a finder button sits in', () => {
  let sheets;
  let buttonRow;
  let linkRow;
  let button;
  let link;
  let scale;

  before(async () => {
    await setViewport({ width: 1440, height: 900 });
    sheets = await Promise.all(['/styles/styles.css', '/blocks/header/header.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');

    // the panel opens off the top item's own control, which is the state
    // header.js leaves behind when a reader opens it
    document.body.innerHTML = `
      <header><nav id="nav" aria-expanded="true"><div class="nav-sections">
        <div class="default-content-wrapper">
          <ul>
            <li class="nav-drop nav-mega">
              <p><button type="button" aria-expanded="true">Tires</button></p>
              <ul>
                <li>
                  <p><strong>Search for Tire</strong></p>
                  <ul>
                    <li><button type="button" data-tire-finder="vehicle">By Vehicle</button></li>
                  </ul>
                </li>
                <li>
                  <p><strong>Popular</strong></p>
                  <ul>
                    <li><a href="/tires/extremecontact-sport-02">ExtremeContact Sport02</a></li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div></nav></header>`;

    const columns = [...document.querySelectorAll('li.nav-mega > ul > li > ul > li')];
    buttonRow = columns.find((row) => row.querySelector('button'));
    linkRow = columns.find((row) => row.querySelector('a'));
    button = buttonRow.querySelector('button');
    link = linkRow.querySelector('a');
    // the panel is display:none until the item is open; a hidden row measures 0
    expect(linkRow.getBoundingClientRect().height, 'the panel is open').to.be.above(0);

    // adopted last, so a move of the type scale beats the sheet it moves; a
    // <style> in the head loses to an adopted sheet whatever it says
    scale = new CSSStyleSheet();
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, scale];
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((sheet) => !sheets.includes(sheet) && sheet !== scale);
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
  });

  /** A computed length in px, as a number. */
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]);

  it('leaves the button in the row the link beside it sits in', () => {
    expect(buttonRow.getBoundingClientRect().height)
      .to.be.closeTo(linkRow.getBoundingClientRect().height, 0.01);
  });

  it('gives the button the padding the shared rule gives the link', () => {
    // a padding of its own is the thing that needed re-measuring; the link's
    // is the panel's own, and it is bigger, so the button's target grows too
    expect(px(button, 'paddingTop')).to.equal(px(link, 'paddingTop'));
    expect(px(button, 'paddingBottom')).to.equal(px(link, 'paddingBottom'));
  });

  it('takes that padding back out in the margin, so the row never sees it', () => {
    // this is the derivation: whatever the padding is, the margin is its
    // negative, so the button's margin box is its line box and the row keeps
    // the list item's own. Nothing here is measured against today's row.
    expect(px(button, 'marginTop')).to.equal(-px(button, 'paddingTop'));
    expect(px(button, 'marginBottom')).to.equal(-px(button, 'paddingBottom'));
  });

  it('keeps the rows level when the panel\'s type scale moves', () => {
    // the defect this closes: at 14px the two rows are 0.59 apart and nobody
    // sees it; one move of the panel's type scale and they are 6 apart
    scale.replaceSync(`
      header nav .nav-sections .default-content-wrapper > ul > li.nav-mega > ul > li > ul > li > :is(a, button) {
        font-size: 20px;
      }`);
    expect(buttonRow.getBoundingClientRect().height)
      .to.be.closeTo(linkRow.getBoundingClientRect().height, 0.01);
    scale.replaceSync('');
  });
});
