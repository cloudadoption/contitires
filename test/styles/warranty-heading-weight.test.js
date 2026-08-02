/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import styleSheet from '../helpers/stylesheet.js';

/**
 * The three section headings on /warranty render on StagSans-THIN where live
 * renders them on StagSans-LIGHT, which is what reads as mid grey: the colour
 * is the same #333 on both sides and the strokes are not, so the darkest pixel
 * of a glyph lands around 100 rather than around 50.
 *
 * The rule behind it is the shared `h1, h2, h3, h4, h5, h6 { font-weight: 300 }`
 * in styles.css, and fonts.css maps 300 to StagSans-Thin, exactly as live's own
 * @font-face does. LIVE DOES NOT PUT ITS SECTION HEADINGS ON THAT FACE. Live
 * resets all six levels to `font-weight: inherit`, sets no weight on body, and
 * then names 36 component titles that take 300, `h1, .as-h1` and the marquee and
 * news-list titles among them. A heading it does not name renders 400.
 *
 * Neither of these two is named:
 *
 *   OURS                       LIVE                            live's weight
 *   .section.cta h2            .banner__title                  400 (no rule)
 *   .columns h2                .content-slider__slide-title     400 (no rule)
 *
 * Read out of continentaltire.com/themes/custom/nextcontinental/dist/css/
 * styles.css on 2026-08-03: `.banner__title` carries no rule at all, and the one
 * `content-slider` rule that sets a weight is `.content-slider__pager`.
 *
 * Both surfaces are counted rather than assumed. Across the 328 paths in the
 * published query-index, `.section.cta` is authored on /warranty alone, and a
 * plain `.columns` block holds a heading on /warranty alone. `.columns steps`
 * carries three on /promotion, which is on the promo template, where
 * `main .section.steps h2` already declares 400 and outscores this rule.
 */
describe("Warranty's section headings, on live's face rather than the thin one", () => {
  let cta;
  let columns;

  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/columns/columns.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.innerHTML = `
      <main>
        <div class="section columns-container">
          <div class="columns-wrapper">
            <div class="columns">
              <div>
                <div>
                  <h2 id="total-confidence-plan-celebrates-10-years">Total Confidence Plan Celebrates 10 Years!</h2>
                  <p>Continental is celebrating 10 years of its Total Confidence Plan.</p>
                </div>
                <div><p>art</p></div>
              </div>
            </div>
          </div>
        </div>
        <div class="section black cta">
          <div class="default-content-wrapper">
            <h2 id="looking-for-another-warranty-type">Looking for another warranty type?</h2>
            <p class="button-wrapper"><a class="button primary" href="/documents/limited-warranty">New vehicle tire warranty</a></p>
          </div>
        </div>
        <div class="section cta">
          <div class="default-content-wrapper">
            <h2 id="get-the-complete-total-confidence-plan">Get the complete Total Confidence Plan.</h2>
            <p><a href="/documents/tcp-brochure">Download now</a></p>
          </div>
        </div>
      </main>`;
    document.body.classList.add('appear');
    cta = [...document.querySelectorAll('.section.cta h2')];
    columns = document.querySelector('.columns h2');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it("puts the cta band's heading on live's 400, on the dark band and the white one", async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(cta).to.have.lengthOf(2);
    cta.forEach((h2) => expect(getComputedStyle(h2).fontWeight).to.equal('400'));
  });

  it('holds that weight below the desktop step too, where live has no query', async () => {
    await setViewport({ width: 375, height: 900 });
    cta.forEach((h2) => expect(getComputedStyle(h2).fontWeight).to.equal('400'));
  });

  it("puts the slide title on live's 400", async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(columns).fontWeight).to.equal('400');
  });

  it('leaves the colour alone, which was never the difference', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(columns).color).to.equal('rgb(51, 51, 51)');
    expect(getComputedStyle(cta[0]).color).to.equal('rgb(255, 255, 255)');
  });
});
