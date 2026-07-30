/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * Live draws an Instagram glyph in the top-right corner of every Social tile.
 * It is the one element that makes an Instagram tile read as one, and #188 is
 * about the tile.
 *
 * Read off live's own stylesheet on 2026-07-30: `.media-instagram.media--cta`
 * is `position: relative`, and its `:after` carries a 29x29 inline SVG as a
 * background, drawn 28 by 28 at `top: 8px; right: 8px`, `no-repeat`, centred.
 * The glyph itself is live's file, taken verbatim from that rule, not redrawn.
 */
const tile = (src, alt, href) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div><a href="${href}">${href}</a></div>
  </div>`;

const authored = (rows, variant = 'social') => {
  document.body.innerHTML = '<main><div class="section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

const POSTS = [
  ['/media/social-1.jpg', 'Nothing like a new fresh set', 'https://www.instagram.com/p/CHOw2STBQYL/'],
  ['/media/social-2.jpg', 'force contact tire IG photo', 'https://www.instagram.com/p/CUYqS3FMtlE/'],
  ['/media/social-3.jpg', 'fall photo ig for homepage', 'https://www.instagram.com/p/CUISJsDA3Mw/'],
];
const social = () => authored(POSTS.map((p) => tile(...p)));

describe('Media gallery social, the Instagram glyph live draws on every tile', () => {
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

  beforeEach(async () => {
    document.body.innerHTML = '';
    decorate(block = social());
    await setViewport({ width: 1440, height: 900 });
  });

  it('anchors the glyph to the tile', () => {
    const cell = block.querySelector('.media-gallery-list > li');
    expect(getComputedStyle(cell).position, 'the tile is the badge\'s anchor').to.equal('relative');
  });

  it('draws live\'s own glyph on every tile', () => {
    const cells = [...block.querySelectorAll('.media-gallery-list > li')];
    expect(cells.length).to.equal(POSTS.length);
    cells.forEach((cell, i) => {
      const badge = getComputedStyle(cell, '::after');
      expect(badge.backgroundImage, `tile ${i} carries the glyph`).to.match(/instagram\.svg/);
      expect(badge.backgroundRepeat, `tile ${i} does not tile it`).to.equal('no-repeat');
    });
  });

  it('sizes and places it where live does', () => {
    const badge = getComputedStyle(block.querySelector('.media-gallery-list > li'), '::after');
    expect(badge.width, "live's 28px").to.equal('28px');
    expect(badge.height, "live's 28px").to.equal('28px');
    expect(badge.position).to.equal('absolute');
    expect(badge.top, "live's 8px").to.equal('8px');
    expect(badge.right, "live's 8px").to.equal('8px');
  });

  it('leaves the whole tile clickable, which live does not', () => {
    const badge = getComputedStyle(block.querySelector('.media-gallery-list > li'), '::after');
    expect(badge.pointerEvents, 'the glyph must not eat the corner of the link').to.equal('none');
  });

  it('draws no glyph on the other variants', () => {
    document.body.innerHTML = '';
    const plain = authored([tile('/media/still.jpg', 'A still', 'https://www.youtube.com/watch?v=KOQDHoMjWSk')], '');
    decorate(plain);
    const badge = getComputedStyle(plain.querySelector('.media-gallery-list > li'), '::after');
    expect(badge.backgroundImage, 'the video gallery has no Instagram badge').to.not.match(/instagram/);
  });
});
