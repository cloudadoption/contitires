/* eslint-disable no-unused-expressions */
/* global describe it before beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/store-locator/store-locator.js';

/**
 * The static stand-in for live's store finder. It was written for a dark band
 * and now stands on the white panel behind /online-retailers' first tab, so
 * the field takes the colour of whatever band it is on. Issue #91.
 *
 * A row is a part: the search column, an example result, and the calls to
 * action under them.
 */
const SAMPLE = ['<h2>Stores near you</h2><p>Use current location</p>',
  '<p>3.4 <strong>MI</strong></p><p><strong>Continental</strong></p>'
  + '<p>1794 Macmillan Park Dr, Fort Mill, SC, 29707</p>'];

function buildLocator(rows = SAMPLE, band = '') {
  document.body.innerHTML = `
    <main>
      <div class="section store-locator-container ${band}">
        <div class="store-locator-wrapper">
          <div class="store-locator block" data-block-name="store-locator">
            ${rows.map((cell) => `<div><div>${cell}</div></div>`).join('')}
          </div>
        </div>
      </div>
    </main>`;
  return document.querySelector('.store-locator.block');
}

describe('Store locator block', () => {
  let block;
  beforeEach(() => { block = buildLocator(); });

  it('puts a disabled search field under the heading', () => {
    decorate(block);
    const input = block.querySelector('.store-locator-field input');
    expect(input, 'the field').to.exist;
    expect(input.disabled, 'no store database stands behind it').to.be.true;
    expect(input.placeholder).to.have.length.above(0);
    expect(input.getAttribute('aria-label')).to.equal(input.placeholder);
    const heading = block.querySelector('h2');
    expect(heading.nextElementSibling).to.equal(input.closest('.store-locator-field'));
  });

  it('splits the result into a distance and the details', () => {
    decorate(block);
    const result = block.querySelector('.store-locator-result');
    expect(result.querySelector('.store-locator-distance').textContent).to.contain('3.4');
    expect(result.querySelector('.store-locator-details').textContent).to.contain('Continental');
  });
});

describe('Store locator block, on the band it stands on', () => {
  let block;

  async function adopt(...paths) {
    const sheets = await Promise.all(paths.map(async (p) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(p)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
  }

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/store-locator/store-locator.css');
    document.body.classList.add('appear');
  });

  it('takes the page\'s own text colour on a white panel', async () => {
    await setViewport({ width: 1440, height: 900 });
    block = buildLocator();
    decorate(block);
    const input = block.querySelector('.store-locator-field input');
    const styles = getComputedStyle(input);
    expect(styles.color, 'the typed text reads').to.equal('rgb(51, 51, 51)');
    expect(styles.borderBottomColor, 'and the rule under it shows').to.equal('rgb(51, 51, 51)');
  });

  it('turns white on a dark band, as it was drawn for', async () => {
    await setViewport({ width: 1440, height: 900 });
    block = buildLocator(SAMPLE, 'dark');
    decorate(block);
    const styles = getComputedStyle(block.querySelector('.store-locator-field input'));
    expect(styles.color).to.equal('rgb(255, 255, 255)');
    expect(styles.borderBottomColor).to.equal('rgb(255, 255, 255)');
  });
});
