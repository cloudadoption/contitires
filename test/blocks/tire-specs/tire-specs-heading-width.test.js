/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/tire-specs/tire-specs.js';

/**
 * The specs heading ran past its own container at 375, where live's fits.
 *
 * The band was padded twice: `main > .section > div` gave every section 24px a
 * side below 900 and 32 above it, and `.tire-specs` gave another 24 on top, so
 * the heading had 279px at 375 where the section left it 327. Live tracks out
 * the word after the product name, and that word measures 308.48px at 375 on
 * both sites, so it overflowed ours by 29.48px and fits live's 335px box with
 * 13.27 to spare. Measured on the published host and on
 * continentaltire.com/tires/contiprocontact, artifacts in `.mossy/parity/477/`.
 *
 * THE SECTION INSET IS LOAD-BEARING FROM HERE, and #219 narrowed it to live's
 * own 20 below 769 and 16 above rather than taking it away, which is the case
 * this file was written to catch. So the box the heading gets IS live's 335 at
 * 375 now, and 868 at 900, both read off continentaltire.com at those widths.
 * The last test is still that dependency, executable: the inset may move to
 * live's number and may not go to zero.
 *
 * The numbers are read with `getComputedStyle` and `getBoundingClientRect` at a
 * real viewport rather than off the declarations, because a declared value
 * cannot see a rule defeated by specificity and this file has been bitten by
 * that twice (#352, #466). Issue #477.
 */
describe('Tire specs, the width the band leaves its heading', () => {
  let block;
  let wrapper;
  let sheets;
  let fetchStub;

  /** The width inside an element's padding, which is what its text gets. */
  const inside = (el) => {
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().width
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  };

  before(async () => {
    sheets = await Promise.all(['/styles/styles.css', '/blocks/tire-specs/tire-specs.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    // the page is hidden until the reveal, and a hidden box measures 0
    document.body.classList.add('appear');
    // the block reads the sheet on decoration; hold it so the band stays in the
    // state a reader meets first, the heading over an empty picker
    fetchStub = sinon.stub(window, 'fetch').callsFake(() => new Promise(() => {}));

    document.body.innerHTML = `
      <main>
        <div class="section product-hero-container"><div class="default-content-wrapper">
          <h1>ContiProContact</h1>
        </div></div>
        <div class="section tire-specs-container"><div class="tire-specs-wrapper">
          <div class="tire-specs block"><div><div>contiprocontact</div></div></div>
        </div></div>
      </main>`;
    block = document.querySelector('.tire-specs');
    wrapper = document.querySelector('.tire-specs-wrapper');
    decorate(block);
  });

  after(async () => {
    fetchStub.restore();
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  it('adds no side inset of its own, so the section pads the band once', async () => {
    await setViewport({ width: 375, height: 800 });
    const cs = getComputedStyle(block);
    expect(`${cs.paddingLeft} ${cs.paddingRight}`).to.equal('0px 0px');
  });

  it('keeps the 48 over and under, which was never doubled', async () => {
    await setViewport({ width: 375, height: 800 });
    const cs = getComputedStyle(block);
    expect(`${cs.paddingTop} ${cs.paddingBottom}`).to.equal('48px 48px');
  });

  it('hands the heading all 335 live leaves at 375', async () => {
    await setViewport({ width: 375, height: 800 });
    expect(inside(wrapper), 'the section inset, once').to.equal(335);
    expect(block.querySelector('h2').clientWidth, 'the heading').to.equal(335);
  });

  it('hands it all 868 at 900, where live pads 16', async () => {
    await setViewport({ width: 900, height: 800 });
    expect(block.querySelector('h2').clientWidth).to.equal(868);
  });

  it('has room at 375 for the tracked word live fits there', async () => {
    await setViewport({ width: 375, height: 800 });
    // live gives the same word 335px and it measures 308.48 at this width
    expect(block.querySelector('h2').clientWidth).to.be.at.least(309);
  });

  it('leans on the section inset, the only side padding left', async () => {
    await setViewport({ width: 375, height: 800 });
    const cs = getComputedStyle(wrapper);
    expect(`${cs.paddingLeft} ${cs.paddingRight}`, "live's 20 below 769").to.equal('20px 20px');
    expect(parseFloat(cs.paddingLeft), 'and never zero').to.be.greaterThan(0);
  });
});
