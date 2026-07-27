/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

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
    expect(cards[0].querySelector('h3').textContent).to.equal('Article 2');
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

    expect(block.querySelectorAll('.article-card')).to.have.length(12);
    const more = block.querySelector('.article-cards-more');
    expect(more).to.exist;

    more.click();
    expect(block.querySelectorAll('.article-card')).to.have.length(15);
    expect(block.querySelector('.article-cards-more')).to.not.exist;
  });

  it('skips rows that have no image', async () => {
    const res = indexResponse(3);
    res.data[1].image = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(res)));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(2);
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
    expect(block.querySelector('.article-cards-more')).to.not.exist;
  });
});

describe('selectRows', () => {
  it('keeps imageless rows out and filters by category', () => {
    const rows = [
      { image: '/a.png', category: 'News', lastModified: '3' },
      { image: '', category: 'News', lastModified: '2' },
      { image: '/c.png', category: 'Technology', lastModified: '1' },
    ];
    expect(selectRows(rows, { category: 'news' }).map((r) => r.lastModified)).to.deep.equal(['3']);
    expect(selectRows(rows).length).to.equal(2);
  });

  it('drops rows using the missing default-meta-image fallback', () => {
    const rows = [
      { image: '/learn/media_1.png?width=1200', lastModified: '3' },
      { image: '/default-meta-image.png?width=1200&format=pjpg', lastModified: '2' },
      { image: '/learn/media_2.png?width=1200', lastModified: '1' },
    ];
    const out = selectRows(rows);
    expect(out).to.have.length(2);
    expect(out.some((r) => r.image.includes('default-meta-image'))).to.be.false;
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
    expect(block.querySelector('.article-card-image')).to.not.exist;
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
    expect(block.querySelector('.article-card-image')).to.not.exist;
    // News has no category image on live, so the columns band keeps the plain
    // section layout rather than building a media column
    expect(block.querySelector('.article-cards-media')).to.not.exist;
    expect(block.querySelector('.article-cards-intro')).to.not.exist;
  });

  it('leaves the plain card grid on the category listing pages', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(3))));
    const block = buildBlock();
    await decorate(block);

    expect(block.querySelectorAll('.article-card')).to.have.length(3);
    expect(block.querySelector('.article-card-image picture img')).to.exist;
    expect(block.querySelector('.article-teaser')).to.not.exist;
  });
});
