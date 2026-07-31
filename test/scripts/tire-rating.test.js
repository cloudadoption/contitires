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

  it('names the product by the page\'s own path, which is the catalog slug', () => {
    const main = productPage();
    decorateMain(main);

    const slug = window.location.pathname.replace(/\/$/, '').split('/').pop();
    expect(main.querySelector('.tire-rating').textContent.trim()).to.equal(slug);
  });

  // /tires/purecontact-ls and /tires/truecontact-tour author no specs band,
  // and both are rated, so the hero has to be enough to end the page.
  it('ends a product page that authors no specs band', () => {
    const main = productPage();
    main.querySelector('.tire-specs').closest('div').remove();
    decorateMain(main);

    expect(main.querySelector('.tire-rating'), 'the band').to.exist;
  });

  // /vancontact-as-ultra carries a plain columns hero, not the product variant.
  it('ends a product page whose hero carries no product variant', () => {
    const main = productPage();
    main.querySelector('.columns.product-hero').classList.remove('product-hero');
    decorateMain(main);

    expect(main.querySelector('.tire-rating'), 'the band').to.exist;
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

    expect(!!main.querySelector('.tire-rating')).to.be.false;
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
