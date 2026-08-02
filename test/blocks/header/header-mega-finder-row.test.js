/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import styleSheet from '../../helpers/stylesheet.js';
import { addFinderIcons } from '../../../blocks/header/header.js';

/** The two sheets these measurements stand on, parsed once for the file. */
const HEADER_CSS = '/blocks/header/header.css';
const GLOBAL_CSS = '/styles/styles.css';

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
 *
 * THE FIXTURE TAKES ITS GLYPH FROM `addFinderIcons`, WHICH IS WHAT SHIPS. #237
 * put a 25px line glyph in every finder trigger and this file kept building
 * bare buttons, so the levelness it asserted was true of the fixture and false
 * of the panel. It could not go red on the rows it named. The glyph comes from
 * the function rather than from a hand-written span, so the day the markup
 * changes this file follows it instead of drifting again. Issue #518.
 *
 * WHAT THE GLYPH DID TO THE ROWS, and it is a separate claim from the
 * derivation above. A 25px box in a 22.4px line box makes the finder row 34.8
 * where the link row beside it is 28.8. On the published host the finder rows
 * are 35 apart against live's 37, where before the glyph they were 29, so the
 * glyph moved them toward live and stopped 2.2 short. #237 named the panel
 * colour, the glyphs and the rule position and not the pitch, so that residue
 * is recorded here rather than closed.
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
    sheets = await Promise.all([GLOBAL_CSS, HEADER_CSS].map((path) => styleSheet(path)));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');

    // the panel opens off the top item's own control, which is the state
    // header.js leaves behind when a reader opens it
    // the wrapper is what the panel hangs off: it is `position: relative` above
    // the breakpoint, and without it `top: 100%` measures the viewport and puts
    // the panel below the fold, where nothing can be pressed
    document.body.innerHTML = `
      <header><div class="nav-wrapper"><nav id="nav" aria-expanded="true"><div class="nav-sections">
        <div class="default-content-wrapper">
          <ul>
            <li class="nav-drop nav-mega">
              <p><button type="button" aria-expanded="true">Tires</button></p>
              <ul>
                <li>
                  <p><strong>Search for Tire</strong></p>
                  <ul>
                    <li><button type="button" data-tire-finder="vehicle">By Vehicle</button></li>
                    <li><button type="button" data-tire-finder="tire-size">By Tire Size</button></li>
                  </ul>
                </li>
                <li>
                  <p><strong>Popular</strong></p>
                  <ul>
                    <li><a href="/tires/extremecontact-sport-02">ExtremeContact Sport02</a></li>
                    <li><a href="/tires/extremecontact-dws06-plus">ExtremeContact DWS06 Plus</a></li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div></nav></div></header>`;

    // production prepends a glyph to every finder trigger, so the fixture takes
    // it from the same function rather than from a copy of what it writes
    // today. header.js is the source of the markup and this file follows it.
    addFinderIcons([...document.querySelectorAll('[data-tire-finder]')]);

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

  /**
   * Runs `body` with the glyphs out of the fixture, then puts the same nodes
   * back where they were.
   *
   * It detaches and re-attaches rather than removing and calling
   * `addFinderIcons` again, and that is the whole point of writing it this way.
   * A restore that BUILDS a glyph repairs a fixture that never had one, so the
   * first test to call this would hand the later ones the state they are meant
   * to be asserting. Checked by taking the `addFinderIcons` call out of the
   * fixture: with a rebuilding restore all seven stayed green, which is this
   * file's own defect wearing the fix's clothes.
   */
  function withoutGlyphs(body) {
    const detached = [...document.querySelectorAll('[data-tire-finder] .icon')]
      .map((icon) => ({ icon, host: icon.parentElement }));
    detached.forEach(({ icon }) => icon.remove());
    try {
      body();
    } finally {
      detached.forEach(({ icon, host }) => host.prepend(icon));
    }
  }

  it('leaves the button in the link\'s row for everything but the glyph', () => {
    // #440's property, on the state where it still holds. The padding cancels
    // in the margin, so with nothing taller than the text in the button the
    // two rows are the same box.
    withoutGlyphs(() => {
      expect(buttonRow.getBoundingClientRect().height)
        .to.be.closeTo(linkRow.getBoundingClientRect().height, 0.01);
    });
  });

  it('lets the glyph, and only the glyph, take the button out of that row', () => {
    // and the other side of it: put the glyph back and the rows part. Written
    // as a pair so the difference is attributed to the glyph rather than to a
    // number read off a render.
    expect(buttonRow.getBoundingClientRect().height)
      .to.be.above(linkRow.getBoundingClientRect().height);
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

  it('leaves every label clickable on its own search', () => {
    // the padded box now reaches 3.8px into the row above and below, where an
    // inline link's stops inside its own row, so two searches share the
    // whitespace between their labels. Both open the same modal on different
    // tabs, so the guard is that a press on a LABEL still reaches the search
    // it names, whoever owns the gap.
    const buttons = [...document.querySelectorAll('li.nav-mega button[data-tire-finder]')];
    expect(buttons.length, 'two searches, so there is a boundary to test').to.equal(2);
    // the tab name rather than the node: chai inspects a failed comparison, and
    // inspecting two header subtrees takes longer than the runner will wait
    const pressed = buttons.map((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit ? (hit.dataset.tireFinder || hit.tagName) : 'nothing';
    });
    expect(pressed).to.eql(buttons.map((el) => el.dataset.tireFinder));
  });

  it('keeps the rows level when the panel\'s type scale moves', () => {
    // the defect this closes: at 14px the two rows are 0.59 apart and nobody
    // sees it; one move of the panel's type scale and they are 6 apart. The
    // glyph comes out for it, because with a fixed 25px box in the button the
    // row is the glyph's at any type scale and the padding is no longer what
    // the reading would be measuring.
    scale.replaceSync(`
      header nav .nav-sections .default-content-wrapper > ul > li.nav-mega > ul > li > ul > li > :is(a, button) {
        font-size: 20px;
      }`);
    withoutGlyphs(() => {
      expect(buttonRow.getBoundingClientRect().height)
        .to.be.closeTo(linkRow.getBoundingClientRect().height, 0.01);
    });
    scale.replaceSync('');
  });

  /*
   * The parity delta, on its own so a failure names which of the two it is.
   * Live's finder rows are 37px apart at 1440 and the shipped panel's are 35,
   * read on the published host after #237; the fixture renders 34.8, which is
   * that 35 before the browser rounds it. Before the glyph landed ours were 29,
   * so the 25px box moved the rows toward live and stopped 2.2 short.
   *
   * #237 named the panel colour, the glyphs and the rule position and not the
   * row pitch, so this records the residue rather than closing it. A change
   * that moves the pitch either way fails here and has to say which way it
   * meant to go.
   */
  it('runs 34.8 against live\'s 37, the residue the glyph left', () => {
    expect(buttonRow.getBoundingClientRect().height).to.be.closeTo(34.8, 0.05);
  });
});
