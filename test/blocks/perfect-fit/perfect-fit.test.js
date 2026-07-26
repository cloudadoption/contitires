/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import decorate, {
  parseSize, sizeOptions, findBySize, findByVehicleClass,
} from '../../../blocks/perfect-fit/perfect-fit.js';

const PRODUCTS = {
  products: [
    {
      slug: 'sport-02', name: 'ExtremeContact Sport 02', category: 'Passenger', season: 'Summer', vehicleTypes: ['Cars', 'Sports Cars'], image: '/p/sport.png', sizes: ['225/45ZR17', '245/40ZR18'],
    },
    {
      slug: 'terrain-at', name: 'TerrainContact A/T', category: 'Light Truck/SUV', season: 'All-Season', vehicleTypes: ['SUVs', 'Light Trucks'], image: '/p/terrain.png', sizes: ['265/70R17', '245/40ZR18'],
    },
    {
      slug: 'purecontact', name: 'PureContact LS', category: 'Passenger', season: 'All-Season', vehicleTypes: ['Cars', 'Crossovers'], image: '/p/pure.png', sizes: ['225/45R17'],
    },
  ],
};

describe('perfect-fit data helpers', () => {
  it('parses a well-formed tire size', () => {
    expect(parseSize('225/45ZR17')).to.deep.equal({ width: '225', aspect: '45', rim: '17' });
    expect(parseSize('265/70R17')).to.deep.equal({ width: '265', aspect: '70', rim: '17' });
    expect(parseSize('not-a-size')).to.equal(null);
  });

  it('builds cascading size options from the catalog', () => {
    const opts = sizeOptions(PRODUCTS.products);
    expect(opts.widths).to.deep.equal(['225', '245', '265']);
    expect(opts.aspectsByWidth['245']).to.deep.equal(['40']);
    expect(opts.rimsByWidthAspect['225/45']).to.deep.equal(['17']);
  });

  it('finds every product available in a given size', () => {
    const hits = findBySize(PRODUCTS.products, { width: '245', aspect: '40', rim: '18' });
    expect(hits.map((p) => p.slug).sort()).to.deep.equal(['sport-02', 'terrain-at']);
  });

  it('finds products by vehicle class keyword', () => {
    const suv = findByVehicleClass(PRODUCTS.products, 'suv');
    expect(suv.map((p) => p.slug)).to.deep.equal(['terrain-at']);
    const car = findByVehicleClass(PRODUCTS.products, 'car');
    expect(car.map((p) => p.slug).sort()).to.deep.equal(['purecontact', 'sport-02']);
  });
});

describe('perfect-fit block', () => {
  let fetchStub;
  function build() {
    document.body.innerHTML = `
      <div class="perfect-fit block">
        <div><div><p>Find your perfect fit:</p></div></div>
        <div>
          <div><span>By Vehicle</span></div>
          <div><span>By Tire Size</span></div>
          <div><span>By Plate</span></div>
        </div>
      </div>`;
    return document.querySelector('.perfect-fit.block');
  }
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(PRODUCTS)));
  });
  afterEach(() => fetchStub.restore());

  it('injects the search icon into each item when the content has none', async () => {
    const block = build();
    await decorate(block);
    const items = block.querySelectorAll('.perfect-fit-item');
    expect(items[0].querySelector('.icon.icon-vehicle')).to.exist;
    expect(items[1].querySelector('.icon.icon-tire-size')).to.exist;
    expect(items[2].querySelector('.icon.icon-license-plate')).to.exist;
  });

  it('does not add a second icon when the content already has one', async () => {
    document.body.innerHTML = `
      <div class="perfect-fit block">
        <div><div><p>Find your perfect fit:</p></div></div>
        <div>
          <div><p><span class="icon icon-vehicle"></span>By Vehicle</p></div>
          <div><p><span class="icon icon-tire-size"></span>By Tire Size</p></div>
          <div><p><span class="icon icon-license-plate"></span>By Plate</p></div>
        </div>
      </div>`;
    const block = document.querySelector('.perfect-fit.block');
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item').forEach((item) => {
      expect(item.querySelectorAll('.icon')).to.have.length(1);
    });
  });

  it('builds three item buttons and a hidden modal', async () => {
    const block = build();
    await decorate(block);
    expect(block.querySelectorAll('.perfect-fit-item')).to.have.length(3);
    const overlay = block.querySelector('.perfect-fit-overlay');
    expect(overlay).to.exist;
    expect(overlay.hidden).to.be.true;
  });

  it('returns matching products when a tire size is searched', async () => {
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item')[1].click(); // By Tire Size

    const panel = block.querySelector('#perfect-fit-panel-tire-size');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('width', '245');
    setSelect('aspect', '40');
    setSelect('rim', '18');
    const form = panel.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const results = panel.querySelectorAll('.perfect-fit-result');
    expect(results.length).to.equal(2);
    expect(results[0].getAttribute('href')).to.match(/^\/tires\//);
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const block = build();
    await decorate(block);
    const trigger = block.querySelectorAll('.perfect-fit-item')[0];
    trigger.click();
    block.querySelector('.perfect-fit-dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(block.querySelector('.perfect-fit-overlay').hidden).to.be.true;
    expect(document.activeElement).to.equal(trigger);
  });
});

// Copy taken verbatim from live's own tire-finder components. Live renders the
// button label in sentence case and uppercases it in CSS, so the DOM text is
// "See tires that fit".
const TERMS = 'By selecting "See Tires That Fit" I confirm that I have read the '
  + 'Tire Selector Terms of Use and I accept the terms.';

describe('perfect-fit modal, rebuilt against live', () => {
  let fetchStub;
  function build(items = ['By Vehicle', 'By Tire Size', 'By Plate'], label = 'Find your perfect fit:') {
    document.body.innerHTML = `
      <div class="perfect-fit block">
        <div><div>${label ? `<p>${label}</p>` : ''}</div></div>
        <div>${items.map((item) => `<div><span>${item}</span></div>`).join('')}</div>
      </div>`;
    return document.querySelector('.perfect-fit.block');
  }
  const setField = (panel, name, value) => {
    const el = panel.querySelector(`[name="${name}"]`);
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(PRODUCTS)));
  });
  afterEach(() => fetchStub.restore());

  it('leads the vehicle form with make, then model, then year', async () => {
    const block = build();
    await decorate(block);
    const names = [...block.querySelectorAll('#perfect-fit-panel-vehicle [name]')]
      .map((el) => el.name);
    expect(names).to.deep.equal(['make', 'model', 'year']);
  });

  it('heads each panel with live\'s question', async () => {
    const block = build();
    await decorate(block);
    const heading = (id) => block.querySelector(`#perfect-fit-panel-${id} h2`).textContent;
    expect(heading('vehicle')).to.equal('What are you driving?');
    expect(heading('tire-size')).to.equal('What\'s your tire size?');
    expect(heading('plate')).to.equal('Enter your license plate.');
  });

  it('shows the terms sentence, with Terms of Use linking to the legal page', async () => {
    const block = build();
    await decorate(block);
    ['vehicle', 'tire-size', 'plate'].forEach((id) => {
      const terms = block.querySelector(`#perfect-fit-panel-${id} .perfect-fit-terms`);
      expect(terms, `${id} panel has terms`).to.exist;
      expect(terms.textContent.replace(/\s+/g, ' ').trim()).to.equal(TERMS);
      expect(terms.querySelector('a').getAttribute('href')).to.equal('/legal');
      expect(terms.querySelector('a').textContent).to.equal('Terms of Use');
    });
  });

  it('labels the call to action the way live does', async () => {
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-search').forEach((button) => {
      expect(button.textContent).to.equal('See tires that fit');
    });
  });

  it('keeps the vehicle call to action disabled until every field has a value', async () => {
    const block = build();
    await decorate(block);
    const panel = block.querySelector('#perfect-fit-panel-vehicle');
    const button = panel.querySelector('.perfect-fit-search');
    expect(button.disabled, 'disabled before any choice').to.be.true;
    setField(panel, 'make', 'Toyota');
    expect(button.disabled, 'still disabled after make').to.be.true;
    setField(panel, 'model', 'Camry');
    expect(button.disabled, 'still disabled after model').to.be.true;
    setField(panel, 'year', '2024');
    expect(button.disabled, 'enabled once year lands').to.be.false;
  });

  it('keeps the tire size call to action disabled until the size is complete', async () => {
    const block = build();
    await decorate(block);
    const panel = block.querySelector('#perfect-fit-panel-tire-size');
    const button = panel.querySelector('.perfect-fit-search');
    expect(button.disabled).to.be.true;
    setField(panel, 'width', '245');
    setField(panel, 'aspect', '40');
    expect(button.disabled, 'still disabled without a rim').to.be.true;
    setField(panel, 'rim', '18');
    expect(button.disabled).to.be.false;
  });

  it('keeps the plate call to action disabled until plate and state are given', async () => {
    const block = build();
    await decorate(block);
    const panel = block.querySelector('#perfect-fit-panel-plate');
    const button = panel.querySelector('.perfect-fit-search');
    expect(button.disabled).to.be.true;
    setField(panel, 'plate', 'ABC1234');
    expect(button.disabled, 'still disabled without a state').to.be.true;
    setField(panel, 'state', 'Texas');
    expect(button.disabled).to.be.false;
  });

  it('names the dialog after the panel on show', async () => {
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item')[1].click();
    const dialog = block.querySelector('.perfect-fit-dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(block.querySelector(`#${labelledBy}`).textContent).to.equal('What\'s your tire size?');
  });

  it('opens on the vehicle tab when the bar is authored as a single item', async () => {
    const block = build(['Find your perfect fit'], '');
    await decorate(block);
    const items = block.querySelectorAll('.perfect-fit-item');
    expect(items).to.have.length(1);
    expect(block.querySelector('.perfect-fit-label')).to.not.exist;
    items[0].click();
    expect(block.querySelector('.perfect-fit-overlay').hidden).to.be.false;
    expect(block.querySelector('#perfect-fit-panel-vehicle').hidden).to.be.false;
  });
});

// The DA sheet serves /products.json as a multi-sheet workbook: the product
// rows live under products.data, with array fields flattened to comma strings.
const WORKBOOK = {
  ':version': 3,
  ':type': 'multi-sheet',
  ':names': ['products', 'specs'],
  products: {
    total: 1,
    offset: 0,
    limit: 1,
    data: [
      {
        slug: 'pure-ls', name: 'PureContact LS', category: 'Passenger', season: 'All-Season', image: '/p/pure.png', sizes: '195/65R15, 205/55R16', vehicleTypes: 'Cars, Crossovers',
      },
    ],
  },
  specs: {
    total: 0, offset: 0, limit: 0, data: [],
  },
};

describe('perfect-fit block, multi-sheet workbook', () => {
  let fetchStub;
  function build() {
    document.body.innerHTML = `
      <div class="perfect-fit block">
        <div><div><p>Find your perfect fit:</p></div></div>
        <div>
          <div><span>By Vehicle</span></div>
          <div><span>By Tire Size</span></div>
          <div><span>By Plate</span></div>
        </div>
      </div>`;
    return document.querySelector('.perfect-fit.block');
  }
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
  });
  afterEach(() => fetchStub.restore());

  it('reads products.data and splits comma-delimited sizes into an array', async () => {
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item')[1].click(); // By Tire Size

    const panel = block.querySelector('#perfect-fit-panel-tire-size');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('width', '195');
    setSelect('aspect', '65');
    setSelect('rim', '15');
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const results = panel.querySelectorAll('.perfect-fit-result');
    expect(results.length).to.equal(1);
    expect(results[0].getAttribute('href')).to.equal('/tires/pure-ls');
  });

  it('splits comma-delimited vehicleTypes so the vehicle finder matches', async () => {
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item')[0].click(); // By Vehicle

    const panel = block.querySelector('#perfect-fit-panel-vehicle');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('make', 'Toyota');
    setSelect('model', 'Camry'); // maps to the "car" class
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const results = panel.querySelectorAll('.perfect-fit-result');
    expect(results.length).to.equal(1);
    expect(results[0].getAttribute('href')).to.equal('/tires/pure-ls');
  });
});

describe('perfect-fit block, single-sheet request', () => {
  let fetchStub;
  function build() {
    document.body.innerHTML = `
      <div class="perfect-fit block">
        <div><div><p>Find your perfect fit:</p></div></div>
        <div>
          <div><span>By Vehicle</span></div>
          <div><span>By Tire Size</span></div>
          <div><span>By Plate</span></div>
        </div>
      </div>`;
    return document.querySelector('.perfect-fit.block');
  }
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });
  afterEach(() => fetchStub.restore());

  // the workbook carries a 1315-row specs sheet the finder never reads, so ask
  // the sheet API for the products sheet alone
  it('asks for the products sheet, not the whole workbook', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK)));
    await decorate(build());
    expect(fetchStub.firstCall.args[0]).to.equal('/products.json?sheet=products');
  });

  it('reads the rows a single-sheet response puts at data', async () => {
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(WORKBOOK.products)));
    const block = build();
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item')[1].click(); // By Tire Size

    const panel = block.querySelector('#perfect-fit-panel-tire-size');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('width', '195');
    setSelect('aspect', '65');
    setSelect('rim', '15');
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const results = panel.querySelectorAll('.perfect-fit-result');
    expect(results.length).to.equal(1);
    expect(results[0].getAttribute('href')).to.equal('/tires/pure-ls');
  });
});
