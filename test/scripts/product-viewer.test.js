/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * A product page hero carrying live's image viewer: the same gallery the
 * article pages author, in the cell that holds the single hero image today.
 */
function productHero() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div>
            <div class="media-gallery product">
              <div>
                <div><picture><img src="/t-3q.png" alt="TerrainContact A/T"></picture></div>
                <div></div>
              </div>
              <div>
                <div><picture><img src="/t-tread.png" alt="TerrainContact A/T tread"></picture></div>
                <div></div>
              </div>
            </div>
          </div>
          <div>
            <h1 id="terraincontact-at">TerrainContact A/T</h1>
            <p>A premium all-season all-terrain tire.</p>
          </div>
        </div>
      </div>
    </div>`;
  return main;
}

// #187. decorateBlocks reads a section's own children, so a gallery inside the
// hero is as far out of its reach as the finder card is.
describe('product hero image viewer', () => {
  it('decorates the gallery, which sits too deep for decorateBlocks to reach', () => {
    const main = productHero();
    decorateMain(main);

    const gallery = main.querySelector('.media-gallery');
    expect(gallery.classList.contains('block')).to.be.true;
    expect(gallery.dataset.blockStatus).to.equal('initialized');
    expect(gallery.dataset.blockName).to.equal('media-gallery');
  });

  it('wraps the gallery in the hero cell, not in the section', () => {
    const main = productHero();
    decorateMain(main);

    const wrapper = main.querySelector('.media-gallery-wrapper');
    expect(wrapper).to.exist;
    expect(wrapper.closest('.columns.product-hero')).to.exist;
    expect(main.querySelector('.section > .media-gallery-wrapper')).to.not.exist;
  });

  it('keeps the variant, which is what puts the tiles in live\'s column', () => {
    const main = productHero();
    decorateMain(main);

    expect(main.querySelector('.media-gallery').classList.contains('product')).to.be.true;
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
