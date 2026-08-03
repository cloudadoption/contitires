/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorate from '../../../blocks/media-gallery/media-gallery.js';

/**
 * #341. At 375 live slides the /events Social row one tile at a time and we
 * stacked all six.
 *
 * Live's Social row is a `con-column-slider`, the same component the base
 * gallery's mobile strip was built from in #327, and below 769 it hides every
 * slide but one and prints a pager under it. Read off continentaltire.com/events
 * on 2026-08-03 at a 375 viewport:
 *
 * | | live |
 * | --- | --- |
 * | slider | 335x399 at x=20 |
 * | the tile showing | 335x367, one of six, the other five at 0x0 |
 * | its picture | 367x367 at x=4, so the still bleeds to 4px of each edge |
 * | pager | `prev`, `1 of 6`, `next` in the slider's own shadow root |
 * | expand badge | `:before`, 21x21 at right 10 bottom 10, and `content: none` at 1440 |
 * | Instagram glyph | `:after`, 28x28 at top 8 right 8, at both widths |
 *
 * So the pager row is 399 less 367, which is 32, and that is what a 16px arrow
 * on a 16px top margin measures here.
 *
 * The variant's own CSS is what stacked it: `grid-template-columns: 1fr` with
 * the base row's scroller undone, at every width under 769. Live's grid starts
 * at 769 instead.
 *
 * The `+` opens live's modal: each item carries `data-modal-target` and its
 * `con-media-gallery-modal` shares one `gallery` attribute with the other five,
 * so live pages the set. #188 read the tile as a link out with no modal, which
 * is what the ANCHOR does; the badge beside it is the other half.
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
const social = () => authored(POSTS.map((p) => tile(...p)));

describe('Media gallery social, the carousel live slides at 375', () => {
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

  const cells = () => [...block.querySelectorAll('.media-gallery-list > li')];

  it('lays the six along one row that scrolls sideways at 375', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const tops = cells().map((c) => Math.round(c.getBoundingClientRect().top));
    expect(new Set(tops).size, 'live shows one tile at a time, not a stack').to.equal(1);
    const list = block.querySelector('.media-gallery-list');
    expect(list.scrollWidth, 'the row runs past the screen').to.be.greaterThan(list.clientWidth + 2);
  });

  it("gives the tile showing live's 367 square, bleeding to 4px of each edge", async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const box = cells()[0].getBoundingClientRect();
    expect(Math.round(box.width), "live's 367").to.equal(367);
    expect(Math.round(box.height), 'square, the way live draws it').to.equal(367);
    expect(Math.round(box.left), 'live leaves 4px of the edge').to.equal(4);
  });

  it("prints live's counter between two arrows under the row", async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const pager = block.querySelector('.media-gallery-pager');
    expect(!!pager, 'live prints one and we printed none').to.be.true;
    expect(pager.querySelector('.media-gallery-pager-count').textContent).to.equal('1 of 6');
    expect(getComputedStyle(pager).display, 'shown at 375').to.equal('flex');
    const row = pager.getBoundingClientRect();
    const strip = block.querySelector('.media-gallery-list').getBoundingClientRect();
    expect(Math.round(row.top - strip.bottom), "live's 16px above the arrows").to.equal(16);
  });

  it('counts on to the next post and wraps off the last', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const count = block.querySelector('.media-gallery-pager-count');
    block.querySelector('.media-gallery-pager-next').click();
    expect(count.textContent).to.equal('2 of 6');
    block.querySelector('.media-gallery-pager-prev').click();
    block.querySelector('.media-gallery-pager-prev').click();
    expect(count.textContent, 'live wraps and so does this').to.equal('6 of 6');
  });

  it("draws live's 21px expand badge on the tile below 769 and none above", async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const zoom = block.querySelector('.media-gallery-zoom');
    expect(!!zoom, 'live paints a + and we painted none').to.be.true;
    const at375 = getComputedStyle(zoom);
    expect(at375.display, 'live paints it below 769').to.not.equal('none');
    expect(at375.width).to.equal('21px');
    expect(at375.height).to.equal('21px');
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(zoom).display, "live's content is none at 1440").to.equal('none');
  });

  it('opens the still on the modal and pages the six from there', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    block.querySelectorAll('.media-gallery-zoom')[2].click();
    const modal = block.querySelector('dialog');
    expect(modal.open, 'the + opens live\'s modal').to.be.true;
    const shown = () => modal.querySelector('.media-gallery-stage img')?.getAttribute('src');
    expect(shown()).to.equal('/media/social-3.jpg');
    expect(modal.querySelectorAll('.media-gallery-thumb').length, 'live pages the set').to.equal(6);
    modal.querySelector('.media-gallery-next').click();
    expect(shown()).to.equal('/media/social-4.jpg');
  });

  it('asks nothing of YouTube: an Instagram link is a post, not a video', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    block.querySelector('.media-gallery-zoom').click();
    const modal = block.querySelector('dialog');
    expect(modal.querySelectorAll('.video').length, 'players').to.equal(0);
    expect(modal.querySelectorAll('iframe').length, 'frames').to.equal(0);
    expect(modal.getAttribute('aria-label')).to.equal('View Nothing like a new fresh set');
  });

  it('leaves the tile itself a link out to the post', async () => {
    await setViewport({ width: 375, height: 812 });
    decorate(block = social());
    const link = block.querySelector('.media-gallery-link');
    expect(link.getAttribute('href')).to.equal(POSTS[0][2]);
    expect(link.getAttribute('target')).to.equal('_blank');
    expect((link.getAttribute('rel') || '').split(/\s+/)).to.include('noopener');
  });

  it("keeps live's three-up grid and no pager at 1440", async () => {
    await setViewport({ width: 1440, height: 900 });
    decorate(block = social());
    const tops = cells().map((c) => Math.round(c.getBoundingClientRect().top));
    expect(new Set(tops.slice(0, 3)).size, 'three share a row').to.equal(1);
    expect(tops[3], 'the fourth wraps').to.be.greaterThan(tops[0]);
    expect(getComputedStyle(block.querySelector('.media-gallery-pager')).display)
      .to.equal('none');
  });
});
