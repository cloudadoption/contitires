/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * A product page hero as the 16 pages of #187 author it: the tire's
 * photographs in the image cell, one per paragraph, and the YouTube link
 * beside the still that stands for the video.
 *
 * The gallery cannot be authored as a block here. EDS carries no block inside
 * a block cell: the pipeline flattens it back to these paragraphs, which is
 * what /tires/terraincontact-at served when it was tried. So the viewer is
 * built from them, the way the finder card in the cell beside it is.
 */
function productHero() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div>
            <p><picture><img src="/t-3q.png" alt="TerrainContact A/T, three-quarter view"></picture></p>
            <p><picture><img src="/t-tread.png" alt="TerrainContact A/T, tread"></picture></p>
            <p><picture><img src="/t-video.png" alt="TerrainContact A/T video"></picture><a href="https://www.youtube.com/watch?v=KlIejJSHJ6E">TerrainContact A/T</a></p>
          </div>
          <div>
            <h1 id="terraincontact-at">TerrainContact A/T</h1>
            <p>A premium all-season all-terrain tire.</p>
            <p><a href="/perfect-fit">Find your size</a></p>
          </div>
        </div>
      </div>
    </div>`;
  return main;
}

describe('product hero image viewer', () => {
  it('builds the viewer from the photographs in the hero image cell', () => {
    const main = productHero();
    decorateMain(main);

    const gallery = main.querySelector('.media-gallery');
    expect(gallery, 'the viewer').to.exist;
    expect(gallery.closest('.columns.product-hero'), 'in the hero').to.exist;
    expect(gallery.children.length, 'a row per photograph').to.equal(3);
    expect(gallery.querySelectorAll('img').length).to.equal(3);
    const left = main.querySelectorAll('.columns.product-hero > div > div:first-child > p');
    expect(left.length, 'the paragraphs are the block now').to.equal(0);
  });

  it('keeps the variant, which is what puts the tiles in live\'s column', () => {
    const main = productHero();
    decorateMain(main);

    expect(main.querySelector('.media-gallery').classList.contains('product')).to.be.true;
  });

  // the block reads the still from the first cell and the video from the
  // second, so the pairing is the paragraph the author wrote them in
  it('pairs a link with the still in its own paragraph', () => {
    const main = productHero();
    decorateMain(main);

    const rows = [...main.querySelector('.media-gallery').children];
    expect(rows.map((r) => !!r.querySelector('a[href]')), 'the third is the video')
      .to.eql([false, false, true]);
    const video = rows[2];
    expect(video.firstElementChild.querySelector('img').getAttribute('src')).to.equal('/t-video.png');
    expect(video.lastElementChild.querySelector('a').getAttribute('href'))
      .to.contain('KlIejJSHJ6E');
  });

  // decorateBlocks reads a section's own children, so a viewer inside the hero
  // is as far out of its reach as the finder card is
  it('decorates the viewer, which sits too deep for decorateBlocks to reach', () => {
    const main = productHero();
    decorateMain(main);

    const gallery = main.querySelector('.media-gallery');
    expect(gallery.classList.contains('block')).to.be.true;
    expect(gallery.dataset.blockStatus).to.equal('initialized');
    expect(gallery.dataset.blockName).to.equal('media-gallery');
  });

  it('wraps the viewer in the hero cell, not in the section', () => {
    const main = productHero();
    decorateMain(main);

    const wrapper = main.querySelector('.media-gallery-wrapper');
    expect(wrapper).to.exist;
    expect(wrapper.closest('.columns.product-hero')).to.exist;
    expect(!!main.querySelector('.section > .media-gallery-wrapper')).to.be.false;
  });

  // 30 of the 46 product pages still ship the single image they were migrated
  // with, and they keep the hero they have until their photographs land
  it('leaves a hero with one image alone', () => {
    const main = document.createElement('main');
    main.innerHTML = `
      <div>
        <div class="columns product-hero">
          <div>
            <div><picture><img src="/t-3q.png" alt="4x4 Contact"></picture></div>
            <div><h1>4x4 Contact</h1><p><a href="/perfect-fit">Find your size</a></p></div>
          </div>
        </div>
      </div>`;
    decorateMain(main);

    expect(!!main.querySelector('.media-gallery')).to.be.false;
    expect(main.querySelector('.columns.product-hero picture')).to.exist;
  });

  // the copy cell holds links of its own, and one of them is a picture away
  // from looking like a tile
  it('leaves the copy cell alone', () => {
    const main = productHero();
    decorateMain(main);

    const cells = [...main.querySelector('.columns.product-hero > div').children];
    expect(!!cells[1].querySelector('.media-gallery')).to.be.false;
    expect(cells[1].querySelector('h1')).to.exist;
  });

  it('leaves a gallery in a section of its own to decorateBlocks', () => {
    const main = document.createElement('main');
    main.innerHTML = `
      <div>
        <div class="media-gallery">
          <div><div><picture><img src="/a.png" alt="a"></picture></div><div></div></div>
        </div>
      </div>`;
    decorateMain(main);

    const gallery = main.querySelector('.media-gallery');
    expect(gallery.dataset.blockStatus).to.equal('initialized');
    expect(main.querySelector('.section > .media-gallery-wrapper'), 'wrapped by the section').to.exist;
  });
});
