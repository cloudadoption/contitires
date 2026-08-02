/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../blocks/tire-rating/tire-rating.js';

/*
 * Live's product pages carry two `application/ld+json` scripts. The first is a
 * `Product` holding the aggregate of its reviews, which is what a search engine
 * draws the stars in a result from; the second is Bazaarvoice's, the review
 * bodies themselves, and this rebuild does not hold those. Read off
 * continentaltire.com/tires/4x4contact on 2026-08-02:
 *
 *   {"@context":"https://schema.org/","@type":"Product","brand":"Continental",
 *    "manufacturer":"Continental","url":"https://continentaltire.com/tires/4x4contact",
 *    "name":"4x4 Contact","category":"Electric Vehicles, Crossover, ...",
 *    "image":"https://continentaltire.com/.../cont-conti4x4contact-a2_4822_0_0.png",
 *    "aggregateRating":{"@type":"AggregateRating","ratingValue":"3.49","reviewCount":"53"}}
 *
 * Ours carried none: the same page in headless Chrome answered 0 scripts. The
 * fields are in the catalog row this band already reads, so the band emits it.
 * (#490)
 */
const CATALOG = {
  total: 3,
  offset: 0,
  limit: 3,
  data: [
    {
      slug: '4x4contact',
      name: '4x4 Contact',
      path: '/tires/4x4contact',
      image: 'https://main--contitires--cloudadoption.aem.live/media/4x4contact-220x220.png',
      description: 'The 4x4 Contact is a premium, all-season touring tire for crossovers, light trucks and SUVs.',
      rating: 3.5,
      reviews: 53,
    },
    {
      slug: 'securecontact-aw', name: 'SecureContact AW', image: '/media/securecontact.png', description: 'An all-weather touring tire.', rating: 5, reviews: 7,
    },
    // 5 of the 46 rows carry no rating, and 0 out of 5 is a verdict nobody gave
    {
      slug: 'scontact', name: 'sContact', image: '/media/scontact.png', description: 'A spare tire.', rating: 0, reviews: 0,
    },
  ],
};

/** A fetch stub answering with a fresh Response, so a second read still works. */
function stubFetch(body, ok = true) {
  return sinon.stub(window, 'fetch').callsFake(() => Promise.resolve(
    ok ? new Response(JSON.stringify(body)) : new Response('', { status: 404 }),
  ));
}

/** A tire-rating block with the product slug in its first cell, in a section. */
function build(slug) {
  document.body.innerHTML = `<div class="section tire-rating-container">
    <div class="tire-rating-wrapper">
      <div class="tire-rating block"><div><div>${slug}</div></div></div>
    </div>
  </div>`;
  return document.querySelector('.tire-rating.block');
}

/** The blocks a crawler would read, parsed. */
const emitted = () => [...document.querySelectorAll('script[type="application/ld+json"]')]
  .map((script) => JSON.parse(script.textContent));

afterEach(() => {
  if (window.fetch.restore) window.fetch.restore();
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  document.body.innerHTML = '';
});

describe('tire-rating emits the Product block live emits (#490)', () => {
  it('emits one Product, named and pictured off the catalog row', async () => {
    stubFetch(CATALOG);
    await decorate(build('4x4contact'));

    const blocks = emitted();
    expect(blocks.length, 'one block, as live carries one Product').to.equal(1);
    const [product] = blocks;
    expect(product['@context']).to.equal('https://schema.org');
    expect(product['@type']).to.equal('Product');
    expect(product.name).to.equal('4x4 Contact');
    expect(product.image).to.equal(CATALOG.data[0].image);
    expect(product.description).to.equal(CATALOG.data[0].description);
  });

  it('carries the rating and the count the band prints', async () => {
    stubFetch(CATALOG);
    await decorate(build('4x4contact'));

    const [{ aggregateRating }] = emitted();
    expect(aggregateRating, 'the aggregate').to.exist;
    expect(aggregateRating['@type']).to.equal('AggregateRating');
    expect(aggregateRating.ratingValue).to.equal(3.5);
    expect(aggregateRating.reviewCount).to.equal(53);
  });

  it('emits it in the head, so the band leaving does not take it', async () => {
    stubFetch(CATALOG);
    await decorate(build('4x4contact'));

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script.parentElement, 'the script is in head').to.equal(document.head);
  });

  // the 5 unrated rows: the band takes itself away, and a Product with no
  // aggregate is still the product a crawler should read
  it('emits a Product with no aggregate where nobody has rated the product', async () => {
    stubFetch(CATALOG);
    await decorate(build('scontact'));

    const blocks = emitted();
    expect(blocks.length, 'the Product survives the band leaving').to.equal(1);
    expect(blocks[0].name).to.equal('sContact');
    expect('aggregateRating' in blocks[0], 'no rating of 0 out of 5').to.be.false;
    expect(!!document.querySelector('.tire-rating'), 'the band still leaves').to.be.false;
  });

  it('emits nothing for a slug the sheet does not carry', async () => {
    stubFetch(CATALOG);
    await decorate(build('not-a-tire'));

    expect(emitted().length).to.equal(0);
  });

  it('emits nothing when the sheet cannot be read', async () => {
    const errors = sinon.stub(console, 'error');
    stubFetch(CATALOG, false);
    await decorate(build('4x4contact'));
    errors.restore();

    expect(emitted().length).to.equal(0);
  });

  // decorateMain runs over a fragment's own main too, so a second band is
  // reachable, and two Products on one page is a defect a crawler sees
  it('emits one block however often the band is decorated', async () => {
    stubFetch(CATALOG);
    await decorate(build('4x4contact'));
    await decorate(build('securecontact-aw'));

    expect(emitted().length).to.equal(1);
  });
});
