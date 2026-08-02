/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * Live lists a video series through card-list card-list--single_leading: the
 * first episode runs the width of the grid with its name and description in a
 * white column beside the still, and the rest follow as cards below it.
 *
 * Read off continentaltire.com/forwhatyoudo at 1440, 1200, 1025, 900, 769 and
 * 375. The feature is 430 tall with a 400px name column padded 20 by 38, the
 * still takes what is left, and below 769 the still goes over the name. The
 * feature name is 20/30 bold from 1025 and 14/20 below it, and every card name
 * is centred below 1025. Issues #256 and #257.
 */
/*
 * The still carries the `width` and `height` the pipeline puts on it, because
 * the leading tile is the one place the block reads them: everywhere else the
 * CSS names an `aspect-ratio` and that outranks the attributes. Both hosts
 * deliver 752x423 on all eight stills of /forwhatyoudo, and so does live, whose
 * own img is `medium_16_9` at the same 752x423.
 *
 * Without them the tile has no intrinsic ratio, so the row falls back to the
 * `min-height` and reads 430 whether the block is right or wrong. That is #391:
 * the assertion below passed only because its image 404ed.
 */
const card = (src, alt, href, title, text) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}" width="752" height="423"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
    ${text ? `<div><p>${text}</p></div>` : ''}
  </div>`;

// the CSS is written against the shape the pipeline delivers, so the block
// stands in a section wrapper inside main or none of it applies
const authored = (rows, variant) => {
  document.body.innerHTML = '<main><div class="dark section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

/** the head of live's /forwhatyoudo: its leading episode and three others */
const series = (variant = 'cards leading') => authored([
  card(
    '/media/resin-art.jpg',
    '',
    'https://www.youtube.com/watch?v=AaIR7v_TJHs',
    'For What You Do: Resin Art',
    'Though Rutledge Wood is more accustomed to wrenching on cars in the garage, he learns in this For What You Do episode that a garage-turned-art studio yields a whole new array of custom classics.',
  ),
  card(
    '/media/dog-training.jpg',
    '',
    'https://www.youtube.com/watch?v=FOzVDp3Jz2g',
    'For What You Do: Dog Training',
    '',
  ),
  card(
    '/media/furniture.jpg',
    '',
    'https://www.youtube.com/watch?v=wdbZvw3iBIs',
    'For What You Do: Rutledge Wood Restores Vintage Furniture',
    '',
  ),
  card(
    '/media/landscaping.jpg',
    '',
    'https://www.youtube.com/watch?v=LeWZkkuSx70',
    'For What You Do: Rutledge Wood Goes Landscaping',
    '',
  ),
], variant);

describe('Media gallery leading, the episode live features', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = series());
  });

  it('names the feature and its followers alike', () => {
    const names = [...block.querySelectorAll('.media-gallery-caption h2')];
    expect(names.map((h) => h.textContent)).to.eql([
      'For What You Do: Resin Art',
      'For What You Do: Dog Training',
      'For What You Do: Rutledge Wood Restores Vintage Furniture',
      'For What You Do: Rutledge Wood Goes Landscaping',
    ]);
  });

  // live shows the description on the leading episode and hides it on the rest
  it('carries the description on the feature alone', () => {
    const captions = [...block.querySelectorAll('.media-gallery-caption')];
    expect(captions[0].querySelector('p').textContent).to.contain('wrenching on cars');
    expect(!!captions[1].querySelector('p'), 'live shows none here').to.be.false;
    expect(!!captions[3].querySelector('p')).to.be.false;
  });

  it('opens the feature on the same modal as any other card', () => {
    block.querySelector('.media-gallery-tile').click();
    const modal = block.querySelector('dialog');
    expect(modal.open).to.be.true;
    expect(modal.querySelector('iframe')?.getAttribute('src') ?? '')
      .to.contain('youtube-nocookie.com/embed/AaIR7v_TJHs');
  });
});

describe('Media gallery leading, live\'s measurements', () => {
  let block;

  before(async () => {
    const sheets = await Promise.all(
      ['/styles/styles.css', '/blocks/media-gallery/media-gallery.css'].map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }),
    );
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const boxes = () => {
    const list = block.querySelector('.media-gallery-list');
    return {
      list: list.getBoundingClientRect(),
      cells: [...list.children].map((li) => li.getBoundingClientRect()),
      tile: block.querySelector('.media-gallery-tile').getBoundingClientRect(),
      caption: block.querySelector('.media-gallery-caption').getBoundingClientRect(),
    };
  };

  it('runs the feature across the grid and the rest three up at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = series());
    const { list, cells } = boxes();
    expect(Math.round(cells[0].width), 'the feature takes the row').to.equal(Math.round(list.width));
    const third = (list.width - 2 * 38) / 3;
    expect(Math.round(cells[1].width), 'the rest are a third').to.equal(Math.round(third));
    expect(Math.round(cells[3].top), 'three on the row under it').to.equal(Math.round(cells[1].top));
  });

  it('stands live\'s 400px name column beside the still at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = series());
    const { cells, tile, caption } = boxes();
    expect(Math.round(caption.left), 'the name is on the left').to.equal(Math.round(cells[0].left));
    expect(Math.round(tile.right), 'the still is on the right').to.equal(Math.round(cells[0].right));
    expect(Math.round(caption.width)).to.equal(400);
    // 430 is live's, and #219 is why it reads live's here now. The tile has no
    // height of its own, so the 16/9 still drove the row: 1200 of container less
    // the 400 column gave an 800 still 450 tall, over live's 430. Live's 1136
    // leaves 736, which is 414, so the row falls back to its own 430 min-height.
    // #396 is the crop live does and is NOT closed by this; what closed is the
    // 20px the row read over live at 1440.
    expect(Math.round(cells[0].height), "live's 430, from the min-height").to.equal(430);
    expect(getComputedStyle(block.querySelector('.media-gallery-caption')).padding)
      .to.equal('20px 38px');
  });

  it('sets the feature name to live\'s type at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = series());
    const name = getComputedStyle(block.querySelector('.media-gallery-caption h2'));
    expect(name.fontSize).to.equal('20px');
    expect(name.lineHeight).to.equal('30px');
    expect(name.fontWeight).to.equal('700');
    expect(name.textAlign).to.equal('center');
  });

  // below live's 1025 the feature name drops to the size of a card name
  it('drops the feature name to 14 over 20 at 900', async () => {
    await setViewport({ width: 900, height: 900 });
    decorate(block = series());
    const name = getComputedStyle(block.querySelector('.media-gallery-caption h2'));
    expect(name.fontSize).to.equal('14px');
    expect(name.lineHeight).to.equal('20px');
    expect(name.fontWeight).to.equal('700');
  });

  it('stacks the still over the name at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = series());
    const {
      list, cells, tile, caption,
    } = boxes();
    expect(Math.round(cells[0].width)).to.equal(Math.round(list.width));
    expect(tile.top, 'the still comes first').to.be.below(caption.top);
    expect(Math.round(tile.width)).to.equal(Math.round(caption.width));
  });

  // live centres a card name below 1025 and lefts it above
  it('centres the card names at 900 and lefts them at 1440', async () => {
    await setViewport({ width: 900, height: 900 });
    decorate(block = series());
    expect(getComputedStyle(block.querySelectorAll('.media-gallery-caption')[1]).textAlign)
      .to.equal('center');
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(block.querySelectorAll('.media-gallery-caption')[1]).textAlign)
      .to.equal('left');
  });

  // the soccer landing page runs the same cards without a feature
  it('leaves the plain cards variant with four equal cards', async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = series('cards'));
    const { cells } = boxes();
    expect(Math.round(cells[0].width)).to.equal(Math.round(cells[1].width));
    expect(Math.round(cells[0].top)).to.equal(Math.round(cells[1].top));
  });
});
