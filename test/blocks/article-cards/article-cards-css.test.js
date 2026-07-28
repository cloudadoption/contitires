/* eslint-disable no-unused-expressions */
/* global describe it before after afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/article-cards/article-cards.js';

/** A query-index response with `count` article rows. */
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

/**
 * A page holding one decorated block and, beside it, a copy of what the block
 * built. The copy stands in for any other element on the page that happens to
 * carry one of these class names.
 */
async function buildPage(variant = '', limit = 4) {
  document.body.innerHTML = `
    <main>
      <div class="section article-cards-container">
        <div class="article-cards-wrapper">
          <div class="article-cards ${variant} block"><div><div>${limit}</div></div></div>
        </div>
      </div>
      <div class="loose"></div>
    </main>`;
  const block = document.querySelector('.article-cards');
  await decorate(block);
  document.querySelector('.loose').replaceChildren(...[...block.children].map((c) => c.cloneNode(true)));
  return block;
}

describe('Article cards, the styles it keeps to itself', () => {
  let fetchStub;
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  afterEach(() => fetchStub?.restore());

  it('lays out its own list and leaves a list outside it alone', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await setViewport({ width: 1440, height: 900 });
    await buildPage();

    const mine = document.querySelector('.article-cards .article-cards-list');
    const loose = document.querySelector('.loose .article-cards-list');
    expect(getComputedStyle(mine).display).to.equal('grid');
    expect(getComputedStyle(loose).display).to.equal('block');
  });

  it('sets its own card beside its image and leaves a card outside it alone', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await setViewport({ width: 1440, height: 900 });
    await buildPage();

    const mine = document.querySelector('.article-cards .article-card');
    const loose = document.querySelector('.loose .article-card');
    expect(getComputedStyle(mine).display).to.equal('flex');
    expect(getComputedStyle(loose).display).to.equal('inline');
    expect(getComputedStyle(document.querySelector('.article-cards .article-card-image')).width)
      .to.equal('171px');
    expect(getComputedStyle(document.querySelector('.loose .article-card-image')).width)
      .to.not.equal('171px');
  });

  it('leaves a teaser outside it unruled', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await setViewport({ width: 1440, height: 900 });
    await buildPage('columns', 3);

    const mine = document.querySelector('.article-cards .article-teaser');
    const loose = document.querySelector('.loose .article-teaser');
    expect(getComputedStyle(mine).borderBottomWidth).to.equal('1px');
    expect(getComputedStyle(loose).borderBottomWidth).to.equal('0px');
  });
});

/**
 * Live opens all three learn layouts at 769: the card grid goes two across
 * with the thumbnail beside the text, the feature band sets its image beside
 * the teaser list, and the News band runs three columns. Measured on
 * continentaltire.com/learn and /learn/tips at 768 and 769.
 *
 * The project runs mobile-first min-width queries at 600/900/1200, so these
 * open at 900 and live's layout from 769 to 899 is the one we give up. Issue
 * #113.
 */
describe('Article cards, where the layouts open', () => {
  let fetchStub;
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  afterEach(() => fetchStub?.restore());

  const tracks = (sel) => getComputedStyle(document.querySelector(sel)).gridTemplateColumns.split(' ').length;

  it('runs the card grid one across at 899 and two from 900', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await buildPage();

    await setViewport({ width: 899, height: 900 });
    expect(tracks('.article-cards .article-cards-list'), 'at 899').to.equal(1);
    expect(getComputedStyle(document.querySelector('.article-card')).display).to.equal('block');

    await setViewport({ width: 900, height: 900 });
    expect(tracks('.article-cards .article-cards-list'), 'at 900').to.equal(2);
    expect(getComputedStyle(document.querySelector('.article-card')).display).to.equal('flex');
  });

  it('stacks the feature band at 899 and sets it beside from 900', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await buildPage('feature', 3);

    await setViewport({ width: 899, height: 900 });
    expect(tracks('.article-cards.feature'), 'at 899').to.equal(1);

    await setViewport({ width: 900, height: 900 });
    expect(tracks('.article-cards.feature'), 'at 900').to.equal(2);
  });

  it('runs the News band one across at 899 and three from 900', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(4))));
    await buildPage('columns', 3);

    await setViewport({ width: 899, height: 900 });
    expect(tracks('.article-cards.columns .article-cards-list'), 'at 899').to.equal(1);

    await setViewport({ width: 900, height: 900 });
    expect(tracks('.article-cards.columns .article-cards-list'), 'at 900').to.equal(3);
  });
});
