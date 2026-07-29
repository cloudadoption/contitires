/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/tire-specs/tire-specs.js';

// legacy /product-specs.json shape: keyed by slug, each an array of
// { size, specs } entries.
const SPECS = {
  'my-tire': [
    { size: '205/45 ZR 16', specs: { 'Load Index': '83', 'Speed Rating': 'W', UTQG: '340 AA A' } },
    { size: '225/45 ZR 17', specs: { 'Load Index': '88', 'Speed Rating': 'W', UTQG: '340 AA A' } },
  ],
};

// the 19 spec columns, in the order the DA specs sheet carries them; this is
// also the dt/dd render order.
const SPEC_ORDER = [
  'Load Index', 'Speed Rating', 'Tread Wear', 'Traction', 'Temperature',
  'Article Number', 'Approved Rim Width', 'Tire Diameter', 'Tire Weight',
  'Max Load', 'Rim Protector', 'Max Inflation Pressure', 'Side Wall',
  'Overall Section Width', 'Tread Depth', 'Tire Metric', 'Load Range',
  'Revs Per Mile', 'UTQG',
];

/** A flat specs-sheet row: slug, size, then the 19 fields in column order. */
function specRow(slug, size, loadIndex) {
  const row = { slug, size };
  SPEC_ORDER.forEach((key, i) => { row[key] = i === 0 ? loadIndex : `v${i}`; });
  return row;
}

// the DA sheet serves /products.json as a multi-sheet workbook; per-size specs
// live under specs.data as flat rows keyed by slug.
const WORKBOOK = {
  ':version': 3,
  ':type': 'multi-sheet',
  ':names': ['products', 'specs'],
  products: {
    total: 0, offset: 0, limit: 0, data: [],
  },
  specs: {
    total: 3,
    offset: 0,
    limit: 3,
    data: [
      specRow('vikingcontact-7', '155/70 R 19', '88'),
      specRow('vikingcontact-7', '285/40 R 19', '99'),
      specRow('other-tire', '205/55 R 16', '77'),
    ],
  },
};

/** A URL-aware fetch stub: each URL prefix resolves to its own fresh Response. */
function stubFetch(map) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const key = Object.keys(map).find((k) => String(url).startsWith(k));
    return Promise.resolve(new Response(JSON.stringify(key ? map[key] : {})));
  });
}

/**
 * A fetch stub that pages the way the sheet API does: it never returns more
 * than pageSize rows, and it honours the offset in the request.
 */
function stubPagedFetch(rows, pageSize) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const offset = Number(new URL(String(url), 'https://x').searchParams.get('offset') || 0);
    const page = rows.slice(offset, offset + pageSize);
    return Promise.resolve(new Response(JSON.stringify({
      total: rows.length, offset, limit: page.length, data: page,
    })));
  });
}

/** A fetch stub for a sheet still on the way: it never answers. */
function stubPendingFetch() {
  return sinon.stub(window, 'fetch').callsFake(() => new Promise(() => {}));
}

/**
 * Waits for what the block does after decoration returns. A mutation observer
 * reports that without a timer, which the test runner throttles on the pages
 * it backgrounds.
 * @param {Function} check reads the page, returning what the caller waits for
 */
function when(check) {
  return new Promise((resolve) => {
    const hit = check();
    if (hit) {
      resolve(hit);
      return;
    }
    const observer = new MutationObserver(() => {
      const found = check();
      if (!found) return;
      observer.disconnect();
      resolve(found);
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true,
    });
  });
}

/** The block once the sheet has landed and the selector is in place. */
const filled = (block) => when(() => block.querySelector('.tire-specs-select'));

/** A tire-specs block with the product slug authored in its first cell. */
function build(slug) {
  document.body.innerHTML = `<div class="tire-specs block"><div><div>${slug}</div></div></div>`;
  return document.querySelector('.tire-specs.block');
}

/** The same block in the section and wrapper the page decoration puts it in. */
function buildInSection(slug) {
  document.body.innerHTML = `<div class="section tire-specs-container"><div class="tire-specs-wrapper">
    <div class="tire-specs block"><div><div>${slug}</div></div></div>
  </div></div>`;
  return document.querySelector('.tire-specs.block');
}

/*
 * A product page carries three more sections under this one, and loadSections
 * reaches them only once this block returns: loadSection awaits every block in
 * turn and leaves the sections below at display none meanwhile. The specs sheet
 * is 827KB over 1656 rows, so awaiting it here held the rest of the page back.
 * The block renders first and fills in when the sheet lands. Issue #111.
 */
describe('Tire specs block, the sheet it does not wait for', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('heads the band before the sheet lands', () => {
    fetchStub = stubPendingFetch();
    const block = build('my-tire');
    decorate(block);
    expect(block.querySelector('h2')).to.exist;
    expect(block.querySelector('h2').textContent).to.equal('Specifications');
  });

  it('leaves the block in place while the sheet is on the way', () => {
    fetchStub = stubPendingFetch();
    const block = buildInSection('my-tire');
    decorate(block);
    expect(document.querySelector('.tire-specs-wrapper')).to.exist;
  });

  it('asks for the sheet while decorating, rather than waiting for a reader', () => {
    fetchStub = stubPendingFetch();
    decorate(build('my-tire'));
    expect(fetchStub.calledOnce).to.be.true;
  });
});

describe('Tire specs block, legacy product-specs.json', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('renders a size selector and the first size specs', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('205/45 ZR 16');
    expect(block.textContent).to.contain('Load Index');
    expect(block.textContent).to.contain('83');
    expect(block.querySelector('.tire-specs-count').textContent).to.contain('2');
  });

  it('switches specs when a different size is selected', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    const select = block.querySelector('.tire-specs-select');
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    expect(block.textContent).to.contain('88');
  });

  it('keeps the band and says so when the product has no specs', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('unknown-tire');
    decorate(block);
    await when(() => block.querySelector('.tire-specs-count'));

    expect(block.isConnected, 'the block stays').to.be.true;
    expect(document.querySelector('.tire-specs-select')).to.not.exist;
    expect(block.querySelector('.tire-specs-count').textContent)
      .to.equal('No sizes are listed for this tire.');
  });
});

describe('Tire specs block, multi-sheet workbook', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('reads specs.data, filters by slug, and renders the 19 fields in column order', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = build('vikingcontact-7');
    decorate(block);
    await filled(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('155/70 R 19');
    expect(opts[1].textContent).to.equal('285/40 R 19');

    const dts = [...block.querySelectorAll('.tire-specs-grid dt')].map((dt) => dt.textContent);
    expect(dts).to.deep.equal(SPEC_ORDER); // slug and size excluded, order preserved
    expect(block.textContent).to.contain('88'); // Load Index of the first size
  });

  // the band used to be removed so an empty one would not paint a bare black
  // stripe under the hero. It is filled now rather than emptied, so it stays,
  // which is what live does on the same six products. (#242)
  it('keeps its wrapper in the section when the slug has no rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await when(() => document.querySelector('.tire-specs-count'));

    expect(document.querySelector('.tire-specs-container').children.length).to.equal(1);
  });

  it('keeps its wrapper when the slug has rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await filled(block);

    expect(document.querySelectorAll('.tire-specs-wrapper').length).to.equal(1);
    expect(block.querySelectorAll('.tire-specs-select option').length).to.equal(2);
  });
});

describe('Tire specs block, single-sheet request', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  // the workbook also carries the products and catalog sheets a PDP never reads
  it('asks for the specs sheet, not the whole workbook', () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK.specs });
    decorate(build('my-tire'));
    expect(fetchStub.firstCall.args[0]).to.contain('/products.json?sheet=specs');
    expect(fetchStub.firstCall.args[0]).to.not.contain('sheet=products');
  });

  it('reads the rows a single-sheet response puts at data', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK.specs });
    const block = build('vikingcontact-7');
    decorate(block);
    await filled(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('155/70 R 19');
  });
});

// The sheet API serves 1000 rows unless asked for more, and the specs sheet is
// longer than that. Every product past the cut rendered no sizes at all.
describe('Tire specs block, sheets longer than one page', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  /** A sheet of `n` rows where only the last three belong to the slug. */
  function longSheet(n, slug) {
    return Array.from({ length: n }, (_, i) => (n - i <= 3
      ? specRow(slug, `20${n - i}/55 R 17`, String(80 + i))
      : specRow('filler', `1${i}5/55 R 16`, String(i))));
  }

  it('asks for more rows than the sheet API serves by default', () => {
    fetchStub = stubPagedFetch(longSheet(30, 'my-tire'), 10);
    decorate(build('my-tire'));

    const url = new URL(String(fetchStub.firstCall.args[0]), 'https://x');
    expect(Number(url.searchParams.get('limit')), 'a request with no limit stops at 1000').to.be.above(1000);
  });

  it('keeps reading until it holds the whole sheet', async () => {
    fetchStub = stubPagedFetch(longSheet(30, 'my-tire'), 10);
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    expect(block.querySelectorAll('.tire-specs-select option')).to.have.length(3);
  });

  it('stops once it has every row', async () => {
    fetchStub = stubPagedFetch(longSheet(30, 'my-tire'), 10);
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    expect(fetchStub.callCount).to.equal(3);
  });

  it('renders a product whose rows all sit past the first page', async () => {
    fetchStub = stubPagedFetch(longSheet(2400, 'contiprocontact'), 1000);
    const block = build('contiprocontact');
    decorate(block);
    await filled(block);

    expect(block.querySelectorAll('.tire-specs-select option')).to.have.length(3);
  });
});

/*
 * The sheet lands after the sections under this one are on screen, so the block
 * holds the room its spec sheet takes. Every product carries the same 19
 * fields, so the height turns on the width rather than on the product: the grid
 * pairs the fields two across from 600px up. These are the heights the filled
 * band settles at, read off four product pages at twelve widths from 320 to
 * 1440: 1472 at 320 falling to 1289 by 480, 962 at 600 falling to 805 by 899,
 * 808 from 900. A band holds the tallest of the widths in it, so the room is
 * never short of the sheet. Where it is over, the sheet sits in a taller band
 * rather than moving what is under it.
 */
describe('The room the spec sheet takes', () => {
  let block;

  before(async () => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/tire-specs/tire-specs.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document.body.innerHTML = '<main><div class="section"><div><div class="tire-specs"></div></div></div></main>';
    block = document.querySelector('.tire-specs');
  });

  after(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.slice(0, -1);
    document.querySelector('main').remove();
  });

  const height = () => Math.round(block.getBoundingClientRect().height);

  it('holds the stacked sheet open on a phone', async () => {
    await setViewport({ width: 375, height: 800 });
    expect(height()).to.equal(1472);
  });

  it('holds the stack open to the foot of its band', async () => {
    await setViewport({ width: 599, height: 800 });
    expect(height()).to.equal(1472);
  });

  it('holds the paired sheet open from 600', async () => {
    await setViewport({ width: 600, height: 800 });
    expect(height()).to.equal(962);
  });

  it('holds it open across that band', async () => {
    await setViewport({ width: 768, height: 800 });
    expect(height()).to.equal(962);
  });

  it('holds the desk sheet open from 900', async () => {
    await setViewport({ width: 1200, height: 800 });
    expect(height()).to.equal(808);
  });
});

/**
 * Live pairs the spec fields two across from 375 up, and goes four across on a
 * wide desk. Read off continentaltire.com/tires/contiprocontact at 375, 600,
 * 768, 769, 900, 1024 and 1440, where its details list holds two pairs a row
 * below 1440 and four at it.
 *
 * Ours ran one pair a row below 700. That is the width the project's 600 band
 * replaces, so the sheet pairs up 100px earlier and closer to live. #113.
 */
describe('Tire specs, where the sheet pairs up', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/tire-specs/tire-specs.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    const pairs = SPEC_ORDER.map((key, i) => `<dt>${key}</dt><dd>v${i}</dd>`).join('');
    document.body.innerHTML = `
      <main><div class="section tire-specs-container"><div class="tire-specs-wrapper">
        <div class="tire-specs block">
          <h2>Specifications</h2>
          <div class="tire-specs-panel"><dl class="tire-specs-grid">${pairs}</dl></div>
        </div>
      </div></div></main>`;
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  const tracks = () => getComputedStyle(document.querySelector('.tire-specs-grid'))
    .gridTemplateColumns.split(' ').length;

  it('runs one pair a row at 599', async () => {
    await setViewport({ width: 599, height: 900 });
    expect(tracks()).to.equal(2);
  });

  it('pairs them two across from 600', async () => {
    await setViewport({ width: 600, height: 900 });
    expect(tracks()).to.equal(4);
  });
});

// #122: the block reads the sheet by two column names. Renaming either one in
// DA used to leave every product page with no spec panel and nothing said.
describe('Tire specs, a sheet that does not carry its columns', () => {
  let fetchStub;
  let errors;

  beforeEach(() => {
    errors = sinon.stub(console, 'error');
  });
  afterEach(() => {
    fetchStub.restore();
    errors.restore();
  });

  /** The specs sheet with one column renamed, the way a sheet edit renames it. */
  const renamed = (from, to) => ({
    total: 2,
    offset: 0,
    limit: 2,
    data: WORKBOOK.specs.data
      .filter((row) => row.slug === 'vikingcontact-7')
      .map(({ [from]: value, ...rest }) => ({ [to]: value, ...rest })),
  });

  it('names the missing column in the band instead of taking the band away', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(renamed('slug', 'product'))));
    const block = buildInSection('vikingcontact-7');
    decorate(block);

    const message = await when(() => block.querySelector('.tire-specs-error'));
    expect(message.textContent).to.contain('slug');
    expect(document.querySelector('.tire-specs-wrapper'), 'the band').to.exist;
  });

  it('names a renamed size column too', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(renamed('size', 'tireSize'))));
    const block = buildInSection('vikingcontact-7');
    decorate(block);

    const message = await when(() => block.querySelector('.tire-specs-error'));
    expect(message.textContent).to.contain('size');
  });

  it('reports the breach to the console as well', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(renamed('slug', 'product'))));
    const block = buildInSection('vikingcontact-7');
    decorate(block);

    await when(() => block.querySelector('.tire-specs-error'));
    expect(errors.called, 'console.error').to.be.true;
  });

  // a sheet that has its columns and no row for this product is the ordinary
  // case for the six products live has no spec table for either. It is not an
  // authoring mistake, so it reads as the empty band rather than as an error.
  it('shows the empty band when the sheet is whole and the product has no rows', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
    const block = buildInSection('purecontact-ls');
    decorate(block);

    await when(() => document.querySelector('.tire-specs-count'));
    expect(document.querySelector('.tire-specs-wrapper'), 'the band stays').to.exist;
    expect(document.querySelector('.tire-specs-error'), 'no authoring error').to.not.exist;
    expect(errors.called, 'console.error').to.be.false;
  });
});

/**
 * Six of the 46 products have no rows anywhere in the specs sheet:
 * 4x4sportcontact, contipremiumcontact-2, contitrac, controlcontact-tour-as-plus,
 * purecontact-ls and truecontact-tour. Counted over all 1656 rows, with the
 * fetch proven complete against the sheet's own total. #242 says six and names
 * these; #232 says four, and four is wrong.
 *
 * Live has no sizes for them either and still renders the band. Read on
 * continentaltire.com/tires/4x4sportcontact with the profile's storage cleared
 * first: the band is 1440 by 428 on black, headed `4x4 SportContact
 * Specifications`, exactly the same 428 as a product with 49 sizes. Only the
 * option count differs.
 *
 * We removed the wrapper instead, so the band went. That is the parity defect
 * in #242 and the late collapse in #232, which are one defect: a band that is
 * never removed cannot collapse. (#242, folding in #232)
 */
describe('Tire specs, the products with no sizes', () => {
  let fetchStub;
  afterEach(() => {
    fetchStub.restore();
    document.querySelector('main')?.remove();
  });

  it('keeps the band where it used to take it away', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await when(() => document.querySelector('.tire-specs-count'));

    expect(document.querySelector('.tire-specs-wrapper'), 'the wrapper').to.exist;
    expect(document.querySelector('.tire-specs-container').children.length).to.equal(1);
    expect(block.querySelector('h2').textContent).to.equal('Specifications');
  });

  it('says plainly that no sizes are listed', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    const count = await when(() => document.querySelector('.tire-specs-count'));

    expect(count.textContent).to.equal('No sizes are listed for this tire.');
  });

  // a picker with nothing in it is a control that does nothing, which is the
  // shape #307 took out of the finder
  it('draws no picker when there is nothing to pick', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await when(() => document.querySelector('.tire-specs-count'));

    expect(block.querySelector('select')).to.not.exist;
    expect(block.querySelector('.tire-specs-grid')).to.not.exist;
  });

  // live's hint reads "Find size by vehicle or plate". Neither of those finds a
  // size here, which is #243, so this offers the one search that does.
  it('offers the search that does find a size', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await when(() => document.querySelector('.tire-specs-count'));

    const trigger = block.querySelector('[data-tire-finder]');
    expect(trigger, 'the finder trigger').to.exist;
    expect(trigger.dataset.tireFinder).to.equal('tire-size');
    expect(trigger.textContent.trim()).to.equal('Search by tire size');
    expect(/vehicle|plate/i.test(block.textContent), 'no vehicle or plate claim').to.be.false;
  });

  it('still fills the band for a product that has rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await filled(block);

    expect(block.querySelectorAll('.tire-specs-select option').length).to.equal(2);
    expect(block.querySelector('[data-tire-finder]'), 'no empty-state help').to.not.exist;
    expect(block.querySelector('.tire-specs-count').textContent)
      .to.equal('2 sizes available. Select a size to see its specs.');
  });
});
