/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, { parseSize, sizeOptions, findBySize } from '../../../blocks/perfect-fit/perfect-fit.js';

/*
 * The size cascade rejects every size that does not start with three digits, so
 * 82 of our 472 distinct sizes never reach it and three products can never be
 * found by size. Issue #495.
 *
 * Live's vocabulary, read from its own endpoint and bundle on 2026-08-02:
 *
 *   LT  a width of its own. LT265 offers 2 ratios where 265 offers 10, and
 *       LT265/70 offers 2 diameters where 265/70 offers 3. Our 8 LT widths are
 *       live's 8, set for set.
 *   P   an alias. P265 answers identically to 265 and P265/70 to 265/70.
 *   C   folds. 195/75, 215/75 and 285/65 each offer one diameter, "16 in", and
 *       the C appears nowhere in the cascade.
 *   HL  a width of its own in live's data, and its control offers none.
 *   T   a width of its own in live's data, and its control offers none.
 *       T155/70 has two diameters where 155/70 has none, which is what tells
 *       it from an alias; the ratio lists agree one level up.
 *
 * Live's own Width field is `pattern: "[LTlt0-9]", max: 5`, so LT plus three
 * digits is the longest thing a reader can type and P, H and C cannot be typed
 * at all. Its rendered listbox holds 29 options, 21 bare ascending then 8 LT
 * ascending, first LT at index 21.
 *
 * So HL and T keep returning null: offering two width groups live does not show
 * is a difference a viewer sees, which guardrail 0 counts as the regression.
 */

const PRODUCTS = {
  products: [
    {
      slug: 'terrain-lt', name: 'TerrainContact A/T', category: 'Light Truck/SUV', season: 'All-Season', vehicleTypes: ['Light Trucks'], image: '/p/t.png', sizes: ['LT265/70R17', '215/55R18'],
    },
    {
      slug: 'tourer', name: 'ProContact TX', category: 'Passenger', season: 'All-Season', vehicleTypes: ['Cars'], image: '/p/p.png', sizes: ['265/70R17', 'P215/55R18'],
    },
    {
      slug: 'van-winter', name: 'VanContact Winter', category: 'Van', season: 'Winter', vehicleTypes: ['Vans'], image: '/p/v.png', sizes: ['205/75R16C'],
    },
    {
      slug: 'heavy', name: 'WinterContact TS 860 S', category: 'Passenger', season: 'Winter', vehicleTypes: ['Cars'], image: '/p/h.png', sizes: ['HL265/45R20'],
    },
    {
      slug: 'spare', name: 'sContact', category: 'Spare', season: 'All-Season', vehicleTypes: ['Cars'], image: '/p/s.png', sizes: ['T155/70R19'],
    },
  ],
};

const SPEC_SHEET = {
  data: PRODUCTS.products.flatMap((product) => product.sizes.map((size) => ({
    slug: product.slug,
    // the sheet spaces a size out where the products cell does not, and
    // sizeKey folds the two spellings together before the parser sees them
    size: size.replace(/^([A-Z]*\d{3})\/(\d{2})(Z?R)(\d{2})([A-Z]*)$/, '$1/$2 $3 $4$5'),
    'Load Index': '95',
  }))),
};

const CATALOGUE = { products: PRODUCTS, specs: SPEC_SHEET };

function stubSheets(sheets) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const name = new URL(String(url), 'https://x').searchParams.get('sheet');
    return Promise.resolve(new Response(JSON.stringify(sheets[name] || { data: [] })));
  });
}

function when(check, what = 'the page to come round') {
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
        <div>${['By Vehicle', 'By Tire Size', 'By Plate'].map((i) => `<div><span>${i}</span></div>`).join('')}</div>
      </div>
    </div></div></main>`;
  return document.querySelector('.perfect-fit.block');
}

const sizePanel = () => document.querySelector('#perfect-fit-panel-tire-size');

async function openFinder() {
  const block = buildBar();
  await decorate(block);
  block.querySelectorAll('.perfect-fit-item')[1].click();
  await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
  return block;
}

function setField(name, value) {
  const field = sizePanel().querySelector(`[name=${name}]`);
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

const optionsOf = (name) => [...sizePanel().querySelectorAll(`[name=${name}] option`)]
  .map((o) => o.value).filter(Boolean);

const resultSlugs = () => [...sizePanel().querySelectorAll('.perfect-fit-result')]
  .map((a) => a.getAttribute('href').replace('/tires/', ''));

describe('Perfect fit, the sizes live searches that this parser dropped', () => {
  it('reads an LT size, keeping the prefix as the width live keeps', () => {
    expect(parseSize('LT265/70R17')).to.deep.equal({ width: 'LT265', aspect: '70', rim: '17' });
  });

  it('folds a P size onto the bare width, as live does', () => {
    expect(parseSize('P215/55R18')).to.deep.equal({ width: '215', aspect: '55', rim: '18' });
  });

  it('drops the C off a van size, which live does not carry either', () => {
    expect(parseSize('205/75R16C')).to.deep.equal({ width: '205', aspect: '75', rim: '16' });
  });

  it('still reads the sizes it always read', () => {
    expect(parseSize('225/45ZR17')).to.deep.equal({ width: '225', aspect: '45', rim: '17' });
    expect(parseSize('265/70R17')).to.deep.equal({ width: '265', aspect: '70', rim: '17' });
    expect(parseSize('not-a-size')).to.equal(null);
  });

  it('reads no HL size, because live\'s control offers no HL width', () => {
    expect(parseSize('HL265/45R20')).to.equal(null);
  });

  it('reads no T size, because live\'s control offers no T width', () => {
    expect(parseSize('T155/70R19')).to.equal(null);
  });
});

describe('Perfect fit, the width list against live\'s 29', () => {
  it('sets the LT widths after the bare ones, each group ascending', () => {
    const opts = sizeOptions(PRODUCTS.products);
    expect(opts.widths).to.eql(['205', '215', '265', 'LT265']);
  });

  it('keeps an LT width\'s own ratios apart from the bare width of the same number', () => {
    const opts = sizeOptions(PRODUCTS.products);
    expect(opts.aspectsByWidth['265'], 'the bare 265').to.eql(['70']);
    expect(opts.aspectsByWidth.LT265, 'LT265, which live gives its own list').to.eql(['70']);
    expect(opts.rimsByWidthAspect['LT265/70']).to.eql(['17']);
  });

  it('finds the LT product by its LT size and not by the bare one', () => {
    const lt = findBySize(PRODUCTS.products, { width: 'LT265', aspect: '70', rim: '17' });
    expect(lt.map((p) => p.slug)).to.eql(['terrain-lt']);
    const bare = findBySize(PRODUCTS.products, { width: '265', aspect: '70', rim: '17' });
    expect(bare.map((p) => p.slug)).to.eql(['tourer']);
  });

  it('finds the van tire by the bare form of its C size', () => {
    const hits = findBySize(PRODUCTS.products, { width: '205', aspect: '75', rim: '16' });
    expect(hits.map((p) => p.slug)).to.eql(['van-winter']);
  });

  it('offers no width for a product whose sizes live cannot express', () => {
    const opts = sizeOptions(PRODUCTS.products);
    expect(opts.widths.some((w) => /^HL/.test(w)), 'an HL width').to.be.false;
    expect(opts.widths.some((w) => /^T\d/.test(w)), 'a T width').to.be.false;
  });
});

describe('Perfect fit, the size tab offers the widths a reader can pick', () => {
  let fetchStub;

  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets(CATALOGUE);
  });

  afterEach(() => {
    fetchStub.restore();
    document.body.innerHTML = '';
  });

  it('lists the LT width in the control, after the bare ones', async () => {
    await openFinder();
    expect(optionsOf('width')).to.eql(['205', '215', '265', 'LT265']);
  });

  it('walks an LT width down to its own diameter', async () => {
    await openFinder();
    setField('width', 'LT265');
    expect(optionsOf('aspect'), 'the ratios LT265 opens').to.eql(['70']);
    setField('aspect', '70');
    expect(optionsOf('rim'), 'the diameters LT265/70 opens').to.eql(['17']);
  });

  it('returns the van tire from a search a reader can actually run', async () => {
    await openFinder();
    setField('width', '205');
    setField('aspect', '75');
    setField('rim', '16');
    sizePanel().querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(resultSlugs()).to.eql(['van-winter']);
  });
});
