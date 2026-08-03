/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * #467. Live runs two card treatments and the block had one, so
 * /my-first-car-my-first-tires rendered with /experience/soccer's type.
 *
 * Live names them itself. Its component is `card-list` and the variant is on the
 * band: `card-list--no_leading` on my-first-car, `card-list--single_leading` and
 * `--double_leading` on soccer and the four video listings. The block already
 * carries `leading` and `leading-pair` for the second kind, so no leading is the
 * absence of both and nothing has to be authored for it.
 *
 * Read off continentaltire.com on 2026-08-03 at 1440, 1024 and 375, my-first-car
 * against soccer as the control:
 *
 * | | live, my-first-car | live, soccer | ours before |
 * | --- | --- | --- | --- |
 * | card name | 12/16, 700, 0.6px, caps | 20/30 on the teaser, 14/20 after | 14/20, 400 |
 * | its alignment | left at all three | centred on the teaser | centred below 1025 |
 * | the lone card | x=508.66, x=359.33, x=20 | | x=152, x=16, x=20 |
 *
 * Live centres that card through a third class, `card-list--centered`, on the one
 * band that holds a single card. `:only-child` is the same condition read off the
 * markup.
 *
 * `/learn/product-highlights` authors this block bare too and is NOT this live
 * component: live builds it as `news-category-page-grid-3` with a CTA in each
 * card footer, which #244 already measured at 18px. So the treatment stops at a
 * block whose captions carry no CTA.
 */
const card = (title, cta) => `
  <div>
    <div><picture><img src="/media/still.png" alt="" width="752" height="423"></picture></div>
    <div><a href="https://www.youtube.com/watch?v=l35vl9EO3ts">${title}</a></div>
    ${cta ? '<div><p><a href="/tires/4x4contact">Tire details</a></p></div>' : ''}
  </div>`;

const authored = (variant, cards, cta = false) => {
  document.body.innerHTML = '<main><div class="dark section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${
      Array.from({ length: cards }, (unused, i) => card(`Episode ${i + 1}`, cta)).join('')
    }</div></div></div></main>`;
  const block = document.querySelector('.media-gallery.block');
  decorate(block);
  if (block.getBoundingClientRect().height === 0) {
    throw new Error('the gallery fixture rendered with no box, so nothing here was measured');
  }
  return block;
};

describe("Media gallery, live's no-leading card treatment (#467)", () => {
  let sheets;

  before(async () => {
    sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/media-gallery/media-gallery.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  beforeEach(() => { document.body.innerHTML = ''; });

  const title = (block) => {
    const el = block.querySelector('.media-gallery-caption > :is(h2, span)');
    if (!el) throw new Error('the fixture built no card name, so nothing here was measured');
    return getComputedStyle(el);
  };

  [1440, 1024, 375].forEach((width) => {
    it(`reads live's 12px card name at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      const cs = title(authored('cards', 8));
      expect(cs.fontSize).to.equal('12px');
      expect(cs.lineHeight).to.equal('16px');
    });

    it(`reads live's bold uppercase name at 0.6px tracking at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      const cs = title(authored('cards', 8));
      expect(cs.fontWeight).to.equal('700');
      expect(cs.letterSpacing).to.equal('0.6px');
      expect(cs.textTransform).to.equal('uppercase');
    });

    it(`lefts the card footer at ${width}, where live lefts it at all three`, async () => {
      await setViewport({ width, height: 900 });
      const block = authored('cards', 8);
      const caption = block.querySelector('.media-gallery-caption');
      expect(getComputedStyle(caption).textAlign).to.equal('left');
    });
  });

  it("centres a lone card at 1440, the way live's centered band does", async () => {
    await setViewport({ width: 1440, height: 900 });
    const block = authored('cards', 1);
    const list = block.querySelector('.media-gallery-list').getBoundingClientRect();
    const cell = block.querySelector('.media-gallery-list > li').getBoundingClientRect();
    const px = (v) => Math.round(v * 100) / 100;
    expect(px(cell.left + cell.width / 2), 'the card sits on the row centre')
      .to.equal(px(list.left + list.width / 2));
    expect(px(cell.width), 'a third of the row, not the whole of it').to.equal(353.33);
  });

  it('centres it at 1024 too', async () => {
    await setViewport({ width: 1024, height: 800 });
    const block = authored('cards', 1);
    const list = block.querySelector('.media-gallery-list').getBoundingClientRect();
    const cell = block.querySelector('.media-gallery-list > li').getBoundingClientRect();
    expect(Math.round(cell.left + cell.width / 2)).to.equal(Math.round(list.left + list.width / 2));
  });

  it('leaves it the whole column at 375, which is live', async () => {
    await setViewport({ width: 375, height: 812 });
    const block = authored('cards', 1);
    const list = block.querySelector('.media-gallery-list').getBoundingClientRect();
    const cell = block.querySelector('.media-gallery-list > li').getBoundingClientRect();
    expect(Math.round(cell.width)).to.equal(Math.round(list.width));
    expect(Math.round(cell.left)).to.equal(Math.round(list.left));
  });

  describe('the blocks this must not reach', () => {
    it('a leading band keeps its own 20px teaser name', async () => {
      await setViewport({ width: 1440, height: 900 });
      const cs = title(authored('cards leading', 7));
      expect(cs.fontSize).to.equal('20px');
      expect(cs.textTransform).to.equal('none');
    });

    it('a leading pair keeps the 14px name', async () => {
      await setViewport({ width: 1440, height: 900 });
      const cs = title(authored('cards leading-pair', 3));
      expect(cs.fontSize).to.equal('14px');
      expect(cs.textTransform).to.equal('none');
    });

    it("/learn/product-highlights keeps #244's 18px CTA row", async () => {
      await setViewport({ width: 1440, height: 900 });
      const cs = title(authored('cards', 9, true));
      expect(cs.fontSize).to.equal('18px');
      expect(cs.letterSpacing).to.equal('0.25px');
    });

    it('and a single CTA card is not centred, because live does not centre it', async () => {
      await setViewport({ width: 1440, height: 900 });
      const block = authored('cards', 1, true);
      const list = block.querySelector('.media-gallery-list').getBoundingClientRect();
      const cell = block.querySelector('.media-gallery-list > li').getBoundingClientRect();
      expect(Math.round(cell.left)).to.equal(Math.round(list.left));
    });
  });
});
