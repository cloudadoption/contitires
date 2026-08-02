/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * Live's /experience/soccer stands its videos in a card grid rather than the
 * square-tile gallery: the same click and the same modal, with the video's name
 * under the still and a description on the cards live shows one for.
 *
 * Read off continentaltire.com/experience/soccer on 2026-07-29. Its grid runs
 * three cards across from 769 and one below, on 16/9 stills, with the name at
 * 14/20 in a white footer padded 16 by 20. Issue #259.
 */
const card = (src, alt, href, title, text) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div>${href ? `<a href="${href}">${title}</a>` : ''}</div>
    ${text ? `<div><p>${text}</p></div>` : ''}
  </div>`;

// the CSS is written against the shape the pipeline delivers, so the block
// stands in a section wrapper inside main or none of it applies
const authored = (rows, variant = 'cards', band = 'black') => {
  document.body.innerHTML = `<main><div class="${band} section"><div class="media-gallery-wrapper">`
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

/** the head of live's This is MLS section: its leading card and two others */
const mls = (variant) => authored([
  card(
    '/media/mls-15-years.jpg',
    'Continental Tire x MLS',
    'https://www.youtube.com/watch?v=KOQDHoMjWSk',
    'Continental Tire x MLS: 15 Years of Passion, Pride & Partnership',
    'From the pitch to the stands, this partnership is built on energy, loyalty, and a deep connection to the fans.',
  ),
  card(
    '/media/fan-energy.jpg',
    'Fan Energy',
    'https://www.youtube.com/watch?v=ARU7Lzi3_P4',
    "Passionate MLS Fans Are What It's All About!",
    '',
  ),
  card(
    '/media/opposing-fans.jpg',
    'Opposing fans',
    'https://www.youtube.com/watch?v=p5MZYIHMhwc',
    'Opposing MLS Fans & How They Affect the Game',
    '',
  ),
], variant);

describe('Media gallery cards, the name live puts under the still', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('names every card with the title of its video', () => {
    decorate(block = mls());
    const names = [...block.querySelectorAll('.media-gallery-caption h3')];
    expect(names.map((h) => h.textContent)).to.eql([
      'Continental Tire x MLS: 15 Years of Passion, Pride & Partnership',
      "Passionate MLS Fans Are What It's All About!",
      'Opposing MLS Fans & How They Affect the Game',
    ]);
  });

  /*
   * The level, which is ours to set rather than live's to match. Live gives
   * these tiles no heading at all, so there is nothing to copy, and our h3 sat
   * under the banner h1 on the two pages of the seven that author no h2 of
   * their own: /emilytalkstires and /learn/product-highlights. h2 closes that
   * skip on both. Live's own /forwhatyoudo reads h1 then h3, so matching live
   * here would reproduce live's defect. Issue #375.
   */
  it('names a card with an h2, so no level is skipped', () => {
    decorate(block = mls());
    const names = [...block.querySelectorAll('.media-gallery-caption h2')];
    expect(names.length).to.equal(3);
    expect(names[0].textContent)
      .to.equal('Continental Tire x MLS: 15 Years of Passion, Pride & Partnership');
    expect(block.querySelectorAll('.media-gallery-caption h3').length, 'no h3 left').to.equal(0);
  });

  // live's click target is the still, and its footer is not part of it
  it('leaves the caption outside the control the click opens', () => {
    decorate(block = mls());
    const caption = block.querySelector('.media-gallery-caption');
    expect(!!caption.closest('.media-gallery-tile'), 'not inside the tile').to.be.false;
    expect(caption.previousElementSibling.classList.contains('media-gallery-tile')).to.be.true;
  });

  it('carries the description on the card that authors one, and nothing on the rest', () => {
    decorate(block = mls());
    const captions = [...block.querySelectorAll('.media-gallery-caption')];
    expect(captions[0].querySelector('p').textContent).to.contain('From the pitch to the stands');
    expect(!!captions[1].querySelector('p'), 'live shows none here').to.be.false;
    expect(!!captions[2].querySelector('p')).to.be.false;
  });

  it('names a still from its alt text when no video is authored', () => {
    decorate(block = authored([card('/media/ball.jpg', 'A soccer ball on the pitch', '', '', '')]));
    expect(block.querySelector('.media-gallery-caption h3').textContent)
      .to.equal('A soccer ball on the pitch');
  });

  it('leaves the square-tile gallery without captions', () => {
    decorate(block = mls(''));
    expect(!!block.querySelector('.media-gallery-caption'), 'no caption off the variant').to.be.false;
    expect(block.querySelectorAll('.media-gallery-tile').length).to.equal(3);
  });

  // the caption is chrome around the same tile: everything the gallery already
  // does has to keep working
  it('opens the same modal on the same player', () => {
    decorate(block = mls());
    block.querySelectorAll('.media-gallery-tile')[1].click();
    const modal = block.querySelector('dialog');
    expect(modal.open).to.be.true;
    expect(modal.querySelector('iframe')?.getAttribute('src') ?? '')
      .to.contain('youtube-nocookie.com/embed/ARU7Lzi3_P4');
  });

  it('leaves the thumbnails without captions', () => {
    decorate(block = mls());
    expect(block.querySelectorAll('.media-gallery-thumb .media-gallery-caption').length)
      .to.equal(0);
    expect(block.querySelectorAll('.media-gallery-thumb').length).to.equal(3);
  });
});

describe('Media gallery cards, live\'s measurements', () => {
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
    decorate(block = mls());
  });

  // live runs three cards across from 769, on a 16/9 still
  it('stands three cards across at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    const tops = tiles.map((t) => Math.round(t.getBoundingClientRect().top));
    expect(new Set(tops).size, 'all three on one row').to.equal(1);
    const box = tiles[0].getBoundingClientRect();
    expect((box.width / box.height).toFixed(2), '16/9').to.equal('1.78');
  });

  it('sets the name to live\'s type', async () => {
    await setViewport({ width: 1440, height: 900 });
    const name = block.querySelector('.media-gallery-caption h3');
    const caption = block.querySelector('.media-gallery-caption');
    expect(getComputedStyle(name).fontSize).to.equal('14px');
    expect(getComputedStyle(name).lineHeight).to.equal('20px');
    expect(getComputedStyle(caption).padding).to.equal('16px 20px');
  });

  // the band around the cards whites its own headings out, and the card is a
  // white one standing on it
  it('keeps the name readable on the dark band the cards stand on', async () => {
    await setViewport({ width: 1440, height: 900 });
    const caption = block.querySelector('.media-gallery-caption');
    expect(getComputedStyle(block.closest('.section')).backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(getComputedStyle(caption).backgroundColor).to.equal('rgb(255, 255, 255)');
    expect(getComputedStyle(caption.querySelector('h3')).color).to.equal('rgb(51, 51, 51)');
    expect(getComputedStyle(caption.querySelector('p')).color).to.equal('rgb(51, 51, 51)');
  });

  it('stands one card across at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    const tiles = [...block.querySelectorAll('.media-gallery-tile')];
    const tops = tiles.map((t) => Math.round(t.getBoundingClientRect().top));
    expect(new Set(tops).size, 'one per row').to.equal(3);
  });
});
