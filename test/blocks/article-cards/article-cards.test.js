/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, { selectRows } from '../../../blocks/article-cards/article-cards.js';

/** A query-index response with `count` article rows, newest last. */
function indexResponse(count) {
  const data = Array.from({ length: count }, (unused, i) => ({
    path: `/learn/article-${i}`,
    title: `Article ${i} | Continental Tire`,
    image: `/learn/media_${i}.png?width=1200&format=pjpg&optimize=medium`,
    description: `Description ${i}.`,
    lastModified: `${1700000000 + i}`,
  }));
  return {
    total: count, offset: 0, limit: count, data,
  };
}

function buildBlock() {
  document.body.innerHTML = '<div class="article-cards block"></div>';
  return document.querySelector('.article-cards.block');
}

describe('Article cards block', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('renders a card per indexed article, newest first', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(3))));
    const block = buildBlock();
    await decorate(block);

    const cards = block.querySelectorAll('.article-card');
    expect(cards).to.have.length(3);
    // newest (highest lastModified = Article 2) comes first
    expect(cards[0].querySelector('h2').textContent).to.equal('Article 2');
    expect(cards[0].getAttribute('href')).to.equal('/learn/article-2');
    // title suffix is stripped
    expect(cards[0].textContent).to.not.contain('Continental Tire');
    // each card has an optimized picture
    expect(cards[0].querySelector('picture img')).to.exist;
  });

  it('caps the first render and reveals more on demand', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(15))));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(10);
    const more = block.querySelector('.article-cards-more');
    expect(more).to.exist;

    more.click();
    expect(block.querySelectorAll('.article-card')).to.have.length(15);
    expect(!!block.querySelector('.article-cards-more')).to.be.false;
  });

  /*
   * Live pages ten and steps ten. Its /learn/news-and-events delivers 10
   * `article.news-teaser` with a Load More anchor to `?page=1`, and clicking it
   * in a browser on 2026-08-03 left 20 teasers on the page. `?page=14` holds the
   * last 8 of 148 and no pager at all. Issue #348.
   */
  it('steps ten at a time, the page live pages', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(25))));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(10);
    block.querySelector('.article-cards-more').click();
    expect(block.querySelectorAll('.article-card')).to.have.length(20);
    block.querySelector('.article-cards-more').click();
    expect(block.querySelectorAll('.article-card')).to.have.length(25);
    expect(!!block.querySelector('.article-cards-more')).to.be.false;
  });

  /*
   * Live prints "1-10 of 148 results" above LOAD MORE, in
   * `<div class="load-more-pager"><div class="pager-summary"><b>1-10</b> of 148
   * results</div><ul class="pager">`, read off /learn/news-and-events. The count
   * and the control are one element on live, and live's own
   * `con-ajax-controller` sets `pager=".load-more-pager"` with
   * `updatePager(e) { ...innerHTML = e ? e.innerHTML : "" }`, so on the last page
   * the fetched document has no pager and both the count and the button go.
   *
   * The range is cumulative here where live's is the fetched page's: live reads
   * "11-20 of 148" over twenty appended teasers, because `appendmode` appends
   * rows while the pager region is replaced wholesale. First render, which is
   * what a visitor lands on, is "1-10" on both. Issue #348.
   */
  it('prints the count above load more and moves it as more is shown', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(15))));
    const block = buildBlock();
    await decorate(block);

    const summary = block.querySelector('.article-cards-summary');
    expect(summary).to.exist;
    expect(summary.textContent).to.equal('1-10 of 15 results');
    expect(summary.querySelector('b').textContent).to.equal('1-10');
    // live keeps the count above the control, and adjacent to it
    expect(summary.nextElementSibling).to.equal(block.querySelector('.article-cards-more'));

    block.querySelector('.article-cards-more').click();
    expect(!!block.querySelector('.article-cards-more')).to.be.false;
    expect(!!block.querySelector('.article-cards-summary')).to.be.false;
  });

  it('prints no count when one batch holds everything', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(10))));
    const block = buildBlock();
    await decorate(block);

    expect(!!block.querySelector('.article-cards-more')).to.be.false;
    expect(!!block.querySelector('.article-cards-summary')).to.be.false;
  });

  /*
   * `/learn/corporate` holds 11 rows, one over a page of ten, and live prints
   * `1-10 of 11 results` there. A batch of 12 swallowed the whole listing, so it
   * drew no control and the count rides with the control. Issue #348.
   */
  it('prints the count for a listing one row over a page', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(11))));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(10);
    expect(block.querySelector('.article-cards-summary').textContent).to.equal('1-10 of 11 results');
    expect(block.querySelector('.article-cards-more')).to.exist;
  });

  it('draws a stub for a row that has no image', async () => {
    const res = indexResponse(3);
    res.data[1].image = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(res)));
    const block = buildBlock();
    await decorate(block);

    const cards = block.querySelectorAll('.article-card');
    expect(cards).to.have.length(3);
    // newest first, so the imageless row (lastModified 1700000001) is the middle card
    const stubbed = cards[1];
    expect(stubbed.querySelector('h2').textContent).to.equal('Article 1');
    expect(!!stubbed.querySelector('picture')).to.be.false;
    expect(stubbed.querySelector('.article-card-image .article-card-image-stub')).to.exist;
    expect(!!cards[0].querySelector('.article-card-image-stub')).to.be.false;
  });

  it('draws a stub for a row carrying the default-meta-image fallback', async () => {
    const res = indexResponse(3);
    res.data[1].image = '/default-meta-image.png?width=1200&format=pjpg&optimize=medium';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(res)));
    const block = buildBlock();
    await decorate(block);

    const cards = block.querySelectorAll('.article-card');
    expect(cards).to.have.length(3);
    expect(!!cards[1].querySelector('picture')).to.be.false;
    expect(cards[1].querySelector('.article-card-image-stub')).to.exist;
  });

  it('filters by an authored category', async () => {
    const res = indexResponse(4);
    res.data[0].category = 'Technology';
    res.data[1].category = 'News';
    res.data[2].category = 'Technology';
    res.data[3].category = 'Tire Tips';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(res)));
    document.body.innerHTML = '<div class="article-cards block"><div><div>Technology</div></div></div>';
    const block = document.querySelector('.article-cards.block');
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(2);
  });

  it('renders a fixed featured set with no load-more when a limit is authored', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(10))));
    document.body.innerHTML = '<div class="article-cards block"><div><div>3</div></div></div>';
    const block = document.querySelector('.article-cards.block');
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(3);
    expect(!!block.querySelector('.article-cards-more')).to.be.false;
    expect(!!block.querySelector('.article-cards-summary')).to.be.false;
  });
});

describe('selectRows', () => {
  it('keeps imageless rows in and filters by category', () => {
    const rows = [
      { image: '/a.png', category: 'News', lastModified: '3' },
      { image: '', category: 'News', lastModified: '2' },
      { image: '/c.png', category: 'Technology', lastModified: '1' },
    ];
    expect(selectRows(rows, { category: 'news' }).map((r) => r.lastModified)).to.deep.equal(['3', '2']);
    expect(selectRows(rows).length).to.equal(3);
  });

  it('keeps a row carrying the default-meta-image fallback', () => {
    const rows = [
      { image: '/learn/media_1.png?width=1200', lastModified: '3' },
      { image: '/default-meta-image.png?width=1200&format=pjpg', lastModified: '2' },
      { image: '/learn/media_2.png?width=1200', lastModified: '1' },
    ];
    const out = selectRows(rows);
    expect(out).to.have.length(3);
    expect(out.some((r) => r.image.includes('default-meta-image'))).to.be.true;
  });

  it('sorts by weight ascending, unweighted rows last by lastModified', () => {
    const rows = [
      { image: '/a.png', weight: '3', lastModified: '10' },
      { image: '/b.png', lastModified: '100' },
      { image: '/c.png', weight: '1', lastModified: '5' },
      { image: '/d.png', weight: '2', lastModified: '1' },
      { image: '/e.png', lastModified: '50' },
      // an empty-string weight is unweighted, not weight 0 (the index stores
      // unweighted rows as '')
      { image: '/f.png', weight: '', lastModified: '200' },
    ];
    const out = selectRows(rows);
    expect(out.map((r) => r.weight || 'none')).to.deep.equal(['1', '2', '3', 'none', 'none', 'none']);
    // the empty-weight row (newest) leads the unweighted tail, not the whole list
    expect(out[3].lastModified).to.equal('200');
    expect(out[4].lastModified).to.equal('100');
    expect(out[5].lastModified).to.equal('50');
  });
});

// The learn hub bands are editorially distinct on live. Tire Tips and
// Technology put a square category image beside a text-only teaser list under
// a gold rule; News runs three text-only teasers in columns. The block renders
// the same card grid for all three today.
describe('Article cards, learn hub band variants', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  /** The band as an author writes it: image, heading, subtitle, block, link. */
  function buildBand(variant, limit = 2) {
    document.body.innerHTML = `
      <div class="section article-cards-container">
        <div class="default-content-wrapper">
          <picture><img src="/learn/tips.png" alt=""></picture>
          <h2 id="tire-tips">Tire Tips</h2>
          <p>Get the most performance out of your Continental tires.</p>
        </div>
        <div class="article-cards-wrapper">
          <div class="article-cards ${variant} block"><div><div>${limit}</div></div></div>
        </div>
        <div class="default-content-wrapper">
          <p class="button-container"><a href="/learn/tips" class="button">All Tire Tips</a></p>
        </div>
      </div>`;
    return document.querySelector('.article-cards.block');
  }

  it('feature: renders teasers with no thumbnail', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('feature');
    await decorate(block);

    const teasers = block.querySelectorAll('.article-teaser');
    expect(teasers).to.have.length(2);
    expect(!!block.querySelector('.article-card-image')).to.be.false;
    expect(block.querySelector('picture img').getAttribute('src')).to.equal('/learn/tips.png');
    expect(teasers[0].querySelector('h3').textContent).to.equal('Article 4');
    expect(teasers[0].querySelector('p').textContent).to.equal('Description 4.');
    expect(teasers[0].getAttribute('href')).to.equal('/learn/article-4');
  });

  it('feature: moves the category image into its own media column', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('feature');
    await decorate(block);

    const media = block.querySelector('.article-cards-media');
    expect(media).to.exist;
    expect(media.querySelector('picture')).to.exist;
    // the media column leads the band, so the image is the first grid item
    expect(block.firstElementChild).to.equal(media);
  });

  it('feature: pairs the heading and subtitle so they can overlay the image', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('feature');
    await decorate(block);

    const intro = block.querySelector('.article-cards-intro');
    expect(intro).to.exist;
    expect(intro.querySelector('h2').textContent).to.equal('Tire Tips');
    expect(intro.querySelector('p').textContent).to.contain('Get the most performance');
  });

  it('feature: closes the band with the all-articles link', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('feature');
    await decorate(block);

    const link = block.lastElementChild;
    expect(link.querySelector('a').getAttribute('href')).to.equal('/learn/tips');
    // nothing is left stranded in the section's own wrappers
    expect(document.querySelectorAll('.section > .default-content-wrapper')).to.have.length(0);
  });

  it('feature: survives a band authored without a category image', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('feature');
    block.closest('.section').querySelector('picture').remove();
    await decorate(block);

    expect(block.querySelectorAll('.article-teaser')).to.have.length(2);
    expect(block.querySelector('.article-cards-intro h2').textContent).to.equal('Tire Tips');
  });

  it('columns: renders text-only teasers and leaves the band chrome alone', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(5))));
    const block = buildBand('columns', 3);
    await decorate(block);

    expect(block.querySelectorAll('.article-teaser')).to.have.length(3);
    expect(!!block.querySelector('.article-card-image')).to.be.false;
    // News has no category image on live, so the columns band keeps the plain
    // section layout rather than building a media column
    expect(!!block.querySelector('.article-cards-media')).to.be.false;
    expect(!!block.querySelector('.article-cards-intro')).to.be.false;
  });

  it('leaves the plain card grid on the category listing pages', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(3))));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(3);
    expect(block.querySelector('.article-card-image picture img')).to.exist;
    expect(!!block.querySelector('.article-teaser')).to.be.false;
  });
});

/**
 * The block read an unlabeled cell by what it looked like: a leading slash
 * made it the index, all digits made it the limit, anything else the category.
 * An author could not see which cell meant what, and a category of digits
 * became a limit. Labeled rows say it instead, and the older one-cell shape
 * the authored bands carry still reads. Issue #121.
 */
describe('Article cards, the authored configuration', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  /** A block with the given rows, each row an array of cells. */
  function configured(...rows) {
    document.body.innerHTML = `<div class="article-cards block">${
      rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')
    }</div>`;
    return document.querySelector('.article-cards.block');
  }

  function indexOf(rows) {
    return {
      total: rows.length, offset: 0, limit: rows.length, data: rows,
    };
  }

  it('reads the labeled rows', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([
      {
        path: '/learn/a', title: 'A', image: '/a.png', category: 'Technology',
      },
      {
        path: '/learn/b', title: 'B', image: '/b.png', category: 'Technology',
      },
      {
        path: '/learn/c', title: 'C', image: '/c.png', category: 'Tire Tips',
      },
    ]))));
    const block = configured(
      ['Source', '/experience/query-index.json'],
      ['Category', 'Technology'],
      ['Limit', '1'],
    );
    await decorate(block);

    expect(fetchStub.firstCall.args[0], 'the labeled source is fetched').to.equal('/experience/query-index.json');
    expect(block.querySelectorAll('.article-card'), 'the labeled limit is kept').to.have.length(1);
    expect(block.textContent, 'the labeled category filters').to.not.contain('C');
  });

  it('reads a label whatever case the author typed it in', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([
      {
        path: '/tires/a', title: 'A', image: '/a.png', category: 'Passenger',
      },
    ]))));
    const block = configured(['source', '/tires/query-index.json']);
    await decorate(block);

    expect(fetchStub.firstCall.args[0]).to.equal('/tires/query-index.json');
    expect(block.querySelectorAll('.article-card'), 'the label is not read as a category')
      .to.have.length(1);
  });

  // the shape that read a digit as a limit: a category named for a year
  it('takes a category of digits as a category', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([
      {
        path: '/learn/a', title: 'A', image: '/a.png', category: '2026',
      },
      {
        path: '/learn/b', title: 'B', image: '/b.png', category: 'Tire Tips',
      },
    ]))));
    const block = configured(['Category', '2026']);
    await decorate(block);

    const cards = block.querySelectorAll('.article-card');
    expect(cards, 'the year filtered rather than capped').to.have.length(1);
    expect(cards[0].getAttribute('href')).to.equal('/learn/a');
  });

  it('leaves the default index where no source is labeled', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([]))));
    await decorate(configured(['Category', 'Technology']));

    expect(fetchStub.firstCall.args[0]).to.equal('/learn/query-index.json');
  });

  it('leaves the default index where the labeled source is empty', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([]))));
    await decorate(configured(['Source', '']));

    expect(fetchStub.firstCall.args[0]).to.equal('/learn/query-index.json');
  });

  // /learn and the four category pages carry this shape, one value per row
  it('still reads the one-cell rows the authored bands carry', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexOf([
      {
        path: '/learn/a', title: 'A', image: '/a.png', category: 'Tire Tips',
      },
      {
        path: '/learn/b', title: 'B', image: '/b.png', category: 'Tire Tips',
      },
      {
        path: '/learn/c', title: 'C', image: '/c.png', category: 'News',
      },
    ]))));
    const block = configured(['Tire Tips'], ['2']);
    await decorate(block);

    expect(fetchStub.firstCall.args[0]).to.equal('/learn/query-index.json');
    expect(block.querySelectorAll('.article-card')).to.have.length(2);
    expect(block.textContent).to.not.contain('C');
  });
});

// #124: the block filters the index by an exact Category string an author
// types into a cell. A typo used to render an empty list, on a page that looks
// finished until someone counts the cards.
describe('Article cards, a category nobody publishes under', () => {
  let fetchStub;
  let errors;

  const ROWS = [
    {
      path: '/learn/a', title: 'A', image: '/a.png', category: 'Tire Tips',
    },
    {
      path: '/learn/b', title: 'B', image: '/b.png', category: 'News',
    },
  ];

  function build(...rows) {
    document.body.innerHTML = `<div class="article-cards block">${
      rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')
    }</div>`;
    return document.querySelector('.article-cards.block');
  }

  function stub() {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify({
      total: ROWS.length, offset: 0, limit: ROWS.length, data: ROWS,
    })));
  }

  beforeEach(() => {
    errors = sinon.stub(console, 'error');
  });
  afterEach(() => {
    fetchStub?.restore();
    errors.restore();
  });

  it('names the typed value and what it could have been', async () => {
    stub();
    const block = build(['Category', 'Tire Tps']);
    await decorate(block);

    const message = block.querySelector('.article-cards-error');
    expect(message, 'the message').to.exist;
    expect(message.textContent).to.contain('Tire Tps');
    expect(message.textContent).to.contain('Tire Tips');
  });

  it('lists nothing under a category it cannot place', async () => {
    stub();
    const block = build(['Category', 'Tire Tps']);
    await decorate(block);
    expect(block.querySelectorAll('.article-card')).to.have.length(0);
  });

  it('reports it to the console as well', async () => {
    stub();
    const block = build(['Category', 'Tire Tps']);
    await decorate(block);
    expect(errors.called, 'console.error').to.be.true;
  });

  it('catches the typo in a one-cell row too', async () => {
    stub();
    const block = build(['Tire Tps']);
    await decorate(block);
    expect(block.querySelector('.article-cards-error')).to.exist;
  });

  it('says nothing about a category that is published under', async () => {
    stub();
    const block = build(['Category', 'Tire Tips']);
    await decorate(block);
    expect(!!block.querySelector('.article-cards-error')).to.be.false;
    expect(block.querySelectorAll('.article-card')).to.have.length(1);
    expect(errors.called, 'console.error').to.be.false;
  });

  it('says nothing about a band that filters by no category', async () => {
    stub();
    const block = build(['/learn/query-index.json']);
    await decorate(block);
    expect(!!block.querySelector('.article-cards-error')).to.be.false;
    expect(block.querySelectorAll('.article-card')).to.have.length(2);
  });
});

/**
 * Live's news-and-events page carries TWO controls. The category tabs pick the
 * LISTING, /learn/tips against /learn/technology against news-and-events. The
 * pills below them pick a term INSIDE that listing, Everything against News
 * against Corporate, and they link to /learn/news and /learn/corporate.
 *
 * They are two axes, so they are two fields. `category` keeps saying which
 * listing a row belongs to and is untouched. `subcategory` says which pill it
 * takes, and an article is allowed to carry NONE.
 *
 * Everything is the UNFILTERED listing, not a union of the pills and not an
 * exclusion of the other listings. Measured on live: 148 in Everything, 129
 * News, 11 Corporate, 8 in Everything under neither pill, and no row in a pill
 * that is not also in Everything. The 8 are correct by construction only while
 * an empty subcategory stays legal, which is what these pin. Issue #246.
 */
describe('selectRows, the pill term inside a listing', () => {
  /** three News rows: one Corporate, one News, one carrying no pill term */
  const rows = () => [
    {
      image: '/a.png', category: 'News', subcategory: 'Corporate', lastModified: '3',
    },
    {
      image: '/b.png', category: 'News', subcategory: 'News', lastModified: '2',
    },
    { image: '/c.png', category: 'News', lastModified: '1' },
    { image: '/d.png', category: 'Tire Tips', lastModified: '0' },
  ];

  it('shows a row with no pill term under Everything', () => {
    const out = selectRows(rows(), { category: 'News' });
    expect(out.map((r) => r.lastModified)).to.deep.equal(['3', '2', '1']);
  });

  it('leaves a row with no pill term out of both pills', () => {
    expect(selectRows(rows(), { category: 'News', subcategory: 'News' })
      .map((r) => r.lastModified)).to.deep.equal(['2']);
    expect(selectRows(rows(), { category: 'News', subcategory: 'Corporate' })
      .map((r) => r.lastModified)).to.deep.equal(['3']);
  });

  it('does not treat Everything as a union of the pills', () => {
    const everything = selectRows(rows(), { category: 'News' });
    const pills = [
      ...selectRows(rows(), { category: 'News', subcategory: 'News' }),
      ...selectRows(rows(), { category: 'News', subcategory: 'Corporate' }),
    ];
    expect(everything.length).to.be.greaterThan(pills.length);
  });

  it('keeps the pill term out of the listing axis', () => {
    // asking for a listing must not be answered by a pill term of the same name
    expect(selectRows(rows(), { category: 'Tire Tips' })
      .map((r) => r.lastModified)).to.deep.equal(['0']);
  });
});

/**
 * The empty-grid message names the axis that emptied the grid. Before the pill
 * term existed there was one axis, so naming the category was naming the cause.
 * Now a page can ask for a listing that IS published and a pill term that is
 * not, and saying "no article is published under News" sends the reader to the
 * wrong cell. /learn/corporate reads exactly that way until its articles carry
 * the term. Issue #246.
 */
describe('Article cards, a pill term nobody publishes under', () => {
  let fetchStub;
  let errors;

  const ROWS = [
    {
      path: '/learn/a', title: 'A', image: '/a.png', category: 'News', subcategory: 'News',
    },
    {
      path: '/learn/b', title: 'B', image: '/b.png', category: 'News',
    },
  ];

  beforeEach(() => {
    errors = sinon.stub(console, 'error');
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify({
      total: ROWS.length, offset: 0, limit: ROWS.length, data: ROWS,
    })));
  });

  afterEach(() => {
    fetchStub.restore();
    errors.restore();
  });

  it('names the pill term, not the listing, when the term is the empty one', async () => {
    document.body.innerHTML = `<div class="article-cards block">
      <div><div>Category</div><div>News</div></div>
      <div><div>Subcategory</div><div>Corporate</div></div>
    </div>`;
    const block = document.querySelector('.article-cards.block');
    await decorate(block);
    const message = block.querySelector('.article-cards-error');
    expect(message, 'an empty grid says why').to.exist;
    expect(message.textContent).to.contain('Corporate');
    expect(message.textContent, 'the listing is not the cause').to.not.contain('under "News"');
  });

  it('still names the listing when the listing is the empty one', async () => {
    document.body.innerHTML = `<div class="article-cards block">
      <div><div>Category</div><div>Recipes</div></div>
    </div>`;
    const block = document.querySelector('.article-cards.block');
    await decorate(block);
    expect(block.querySelector('.article-cards-error').textContent).to.contain('Recipes');
  });
});

/**
 * Live's card carries its OWN excerpt, separate from the meta description, and
 * truncates it: 133 of its 145 teasers end in an ellipsis, median 150 characters
 * and max 153, which is 150 plus the ellipsis.
 *
 * We rendered the meta description into the card, so 18 cards showed a bare
 * dateline: VikingContact 8 read "Fort Mill, S.C." where live read 148
 * characters of the story. The index now carries `excerpt`; description stays
 * exactly as it is, because live's meta descriptions are cut the same way ours
 * are and rewriting them would break meta parity on 13 pages. Issue #246.
 */
describe('Article cards, the card excerpt', () => {
  let fetchStub;
  const LONG = 'Fort Mill, S.C. - August 1, 2025 - Continental Tire proudly introduces the VikingContact 8, our next-generation winter tire engineered to deliver exceptional performance in the harshest winter conditions';

  const serve = (rows) => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify({
      total: rows.length, offset: 0, limit: rows.length, data: rows,
    })));
  };

  afterEach(() => fetchStub && fetchStub.restore());

  async function render(row, variant = '') {
    serve([{
      path: '/learn/a', title: 'A', image: '/a.png', ...row,
    }]);
    document.body.innerHTML = `<div class="article-cards ${variant} block"></div>`;
    const block = document.querySelector('.article-cards.block');
    await decorate(block);
    return block.querySelector('li p')?.textContent ?? '';
  }

  it('renders the excerpt rather than the description', async () => {
    expect(await render({ excerpt: 'The story.', description: 'Fort Mill, S.C.' }))
      .to.equal('The story.');
  });

  it('falls back to the description when there is no excerpt', async () => {
    expect(await render({ description: 'A short tagline.' })).to.equal('A short tagline.');
  });

  it('trims the leading space the index join leaves', async () => {
    expect(await render({ excerpt: '  Fort Mill, S.C. - the story.' }))
      .to.equal('Fort Mill, S.C. - the story.');
  });

  it('cuts a long excerpt at a word boundary and ends it like live', async () => {
    const out = await render({ excerpt: LONG });
    expect(out.length, 'live maxes at 153').to.be.at.most(153);
    expect(out.endsWith('...'), 'live ends 133 of 145 with an ellipsis').to.equal(true);
    expect(out.slice(0, -3).endsWith(' '), 'no space before the ellipsis').to.equal(false);
    expect(LONG.startsWith(out.slice(0, -3)), 'a prefix of the excerpt').to.equal(true);
  });

  it('leaves a short excerpt whole, with no ellipsis', async () => {
    expect(await render({ excerpt: 'Celebrating 150 Years of Continental!' }))
      .to.equal('Celebrating 150 Years of Continental!');
  });

  it('cuts shorter on the teaser surface, which live cuts near 95', async () => {
    const out = await render({ excerpt: LONG }, 'columns');
    expect(out.length, 'the /events mini teaser').to.be.at.most(98);
    expect(out.endsWith('...')).to.equal(true);
  });
});
