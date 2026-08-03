/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/cards/cards.js';
import styleSheet from '../../helpers/stylesheet.js';

/**
 * Our Tires Are EV Compatible draws its three marks beside their labels on live
 * and above them here, at ten times the size. Read at 1440 on 2026-08-03:
 *
 *   live  .cards-carousel__item     flex row, align-items flex-start,
 *                                   padding 20 20 26 20, 439.33x204
 *         .cards-carousel__item__icon  56 wide, flex-shrink 0, 20 to its right
 *         its img                      56x56
 *         .cards-carousel__item__texts left-aligned, at x = icon + 56 + 20
 *   ours  the Weight mark 558x313.88, a full-width 16:9 crop over centred text
 *
 * The shared card image is that crop, `aspect-ratio: 16 / 9` with
 * `object-fit: cover`, which is right for a photograph and 5.6 times too wide for
 * a 600 by 600 pictogram.
 *
 * SAME DISCRIMINATOR AS THE GROUND RULE #398 PUT ON THIS ROW, the tile's own
 * file. `highlights` covers live's `tile`, which holds a photograph, and its
 * `cards-carousel__item`, which holds a drawn mark; of the two rows in a `dark`
 * section only this one holds marks, and /smart-choice's four photo tiles must
 * keep the crop. Issue #245.
 */
const ICON = '/ev-compatible/media_182418959830d758e9fd377382e494f4e919e80c8.svg?width=750&format=svg&optimize=medium';
const PHOTO = '/smart-choice/media_146ab.jpg?width=750&format=jpg&optimize=medium';

/**
 * @param {object} opts
 * @param {string} [opts.section] the section's style class
 * @param {boolean} [opts.icons] whether the tiles hold marks or photographs
 * @returns {Element} the decorated block
 */
function build({ section = 'dark', icons = true } = {}) {
  const media = `<picture><img src="${icons ? ICON : PHOTO}" alt=""></picture>`;
  const card = (name) => `
    <div>
      <div>${media}</div>
      <div><h3>${name}</h3><p>Body copy for the ${name} card, long enough to wrap.</p></div>
    </div>`;
  document.body.innerHTML = `
    <main><div class="${section} section cards-container">
      <div class="default-content-wrapper"><h2>Our Tires Are EV Compatible</h2></div>
      <div class="cards-wrapper"><div class="cards highlights block">
        ${['Weight', 'Noise', 'Range'].map(card).join('')}
      </div></div>
    </div></main>`;
  const block = document.querySelector('.cards');
  decorate(block);
  return block;
}

const tile = (block) => block.querySelector(':scope > ul > li');
const mark = (block) => block.querySelector('.cards-card-image');
const body = (block) => block.querySelector('.cards-card-body');

describe("Cards, live's mark beside its label", () => {
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

  it("draws the mark at live's 56 square", async () => {
    await setViewport({ width: 1440, height: 900 });
    const img = build().querySelector('img');
    const box = img.getBoundingClientRect();
    expect(Math.round(box.width), 'width').to.equal(56);
    expect(Math.round(box.height), 'height').to.equal(56);
  });

  it('holds the 56 at 375, where live holds it too', async () => {
    await setViewport({ width: 375, height: 900 });
    const box = build().querySelector('img').getBoundingClientRect();
    expect(Math.round(box.width)).to.equal(56);
    expect(Math.round(box.height)).to.equal(56);
  });

  it('keeps the whole mark rather than cropping it to 16 by 9', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cs = getComputedStyle(build().querySelector('img'));
    expect(cs.objectFit).to.equal('contain');
    expect(cs.aspectRatio).to.equal('auto');
  });

  it('lays the mark out to the left of the label', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    const icon = mark(block).getBoundingClientRect();
    const text = body(block).getBoundingClientRect();
    expect(Math.round(text.left - icon.right), "live's 20 between them").to.equal(20);
    expect(Math.round(icon.top), 'level with the copy').to.equal(Math.round(text.top));
  });

  it("gives the tile live's own room around the pair", async () => {
    await setViewport({ width: 1440, height: 900 });
    const cs = getComputedStyle(tile(build()));
    expect(cs.display).to.equal('flex');
    expect(cs.flexDirection).to.equal('row');
    expect(cs.alignItems).to.equal('flex-start');
    expect(cs.paddingTop).to.equal('20px');
    expect(cs.paddingLeft).to.equal('20px');
    expect(cs.paddingRight).to.equal('20px');
    expect(cs.paddingBottom).to.equal('26px');
  });

  it('reads the label and the copy left, where live reads them left', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build();
    expect(getComputedStyle(body(block)).textAlign).to.equal('left');
    expect(getComputedStyle(body(block)).flexDirection, 'the label over the copy').to.equal('column');
  });

  // /smart-choice's Total Confidence Plan row: same variant, same dark band,
  // photographs rather than marks, and live keeps the full-width crop there.
  it('leaves a photo tile in the same dark section on the crop', async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = build({ icons: false });
    const cs = getComputedStyle(block.querySelector('img'));
    expect(cs.aspectRatio).to.equal('16 / 9');
    expect(cs.objectFit).to.equal('cover');
    expect(getComputedStyle(tile(block)).display).to.equal('list-item');
  });

  // /ev-compatible's own Why Continental? row holds photographs in a section with
  // no style class, and keeps the crop as well.
  it('leaves an icon tile outside a dark section alone', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(tile(build({ section: '' }))).display).to.equal('list-item');
  });
});
