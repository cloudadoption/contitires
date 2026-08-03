/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { decorateMain } from '../../scripts/scripts.js';
import decorateGallery from '../../blocks/media-gallery/media-gallery.js';

/**
 * A gallery authored into the middle of an article takes the copy's measure,
 * not the whole reading column. Live has no gallery rule of its own on a
 * default article: the block is a child of `.news-article__body`, which live
 * insets 13% each side, so the gallery is exactly as wide as the paragraphs
 * above it. Read off the delivered pages on 2026-08-03, where
 * `.media-gallery` and `.news-article__body` report the same box:
 *
 * | vw | reading column | gallery | tile |
 * | --- | --- | --- | --- |
 * | 1440 | 755 | 558.7 | 269.4 |
 * | 1024 | 647 | 478.8 | 229.4 |
 * | 900 | 523 | 387 | 183.5 |
 * | 769 | 392 | 290.1 | 135 |
 *
 * Ours held every one of them to the block's own 750px cap, so the gallery ran
 * 191px wider than live's at 1440 and 136 wider at 900, and its tiles read 365
 * against live's 269. Issue #326.
 *
 * 13 of the site's 26 bare galleries sit inline like this. The other 13 are
 * partner pages, where live DOES give the gallery a column of its own and the
 * 750 is right, so the cap moves onto `.partner` rather than going away.
 */
const LIVE = [
  { vw: 1440, column: 755, gallery: 558.7, tile: 269.4 },
  { vw: 1024, column: 647, gallery: 478.8, tile: 229.4 },
  { vw: 900, column: 523, gallery: 387, tile: 183.5 },
  { vw: 769, column: 392, gallery: 290.1, tile: 135 },
];

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

const tile = (src, alt) => `
  <div>
    <div><picture><img src="${src}" alt="${alt}"></picture></div>
    <div></div>
  </div>`;

/**
 * An article with a gallery in the body, as the pipeline delivers
 * /learn/continental-tire-launches-truecontact-tour-54: a title section, then a
 * body section holding the copy and the gallery. No share block is authored,
 * so `buildArticleSidebar` adds one and the body section is the reading column.
 */
function buildArticle(style = '') {
  const main = document.createElement('main');
  main.innerHTML = `
    <div><h1>Continental Tire Launches the TrueContact Tour 54</h1></div>
    <div${style ? ` class="${style}"` : ''}>
      <p>Continental Tire is pleased to announce the new TrueContact Tour 54.</p>
      <div class="media-gallery">
        ${tile('/icons/search.svg', 'one')}
        ${tile('/icons/search.svg', 'two')}
      </div>
    </div>`;
  document.body.replaceChildren(main);
  decorateMain(main);
  // decorateBlocks names the block and its wrapper; loadBlock is what runs the
  // block's own script, and the tiles are the gallery's own work.
  decorateGallery(main.querySelector('.media-gallery'));
  // decorateSections hides each section inline and loadSection reveals it. A
  // hidden grid reports its declared tracks rather than its used ones.
  main.querySelectorAll('.section').forEach((s) => {
    s.dataset.sectionStatus = 'loaded';
    s.style.display = null;
  });
  return main;
}

const box = (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, width: r.width, right: r.right };
};

async function measure(vw) {
  await setViewport({ width: vw, height: 900 });
  const gallery = document.querySelector('main .media-gallery');
  return {
    vw: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    column: box(gallery.closest('.media-gallery-wrapper')),
    gallery: box(gallery),
    tile: box(gallery.querySelector('.media-gallery-tile')),
    list: box(gallery.querySelector('.media-gallery-list')),
  };
}

describe("An article's inline gallery", () => {
  before(async () => {
    await adopt('/styles/styles.css', '/styles/article.css', '/blocks/media-gallery/media-gallery.css', '/blocks/share/share.css');
    document.body.classList.add('article', 'appear');
  });

  after(async () => {
    document.body.classList.remove('article', 'appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  LIVE.forEach(({ vw, column, gallery, tile: tileW }) => {
    it(`takes live's ${gallery}px of a ${column}px column at ${vw}`, async () => {
      buildArticle();
      const m = await measure(vw);
      expect(m.column.width, `reading column at ${vw}`).to.be.closeTo(column, 1);
      expect(m.gallery.width, `gallery at ${vw}`).to.be.closeTo(gallery, 1);
      expect(m.tile.width, `tile at ${vw}`).to.be.closeTo(tileW, 1);
    });

    it(`centres it in the column at ${vw}`, async () => {
      buildArticle();
      const m = await measure(vw);
      expect(m.gallery.left - m.column.left, `left inset at ${vw}`)
        .to.be.closeTo(m.column.right - m.gallery.right, 1);
    });

    it(`fits the viewport at ${vw}`, async () => {
      buildArticle();
      const m = await measure(vw);
      expect(m.scrollWidth, `scrollWidth at ${vw}`).to.be.at.most(m.vw);
    });
  });

  // A partner section gets a column of its own, and live's gallery fills it.
  // `:not(.partner)` is what keeps the narrowing off these 13 pages, so the
  // block is measured here rather than the wrapper article-partner.test.js reads.
  it("leaves a partner gallery on live's 750 at 1440", async () => {
    buildArticle('partner');
    const m = await measure(1440);
    expect(m.gallery.width, 'partner gallery').to.be.closeTo(750, 1);
  });

  // below 769 live shows one tile at a time, and the list bleeds to 4px of each
  // viewport edge. Nothing about the column changes there, so the bleed has to
  // survive the narrowing untouched.
  it('keeps the mobile bleed at 375', async () => {
    buildArticle();
    const m = await measure(375);
    expect(m.column.width, 'reading column at 375').to.equal(335);
    expect(m.gallery.width, 'gallery at 375').to.equal(335);
    expect(m.list.left, 'list bleeds to the left edge').to.equal(0);
    expect(m.list.width, 'list spans the viewport').to.equal(375);
    expect(m.tile.width, 'one tile, 4px inside each edge').to.equal(367);
  });
});
