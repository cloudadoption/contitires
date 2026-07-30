/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * Live's /events ends on a Social section: six square tiles, each one a link
 * out to an Instagram post. It is the same media gallery in a third shape, so
 * it is a variant of this block rather than a block of its own, the way `cards`
 * already is.
 *
 * What makes it its own variant is the LINK. Everywhere else in this block a
 * row with a link is a video, and `decorate` hands it to the video block to
 * play in the modal. Here the link leaves the site, so the tile is an anchor
 * and there is no player and no modal.
 *
 * Read off continentaltire.com/events on 2026-07-30, issue #188. Live's tiles
 * measure 177x177 at a 1440 viewport, three across, 20px apart, 10px radius, on
 * #f3f3f3, and each anchor carries rel="nofollow" title="Go to <url>"
 * target="_blank". The images are live's own files under /sites/default/files/,
 * with no Instagram CDN reference and no embed script anywhere on the page.
 */
const tile = (src, alt, href) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div><a href="${href}">${href}</a></div>
  </div>`;

// the CSS is written against the shape the pipeline delivers, so the block
// stands in a section wrapper inside main or none of it applies
const authored = (rows, variant = 'social') => {
  document.body.innerHTML = '<main><div class="section"><div class="media-gallery-wrapper">'
    + `<div class="media-gallery ${variant} block">${rows.join('')}</div></div></div></main>`;
  return document.querySelector('.media-gallery.block');
};

/** live's six Social tiles, in the order live paints them */
const POSTS = [
  ['/media/social-1.jpg', 'Nothing like a new fresh set', 'https://www.instagram.com/p/CHOw2STBQYL/'],
  ['/media/social-2.jpg', 'force contact tire IG photo', 'https://www.instagram.com/p/CUYqS3FMtlE/'],
  ['/media/social-3.jpg', 'fall photo ig for homepage', 'https://www.instagram.com/p/CUISJsDA3Mw/'],
  ['/media/social-4.jpg', 'carrera on conti', 'https://www.instagram.com/p/CRu2kmlh1u8/'],
  ['/media/social-5.jpg', 'uhp lineup in front of mustang', 'https://www.instagram.com/p/CQd8lHsgP7S/'],
  ['/media/social-6.jpg', 'stadium super trucks', 'https://www.instagram.com/p/CUVD7zFr9le/'],
];
const social = (variant) => authored(POSTS.map((p) => tile(...p)), variant);

describe('Media gallery social, the tiles live links out to Instagram', () => {
  let block;

  beforeEach(() => {
    document.body.innerHTML = '';
    decorate(block = social());
  });

  it('paints one tile per authored row', () => {
    expect(block.querySelectorAll('.media-gallery-list > li').length).to.equal(POSTS.length);
  });

  it('makes each tile a link to its post, in live\'s order', () => {
    const hrefs = [...block.querySelectorAll('.media-gallery-list a')].map((a) => a.getAttribute('href'));
    expect(hrefs).to.deep.equal(POSTS.map((p) => p[2]));
  });

  it('opens the post in a new tab the way live does, and closes the tabnabbing hole', () => {
    const link = block.querySelector('.media-gallery-list a');
    expect(link?.getAttribute('target') || '', 'live opens a new tab').to.equal('_blank');
    const rel = (link?.getAttribute('rel') || '').split(/\s+/);
    expect(rel, 'live marks it nofollow').to.include('nofollow');
    expect(rel, 'target=_blank without noopener is a tabnabbing hole live leaves open').to.include('noopener');
  });

  it('names the link by what the photo shows rather than by its URL', () => {
    const link = block.querySelector('.media-gallery-list a');
    expect((link?.textContent || '').trim(), 'the raw URL is not a name').to.not.match(/^https?:/);
    expect(link?.querySelector('img')?.getAttribute('alt') || '').to.equal(POSTS[0][1]);
  });

  it('builds no video player and no button, because the link leaves the site', () => {
    expect(block.querySelectorAll('.video').length, 'players').to.equal(0);
    expect(block.querySelectorAll('.media-gallery-tile').length, 'modal-opening buttons').to.equal(0);
  });

  it('builds no modal at all', () => {
    expect(block.querySelectorAll('dialog').length, 'dialogs').to.equal(0);
  });

  it('leaves the video variants alone: a linked row still plays in the modal', () => {
    document.body.innerHTML = '';
    const videos = authored([tile('/media/still.jpg', 'A still', 'https://www.youtube.com/watch?v=KOQDHoMjWSk')], '');
    decorate(videos);
    expect(videos.querySelectorAll('dialog').length, 'the plain gallery keeps its modal').to.equal(1);
    expect(videos.querySelectorAll('.media-gallery-tile').length, 'and its buttons').to.equal(1);
  });
});

describe('Media gallery social, live\'s measurements', () => {
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
    decorate(block = social());
  });

  it('stands three square tiles across at 1440, 20 apart', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cells = [...block.querySelectorAll('.media-gallery-list > li')];
    const tops = cells.slice(0, 3).map((c) => Math.round(c.getBoundingClientRect().top));
    expect(new Set(tops).size, 'the first three share a row').to.equal(1);
    expect(Math.round(cells[3].getBoundingClientRect().top), 'the fourth wraps')
      .to.be.greaterThan(tops[0]);
    const box = cells[0].getBoundingClientRect();
    expect((box.width / box.height).toFixed(2), 'live\'s square').to.equal('1.00');
    const list = block.querySelector('.media-gallery-list');
    expect(getComputedStyle(list).gap, 'live\'s 20px gap').to.equal('20px');
  });

  it('rounds and beds the tiles the way live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    const cell = block.querySelector('.media-gallery-list > li');
    expect(getComputedStyle(cell).borderRadius, 'live\'s 10px').to.equal('10px');
    expect(getComputedStyle(cell).backgroundColor, 'live\'s #f3f3f3').to.equal('rgb(243, 243, 243)');
    expect(getComputedStyle(cell).boxShadow, 'live casts none').to.equal('none');
  });

  it('fills the tile with the photo', async () => {
    await setViewport({ width: 1440, height: 900 });
    const img = block.querySelector('.media-gallery-list img');
    expect((img.getBoundingClientRect().width / img.getBoundingClientRect().height).toFixed(2))
      .to.equal('1.00');
  });
});
