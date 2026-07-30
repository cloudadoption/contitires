/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate, {
  parseSize, sizeOptions, findBySize, findByVehicleClass, openTireFinder,
} from '../../../blocks/perfect-fit/perfect-fit.js';

const PRODUCTS = {
  products: [
    {
      slug: 'sport-02', name: 'ExtremeContact Sport02', nameHtml: 'ExtremeContact Sport<sup>02</sup>', category: 'Passenger', season: 'Summer', vehicleTypes: ['Cars', 'Sports Cars'], image: '/p/sport.png', sizes: ['225/45ZR17', '245/40ZR18'],
    },
    {
      slug: 'terrain-at', name: 'TerrainContact A/T', category: 'Light Truck/SUV', season: 'All-Season', vehicleTypes: ['SUVs', 'Light Trucks'], image: '/p/terrain.png', sizes: ['265/70R17', '245/40ZR18'],
    },
    {
      slug: 'purecontact', name: 'PureContact LS', category: 'Passenger', season: 'All-Season', vehicleTypes: ['Cars', 'Crossovers'], image: '/p/pure.png', sizes: ['225/45R17'],
    },
  ],
};

/*
 * The specs sheet those products come with. It is derived from their sizes the
 * way the workbook's own sizes cell is derived from the sheet, so one place
 * writes a size and the assertions below hold whichever sheet the finder reads.
 * The sheet spaces a size out where the cell does not.
 */
const SPEC_SHEET = {
  data: PRODUCTS.products.flatMap((product) => product.sizes.map((size) => ({
    slug: product.slug,
    size: size.replace(/^(\d{3})\/(\d{2})(Z?R)(\d{2})$/, '$1/$2 $3 $4'),
    'Load Index': '95',
  }))),
};

/**
 * A fetch stub that answers a sheet request with that sheet, building a fresh
 * Response every call. The finder reads two sheets and a Response body can only
 * be read once, so one shared Response answers the second read with nothing.
 * @param {Object} sheets sheet name to the body that request answers with
 */
function stubSheets(sheets) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const name = new URL(String(url), 'https://x').searchParams.get('sheet');
    const body = sheets[name] || { data: [] };
    return Promise.resolve(new Response(JSON.stringify(body)));
  });
}

/** The workbook the three products above make. */
const CATALOGUE = { products: PRODUCTS, specs: SPEC_SHEET };

/**
 * Waits for what a click brings about. The modal is built on the first one, so
 * it arrives after the handler has read the catalogue, and a mutation observer
 * reports that without a timer, which the test runner throttles on the pages it
 * backgrounds.
 * @param {Function} check reads the page, returning what the caller waits for
 */
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

/**
 * The bar in the section and wrapper the page decoration puts it in. The modal
 * is hosted in a section of its own, so the fixture needs the main around it.
 */
function buildBar(items = ['By Vehicle', 'By Tire Size', 'By Plate'], label = 'Find your perfect fit:') {
  document.body.innerHTML = `
    <main><div class="section perfect-fit-container"><div class="perfect-fit-wrapper">
      <div class="perfect-fit block">
        <div><div>${label ? `<p>${label}</p>` : ''}</div></div>
        <div>${items.map((item) => `<div><span>${item}</span></div>`).join('')}</div>
      </div>
    </div></div></main>`;
  return document.querySelector('.perfect-fit.block');
}

/** Opens the finder from a bar item, and waits for the modal the click builds. */
async function openFrom(block, index = 0) {
  block.querySelectorAll('.perfect-fit-item')[index].click();
  return when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
}

/** The panel of one tab, wherever the modal is hosted. */
const panelOf = (id) => document.querySelector(`#perfect-fit-panel-${id}`);

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

/*
 * The bar is the third section of the homepage, and loadSections reaches the
 * six under it only once this block returns: loadSection awaits every block in
 * turn and leaves the sections below at display none meanwhile. The catalogue
 * is only read to fill the modal, and the modal only opens on a click, so both
 * wait for one. Issue #111.
 */
describe('perfect-fit bar, the catalogue it does not read', () => {
  let fetchStub;
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets(CATALOGUE);
  });
  afterEach(() => fetchStub.restore());

  it('reads no catalogue while decorating', async () => {
    await decorate(buildBar());
    expect(fetchStub.called).to.be.false;
  });

  it('builds no modal while decorating', async () => {
    await decorate(buildBar());
    expect(document.querySelector('.perfect-fit-overlay')).to.not.exist;
  });

  it('reads the catalogue on the first click', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1);
    // the two sheets the catalogue is made of
    expect(fetchStub.callCount).to.equal(2);
  });

  it('reads it once, however often the bar is clicked', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 0);
    const read = fetchStub.callCount;
    await openFrom(block, 1);
    expect(fetchStub.callCount, 'reads on the second click').to.equal(read);
    expect(document.querySelectorAll('.perfect-fit-overlay')).to.have.length(1);
  });
});

describe('perfect-fit block', () => {
  let fetchStub;
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets(CATALOGUE);
  });
  afterEach(() => fetchStub.restore());

  it('injects the search icon into each item when the content has none', async () => {
    const block = buildBar();
    await decorate(block);
    const items = block.querySelectorAll('.perfect-fit-item');
    expect(items[0].querySelector('.icon.icon-vehicle')).to.exist;
    expect(items[1].querySelector('.icon.icon-tire-size')).to.exist;
    expect(items[2].querySelector('.icon.icon-license-plate')).to.exist;
  });

  it('does not add a second icon when the content already has one', async () => {
    const block = buildBar([
      '<p><span class="icon icon-vehicle"></span>By Vehicle</p>',
      '<p><span class="icon icon-tire-size"></span>By Tire Size</p>',
      '<p><span class="icon icon-license-plate"></span>By Plate</p>',
    ]);
    await decorate(block);
    block.querySelectorAll('.perfect-fit-item').forEach((item) => {
      expect(item.querySelectorAll('.icon')).to.have.length(1);
    });
  });

  it('builds three item buttons', async () => {
    const block = buildBar();
    await decorate(block);
    expect(block.querySelectorAll('.perfect-fit-item')).to.have.length(3);
  });

  it('opens the modal on the tab the item names', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 2);
    expect(panelOf('plate').hidden).to.be.false;
    expect(panelOf('vehicle').hidden).to.be.true;
  });

  it('returns matching products when a tire size is searched', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1); // By Tire Size

    const panel = panelOf('tire-size');
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

  /*
   * The finder printed its result headings as textContent off the products
   * sheet's name cell, which holds no markup, so it was the one result surface
   * that could not carry live's mark. The sheet gains a nameHtml cell and the
   * heading renders it through the shared sanitiser. Issue #238.
   */
  it('sets the mark on a result heading live superscripts', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1); // By Tire Size

    const panel = panelOf('tire-size');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('width', '225');
    setSelect('aspect', '45');
    setSelect('rim', '17');
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const heading = panel.querySelector('.perfect-fit-result h3');
    const mark = heading.querySelector('sup');
    expect(mark, 'the result heading carries the mark').to.exist;
    expect(mark.textContent).to.equal('02');
    expect(heading.textContent).to.equal('ExtremeContact Sport02');
  });

  it('reads a product with no nameHtml cell as its plain name', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1);

    const panel = panelOf('tire-size');
    const setSelect = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    setSelect('width', '265');
    setSelect('aspect', '70');
    setSelect('rim', '17');
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const heading = panel.querySelector('.perfect-fit-result h3');
    expect(heading.textContent).to.equal('TerrainContact A/T');
    expect(heading.querySelectorAll('sup').length, 'no mark invented').to.equal(0);
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const block = buildBar();
    await decorate(block);
    const trigger = block.querySelectorAll('.perfect-fit-item')[0];
    const overlay = await openFrom(block, 0);
    document.querySelector('.perfect-fit-dialog').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(overlay.hidden).to.be.true;
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
  const setField = (panel, name, value) => {
    const el = panel.querySelector(`[name="${name}"]`);
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  /** A decorated bar with its modal open, since the click is what builds it. */
  async function open(index = 0) {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, index);
    return block;
  }
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets(CATALOGUE);
  });
  afterEach(() => fetchStub.restore());

  it('leads the vehicle form with make, then model, then year', async () => {
    await open();
    const names = [...panelOf('vehicle').querySelectorAll('[name]')].map((el) => el.name);
    expect(names).to.deep.equal(['make', 'model', 'year']);
  });

  it('heads each panel with live\'s question', async () => {
    await open();
    const heading = (id) => panelOf(id).querySelector('h2').textContent;
    expect(heading('vehicle')).to.equal('What are you driving?');
    expect(heading('tire-size')).to.equal('What\'s your tire size?');
    expect(heading('plate')).to.equal('Enter your license plate.');
  });

  it('shows the terms sentence, with Terms of Use linking to the legal page', async () => {
    await open();
    ['vehicle', 'tire-size', 'plate'].forEach((id) => {
      const terms = panelOf(id).querySelector('.perfect-fit-terms');
      expect(terms, `${id} panel has terms`).to.exist;
      expect(terms.textContent.replace(/\s+/g, ' ').trim()).to.equal(TERMS);
      expect(terms.querySelector('a').getAttribute('href')).to.equal('/legal');
      expect(terms.querySelector('a').textContent).to.equal('Terms of Use');
    });
  });

  it('labels the call to action the way live does', async () => {
    await open();
    document.querySelectorAll('.perfect-fit-search').forEach((button) => {
      expect(button.textContent).to.equal('See tires that fit');
    });
  });

  it('keeps the vehicle call to action disabled until every field has a value', async () => {
    await open();
    const panel = panelOf('vehicle');
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
    await open(1);
    const panel = panelOf('tire-size');
    const button = panel.querySelector('.perfect-fit-search');
    expect(button.disabled).to.be.true;
    setField(panel, 'width', '245');
    setField(panel, 'aspect', '40');
    expect(button.disabled, 'still disabled without a rim').to.be.true;
    setField(panel, 'rim', '18');
    expect(button.disabled).to.be.false;
  });

  it('keeps the plate call to action disabled until plate and state are given', async () => {
    await open(2);
    const panel = panelOf('plate');
    const button = panel.querySelector('.perfect-fit-search');
    expect(button.disabled).to.be.true;
    setField(panel, 'plate', 'ABC1234');
    expect(button.disabled, 'still disabled without a state').to.be.true;
    setField(panel, 'state', 'Texas');
    expect(button.disabled).to.be.false;
  });

  it('floats the field name above the control once it holds a value', async () => {
    await open();
    const panel = panelOf('vehicle');
    const wrapper = panel.querySelector('[name="make"]').closest('.perfect-fit-field');
    expect(wrapper.classList.contains('perfect-fit-field-filled'), 'empty').to.be.false;
    setField(panel, 'make', 'Toyota');
    expect(wrapper.classList.contains('perfect-fit-field-filled'), 'filled').to.be.true;
  });

  it('takes the floated name away when the cascade clears the field below', async () => {
    await open();
    const panel = panelOf('vehicle');
    const model = panel.querySelector('[name="model"]').closest('.perfect-fit-field');
    setField(panel, 'make', 'Toyota');
    setField(panel, 'model', 'Camry');
    expect(model.classList.contains('perfect-fit-field-filled')).to.be.true;
    setField(panel, 'make', 'Ford');
    expect(model.classList.contains('perfect-fit-field-filled'), 'cleared with the make').to.be.false;
  });

  it('names the dialog after the panel on show', async () => {
    await open(1);
    const dialog = document.querySelector('.perfect-fit-dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(document.querySelector(`#${labelledBy}`).textContent).to.equal('What\'s your tire size?');
  });

  it('puts focus on the dialog rather than into the first field', async () => {
    await open();
    const dialog = document.querySelector('.perfect-fit-dialog');
    expect(dialog.getAttribute('tabindex')).to.equal('-1');
    expect(document.activeElement).to.equal(dialog);
  });

  it('opens on the vehicle tab when the bar is authored as a single item', async () => {
    const block = buildBar(['Find your perfect fit'], '');
    await decorate(block);
    const items = block.querySelectorAll('.perfect-fit-item');
    expect(items).to.have.length(1);
    expect(block.querySelector('.perfect-fit-label')).to.not.exist;
    await openFrom(block, 0);
    expect(panelOf('vehicle').hidden).to.be.false;
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
    total: 2,
    offset: 0,
    limit: 2,
    data: [
      { slug: 'pure-ls', size: '195/65 R 15', 'Load Index': '91' },
      { slug: 'pure-ls', size: '205/55 R 16', 'Load Index': '94' },
    ],
  },
};

describe('perfect-fit block, multi-sheet workbook', () => {
  let fetchStub;
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets({ products: WORKBOOK, specs: WORKBOOK });
  });
  afterEach(() => fetchStub.restore());

  it('reads products.data and splits comma-delimited sizes into an array', async () => {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1); // By Tire Size

    const panel = panelOf('tire-size');
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
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 0); // By Vehicle

    const panel = panelOf('vehicle');
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
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });
  afterEach(() => fetchStub.restore());

  // the workbook's third sheet, catalog, belongs to the listing, so ask for the
  // two sheets the finder reads by name rather than for the whole workbook
  it('asks for its two sheets by name, not for the whole workbook', async () => {
    fetchStub = stubSheets({ products: WORKBOOK, specs: WORKBOOK });
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 0);
    const asked = fetchStub.getCalls().map((call) => String(call.args[0]));
    expect(asked).to.have.lengthOf(2);
    expect(asked[0]).to.equal('/products.json?sheet=products');
    expect(asked[1]).to.equal('/products.json?sheet=specs&limit=10000');
  });

  it('reads the rows a single-sheet response puts at data', async () => {
    fetchStub = stubSheets({ products: WORKBOOK.products, specs: WORKBOOK.specs });
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1); // By Tire Size

    const panel = panelOf('tire-size');
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

// The header, the footer and the product pages offer the finder on pages that
// carry no perfect-fit bar, so the modal has to open without a block.
describe('perfect-fit modal, opened without a block', () => {
  let fetchStub;
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    document.body.innerHTML = '<main><div class="section"><p>a page with no bar</p></div></main>';
    fetchStub = stubSheets(CATALOGUE);
  });
  afterEach(() => fetchStub.restore());

  it('opens on the requested tab', async () => {
    await openTireFinder('plate');
    const overlay = document.querySelector('.perfect-fit-overlay');
    expect(overlay).to.exist;
    expect(overlay.hidden).to.be.false;
    expect(panelOf('plate').hidden).to.be.false;
    expect(panelOf('vehicle').hidden).to.be.true;
  });

  // #149 anchored two of its fixes on `main .section`, so the modal has to stay
  // inside a section rather than hang off the body
  it('hosts the modal inside main, where the block styles reach it', async () => {
    await openTireFinder('vehicle');
    const overlay = document.querySelector('.perfect-fit-overlay');
    expect(overlay.closest('main .section')).to.exist;
  });

  // `main > .section > div` caps a section's first level at the content width
  // and pads it, which boxed the overlay at 1264 of 1440 and let the page show
  // down both sides
  it('keeps the overlay clear of the section content width', async () => {
    await openTireFinder('vehicle');
    const overlay = document.querySelector('.perfect-fit-overlay');
    expect(overlay.parentElement.classList.contains('section')).to.be.false;
    expect(overlay.closest('.section').firstElementChild)
      .to.not.equal(overlay);
  });

  it('builds one modal however often it is opened', async () => {
    await openTireFinder('vehicle');
    await openTireFinder('tire-size');
    expect(document.querySelectorAll('.perfect-fit-overlay')).to.have.length(1);
    expect(panelOf('tire-size').hidden).to.be.false;
  });

  it('returns focus to the control that opened it', async () => {
    const trigger = document.createElement('button');
    document.querySelector('main .section').append(trigger);
    await openTireFinder('vehicle', trigger);
    document.querySelector('.perfect-fit-close').click();
    expect(document.activeElement).to.equal(trigger);
  });

  it('loads the block stylesheet, which no other block on the page pulls in', async () => {
    await openTireFinder('vehicle');
    expect(document.querySelector('head > link[href$="/blocks/perfect-fit/perfect-fit.css"]')).to.exist;
  });
});

describe('perfect-fit card, the product hero variant', () => {
  let fetchStub;
  function build(heading = 'Does this tire fit? Check now:') {
    document.body.innerHTML = `
      <main><div class="section"><div class="perfect-fit-wrapper">
        <div class="perfect-fit card block">
          <div><div><p>${heading}</p></div></div>
        </div>
      </div></div></main>`;
    return document.querySelector('.perfect-fit.card');
  }
  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    fetchStub = stubSheets(CATALOGUE);
  });
  afterEach(() => fetchStub.restore());

  it('heads the card with the authored question', async () => {
    const block = build();
    await decorate(block);
    const heading = block.querySelector('.perfect-fit-card-heading');
    expect(heading).to.exist;
    expect(heading.textContent).to.equal('Does this tire fit? Check now:');
  });

  it('offers all three searches, as buttons', async () => {
    const block = build();
    await decorate(block);
    const items = [...block.querySelectorAll('.perfect-fit-item')];
    expect(items.map((i) => i.tagName)).to.eql(['BUTTON', 'BUTTON', 'BUTTON']);
    expect(items.map((i) => i.dataset.tireFinder)).to.eql(['vehicle', 'tire-size', 'plate']);
    expect(items.map((i) => i.textContent.trim())).to.eql(['By Vehicle', 'By Tire Size', 'By Plate']);
  });

  it('gives each search its icon', async () => {
    const block = build();
    await decorate(block);
    const items = [...block.querySelectorAll('.perfect-fit-item')];
    expect(items[0].querySelector('.icon-vehicle')).to.exist;
    expect(items[1].querySelector('.icon-tire-size')).to.exist;
    expect(items[2].querySelector('.icon-license-plate')).to.exist;
  });

  // the card renders in the hero, so it is in the eager phase of every product
  // page. The modal and the catalogue behind it wait for a click.
  it('reads no catalogue and builds no modal', async () => {
    const block = build();
    await decorate(block);
    expect(fetchStub.called).to.be.false;
    expect(block.querySelector('.perfect-fit-overlay')).to.not.exist;
  });
});

// Live's finder bar puts the icon left of the label in one row from 769 up,
// alongside its heading, and stacks icon over label below that with all three
// items still on one row. Measured on continentaltire.com at 768 and 769. We
// open the bar at the project's 900 band, so the row starts there. #113.
describe('Perfect fit bar, live\'s two rows', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/perfect-fit/perfect-fit.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  it('stacks the icon over its label on a narrow screen', () => {
    expect(value('.perfect-fit-item', 'flex-direction')).to.equal('column');
  });

  it('keeps all three items on one row at 375', () => {
    expect(value('.perfect-fit-items', 'flex-wrap')).to.equal('nowrap');
  });

  it('sets the icon beside its label from 900 up', () => {
    expect(value('.perfect-fit-item', 'flex-direction', '900px')).to.equal('row');
    expect(value('.perfect-fit-item', 'align-items', '900px')).to.equal('center');
  });
});

/**
 * Live opens the bar at 769: the heading moves beside the three items and each
 * item sets its icon beside its label, which takes the bar from 124px tall to
 * 56. Read off continentaltire.com at 768 and 769.
 *
 * Ours opened the bar at 700 and its items at 769, so from 700 to 768 it ran a
 * row of stacked items, which live never draws. Both open at 900 now, the
 * project's band, and live's bar from 769 to 899 is what we give up. #113.
 */
describe('Perfect fit, where the bar opens out', () => {
  let sheet;
  let block;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/perfect-fit/perfect-fit.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    block = buildBar();
    decorate(block);
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.replaceChildren();
    await setViewport({ width: 1440, height: 900 });
  });

  const dir = (sel) => getComputedStyle(document.querySelector(sel)).flexDirection;

  it('stacks the bar and its items at 899', async () => {
    await setViewport({ width: 899, height: 900 });
    expect(dir('.perfect-fit'), 'the bar').to.equal('column');
    expect(dir('.perfect-fit-item'), 'an item').to.equal('column');
  });

  it('sets the heading and the icons on their rows from 900', async () => {
    await setViewport({ width: 900, height: 900 });
    expect(dir('.perfect-fit'), 'the bar').to.equal('row');
    expect(dir('.perfect-fit-item'), 'an item').to.equal('row');
  });
});

// #122: sizes were held twice, as a comma-joined products.sizes cell and as the
// specs sheet. The finder read the cell, the product page read the sheet, and an
// edit to one left the other saying something else. The sheet is the one source
// now and the cell is derived from it.
describe('The finder reads its sizes from the specs sheet', () => {
  let fetchStub;
  let warns;

  // products.sizes disagrees with the sheet three ways at once: it is short of
  // one size the sheet carries, it carries one the sheet does not, and one
  // product has no rows in the sheet at all
  const DISAGREEING = {
    products: {
      total: 2,
      offset: 0,
      limit: 2,
      data: [
        {
          slug: 'viking-7', name: 'VikingContact 7', category: 'Passenger', season: 'Winter', image: '/p/v.png', vehicleTypes: 'Cars', sizes: '205/55R16, 275/45R22',
        },
        {
          slug: 'pure-ls', name: 'PureContact LS', category: 'Passenger', season: 'All-Season', image: '/p/p.png', vehicleTypes: 'Cars', sizes: '225/45R17',
        },
      ],
    },
    specs: {
      total: 2,
      offset: 0,
      limit: 2,
      data: [
        { slug: 'viking-7', size: '205/55 R 16', 'Load Index': '91' },
        { slug: 'viking-7', size: '245/40 ZR 18', 'Load Index': '97' },
      ],
    },
  };

  /** Runs one width/aspect/rim search and returns the hrefs it lists. */
  async function search(width, aspect, rim) {
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1); // By Tire Size
    const panel = panelOf('tire-size');
    const set = (name, value) => {
      const el = panel.querySelector(`[name="${name}"]`);
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('width', width);
    set('aspect', aspect);
    set('rim', rim);
    panel.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return [...panel.querySelectorAll('.perfect-fit-result')].map((a) => a.getAttribute('href'));
  }

  beforeEach(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    warns = sinon.stub(console, 'warn');
  });
  afterEach(() => {
    fetchStub.restore();
    warns.restore();
  });

  it('asks for the whole specs sheet, past the row the API pages at', async () => {
    fetchStub = stubSheets(DISAGREEING);
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 0);
    const asked = fetchStub.getCalls().map((call) => String(call.args[0]));
    expect(asked.some((url) => url.includes('sheet=specs') && url.includes('limit=10000'))).to.be.true;
  });

  it('finds a product by a size only the sheet carries', async () => {
    fetchStub = stubSheets(DISAGREEING);
    // 245/40ZR18 is in the specs sheet and not in products.sizes
    expect(await search('245', '40', '18')).to.deep.equal(['/tires/viking-7']);
  });

  it('does not offer a size the sheet has no row for', async () => {
    fetchStub = stubSheets(DISAGREEING);
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 1);
    const widths = [...panelOf('tire-size').querySelectorAll('[name="width"] option')]
      .map((o) => o.value).filter(Boolean);
    // 275/45R22 is in products.sizes and not in the sheet
    expect(widths).to.not.include('275');
    expect(widths).to.deep.equal(['205', '245']);
  });

  it('offers nothing for a product the sheet has no rows for', async () => {
    fetchStub = stubSheets(DISAGREEING);
    expect(await search('225', '45', '17')).to.deep.equal([]);
  });

  it('says which products the sheet has no rows for', async () => {
    fetchStub = stubSheets(DISAGREEING);
    const block = buildBar();
    await decorate(block);
    await openFrom(block, 0);
    expect(warns.called, 'console.warn').to.be.true;
    expect(warns.getCall(0).args.join(' ')).to.contain('pure-ls');
  });

  it('falls back to products.sizes when the sheet does not carry its columns', async () => {
    fetchStub = stubSheets({
      ...DISAGREEING,
      specs: {
        total: 1, offset: 0, limit: 1, data: [{ product: 'viking-7', tireSize: '205/55 R 16' }],
      },
    });
    const errors = sinon.stub(console, 'error');
    try {
      // 275/45R22 comes back, because the cell is all there is to read
      expect(await search('275', '45', '22')).to.deep.equal(['/tires/viking-7']);
      expect(errors.called, 'console.error').to.be.true;
    } finally {
      errors.restore();
    }
  });
});
