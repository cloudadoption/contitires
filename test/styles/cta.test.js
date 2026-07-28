/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The band live closes a page with: a heading with its controls under it, all
 * centred, 16 apart, in a band padded 80 from 769 and 38 below. /warranty has
 * two, one black with three pills and one white with a download link. Ours ran
 * both left aligned, and drew the download as a pill.
 *
 * Read off continentaltire.com/warranty at 1440, 900, 768 and 375. Issue #94.
 */
describe("The cta band, live's heading over its controls", () => {
  let dark;
  let light;

  before(async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const pill = (href, text) => `<p class="button-wrapper"><a class="button primary" href="${href}">${text}</a></p>`;
    document.body.innerHTML = `
      <main>
        <div class="section black cta">
          <div class="default-content-wrapper">
            <h2 id="looking-for-another-warranty-type">Looking for another warranty type?</h2>
            ${pill('https://continentaltire.zendesk.com/hc/en-us/articles/44468078554260', 'Fleet warranty')}
            ${pill('/documents/limited-warranty', 'New vehicle tire warranty')}
            ${pill('/documents/tcp-spanish', 'Total Confidence Plan (Spanish)')}
          </div>
        </div>
        <div class="section cta">
          <div class="default-content-wrapper">
            <h2 id="get-the-complete-total-confidence-plan">Get the complete Total Confidence Plan.</h2>
            <p><a href="/documents/tcp-brochure">Download now <span class="icon icon-download-arrow"></span></a></p>
          </div>
        </div>
      </main>`;
    document.body.classList.add('appear');
    [dark, light] = [...document.querySelectorAll('.section.cta')];
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
  });

  it('centres the band and its controls', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(dark).textAlign).to.equal('center');
    expect(getComputedStyle(light).textAlign).to.equal('center');
    const heading = dark.querySelector('h2').getBoundingClientRect();
    const wrapper = dark.firstElementChild.getBoundingClientRect();
    expect(Math.round(heading.left - wrapper.left))
      .to.equal(Math.round(wrapper.right - heading.right));
  });

  it("pads the band live's 38, and 80 from 769", async () => {
    await setViewport({ width: 768, height: 900 });
    expect(getComputedStyle(light).padding).to.equal('38px 0px');
    await setViewport({ width: 769, height: 900 });
    expect(getComputedStyle(light).padding).to.equal('80px 0px');
  });

  // live's bands touch, each carrying its own room
  it('lets the bands touch', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(light).margin).to.equal('0px');
    expect(Math.round(light.getBoundingClientRect().top))
      .to.equal(Math.round(dark.getBoundingClientRect().bottom));
  });

  it('sets 16 between the heading and each control', async () => {
    await setViewport({ width: 1440, height: 900 });
    const heading = dark.querySelector('h2');
    const pills = [...dark.querySelectorAll('.button-wrapper')];
    expect(Math.round(pills[0].getBoundingClientRect().top
      - heading.getBoundingClientRect().bottom)).to.equal(16);
    expect(Math.round(pills[1].getBoundingClientRect().top
      - pills[0].getBoundingClientRect().bottom)).to.equal(16);
    const link = light.querySelector('a');
    expect(Math.round(link.getBoundingClientRect().top
      - light.querySelector('h2').getBoundingClientRect().bottom)).to.equal(16);
  });

  it('runs a pill the width of the column below 769', async () => {
    await setViewport({ width: 768, height: 900 });
    const pill = dark.querySelector('.button');
    const wrapper = dark.firstElementChild;
    expect(Math.round(pill.getBoundingClientRect().width))
      .to.equal(Math.round(wrapper.getBoundingClientRect().width) - 48);
    await setViewport({ width: 769, height: 900 });
    expect(Math.round(pill.getBoundingClientRect().width)).to.be.below(300);
  });

  // live draws the download as a plain link rather than a pill: small,
  // uppercase, with its arrow after the words
  it("draws a plain link as live's download", async () => {
    await setViewport({ width: 1440, height: 900 });
    const link = light.querySelector('a');
    const styles = getComputedStyle(link);
    // a flex item, so the authored inline-flex is blockified to flex
    expect(styles.display).to.equal('flex');
    expect(styles.alignItems).to.equal('center');
    expect(styles.padding).to.equal('0px');
    expect(styles.fontSize).to.equal('12px');
    expect(styles.lineHeight).to.equal('16px');
    expect(styles.fontWeight).to.equal('700');
    expect(styles.letterSpacing).to.equal('1.25px');
    expect(styles.textTransform).to.equal('uppercase');
    expect(styles.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    expect(Math.round(link.getBoundingClientRect().height)).to.equal(20);
  });

  // an underline live keeps transparent until hover, which this site paints
  it('keeps the link underlined, where live hides it', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(light.querySelector('a')).textDecorationLine).to.equal('underline');
  });

  it('sets the arrow 20 square, 6 after the words', async () => {
    await setViewport({ width: 1440, height: 900 });
    const arrow = light.querySelector('a .icon');
    expect(Math.round(arrow.getBoundingClientRect().width)).to.equal(20);
    expect(Math.round(arrow.getBoundingClientRect().height)).to.equal(20);
    expect(getComputedStyle(arrow).marginInlineStart).to.equal('6px');
  });
});
