/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/hero/hero.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * /ev-compatible opens on a centred two-line title with an arrow bouncing under
 * it. Ours read one flat line pinned left and drew no arrow. Read at 1440 on
 * 2026-08-03:
 *
 *   live  section.marquee marquee--bottom marquee--has-jumplink, 1440x360
 *         h1 459.39x96 at x=490.3, so two 48px lines centred on the page
 *         .marquee__content  text-align center, align-items center,
 *                            justify-content flex-end, padding-bottom 70
 *         a.marquee__jump-link  28x35 at x=710 y=409.69, bottom 20,
 *                               animation bounce 1s infinite, href #evready
 *   ours  h1 1376x48 at x=32, one line, .hero-content text-align left, no arrow
 *
 * THE BREAK IS AUTHORED AND THE CENTRING IS NOT. Live's own h1 holds a literal
 * `<br>`, `<span class="text-uppercase"><span class="text-color-yellow">THE SMART
 * CHOICE</span></span><br>For Your Electric Vehicle`, so the two lines are in
 * live's document; the centring comes from `.marquee--bottom .marquee__content`,
 * a rule on a component option. Ours is the mirror image: the break goes in the
 * document and the centring goes here, on a `bottom` variant standing for live's
 * `marquee--bottom`. `.hero.stacked .hero-content` sets `text-align: left` above
 * 1025 for the desktop overlay, which is what pinned this title left.
 *
 * THE ARROW POINTS AT THE SECTION UNDER THE BAND. Live's points at
 * `<section class="tab-anchor" id="evready">`, an empty anchor its editor places;
 * ours reads the id the pipeline slugs onto the next section's first heading,
 * `#why-continental` here, so nothing has to be authored for the target. No id,
 * no arrow: a control that scrolls nowhere is worse than none.
 *
 * Live's own arrow sits 4px right of centre, `left: calc(50% - 10px)` under a
 * 28px box. Ours is centred; a 4px lean reads as a defect rather than as live.
 *
 * Issue #245.
 */
const TITLE = 'THE SMART CHOICE<br>For Your Electric Vehicle';

/**
 * @param {object} opts
 * @param {string} [opts.variants] the classes the author put on the block
 * @param {string} [opts.next] the section under the band
 * @returns {Element} the decorated block
 */
function build({ variants = 'stacked slim bottom jump', next = '<h2 id="why-continental">Why Continental?</h2>' } = {}) {
  document.body.innerHTML = `
    <main>
      <div class="section hero-container">
        <div class="hero-wrapper">
          <div class="hero ${variants} block">
            <div><div><picture><img src="/ev-compatible/banner.jpg" width="1440" height="360" alt=""></picture></div></div>
            <div><div><h1 id="the-smart-choice-for-your-electric-vehicle">${TITLE}</h1></div></div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="default-content-wrapper">${next}</div>
      </div>
    </main>`;
  const block = document.querySelector('.hero');
  decorate(block);
  return block;
}

const content = (block) => block.querySelector('.hero-content');
const arrow = (block) => block.querySelector('.hero-jump');

describe("Hero, live's bottom-anchored title and its jump arrow", () => {
  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/hero/hero.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it('centres the title at 1440, where the stacked variant pins it left', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    expect(getComputedStyle(content(block)).textAlign).to.equal('center');
    const h1 = block.querySelector('h1').getBoundingClientRect();
    const band = block.getBoundingClientRect();
    expect(Math.round(h1.left - band.left)).to.equal(Math.round(band.right - h1.right));
  });

  it('centres it at 375 too, where live centres its divided band', async () => {
    await setViewport({ width: 375, height: 900 });
    expect(getComputedStyle(content(build())).textAlign).to.equal('center');
  });

  it("sits the copy at the foot of the band on live's 70", async () => {
    await setViewport({ width: 1440, height: 900 });
    const cs = getComputedStyle(content(build()));
    expect(cs.alignSelf).to.equal('flex-end');
    expect(cs.paddingBottom).to.equal('70px');
  });

  it('renders the authored break as two lines', async () => {
    await setViewport({ width: 1440, height: 900 });
    const h1 = build().querySelector('h1');
    expect(h1.querySelector('br'), 'the break survived decoration').to.exist;
    expect(Math.round(h1.getBoundingClientRect().height), 'two 48px lines').to.equal(96);
  });

  it('draws a link to the section under the band', async () => {
    const link = arrow(build());
    expect(link, 'the arrow').to.exist;
    expect(link.tagName).to.equal('A');
    expect(link.getAttribute('href')).to.equal('#why-continental');
    expect(link.getAttribute('aria-label'), 'a name for a link with no text').to.contain('Why Continental');
  });

  it('pins the arrow to the bottom of the band and centres it', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    const cs = getComputedStyle(arrow(block));
    expect(cs.position).to.equal('absolute');
    expect(cs.bottom).to.equal('20px');
    expect(Math.round(parseFloat(cs.width)), "live's 28").to.equal(28);
    expect(Math.round(parseFloat(cs.height))).to.equal(28);
    const box = arrow(block).getBoundingClientRect();
    const band = block.getBoundingClientRect();
    expect(Math.round(box.left - band.left)).to.equal(Math.round(band.right - box.right));
  });

  it("bounces it on live's 1s loop", async () => {
    await setViewport({ width: 1440, height: 900 });
    const cs = getComputedStyle(arrow(build()));
    expect(cs.animationName).to.equal('hero-bounce');
    expect(cs.animationDuration).to.equal('1s');
    expect(cs.animationIterationCount).to.equal('infinite');
  });

  it("takes live's 8 off the bottom below the desktop step", async () => {
    await setViewport({ width: 375, height: 900 });
    expect(getComputedStyle(arrow(build())).bottom).to.equal('8px');
  });

  it('draws no arrow on a hero that does not ask for one', () => {
    expect(arrow(build({ variants: 'stacked slim bottom' }))).to.not.exist;
  });

  it('draws no arrow when the next section has no heading to reach', () => {
    expect(arrow(build({ next: '<p>No heading here.</p>' }))).to.not.exist;
  });

  it('draws no arrow when the next heading carries no id', () => {
    expect(arrow(build({ next: '<h2>Why Continental?</h2>' }))).to.not.exist;
  });

  it('leaves a hero without the bottom variant pinned left above the step', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build({ variants: 'stacked slim' });
    expect(getComputedStyle(content(block)).textAlign).to.equal('left');
  });
});
