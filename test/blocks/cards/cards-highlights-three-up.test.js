/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * /ev-compatible runs two three-tile rows and ours put two across, so the third
 * tile stood alone beside an empty half-row in both. Read at 1440 on 2026-08-03:
 *
 *   live  .tiles__list_col_3 and .cards-carousel__grid both
 *         `grid-template-columns: repeat(3, 1fr)`, three 439.328px columns in a
 *         1358 container, collapsing to `1fr` under `max-width: 768px`
 *   ours  `558px 558px` on both rows
 *
 * THE COUNT IS WHAT DECIDES IT, not the variant, because `highlights` stands in
 * for four different live components and live gives them three different column
 * counts. Censused over the 327 published paths in `.mossy/parity/395/`, five
 * rows carry the variant:
 *
 *   /ev-compatible  3 tiles  live tiles__list_col_3                3 across
 *   /ev-compatible  3 tiles  live cards-carousel--grid             3 across
 *   /smart-choice   3 tiles  live tiles__list_col_3                3 across
 *   /smart-choice   4 tiles  live tiles__list_col_4                4 across
 *   /smart-choice  13 tiles  live cards-carousel, a scroller       -
 *   /learn          4 tiles  live product-highlights-block__grid   2 across
 *
 * So every three-tile row on live is three across, and four tiles is 4 on one
 * page and 2 on another. A rule on the count closes the three and leaves the
 * others where they are; taking the count off the variant would put /learn's row
 * on a column live does not give it. Issue #245.
 */
const card = (name) => `
  <div>
    <div><picture><img src="/ev-compatible/tile.jpg" alt="${name}"></picture></div>
    <div><h3>${name}</h3><p>Body copy for the ${name} tile.</p></div>
  </div>`;

/**
 * @param {number} count how many tiles the row holds
 * @returns {Element} the decorated block
 */
function build(count) {
  const names = ['One', 'Two', 'Three', 'Four', 'Five'].slice(0, count);
  document.body.innerHTML = `
    <main><div class="section cards-container">
      <div class="default-content-wrapper"><h2>Why Continental?</h2></div>
      <div class="cards-wrapper"><div class="cards highlights block">
        ${names.map(card).join('')}
      </div></div>
    </div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  return block;
}

const columns = (block) => getComputedStyle(block.querySelector(':scope > ul'))
  .gridTemplateColumns.split(' ').length;

describe("Cards, live's three-up highlights row", () => {
  before(async () => {
    const sheets = await Promise.all([
      styleSheet('/styles/styles.css'),
      styleSheet('/blocks/cards/cards.css'),
    ]);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => {
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    document.adoptedStyleSheets = [];
  });

  it('runs three tiles across at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(columns(build(3))).to.equal(3);
  });

  it('runs three across at 900, where live runs three too', async () => {
    await setViewport({ width: 900, height: 900 });
    expect(columns(build(3))).to.equal(3);
  });

  it("runs three across at live's own 769 bound", async () => {
    await setViewport({ width: 769, height: 900 });
    expect(columns(build(3))).to.equal(3);
  });

  it('stacks them at 768, where live collapses to one column', async () => {
    await setViewport({ width: 768, height: 900 });
    expect(columns(build(3))).to.equal(1);
  });

  it('leaves no tile alone on a half-row', async () => {
    await setViewport({ width: 1440, height: 900 });
    const tiles = [...build(3).querySelectorAll(':scope > ul > li')];
    const tops = new Set(tiles.map((li) => Math.round(li.getBoundingClientRect().top)));
    expect(tops.size, 'one row').to.equal(1);
  });

  // /learn's row, which live runs two across
  it('leaves a four-tile row on two columns', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(columns(build(4))).to.equal(2);
  });

  it('leaves a five-tile row on two columns', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(columns(build(5))).to.equal(2);
  });
});
