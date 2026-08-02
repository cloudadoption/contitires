/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/hero/hero.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * /learn closes with an EV band that live sets in centred, letter-spaced
 * capitals and ours sets in left-aligned sentence case at 1440.
 *
 * THE CAPITALS ARE NOT AUTHORED, on live or here. Live's own markup reads
 * `<h3 class="banner-with-image__copy-title">Continental Tire is EV
 * Compatible</h3>`, in sentence case, the same words our document carries, and
 * live's stylesheet uppercases it:
 *
 *   .banner-with-image--style-center .banner-with-image__copy-title {
 *     text-transform: uppercase; letter-spacing: 6px }
 *   .banner-with-image--style-center .banner-with-image__copy {
 *     background: none; text-align: center; margin: 0 auto; max-width: 840px }
 *
 * So it is a treatment rather than a content edit. 6px is live's own number at
 * live's own size: `--brand22` sets that title 42px, which is what our
 * `.hero-content` heading already renders at 1025 and up, and live keeps the 6px
 * under its 768 query where the title drops to 32px.
 *
 * THE BAND IS TOLD APART BY ITS HEADING LEVEL, which is exact rather than
 * incidental. Four pages author an in-page band as `hero left`: the homepage,
 * /learn, /smart-choice and /all-new-securecontact-aw. Live gives three of them
 * `--style-left` and only /learn's `--style-center`, and across the 328 paths in
 * the published query-index /learn's is the ONE hero block on the site holding
 * an h3. Live's own three carry no heading at all in that band; ours put an h2
 * in one and nothing in the other two.
 */
describe("Hero, live's centred in-page band", () => {
  let block;
  let content;

  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/hero/hero.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.innerHTML = `
      <main>
        <div class="section hero-container">
          <div class="hero-wrapper">
            <div class="hero left block">
              <div><div><picture><img src="/learn-band.jpg" width="1440" height="400" alt=""></picture></div></div>
              <div>
                <div>
                  <h3 id="continental-tire-is-ev-compatible">Continental Tire is EV Compatible</h3>
                  <p>All Continental product lines are designed with Electric Vehicles (EVs) in mind.</p>
                  <p class="button-wrapper"><a class="button primary" href="/ev-compatible">See How</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>`;
    document.body.classList.add('appear');
    block = document.querySelector('.hero');
    decorate(block);
    content = block.querySelector('.hero-content');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it("sets the title in live's letter-spaced capitals", async () => {
    await setViewport({ width: 1440, height: 900 });
    const h3 = getComputedStyle(block.querySelector('h3'));
    expect(h3.textTransform).to.equal('uppercase');
    expect(h3.letterSpacing).to.equal('6px');
  });

  it('keeps the capitals below the desktop step, where live keeps them too', async () => {
    await setViewport({ width: 375, height: 900 });
    const h3 = getComputedStyle(block.querySelector('h3'));
    expect(h3.textTransform).to.equal('uppercase');
    expect(h3.letterSpacing).to.equal('6px');
  });

  it('centres the copy at 1440, where the left variant pins it left', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(content).textAlign).to.equal('center');
  });

  it("gives the copy live's 840 cap and centres it in the band", async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(content).maxWidth).to.equal('840px');
    const copy = content.getBoundingClientRect();
    const band = block.getBoundingClientRect();
    expect(Math.round(copy.left - band.left)).to.equal(Math.round(band.right - copy.right));
  });

  it('centres the call to action', async () => {
    await setViewport({ width: 1440, height: 900 });
    const ctas = block.querySelector('.hero-ctas');
    expect(getComputedStyle(ctas).justifyContent).to.equal('center');
  });

  it('leaves a band without an h3 on the left variant', async () => {
    await setViewport({ width: 1440, height: 900 });
    const other = document.createElement('div');
    other.className = 'hero left block';
    other.innerHTML = '<div><div><p>copy</p></div></div><div><div><h2>Ready for confidence in every condition?</h2></div></div>';
    document.querySelector('.hero-wrapper').append(other);
    decorate(other);
    const plain = other.querySelector('.hero-content');
    expect(getComputedStyle(plain).textAlign).to.equal('left');
    expect(getComputedStyle(plain).maxWidth).to.equal('640px');
    other.remove();
  });
});
