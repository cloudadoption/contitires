/* eslint-disable no-unused-expressions */
/* global describe it beforeEach */

import { expect } from '@esm-bundle/chai';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * #319. Live's product viewer keeps a set the modal can page and the grid does
 * not draw. It marks those items `media--hidden-media-gallery-item` and gives
 * them no `picture` at all, standing them after the slider inside
 * `con-media-gallery-wrapper`, so `/tires/extremecontact-dws06-plus` draws 6
 * tiles and pages 11 slides.
 *
 * Counted on all 56 live tire URLs on 2026-08-03. 45 carry a viewer; the other
 * 11 are category pages. The grid draws 2, 3, 4, 5 or 6 and never more: 1 page
 * at 2, 25 at 3, 5 at 4, 4 at 5 and 10 at 6. Hidden items appear on 10 pages
 * and on no others, and each of those 10 draws exactly 6, so POSITION tells the
 * two apart as reliably as live's own class does: the 32 hidden assets are
 * items 7 and up.
 *
 * | page | grid | modal |
 * | --- | --- | --- |
 * | /tires/extremecontact-dws06-plus | 6 | 11 |
 * | /tires/extremecontact-force | 6 | 11 |
 * | /tires/terraincontact-at | 6 | 11 |
 * | /tires/terraincontact-at-2 | 6 | 10 |
 * | /tires/truecontact-tour54 | 6 | 10 |
 * | /tires/vikingcontact-8 | 6 | 9 |
 * | /tires/crosscontact-lx25 | 6 | 8 |
 * | /tires/extremecontact-sport-02 | 6 | 8 |
 * | /tires/purecontact-ls | 6 | 7 |
 * | /tires/vikingcontact-7 | 6 | 7 |
 *
 * So no new row shape is needed and an author writes what they always wrote:
 * one photograph per paragraph in the hero's image cell, which
 * `buildProductViewer` reads into rows. The cap is the block's, and it is the
 * product viewer's alone. A non-product gallery takes none: live draws 14
 * visible tiles on /experience/lingenfelter-performance-engineering, 8 on
 * /experience/usf-pro-championships and 7 on /learn/continental-science-guy,
 * with 0 hidden on each.
 */

const row = (src, alt, href, title) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
  </div>`;

/**
 * Live's own eleven on /tires/extremecontact-dws06-plus, in live's order: the
 * six the grid draws, then the five it keeps for the modal. The fifth is live's
 * video at `KPz7aIfx0Ng`. Read off the delivered page on 2026-08-03.
 */
const DWS06 = [
  ['ExtremeContactDWS06Plus_Lt3Q.png', 'ExtremeContact DWS06 Plus', '', ''],
  ['ExtremeContactDWS06Plus_Sidewall.png', 'DWS06 Plus sidewall', '', ''],
  ['ExtremeContactDWS06Plus_tread.png', 'DWS06 Plus tread', '', ''],
  ['ExtremeContactDWS06Plus_Rt3Q.png', 'DWS06 Plus right three quarter', '', ''],
  ['dws06web_1.png', 'DWS06 Plus video still', 'https://www.youtube.com/watch?v=KPz7aIfx0Ng', 'ExtremeContact DWS06 Plus'],
  ['CT20_ExtremeContactDWS06Plus_Tesla.jpg', 'DWS06 Plus on a Tesla', '', ''],
  ['CT21_ExtremeContactDWS06_Plus_1440x810_Marquee_1_0.jpg', 'DWS06 Plus marquee', '', ''],
  ['CT21_ExtremeContactDWS06_Plus_767x431_2.jpg', 'DWS06 Plus banner', '', ''],
  ['CT20_ExtremeContactDWS06Plus_Corvetteangle_resized.jpg', 'DWS06 Plus on a Corvette', '', ''],
  ['CT20_ExtremeContactDWS06Plus_AlphaRomeo.jpg', 'DWS06 Plus on an Alfa Romeo', '', ''],
  ['CT21_Website_DWS06-Plus_0003_CT20_ExtremeContactDWS06Plus_Corvette_4.jpg', 'DWS06 Plus Corvette rear', '', ''],
];

/** the block as `buildProductViewer` hands it over, inside the hero's cell */
const viewer = (items, variant = 'product') => {
  const rows = items.map(([file, alt, href, title]) => row(`/media/${file}`, alt, href, title));
  document.body.innerHTML = '<main><div class="section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div>`
    + '</div></div></main>';
  return document.querySelector('.media-gallery.block');
};

const src = (el) => el?.querySelector('img')?.getAttribute('src');

describe('Media gallery product viewer, the set live keeps for the modal', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = viewer(DWS06));
  });

  it("draws live's six tiles from the eleven authored rows", () => {
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    expect(tiles.length, 'tiles live draws').to.equal(6);
    expect(tiles.map(src)).to.eql([
      '/media/ExtremeContactDWS06Plus_Lt3Q.png',
      '/media/ExtremeContactDWS06Plus_Sidewall.png',
      '/media/ExtremeContactDWS06Plus_tread.png',
      '/media/ExtremeContactDWS06Plus_Rt3Q.png',
      '/media/dws06web_1.png',
      '/media/CT20_ExtremeContactDWS06Plus_Tesla.jpg',
    ]);
  });

  it('keeps all eleven in the thumbnail strip', () => {
    const thumbs = [...block.querySelectorAll('.media-gallery-thumb')];
    expect(thumbs.length, 'slides live pages').to.equal(11);
    expect(src(thumbs[10]))
      .to.equal('/media/CT21_Website_DWS06-Plus_0003_CT20_ExtremeContactDWS06Plus_Corvette_4.jpg');
  });

  // the sixth tile is the last one drawn, and paging on from it is the only way
  // into the set live keeps back
  it('pages from the last tile onto the first item the grid skips', () => {
    block.querySelectorAll('.media-gallery-tile')[5].click();
    block.querySelector('.media-gallery-next').click();
    expect(src(block.querySelector('.media-gallery-stage')))
      .to.equal('/media/CT21_ExtremeContactDWS06_Plus_1440x810_Marquee_1_0.jpg');
  });

  it('wraps backwards off the first tile onto the last item', () => {
    block.querySelectorAll('.media-gallery-tile')[0].click();
    block.querySelector('.media-gallery-prev').click();
    expect(src(block.querySelector('.media-gallery-stage')))
      .to.equal('/media/CT21_Website_DWS06-Plus_0003_CT20_ExtremeContactDWS06Plus_Corvette_4.jpg');
  });

  it('shows an item the grid skips when its thumbnail names it', () => {
    block.querySelectorAll('.media-gallery-tile')[0].click();
    block.querySelectorAll('.media-gallery-thumb')[8].click();
    expect(src(block.querySelector('.media-gallery-stage')))
      .to.equal('/media/CT20_ExtremeContactDWS06Plus_Corvetteangle_resized.jpg');
  });

  it('leaves a set shorter than six alone', () => {
    decorate(block = viewer(DWS06.slice(0, 4)));
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(4);
    expect(block.querySelectorAll('.media-gallery-thumb').length).to.equal(4);
  });

  it('draws all six where the whole set is six', () => {
    decorate(block = viewer(DWS06.slice(0, 6)));
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(6);
  });
});

/**
 * /tires/truecontact-tour54 is the same shape with a video: live holds one at
 * `Zbn0xviN7A4` on an element it gives zero height, in the modal set and not in
 * the grid. So a video past the sixth row is reachable and unplayed until asked
 * for, the same as any other page turn.
 */
describe('Media gallery product viewer, a video the grid skips', () => {
  const TOUR54 = [
    ...DWS06.slice(0, 6).map(([f, a]) => [f, a, '', '']),
    ['tour54-hero.jpg', 'TrueContact Tour 54 hero', '', ''],
    ['tour54web.png', 'TrueContact Tour 54 video still', 'https://www.youtube.com/watch?v=Zbn0xviN7A4', 'TrueContact Tour 54'],
  ];

  it('reaches it through the strip and asks nothing of YouTube until played', () => {
    document.body.innerHTML = '';
    const block = decorate(viewer(TOUR54)) ?? document.querySelector('.media-gallery.block');
    expect(block.querySelectorAll('.media-gallery-tile').length, 'six drawn').to.equal(6);
    expect(block.querySelectorAll('.media-gallery-thumb').length, 'eight paged').to.equal(8);
    block.querySelectorAll('.media-gallery-tile')[0].click();
    const modal = block.querySelector('dialog');
    modal.querySelectorAll('.media-gallery-thumb')[7].click();
    expect(modal.querySelectorAll('iframe').length, 'the facade, not the player').to.equal(0);
    modal.querySelector('.video-play').click();
    expect(modal.querySelector('iframe')?.getAttribute('src') ?? '')
      .to.contain('youtube-nocookie.com/embed/Zbn0xviN7A4');
  });
});

/**
 * The cap is the product viewer's. Live's article and card galleries draw the
 * whole set: 14 tiles on /experience/lingenfelter-performance-engineering, 8 on
 * /experience/usf-pro-championships and 7 on /learn/continental-science-guy,
 * with no hidden item on any of the 26 article pages that carry one.
 */
describe('Media gallery, the galleries live does not cap', () => {
  const many = (n) => Array.from({ length: n }, (_, i) => [`shot-${i + 1}.jpg`, `shot ${i + 1}`, '', '']);

  it("draws live's fourteen on an article gallery", () => {
    document.body.innerHTML = '';
    const block = viewer(many(14), '');
    decorate(block);
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(14);
  });

  it('draws every card on a cards gallery', () => {
    document.body.innerHTML = '';
    const block = viewer(many(8), 'cards');
    decorate(block);
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(8);
  });

  it('draws every tile on a social row', () => {
    document.body.innerHTML = '';
    const block = viewer(
      Array.from({ length: 8 }, (_, i) => [`p-${i}.jpg`, `post ${i}`, `https://www.instagram.com/p/x${i}/`, `https://www.instagram.com/p/x${i}/`]),
      'social',
    );
    decorate(block);
    expect(block.querySelectorAll('.media-gallery-link').length).to.equal(8);
  });
});
