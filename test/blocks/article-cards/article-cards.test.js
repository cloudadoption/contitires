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
});
