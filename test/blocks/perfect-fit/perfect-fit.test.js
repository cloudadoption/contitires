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
    fetchStub = sinon.stub(window, 'fetch').resolves(new Response(JSON.stringify(PRODUCTS)));
  });
  afterEach(() => fetchStub.restore());

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
