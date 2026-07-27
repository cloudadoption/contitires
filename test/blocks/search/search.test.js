/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, { excerpt, pageUrl, readParams } from '../../../blocks/search/search.js';

/**
 * Rows as /query-index.json serves them: path, title, description, image, robots, body.
 * The ranking is covered by test/scripts/search.test.js against the real index; these
 * rows only have to be findable, so each holds its query term in a known field.
 */
function row(i, extra = {}) {
  return {
    path: `/learn/article-${i}`,
    title: `Article ${i} about tires | Continental Tire`,
    description: `Description ${i}.`,
    image: `/media_${i}.jpg?width=1200&format=pjpg&optimize=medium`,
    robots: '',
    body: `Body ${i} mentions tires once.`,
    ...extra,
  };
}

/** An index response holding `count` rows, plus any extra rows given. */
function indexResponse(count, extra = []) {
  const data = [...Array.from({ length: count }, (unused, i) => row(i)), ...extra];
  return {
    total: data.length, offset: 0, limit: data.length, data,
  };
}

function buildBlock(html = '') {
  document.body.innerHTML = `<div class="search block">${html}</div>`;
  return document.querySelector('.search.block');
}

/** Waits for `fn` to return something truthy, so a deferred fetch can land. */
async function waitFor(fn, message = 'condition') {
  for (let i = 0; i < 100; i += 1) {
    const value = fn();
    if (value) return value;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  throw new Error(`timed out waiting for ${message}`);
}

/** Decorates with `search` on the URL and waits for the results to land. */
async function decorateWith(search, response, block = buildBlock()) {
  window.history.replaceState({}, '', search);
  const stub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(response)));
  await decorate(block);
  return { block, stub };
}

describe('Search block: URL contract', () => {
  it('reads live\'s keywords parameter', () => {
    expect(readParams('?keywords=winter+tires').query).to.equal('winter tires');
  });

  it('falls back to q, which our header sent before this page existed', () => {
    expect(readParams('?q=winter').query).to.equal('winter');
    expect(readParams('?keywords=winter&q=summer').query).to.equal('winter');
  });

  it('reads a zero-based page, defaulting to the first', () => {
    expect(readParams('?keywords=tire').page).to.equal(0);
    expect(readParams('?keywords=tire&page=1').page).to.equal(1);
    expect(readParams('?keywords=tire&page=-3').page).to.equal(0);
    expect(readParams('?keywords=tire&page=x').page).to.equal(0);
  });

  it('trims the query and tolerates an empty URL', () => {
    expect(readParams('?keywords=%20tire%20').query).to.equal('tire');
    expect(readParams('').query).to.equal('');
  });

  it('builds paging URLs the way live does, omitting the first page', () => {
    expect(pageUrl('winter tires', 0)).to.equal('?keywords=winter+tires');
    expect(pageUrl('winter tires', 1)).to.equal('?keywords=winter+tires&page=1');
  });
});

describe('Search block: excerpt', () => {
  it('marks the matched term inside its surrounding text', () => {
    const segments = excerpt('It is more than a warranty, it is our promise.', ['warranty']);
    expect(segments.filter((s) => s.mark).map((s) => s.text)).to.deep.equal(['warranty']);
    expect(segments.map((s) => s.text).join('')).to.contain('more than a warranty, it is');
  });

  it('marks a plural where the query is singular', () => {
    const segments = excerpt('Winter tires keep their grip.', ['tire']);
    expect(segments.filter((s) => s.mark).map((s) => s.text)).to.deep.equal(['tires']);
  });

  it('elides the text between snippets and around them', () => {
    const filler = 'word '.repeat(40);
    const segments = excerpt(`${filler}warranty ${filler} warranty ${filler}`, ['warranty']);
    const text = segments.map((s) => s.text).join('');
    expect(text.startsWith('…'), `starts with an ellipsis: ${text.slice(0, 20)}`).to.be.true;
    expect(text.endsWith('…'), 'ends with an ellipsis').to.be.true;
    expect(text.split('…')).to.have.length.above(3);
    expect(text.length).to.be.below(500);
  });

  it('stops after three snippets, as live does', () => {
    const filler = 'word '.repeat(30);
    const segments = excerpt(Array.from({ length: 6 }, () => `${filler}warranty`).join(' '), ['warranty']);
    expect(segments.filter((s) => s.mark)).to.have.length(3);
  });

  it('returns nothing when the text holds no term', () => {
    expect(excerpt('Nothing to see here.', ['warranty'])).to.deep.equal([]);
    expect(excerpt('', ['warranty'])).to.deep.equal([]);
    expect(excerpt(undefined, ['warranty'])).to.deep.equal([]);
  });
});

describe('Search block: results', () => {
  let stub;
  afterEach(() => {
    stub?.restore();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('fetches the index after first paint, not while decorating', async () => {
    window.history.replaceState({}, '', '?keywords=tires');
    stub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(3))));
    const block = buildBlock();
    await decorate(block);
    expect(stub.called, 'no fetch during decorate').to.be.false;
    expect(block.querySelector('.search-form'), 'the form paints first').to.exist;
    // the results arrive after the load event, so their space is held from the start,
    // otherwise the footer sits under the form and the results shove it down
    const band = block.querySelector('.search-results-wrapper').classList;
    expect(band.contains('search-band'), 'the results area is reserved').to.be.true;
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(stub.calledOnce).to.be.true;
    expect(stub.firstCall.args[0]).to.equal('/query-index.json');
  });

  it('renders the search form live sends, prefilled with the query', async () => {
    ({ stub } = await decorateWith('?keywords=tires', indexResponse(3)));
    const form = document.querySelector('.search-form');
    expect(form.getAttribute('action')).to.equal('/search');
    expect(form.getAttribute('method')).to.equal('get');
    const input = form.querySelector('input[name="keywords"]');
    expect(input, 'input named keywords').to.exist;
    expect(input.value).to.equal('tires');
    expect(form.querySelector('button[type="submit"]')).to.exist;
  });

  it('names the query in the status line', async () => {
    const { block } = await decorateWith('?keywords=tires', indexResponse(3));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const status = block.querySelector('.search-status');
    expect(status.textContent.trim()).to.equal('Site results for tires');
    expect(status.querySelector('b').textContent).to.equal('tires');
  });

  it('renders live\'s result markup: title link, image, excerpt', async () => {
    const { block } = await decorateWith('?keywords=tires', indexResponse(3));
    await waitFor(() => block.querySelector('.search-result'), 'results');

    const first = block.querySelector('.search-results > li > article.search-result');
    expect(first, 'article.search-result inside a list item').to.exist;
    const link = first.querySelector('h2.search-result-title a');
    expect(link.getAttribute('href')).to.equal('/learn/article-0');
    expect(link.textContent).to.equal('Article 0 about tires');
    expect(first.querySelector('.search-result-image picture img')).to.exist;
    expect(first.querySelector('.search-result-excerpt strong').textContent).to.equal('tires');
  });

  it('shows ten results a page and pages the rest, as live does', async () => {
    const { block } = await decorateWith('?keywords=tires', indexResponse(24));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(block.querySelectorAll('.search-result')).to.have.length(10);

    const summary = block.querySelector('.search-pager-summary');
    expect(summary.textContent.replace(/\s+/g, ' ').trim()).to.equal('1-10 of 24 results');

    const pages = [...block.querySelectorAll('.search-pager-page')];
    expect(pages.map((p) => p.textContent.replace('Current page', '').trim()))
      .to.deep.equal(['1', '2', '3']);
    expect(pages[0].getAttribute('aria-current')).to.equal('page');
    expect(pages[1].getAttribute('href')).to.equal('?keywords=tires&page=1');
    expect(block.querySelector('.search-pager-nav a[rel="next"]').getAttribute('href'))
      .to.equal('?keywords=tires&page=1');
    expect(block.querySelector('.search-pager-nav a[rel="prev"]'), 'no previous on page 1').to.not.exist;
  });

  it('renders a later page from the URL', async () => {
    const { block } = await decorateWith('?keywords=tires&page=2', indexResponse(24));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(block.querySelectorAll('.search-result')).to.have.length(4);
    expect(block.querySelector('.search-pager-summary').textContent.replace(/\s+/g, ' ').trim())
      .to.equal('21-24 of 24 results');
    expect(block.querySelector('.search-pager-nav a[rel="prev"]').getAttribute('href'))
      .to.equal('?keywords=tires&page=1');
    expect(block.querySelector('.search-pager-nav a[rel="next"]'), 'no next on the last page').to.not.exist;
  });

  it('shows nine numbered pages at a time, centred on the current one', async () => {
    // live pages 215 results as 22 pages and never renders more than nine numbers:
    // page 1 shows 1-9, page 13 shows 9-17, and the last page shows 14-22
    const { block } = await decorateWith('?keywords=tires&page=12', indexResponse(215));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const numbers = [...block.querySelectorAll('.search-pager-page')]
      .map((p) => p.textContent.replace('Current page', '').trim());
    expect(numbers).to.deep.equal(['9', '10', '11', '12', '13', '14', '15', '16', '17']);
    expect(block.querySelector('.search-pager-nav a[rel="prev"]').textContent).to.equal('Prev');
    expect(block.querySelector('.search-pager-nav a[rel="next"]').textContent).to.equal('Next');
  });

  it('clamps the numbered pages at the first and the last', async () => {
    const { block } = await decorateWith('?keywords=tires&page=21', indexResponse(215));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const numbers = [...block.querySelectorAll('.search-pager-page')]
      .map((p) => p.textContent.replace('Current page', '').trim());
    expect(numbers).to.deep.equal(['14', '15', '16', '17', '18', '19', '20', '21', '22']);
  });

  it('drops the pager when everything fits on one page', async () => {
    const { block } = await decorateWith('?keywords=tires', indexResponse(4));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(block.querySelector('.search-pager-nav'), 'no pager nav').to.not.exist;
    expect(block.querySelector('.search-pager-summary').textContent.replace(/\s+/g, ' ').trim())
      .to.equal('1-4 of 4 results');
  });

  it('says what live says when nothing matches', async () => {
    const { block } = await decorateWith('?keywords=zzzqqq', indexResponse(3));
    await waitFor(() => block.querySelector('.search-no-results'), 'the no-results message');
    expect(block.querySelector('.search-no-results h2').textContent)
      .to.equal('You have stumped us. No results.');
    const again = block.querySelector('.search-no-results a');
    expect(again.getAttribute('href')).to.equal('/search');
    expect(again.textContent).to.equal('Search again');
    expect(block.querySelector('.search-results'), 'no empty result list').to.not.exist;
  });

  it('shows the form alone when no query was given', async () => {
    const { block, stub: fetchStub } = await decorateWith('', indexResponse(3));
    expect(block.querySelector('.search-form')).to.exist;
    expect(block.querySelector('.search-no-results'), 'live shows no message here').to.not.exist;
    expect(block.querySelector('.search-results')).to.not.exist;
    expect(block.querySelector('.search-status').textContent.trim()).to.equal('');
    expect(fetchStub.called, 'no index fetch without a query').to.be.false;
    const band = block.querySelector('.search-results-wrapper').classList;
    expect(band.contains('search-band'), 'nothing reserved without a query').to.be.false;
  });

  it('keeps a noindex page out of its own results', async () => {
    const hidden = row(99, { path: '/search', title: 'Main search | Continental Tire', robots: 'noindex, nofollow' });
    const { block } = await decorateWith('?keywords=tires', indexResponse(2, [hidden]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const paths = [...block.querySelectorAll('.search-result-title a')].map((a) => a.getAttribute('href'));
    expect(paths).to.not.contain('/search');
    expect(paths).to.have.length(2);
  });

  it('renders an excerpt as text, so an indexed tag cannot become markup', async () => {
    const nasty = row(7, { body: 'Fitting <script>alert(1)</script> tires safely.' });
    const { block } = await decorateWith('?keywords=tires', indexResponse(0, [nasty]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(block.querySelector('script'), 'no script element').to.not.exist;
    expect(block.querySelector('.search-result-excerpt').textContent).to.contain('<script>');
  });

  it('falls back to the description when the body holds no term', async () => {
    const titleOnly = row(8, {
      title: 'Tire Dealers | Continental Tire',
      description: 'Find a Continental tire dealer near you.',
      body: 'Locations and hours.',
    });
    const { block } = await decorateWith('?keywords=dealer', indexResponse(0, [titleOnly]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const text = block.querySelector('.search-result-excerpt').textContent;
    expect(text).to.contain('dealer');
    expect(block.querySelector('.search-result-excerpt strong').textContent).to.equal('dealer');
  });

  it('does not open the excerpt with the title, which sits above it', async () => {
    // the indexed body starts with the page heading, so the raw text repeats the title
    const repeated = row(5, {
      title: 'How Tire Rotation Can Extend the Life of Your Tires | Continental Tire',
      body: 'How Tire Rotation Can Extend the Life of Your Tires Why should I rotate my tires? It helps.',
    });
    const { block } = await decorateWith('?keywords=tires', indexResponse(0, [repeated]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const text = block.querySelector('.search-result-excerpt').textContent;
    expect(text).to.not.contain('How Tire Rotation Can Extend');
    expect(text).to.contain('Why should I rotate my tires');
  });

  it('loads a Drupal-path thumbnail from the live host, which serves it', async () => {
    // 58 of 320 index rows hold the image as /sites/default/files/..., a path this
    // origin does not serve, while the page's own og:image is the absolute live URL
    const drupal = row(6, { image: '/sites/default/files/media/image/2024-08/ct_crosscontact.png' });
    const { block } = await decorateWith('?keywords=tires', indexResponse(0, [drupal]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    const img = block.querySelector('.search-result-image img');
    expect(img.getAttribute('src')).to.equal(
      'https://continentaltire.com/sites/default/files/media/image/2024-08/ct_crosscontact.png',
    );
    expect(img.getAttribute('loading')).to.equal('lazy');
  });

  it('leaves out the image when a row has none', async () => {
    const noImage = row(9, { image: '' });
    const { block } = await decorateWith('?keywords=tires', indexResponse(0, [noImage]));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(block.querySelector('.search-result-image')).to.not.exist;
    expect(block.querySelector('.search-result-title a')).to.exist;
  });
});

describe('Search block: index source', () => {
  let stub;
  afterEach(() => {
    stub?.restore();
    window.history.replaceState({}, '', window.location.pathname);
  });

  it('takes an authored index path over the default', async () => {
    const block = buildBlock('<div><div>/learn/query-index.json</div></div>');
    ({ stub } = await decorateWith('?keywords=tires', indexResponse(2), block));
    await waitFor(() => block.querySelector('.search-result'), 'results');
    expect(stub.firstCall.args[0]).to.equal('/learn/query-index.json');
  });

  it('says nothing matched when the index cannot be fetched', async () => {
    window.history.replaceState({}, '', '?keywords=tires');
    stub = sinon.stub(window, 'fetch').resolves(new Response('', { status: 404 }));
    const block = buildBlock();
    await decorate(block);
    await waitFor(() => block.querySelector('.search-no-results'), 'the no-results message');
  });
});
