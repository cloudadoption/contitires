/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * A product page as the 46 of them are authored: the hero, the specs band
 * carrying the product slug, then the warranty and stores bands live also
 * ends them with.
 */
function productPage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div><p><picture><img src="/t.png" alt="4x4 Contact"></picture></p></div>
          <div><h1 id="4x4-contact">4x4 Contact</h1><p>A premium all-season tire.</p></div>
        </div>
      </div>
    </div>
    <div>
      <div class="tire-specs"><div><div>4x4contact</div></div></div>
    </div>
    <div class="black">
      <div class="store-locator"><div><div><h2 id="stores-near">Stores near</h2></div></div></div>
    </div>`;
  return main;
}

/** A page with no product on it, which is most of the site. */
function articlePage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <h1 id="a-headline">A headline</h1>
      <p>A paragraph.</p>
    </div>`;
  return main;
}

describe('the rating band on a product page', () => {
  it('ends a product page with a rating band, where live ends it with reviews', () => {
    const main = productPage();
    decorateMain(main);

    const band = main.querySelector('.tire-rating');
    expect(band, 'the band').to.exist;
    expect(main.lastElementChild.contains(band), 'in the last section').to.be.true;
  });

  it('carries the slug the specs band already names', () => {
    const main = productPage();
    decorateMain(main);

    expect(main.querySelector('.tire-rating').textContent.trim()).to.equal('4x4contact');
  });

  it('leaves the stores band where it is', () => {
    const main = productPage();
    decorateMain(main);

    const sections = [...main.children];
    const stores = sections.findIndex((s) => s.querySelector('.store-locator'));
    const rating = sections.findIndex((s) => s.querySelector('.tire-rating'));
    expect(stores, 'the stores band still on the page').to.be.greaterThan(-1);
    expect(rating, 'and the rating band after it').to.be.greaterThan(stores);
  });

  it('adds nothing to a page that carries no product', () => {
    const main = articlePage();
    decorateMain(main);

    expect(main.querySelector('.tire-rating')).to.not.exist;
  });

  it('does not add a second band to a page that already has one', () => {
    const main = productPage();
    const section = document.createElement('div');
    section.innerHTML = '<div class="tire-rating"><div><div>4x4contact</div></div></div>';
    main.append(section);
    decorateMain(main);

    expect(main.querySelectorAll('.tire-rating').length).to.equal(1);
  });
});
