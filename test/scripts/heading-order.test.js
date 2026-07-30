/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach before */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorateCards from '../../blocks/article-cards/article-cards.js';
import decorateFinder from '../../blocks/perfect-fit/perfect-fit.js';

/*
 * #117. Two blocks build their headings in JavaScript, so the level they pick
 * is invisible to the authored markup and to a curl. Both pick one that skips:
 * an article card titles itself h3 under a page whose only other heading is the
 * banner h1, and a finder result titles itself h4 under the dialog's h2
 * question. Both images then repeat the title beside them in their alt, so the
 * link says it twice.
 *
 * Measured on the published host 2026-07-30: five learn category pages skip
 * h1 to h3 (/learn/tips, /learn/technology, /learn/news, /learn/news-and-events
 * and /learn/corporate, 58 cards between them), and all three finder tabs skip
 * h2 to h4. Live titles its own category cards h2.
 */

/** The level jumps in a root's heading outline, the way axe reads heading-order. */
function skips(root) {
  const found = [];
  let prev = 0;
  [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].forEach((h) => {
    const level = Number(h.tagName[1]);
    if (prev && level > prev + 1) found.push(`h${prev} to h${level}`);
    prev = level;
  });
  return found;
}

async function adopt(...paths) {
  const sheets = await Promise.all(paths.map(async (p) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch(p)).text());
    return sheet;
  }));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
}

const typeOf = (el) => {
  const cs = getComputedStyle(el);
  return {
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    fontWeight: cs.fontWeight,
    letterSpacing: cs.letterSpacing,
  };
};

/** A query-index response with `count` article rows. */
function indexResponse(count) {
  return {
    total: count,
    offset: 0,
    limit: count,
    data: Array.from({ length: count }, (unused, i) => ({
      path: `/learn/article-${i}`,
      title: `Article ${i} | Continental Tire`,
      image: `/learn/media_${i}.png?width=1200&format=pjpg&optimize=medium`,
      description: `Description ${i}.`,
      lastModified: `${1700000000 + i}`,
    })),
  };
}

/* The shape of a learn category page: a banner h1, then the card grid. */
function buildCategoryPage() {
  document.body.innerHTML = `
    <main><div class="section"><div class="banner-wrapper">
      <div class="banner block"><h1>Performance, mileage and confidence</h1></div>
    </div></div>
    <div class="section"><div class="article-cards-wrapper">
      <div class="article-cards block"></div>
    </div></div></main>`;
  return document.querySelector('.article-cards.block');
}

describe('Article cards, the level a category page reads', () => {
  let fetchStub;

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/article-cards/article-cards.css');
  });

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch').callsFake((url) => {
      if (String(url).includes('query-index')) {
        return Promise.resolve(new Response(JSON.stringify(indexResponse(3))));
      }
      return Promise.resolve(new Response('{}'));
    });
  });

  afterEach(() => fetchStub.restore());

  it('titles a card h2, the level live gives its own category cards', async () => {
    const block = buildCategoryPage();
    await decorateCards(block);
    const card = block.querySelector('.article-card');
    expect(card.querySelector('h2'), 'the card title is an h2').to.exist;
  });

  it('leaves no level skip between the banner h1 and the cards', async () => {
    const block = buildCategoryPage();
    await decorateCards(block);
    expect(skips(document.querySelector('main'))).to.deep.equal([]);
  });

  it('keeps the card title at the type the card had as an h3', async () => {
    const block = buildCategoryPage();
    await decorateCards(block);
    const title = block.querySelector('.article-card-body h2');
    expect(typeOf(title)).to.deep.equal({
      fontSize: '14px', lineHeight: '20px', fontWeight: '700', letterSpacing: '0.5px',
    });
  });

  it('leaves the card image alt empty, since the title beside it is the link text', async () => {
    const block = buildCategoryPage();
    await decorateCards(block);
    const alts = [...block.querySelectorAll('.article-card img')].map((img) => img.getAttribute('alt'));
    expect(alts).to.have.length(3);
    expect(alts.every((alt) => alt === ''), `alts were ${JSON.stringify(alts)}`).to.be.true;
  });
});

const CATALOGUE = {
  products: {
    products: [{
      slug: 'terrain-at',
      name: 'TerrainContact A/T',
      category: 'Light Truck/SUV',
      season: 'All-Season',
      vehicleTypes: ['SUVs'],
      image: '/p/terrain.png',
      sizes: ['265/70R17'],
    }],
  },
  specs: { data: [{ slug: 'terrain-at', size: '265/70 R 17', 'Load Index': '95' }] },
};

function stubSheets() {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const name = new URL(String(url), 'https://x').searchParams.get('sheet');
    return Promise.resolve(new Response(JSON.stringify(CATALOGUE[name] || { data: [] })));
  });
}

/** Waits for what a click brings about, since the modal is built on the first one. */
function when(check, what) {
  return new Promise((resolve, reject) => {
    const hit = check();
    if (hit) {
      resolve(hit);
      return;
    }
    let stop = () => {};
    const observer = new MutationObserver(() => {
      const found = check();
      if (!found) return;
      stop();
      resolve(found);
    });
    const timer = setTimeout(() => {
      stop();
      reject(new Error(`waited in vain for ${what}`));
    }, 2000);
    stop = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true,
    });
  });
}

function buildBar() {
  document.body.innerHTML = `
    <main><div class="section perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit block">
        <div><div><p>Find your perfect fit:</p></div></div>
        <div>
          <div><span>By Vehicle</span></div>
          <div><span>By Tire Size</span></div>
          <div><span>By Plate</span></div>
        </div>
      </div>
    </div></div></main>`;
  return document.querySelector('.perfect-fit.block');
}

describe('Tire finder results, the level the dialog reads', () => {
  let fetchStub;

  before(async () => {
    await adopt('/styles/styles.css', '/blocks/perfect-fit/perfect-fit.css');
  });

  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets();
  });

  afterEach(() => fetchStub.restore());

  /** A search on the tire size tab, run to its results. */
  async function search() {
    const block = buildBar();
    await decorateFinder(block);
    block.querySelectorAll('.perfect-fit-item')[1].click();
    await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal');
    const panel = document.querySelector('#perfect-fit-panel-tire-size');
    [['width', '265'], ['aspect', '70'], ['rim', '17']].forEach(([name, value]) => {
      const field = panel.querySelector(`[name="${name}"]`);
      field.value = value;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return panel;
  }

  it('titles a result h3, one level under the question the dialog asks', async () => {
    const panel = await search();
    expect(panel.querySelector('.perfect-fit-result h3'), 'the result title is an h3').to.exist;
  });

  it('leaves no level skip inside the open panel', async () => {
    const panel = await search();
    expect(skips(panel)).to.deep.equal([]);
  });

  it('keeps the result title at the type it had as an h4', async () => {
    const panel = await search();
    const title = panel.querySelector('.perfect-fit-result-body h3');
    const { fontSize, fontWeight } = typeOf(title);
    expect({ fontSize, fontWeight }).to.deep.equal({ fontSize: '15px', fontWeight: '700' });
  });

  it('leaves the result image alt empty, since the name beside it is the link text', async () => {
    const panel = await search();
    const img = panel.querySelector('.perfect-fit-result img');
    expect(img.getAttribute('alt')).to.equal('');
  });
});
