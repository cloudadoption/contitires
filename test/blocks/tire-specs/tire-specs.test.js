/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
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

describe('Tire specs block, legacy product-specs.json', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('renders a size selector and the first size specs', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    await decorate(block);

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
    await decorate(block);

    const select = block.querySelector('.tire-specs-select');
    select.value = '1';
    select.dispatchEvent(new Event('change'));
    expect(block.textContent).to.contain('88');
  });

  it('renders nothing when the product has no specs', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('unknown-tire');
    await decorate(block);

    expect(block.querySelector('.tire-specs-select')).to.not.exist;
  });
});

describe('Tire specs block, multi-sheet workbook', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  it('reads specs.data, filters by slug, and renders the 19 fields in column order', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = build('vikingcontact-7');
    await decorate(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('155/70 R 19');
    expect(opts[1].textContent).to.equal('285/40 R 19');

    const dts = [...block.querySelectorAll('.tire-specs-grid dt')].map((dt) => dt.textContent);
    expect(dts).to.deep.equal(SPEC_ORDER); // slug and size excluded, order preserved
    expect(block.textContent).to.contain('88'); // Load Index of the first size
  });

  it('renders nothing when the slug has no rows in the specs sheet', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = build('purecontact-ls');
    await decorate(block);

    expect(block.querySelector('.tire-specs-select')).to.not.exist;
  });

  // an empty block still paints its dark band, leaving a black stripe under the
  // hero on the products live has no sizes for
  it('takes its wrapper out of the section when the slug has no rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    await decorate(block);

    expect(document.querySelectorAll('.tire-specs-wrapper').length).to.equal(0);
    expect(document.querySelector('.tire-specs-container').children.length).to.equal(0);
  });

  it('keeps its wrapper when the slug has rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('vikingcontact-7');
    await decorate(block);

    expect(document.querySelectorAll('.tire-specs-wrapper').length).to.equal(1);
    expect(block.querySelectorAll('.tire-specs-select option').length).to.equal(2);
  });
});

describe('Tire specs block, single-sheet request', () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  // the workbook also carries the products and catalog sheets a PDP never reads
  it('asks for the specs sheet, not the whole workbook', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK.specs });
    await decorate(build('my-tire'));
    expect(fetchStub.firstCall.args[0]).to.equal('/products.json?sheet=specs');
  });

  it('reads the rows a single-sheet response puts at data', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK.specs });
    const block = build('vikingcontact-7');
    await decorate(block);

    const opts = block.querySelectorAll('.tire-specs-select option');
    expect(opts).to.have.length(2);
    expect(opts[0].textContent).to.equal('155/70 R 19');
  });
});
