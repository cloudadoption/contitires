/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate from '../../../blocks/tire-rating/tire-rating.js';

// The catalog sheet as /products.json?sheet=catalog delivers it: a single
// sheet, so the rows are at the top level rather than under a sheet name.
// Rating and reviews are the two columns this block reads; the rest are the
// listing's and are here because a real row carries them.
const CATALOG = {
  total: 4,
  offset: 0,
  limit: 4,
  data: [
    {
      slug: '4x4contact', name: '4x4 Contact', path: '/tires/4x4contact', rating: 3.5, reviews: 53,
    },
    {
      slug: 'extremecontact-force', name: 'ExtremeContact Force', path: '/tires/extremecontact-force', rating: 5, reviews: 1,
    },
    {
      slug: 'extremecontact-dws06-plus', name: 'ExtremeContact DWS06 PLUS', path: '/tires/extremecontact-dws06-plus', rating: 4.6, reviews: 1043,
    },
    {
      slug: 'scontact', name: 'sContact', path: '/tires/scontact', rating: 0, reviews: 0,
    },
  ],
};

/** The same sheet with a column renamed, which is what an author can do. */
function catalogWithout(column) {
  return {
    ...CATALOG,
    data: CATALOG.data.map((row) => {
      const copy = { ...row };
      copy[`${column}Value`] = copy[column];
      delete copy[column];
      return copy;
    }),
  };
}

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

afterEach(() => {
  if (window.fetch.restore) window.fetch.restore();
  document.body.innerHTML = '';
});

describe('tire-rating', () => {
  it('renders the score, the stars and the count the catalog sheet holds', async () => {
    stubFetch(CATALOG);
    const block = build('4x4contact');
    await decorate(block);

    expect(block.querySelector('h2').textContent, 'the heading').to.equal('Customer rating');
    expect(block.querySelector('.tire-rating-score').textContent).to.equal('3.5');
    expect(block.querySelector('.tire-rating-count').textContent).to.equal('53 Reviews');
    expect(block.querySelector('.tire-rating-stars'), 'the star widget').to.exist;
  });

  it('asks for the catalog sheet alone, and for all of its rows', async () => {
    const fetched = stubFetch(CATALOG);
    await decorate(build('4x4contact'));

    const url = String(fetched.firstCall.args[0]);
    expect(url).to.contain('/products.json');
    expect(url, 'the catalog sheet').to.contain('sheet=catalog');
    expect(url, 'past the 1000-row default').to.contain('limit=');
  });

  it('fills the stars to the rating', async () => {
    stubFetch(CATALOG);
    const block = build('4x4contact');
    await decorate(block);

    const fill = block.querySelector('.tire-rating-stars-fill');
    expect(fill.style.width, '3.5 of 5').to.equal('70%');
  });

  it('states the rating in words, for a reader who cannot see the stars', async () => {
    stubFetch(CATALOG);
    const block = build('4x4contact');
    await decorate(block);

    const said = block.querySelector('.sr-only').textContent;
    expect(said).to.equal('Rated 3.5 out of 5 from 53 reviews');
    expect(block.querySelector('.tire-rating-stars').getAttribute('aria-hidden')).to.equal('true');
  });

  it('writes a whole rating with its decimal, the way live does', async () => {
    stubFetch(CATALOG);
    const block = build('extremecontact-force');
    await decorate(block);

    expect(block.querySelector('.tire-rating-score').textContent).to.equal('5.0');
  });

  it('counts one review in the singular', async () => {
    stubFetch(CATALOG);
    const block = build('extremecontact-force');
    await decorate(block);

    expect(block.querySelector('.tire-rating-count').textContent).to.equal('1 Review');
  });

  it('leaves a four-figure count unpunctuated, the way live writes it', async () => {
    stubFetch(CATALOG);
    const block = build('extremecontact-dws06-plus');
    await decorate(block);

    expect(block.querySelector('.tire-rating-count').textContent).to.equal('1043 Reviews');
  });

  it('takes the band away for a product nobody has rated', async () => {
    stubFetch(CATALOG);
    const block = build('scontact');
    await decorate(block);

    expect(!!document.querySelector('.tire-rating'), 'the block').to.be.false;
    expect(!!document.querySelector('.tire-rating-container'), 'and its section').to.be.false;
  });

  it('takes the band away for a slug the sheet does not carry', async () => {
    stubFetch(CATALOG);
    const block = build('not-a-tire');
    await decorate(block);

    expect(!!document.querySelector('.tire-rating')).to.be.false;
  });

  it('reads the slug off the path when no cell is authored', async () => {
    stubFetch(CATALOG);
    document.body.innerHTML = '<div class="tire-rating block"><div><div></div></div></div>';
    const block = document.querySelector('.tire-rating.block');
    const slug = window.location.pathname.replace(/\/$/, '').split('/').pop();
    CATALOG.data.push({
      slug, name: 'The page itself', rating: 2, reviews: 8,
    });
    await decorate(block);
    CATALOG.data.pop();

    expect(block.querySelector('.tire-rating-count').textContent).to.equal('8 Reviews');
  });

  // #122's contract, on the sheet the listing and this band share: a renamed
  // column would otherwise blank every product page and say nothing.
  it('names a column the sheet no longer has, rather than going quiet', async () => {
    stubFetch(catalogWithout('rating'));
    const block = build('4x4contact');
    await decorate(block);

    expect(document.querySelector('.tire-rating'), 'the band stays').to.exist;
    const message = block.querySelector('.tire-rating-error');
    expect(message, 'the breach on the page').to.exist;
    expect(message.textContent).to.contain('rating');
  });

  it('names a missing count column too', async () => {
    stubFetch(catalogWithout('reviews'));
    const block = build('4x4contact');
    await decorate(block);

    const message = block.querySelector('.tire-rating-error');
    expect(message, 'the breach on the page').to.exist;
    expect(message.textContent).to.contain('reviews');
  });
});

/*
 * #434. A catalog outage and a product nobody has rated both ended with the
 * band and its container gone, so the page afterwards showed a product that
 * never had a rating and no reading of it could say which had happened. The
 * band going is what a reader sees either way, because a broken band is worse.
 * What separates them is the console, which is this repo's own way of saying a
 * sheet could not be read: perfect-fit, article-cards and tire-specs all use it.
 */
describe('tire-rating, an outage told apart from an unrated product', () => {
  let errors;

  beforeEach(() => {
    errors = sinon.stub(console, 'error');
  });
  afterEach(() => errors.restore());

  it('takes the band away when the sheet answers 404, and says so', async () => {
    stubFetch(CATALOG, false);
    const block = build('4x4contact');
    await decorate(block);

    expect(!!document.querySelector('.tire-rating'), 'the block').to.be.false;
    expect(!!document.querySelector('.tire-rating-container'), 'and its section').to.be.false;
    expect(errors.called, 'console.error').to.be.true;
    expect(String(errors.firstCall.args[0]), 'names the block and the sheet')
      .to.contain('tire-rating').and.to.contain('catalog sheet');
  });

  it('takes the band away when the read throws, and says so', async () => {
    sinon.stub(window, 'fetch').rejects(new TypeError('Failed to fetch'));
    const block = build('4x4contact');
    await decorate(block);

    expect(!!document.querySelector('.tire-rating'), 'the block').to.be.false;
    expect(errors.called, 'console.error').to.be.true;
    expect(String(errors.firstCall.args[0])).to.contain('catalog sheet');
  });

  it('says nothing when the sheet is whole and nobody has rated the product', async () => {
    stubFetch(CATALOG);
    const block = build('scontact');
    await decorate(block);

    expect(!!document.querySelector('.tire-rating'), 'the block').to.be.false;
    expect(errors.called, 'console.error').to.be.false;
  });

  it('says nothing when the sheet is whole and carries no row for the slug', async () => {
    stubFetch(CATALOG);
    await decorate(build('not-a-tire'));

    expect(errors.called, 'console.error').to.be.false;
  });

  // the assertion the issue is about: not that either case renders nothing,
  // which was already true, but that the two are no longer one answer
  it('answers a failed read and an unrated product differently', async () => {
    stubFetch(CATALOG, false);
    await decorate(build('4x4contact'));
    const onOutage = errors.callCount;

    window.fetch.restore();
    errors.resetHistory();
    stubFetch(CATALOG);
    await decorate(build('scontact'));
    const onUnrated = errors.callCount;

    expect(onOutage, 'a failed read').to.be.greaterThan(0);
    expect(onUnrated, 'a product nobody has rated').to.equal(0);
    expect(onOutage).to.not.equal(onUnrated);
  });
});
