/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/promo-bar/promo-bar.js';

/**
 * The open panel's chrome, read off continentaltire.com on 2026-08-02:
 *
 *   .promo-bar__disclosure[expanded] [slot=detail] { text-align: center;
 *     background-color: #000002; color: var(--white); border: 5px solid
 *     var(--yellow); display: block; position: relative;
 *     padding: var(--space-16) }
 *   .promo-bar__disclosure[expanded] [slot=close] { display: block;
 *     position: absolute; top: 0.5rem; right: 0.5rem }
 *
 * with `--yellow: #ffa500`, identical to `--conti-yellow`, and `--black: #333`,
 * identical to `--conti-black`. Live's call to action is
 * `<a class="btn btn--yellow">`, which is a yellow field with black text, and it
 * is not the panel's first child, so the `.btn--yellow:first-child` white
 * variant does not reach it. Its close control is `icon__close-circle icon--lg
 * icon--white`, which resolves to a 30px circle filled and stroked white with a
 * #333 cross, and `aria-label="Close the panel"`.
 *
 * The bar is a divergence zone, so nothing here reads or changes a word of the
 * copy: a background colour, a border and a button make no commercial claim,
 * assert no copyright and imply no operator. The last test holds the copy still.
 * Issue #169.
 */
describe('Promo bar, the open panel', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/promo-bar/promo-bar.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(async () => {
    document.body.innerHTML = `
      <main><div class="section promo-bar-container"><div class="promo-bar-wrapper">
        <div class="promo-bar block">
          <div><div><p>See how to get a $110 Rebate</p></div></div>
          <div><div>
            <h2>Get a $110 Rebate</h2>
            <p>when you purchase a set of 4 qualifying Continental Tires!</p>
            <p><a href="/offers">See Full Details</a></p>
          </div></div>
        </div>
      </div></div></main>`;
    block = document.querySelector('.promo-bar.block');
    decorate(block);
    await setViewport({ width: 1440, height: 900 });
  });

  const open = () => {
    block.querySelector('.promo-bar-toggle').click();
    return block.querySelector('.promo-bar-panel');
  };

  it('is black behind white text, not white', () => {
    const panel = open();
    expect(getComputedStyle(panel).backgroundColor, "live's #000002").to.equal('rgb(0, 0, 2)');
    expect(getComputedStyle(panel).color, "live's white").to.equal('rgb(255, 255, 255)');
  });

  it('frames the panel in 5px of yellow, edge to edge', async () => {
    open();
    const inner = block.querySelector('.promo-bar-panel-inner');
    const frame = getComputedStyle(inner);
    ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => {
      expect(frame[`border${side}Width`], `live's 5px on the ${side.toLowerCase()}`).to.equal('5px');
      expect(frame[`border${side}Color`], `live's yellow on the ${side.toLowerCase()}`).to.equal('rgb(255, 165, 0)');
    });
    // live's border is on the full-bleed panel, so the frame reaches both edges
    // at every width rather than stopping at the 1200 content column
    const widths = [375, 900, 1440];
    // eslint-disable-next-line no-restricted-syntax
    for (const width of widths) {
      // eslint-disable-next-line no-await-in-loop
      await setViewport({ width, height: 800 });
      expect(inner.getBoundingClientRect().width, `full bleed at ${width}`).to.be.closeTo(width, 1);
    }
  });

  it('shows no yellow while the panel is shut', () => {
    const inner = block.querySelector('.promo-bar-panel-inner');
    expect(getComputedStyle(inner).borderTopWidth, 'nothing leaks under the bar').to.equal('0px');
    expect(block.querySelector('.promo-bar-panel').getBoundingClientRect().height, 'and the row is crushed').to.be.closeTo(0, 1);
  });

  it('makes the call to action a yellow field with black text', () => {
    open();
    const cta = block.querySelector('.promo-bar-panel-content a[href="/offers"]');
    expect(cta.classList.contains('primary'), "live's btn--yellow, not an outline").to.be.true;
    expect(cta.classList.contains('secondary'), 'the outline variant is gone').to.be.false;
    const style = getComputedStyle(cta);
    expect(style.backgroundColor, "live's yellow").to.equal('rgb(255, 165, 0)');
    expect(style.color, "live's black").to.equal('rgb(51, 51, 51)');
  });

  it('offers the close control live puts in the corner', () => {
    open();
    const close = block.querySelector('.promo-bar-close');
    expect(close, 'the control').to.exist;
    expect(close.tagName).to.equal('BUTTON');
    expect(close.type).to.equal('button');
    expect(close.getAttribute('aria-label'), "live's own label").to.equal('Close the panel');

    const box = close.getBoundingClientRect();
    expect(box.width, "live's icon--lg 30px").to.be.closeTo(30, 0.5);
    expect(box.height, "live's icon--lg 30px").to.be.closeTo(30, 0.5);
    expect(getComputedStyle(close).backgroundImage, 'the circled cross').to.match(/svg/);

    // 0.5rem in from the panel's own top-right, which is live's inset
    const panel = block.querySelector('.promo-bar-panel-inner').getBoundingClientRect();
    expect(box.top - panel.top, "live's 8px down").to.be.closeTo(8 + 5, 1);
    expect(panel.right - box.right, "live's 8px in").to.be.closeTo(8 + 5, 1);
  });

  it('shuts the panel from the close control and hands focus back', () => {
    const panel = open();
    expect(panel.classList.contains('promo-bar-panel-open')).to.be.true;
    block.querySelector('.promo-bar-close').click();
    expect(panel.classList.contains('promo-bar-panel-open'), 'shut').to.be.false;
    expect(panel.hasAttribute('inert'), 'and out of reach again').to.be.true;
    expect(document.activeElement, 'focus goes back to the toggle it came from')
      .to.equal(block.querySelector('.promo-bar-toggle'));
  });

  it('changes not a word of the copy', () => {
    open();
    const content = block.querySelector('.promo-bar-panel-content');
    expect(content.querySelector('h2').textContent).to.equal('Get a $110 Rebate');
    expect(content.querySelector('p').textContent)
      .to.equal('when you purchase a set of 4 qualifying Continental Tires!');
    expect(content.querySelector('a').textContent).to.equal('See Full Details');
    expect(block.querySelector('.promo-bar-toggle').textContent)
      .to.contain('See how to get a $110 Rebate');
  });
});
