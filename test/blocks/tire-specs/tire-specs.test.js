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

/** The block once the sheet has landed and the picker holds its sizes. */
const filled = (block) => when(() => block.querySelector('.tire-specs-select option[value="0"]'));

/** Chooses a size in the picker, the way a reader does. */
function choose(block, index) {
  const select = block.querySelector('.tire-specs-select');
  select.value = String(index);
  select.dispatchEvent(new Event('change'));
  return select;
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

/** The same block on a product page, under the hero's h1. */
function buildProductPage(slug, name) {
  document.body.innerHTML = `<main><h1>${name}</h1>
    <div class="section tire-specs-container"><div class="tire-specs-wrapper">
      <div class="tire-specs block"><div><div>${slug}</div></div></div>
    </div></div></main>`;
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

  it('offers the sizes under live\'s placeholder, and shows none of them yet', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    const opts = [...block.querySelectorAll('.tire-specs-select option')].map((o) => o.textContent);
    expect(opts).to.deep.equal(['Select a size', '205/45 ZR 16', '225/45 ZR 17']);
    expect(block.textContent).to.not.contain('Load Index');
  });

  it('shows a size\'s specs once a reader chooses it', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    choose(block, 0);
    expect(block.textContent).to.contain('Load Index');
    expect(block.textContent).to.contain('83');
  });

  it('switches specs when a different size is selected', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = build('my-tire');
    decorate(block);
    await filled(block);

    choose(block, 1);
    expect(block.textContent).to.contain('88');
  });

  it('keeps the band and draws the empty state when the product has no specs', async () => {
    fetchStub = stubFetch({ '/product-specs.json': SPECS });
    const block = buildInSection('unknown-tire');
    decorate(block);
    await when(() => block.querySelector('.tire-specs-status'));

    expect(document.querySelector('.tire-specs-wrapper')).to.exist;
    expect(!!block.querySelector('.tire-specs-grid'), 'a spec table').to.be.false;
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

    const opts = [...block.querySelectorAll('.tire-specs-select option')].map((o) => o.textContent);
    expect(opts).to.deep.equal(['Select a size', '155/70 R 19', '285/40 R 19']);

    choose(block, 0);
    const dts = [...block.querySelectorAll('.tire-specs-grid dt')].map((dt) => dt.textContent);
    expect(dts).to.deep.equal(SPEC_ORDER); // slug and size excluded, order preserved
    expect(block.textContent).to.contain('88'); // Load Index of the first size
  });

  // live keeps the band on the six products its own sheet has no sizes for,
  // and shows an empty picker inside it
  it('keeps its wrapper in the section when the slug has no rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await when(() => block.querySelector('.tire-specs-status'));

    expect(document.querySelector('.tire-specs-wrapper')).to.exist;
    expect(document.querySelector('.tire-specs-container').children.length).to.equal(1);
  });

  it('keeps its wrapper when the slug has rows', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await filled(block);

    expect(document.querySelectorAll('.tire-specs-wrapper').length).to.equal(1);
    expect(block.querySelectorAll('.tire-specs-select option').length).to.equal(3);
  });
});

/*
 * Live's own band on a product it has no sizes for, read off
 * continentaltire.com/tires/4x4sportcontact at 1440x1000 with the profile's
 * storage cleared, in the state a reader arrives in with no size chosen. Its
 * picker holds 0 options, where the same read of the same band on
 * /tires/extremecontact-dws06-plus holds 119. Live keeps the band, heads it
 * with the product name, and shows an empty picker inside it. #242, #232.
 */
describe("Tire specs, live's empty state", () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  /** The band once the sheet has landed and the picker has no size to offer. */
  const empty = (block) => when(() => [...block.querySelectorAll('.tire-specs-select option')]
    .some((o) => o.textContent === 'No results found'));

  it('heads the band with the product name, live\'s eyebrow after it', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    const heading = block.querySelector('h2');
    expect(heading.textContent.replace(/\s+/g, ' ').trim()).to.equal('4x4 SportContact Specifications');
    expect(heading.querySelector('span').textContent.trim()).to.equal('Specifications');
  });

  /*
   * Live heads the band with the mark on: "CrossContact LX<sup>25</sup>
   * Specifications". Reading the h1 as textContent flattens it, so the band was
   * the one surface that dropped the mark even where the page carried it. The
   * mark stays at display inline, which keeps the accessible name one word.
   * Issue #238.
   */
  it('keeps the superscript the h1 carries, as live does', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', 'CrossContact LX<sup>25</sup>');
    decorate(block);
    await empty(block);

    const heading = block.querySelector('h2');
    const mark = heading.querySelector('sup');
    expect(mark, 'the band heading carries the mark').to.exist;
    expect(mark.textContent).to.equal('25');
    expect(heading.textContent.replace(/\s+/g, ' ').trim()).to.equal('CrossContact LX25 Specifications');
  });

  it('keeps live\'s own space before the mark, and the text after it', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('ct-m-as', 'ControlContact Tour<sup>M</sup> A/S');
    decorate(block);
    await empty(block);

    const heading = block.querySelector('h2');
    expect(heading.querySelector('sup'), 'the mark').to.exist;
    expect(heading.textContent.replace(/\s+/g, ' ').trim()).to.equal('ControlContact TourM A/S Specifications');
  });

  it('heads the band with a plain name unchanged', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    const heading = block.querySelector('h2');
    expect(heading.textContent.replace(/\s+/g, ' ').trim()).to.equal('4x4 SportContact Specifications');
    expect(heading.querySelectorAll('sup').length, 'no mark invented').to.equal(0);
  });

  it('says what live says above the picker', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    expect(block.querySelector('.tire-specs-status').textContent)
      .to.equal('Make a selection below to view tire specifications.');
  });

  it('offers live\'s empty picker, under live\'s label', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    const select = block.querySelector('.tire-specs-select');
    const label = block.querySelector('label[for]');
    expect(label.textContent).to.equal('Tire size');
    expect(label.getAttribute('for')).to.equal(select.id);
    const options = [...select.options].map((o) => o.textContent);
    expect(options).to.deep.equal(['Select a size', 'No results found']);
    expect(select.options[1].disabled, 'nothing to choose').to.be.true;
  });

  it('carries live\'s hint, with vehicle and plate as controls', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    const hint = block.querySelector('.tire-specs-help');
    expect(hint.textContent.replace(/\s+/g, ' ')).to.equal('Need Help? Find size by vehicle or plate');
    const controls = [...hint.querySelectorAll('button')];
    expect(controls.map((b) => b.textContent)).to.deep.equal(['vehicle', 'plate']);
    expect(controls.map((b) => b.dataset.tab)).to.deep.equal(['vehicle', 'plate']);
  });

  it('links where live links, by the product\'s own slug', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    const link = block.querySelector('.tire-specs-view-all');
    expect(link.textContent).to.equal('View all sizes & specs');
    expect(link.getAttribute('href')).to.equal('/tires/4x4sportcontact/specs');
  });

  it('shows no spec panel, because there is nothing to put in one', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = buildProductPage('4x4sportcontact', '4x4 SportContact');
    decorate(block);
    await empty(block);

    expect(!!block.querySelector('.tire-specs-grid')).to.be.false;
  });
});

/*
 * Live's band is the same on a product with sizes as on one without. Only the
 * picker's contents differ: 119 options against none. It says the same sentence,
 * carries the same hint and the same link, and shows NO spec table until a size
 * is chosen. Read off continentaltire.com/tires/extremecontact-dws06-plus at
 * 1440x1000 with the profile's storage cleared and the cache bypassed: 428 tall
 * with nothing chosen, 788 once 195/50 ZR 16 is picked, and the sentence stays
 * on screen either way. #314.
 */
describe("Tire specs, live's band on a product with sizes", () => {
  let fetchStub;
  afterEach(() => fetchStub?.restore());

  const page = () => buildProductPage('vikingcontact-7', 'VikingContact 7');

  it('says what live says, rather than counting the sizes', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = page();
    decorate(block);
    await filled(block);

    expect(block.querySelector('.tire-specs-status').textContent)
      .to.equal('Make a selection below to view tire specifications.');
    expect(block.textContent).to.not.contain('sizes available');
    expect(!!block.querySelector('.tire-specs-count')).to.be.false;
  });

  it('waits for the reader, showing no size nobody chose', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = page();
    decorate(block);
    await filled(block);

    const select = block.querySelector('.tire-specs-select');
    expect(select.options[0].textContent, 'what the picker reads').to.equal('Select a size');
    expect(select.value, 'nothing chosen').to.equal('');
    expect(!!block.querySelector('.tire-specs-grid'), 'a spec table').to.be.false;
  });

  it('carries live\'s hint and link here too', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = page();
    decorate(block);
    await filled(block);

    expect(block.querySelector('.tire-specs-help').textContent.replace(/\s+/g, ' '))
      .to.equal('Need Help? Find size by vehicle or plate');
    expect(block.querySelector('.tire-specs-view-all').getAttribute('href'))
      .to.equal('/tires/vikingcontact-7/specs');
  });

  it('puts the specs where live puts them, under the hint and above the link', async () => {
    fetchStub = stubFetch({ '/products.json': WORKBOOK });
    const block = page();
    decorate(block);
    await filled(block);
    choose(block, 0);

    const order = [...block.children].map((el) => el.className || el.tagName);
    expect(order).to.deep.equal([
      'H2', 'tire-specs-status', 'tire-specs-field', 'tire-specs-help',
      'tire-specs-panel', 'tire-specs-view-all',
    ]);
    expect(block.querySelector('.tire-specs-panel .tire-specs-grid')).to.exist;
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

    const opts = block.querySelectorAll('.tire-specs-select option:not([value=""])');
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

    expect(block.querySelectorAll('.tire-specs-select option:not([value=""])')).to.have.length(3);
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

    expect(block.querySelectorAll('.tire-specs-select option:not([value=""])')).to.have.length(3);
  });
});

/*
 * Live's band waits for the reader, so nothing lands in it late and it holds no
 * room for a sheet. Its own band is 428 at 1440 with nothing chosen, on a
 * product with 119 sizes and on one with none alike, and grows to 788 when a
 * size is picked. Ours used to reserve 1472, 962 and 808 for a sheet it drew
 * without being asked. Read off continentaltire.com at 1440x1000 with the
 * profile's storage cleared and the cache bypassed. #314, #232.
 */
describe('The room the band no longer holds', () => {
  let sheet;

  const band = (extra) => {
    document.body.innerHTML = `<main><div class="section"><div>
      <div class="tire-specs">
        <h2>VikingContact 7 <span>Specifications</span></h2>
        <p class="tire-specs-status">Make a selection below to view tire specifications.</p>
        <div class="tire-specs-field">
          <label class="tire-specs-label" for="s">Tire size</label>
          <select class="tire-specs-select" id="s"><option>Select a size</option></select>
        </div>
        <p class="tire-specs-help">Need Help? Find size by vehicle or plate</p>
        <div class="tire-specs-panel">${extra}</div>
        <a class="tire-specs-view-all" href="/tires/vikingcontact-7/specs">View all sizes &amp; specs</a>
      </div></div></div></main>`;
    return document.querySelector('.tire-specs');
  };

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/tire-specs/tire-specs.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.querySelector('main').remove();
    await setViewport({ width: 1440, height: 900 });
  });

  const reserved = (el) => getComputedStyle(el).minHeight;

  it('reserves nothing on a phone', async () => {
    await setViewport({ width: 375, height: 800 });
    expect(reserved(band(''))).to.equal('0px');
  });

  it('reserves nothing from 600', async () => {
    await setViewport({ width: 600, height: 800 });
    expect(reserved(band(''))).to.equal('0px');
  });

  it('reserves nothing on a desk', async () => {
    await setViewport({ width: 1200, height: 800 });
    expect(reserved(band(''))).to.equal('0px');
  });

  it('stands taller once a reader has chosen a size', async () => {
    await setViewport({ width: 1200, height: 800 });
    const empty = band('').getBoundingClientRect().height;
    const pairs = SPEC_ORDER.map((key, i) => `<dt>${key}</dt><dd>v${i}</dd>`).join('');
    const chosen = band(`<dl class="tire-specs-grid">${pairs}</dl>`).getBoundingClientRect().height;
    expect(chosen, 'the band with a spec sheet in it').to.be.above(empty);
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

  // a sheet that carries its columns and no row for this product is the
  // ordinary case for the six products live has no sizes for either
  // waits for the picker rather than for the status line: band() writes the
  // status synchronously, before the sheet has landed, so a wait on it read the
  // console before the block could have written to it and the assertion below
  // passed whatever the block did. Found by #434's connection check.
  it('draws the empty state, not an error, when the sheet is whole and the product has no rows', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
    const block = buildInSection('purecontact-ls');
    decorate(block);

    await when(() => block.querySelector('.tire-specs-select option[disabled]'));
    expect(!!document.querySelector('.tire-specs-error'), 'no authoring error').to.be.false;
    expect(errors.called, 'console.error').to.be.false;
  });
});

/*
 * #434, the same defect on this block's two failure paths. The specs sheet and
 * the legacy file both failing rendered as a product with no sizes, and six
 * real products look precisely like that. The empty picker is the right thing
 * for a reader in either case; the console is what tells the two apart.
 */
describe('Tire specs, an outage told apart from a product with no sizes', () => {
  let fetchStub;
  let errors;

  beforeEach(() => {
    errors = sinon.stub(console, 'error');
  });
  afterEach(() => {
    fetchStub?.restore();
    errors.restore();
  });

  /**
   * Waits for whichever answer the block reaches, so a run that renders the
   * authoring message fails on its assertion rather than timing out.
   */
  const settled = (block) => when(() => block.querySelector('.tire-specs-select option[disabled]')
    || block.querySelector('.tire-specs-error'));

  it('says so when neither the sheet nor the legacy file can be read', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response('', { status: 404 }));
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await settled(block);

    expect(errors.called, 'console.error').to.be.true;
    expect(String(errors.firstCall.args[0]), 'names the block and both sources')
      .to.contain('tire-specs').and.to.contain('specs sheet').and.to.contain('/product-specs.json');
  });

  it('leaves the reader the same empty picker, and no message on the page', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response('', { status: 404 }));
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await settled(block);

    const none = block.querySelector('.tire-specs-select option[disabled]');
    expect(none, 'the empty state').to.exist;
    expect(none.textContent).to.equal('No results found');
    expect(!!block.querySelector('.tire-specs-error'), 'nothing said to the reader').to.be.false;
    expect(document.querySelector('.tire-specs-wrapper'), 'the band').to.exist;
  });

  it('says so when the read throws', async () => {
    fetchStub = sinon.stub(window, 'fetch').rejects(new TypeError('Failed to fetch'));
    const block = buildInSection('vikingcontact-7');
    decorate(block);
    await settled(block);

    expect(errors.called, 'console.error').to.be.true;
    expect(String(errors.firstCall.args[0])).to.contain('could not be read');
  });

  it('still says nothing for a product the whole sheet has no rows for', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
    const block = buildInSection('purecontact-ls');
    decorate(block);
    await settled(block);

    expect(errors.called, 'console.error').to.be.false;
  });

  it('answers a failed read and a product with no sizes differently', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response('', { status: 404 }));
    const outage = buildInSection('vikingcontact-7');
    decorate(outage);
    await settled(outage);
    const onOutage = errors.callCount;

    fetchStub.restore();
    errors.resetHistory();
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
    const empty = buildInSection('purecontact-ls');
    decorate(empty);
    await settled(empty);
    const onEmpty = errors.callCount;

    expect(onOutage, 'a failed read').to.be.greaterThan(0);
    expect(onEmpty, 'a product with no sizes').to.equal(0);
  });
});
