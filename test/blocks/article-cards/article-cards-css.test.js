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
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    // the block's rules are built from the global custom properties: a border
    // built from an undefined var computes to none
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global, sheet];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => s !== sheet && s !== global);
    document.body.classList.remove('appear');
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
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    // the block's rules are built from the global custom properties: a border
    // built from an undefined var computes to none
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global, sheet];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => s !== sheet && s !== global);
    document.body.classList.remove('appear');
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

/**
 * An article with no image of its own. Live keeps it in the listing and draws a
 * black tile where the thumbnail would be, `.news-teaser__image-stub`:
 *
 *     background-color: #000000
 *     background-image: url(.../contiseal-white.png)
 *     background-size: 50%; background-position: center center
 *     height: 128px; width: 100%; border-radius: 1rem
 *
 * and under `max-width: 768px` it hides the tile, leaving the 1px-bordered
 * wrapper and its 8px margin above the title. Read off live's own
 * /themes/custom/nextcontinental/dist/css/styles.css and confirmed in the
 * rendered markup of /learn/corporate, which carries one of these teasers.
 *
 * The wrapper is 171px wide from live's 769, so the tile is 171x128 there. Ours
 * pulls the empty wrapper to that width at 769 as well, which is why the tile
 * reads live's box in the band where the card itself is still stacked (#113).
 * The mark inside live's tile is not in this repo, so the tile ships without
 * one. Issue #346.
 */
describe('Article cards, the tile a row with no image gets (#346)', () => {
  let fetchStub;
  let sheet;
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global, sheet];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => s !== sheet && s !== global);
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  afterEach(() => fetchStub?.restore());

  /** One card, built from a row whose image is missing. */
  async function buildStubbedPage() {
    const res = indexResponse(1);
    res.data[0].image = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(res)));
    document.body.innerHTML = `
      <main>
        <div class="section article-cards-container">
          <div class="article-cards-wrapper">
            <div class="article-cards block"><div><div>1</div></div></div>
          </div>
        </div>
      </main>`;
    const block = document.querySelector('.article-cards');
    await decorate(block);
    return block;
  }

  const stub = () => document.querySelector('.article-cards .article-card-image-stub');
  const figure = () => document.querySelector('.article-cards .article-card-image');

  it('draws live\'s 171x128 black tile at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    await buildStubbedPage();

    const box = stub().getBoundingClientRect();
    expect(Math.round(box.width), 'width').to.equal(171);
    expect(Math.round(box.height), 'height').to.equal(128);
    const style = getComputedStyle(stub());
    expect(style.display).to.equal('block');
    expect(style.backgroundColor).to.equal('rgb(0, 0, 0)');
    expect(style.borderRadius).to.equal('16px');
  });

  it('opens the tile at live\'s 769 and keeps it 171x128 there', async () => {
    await buildStubbedPage();

    await setViewport({ width: 768, height: 900 });
    expect(getComputedStyle(stub()).display, 'at 768').to.equal('none');
    // the wrapper live keeps below its cap: 1px border top and bottom, no content
    expect(Math.round(figure().getBoundingClientRect().height), 'wrapper at 768').to.equal(2);

    await setViewport({ width: 769, height: 900 });
    expect(getComputedStyle(stub()).display, 'at 769').to.equal('block');
    const box = stub().getBoundingClientRect();
    expect(Math.round(box.width), 'width at 769').to.equal(171);
    expect(Math.round(box.height), 'height at 769').to.equal(128);
  });
});

/**
 * Live's count and its LOAD MORE share one centred flex column:
 *
 *     .load-more-pager { display: flex; flex-direction: column;
 *       align-items: center; justify-content: center }
 *     .load-more-pager > * + * { margin-top: var(--space-20) }
 *     .pager-summary { font-size: var(--font-size-15);
 *       line-height: var(--line-height-22) }
 *
 * so the count is centred with 20px between it and the button. Read off live's
 * own stylesheet on 2026-08-02. The gap above the count is this block's
 * existing 40px, which the button carried before the count went in front of it.
 * Issue #348.
 */
describe('Article cards, where the result count sits (#348)', () => {
  let fetchStub;
  let sheet;
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/article-cards/article-cards.css')).text());
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, global, sheet];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => s !== sheet && s !== global);
    document.body.classList.remove('appear');
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  afterEach(() => fetchStub?.restore());

  it('centres the count 20px above the button, at live\'s 15 on 22', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(indexResponse(15))));
    await setViewport({ width: 1440, height: 900 });
    document.body.innerHTML = `
      <main>
        <div class="section article-cards-container">
          <div class="article-cards-wrapper">
            <div class="article-cards block"></div>
          </div>
        </div>
      </main>`;
    const block = document.querySelector('.article-cards');
    await decorate(block);

    const summary = block.querySelector('.article-cards-summary');
    const more = block.querySelector('.article-cards-more');
    const style = getComputedStyle(summary);
    expect(style.textAlign).to.equal('center');
    expect(style.fontSize).to.equal('15px');
    expect(style.lineHeight).to.equal('22px');
    const gap = more.getBoundingClientRect().top - summary.getBoundingClientRect().bottom;
    expect(Math.round(gap), 'count to button').to.equal(20);
    // the 40px the button carried alone still opens the pair
    const list = block.querySelector('.article-cards-list');
    const above = summary.getBoundingClientRect().top - list.getBoundingClientRect().bottom;
    expect(Math.round(above), 'list to count').to.equal(40);
  });
});
