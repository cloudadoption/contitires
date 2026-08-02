/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/*
 * Two things on the By Tire Size form, measured live against main on 2026-08-02
 * at 1440, 900, 800, 768 and 375.
 *
 * #484. Live's fields row is 520 wide from 768 up and composes that 520 two
 * ways: 3x168 plus 2x8 at 768, and 3x160 plus 2x20 from 769. It steps the gap
 * at 769 and lets the columns absorb it. Ours was 496 with a flat 8px gap,
 * because `.perfect-fit-form-tire-size` capped the whole FORM at 496px. That
 * cap took the terms sentence and the call to action with it: live's terms run
 * one line across 1136 at 1440 where ours wrapped to two inside 496, which put
 * the submit 20px lower. Live's own structure is a 520 island inside a form at
 * the dialog's content width, so that is what this builds.
 *
 * At 375 the two already agreed, row 20..355 at 335 wide with an 8px gap on
 * both sides, so 375 not moving is one of the assertions rather than an
 * afterthought.
 *
 * #489. Live's diameter option reads "18 in" against a value of "18", and it
 * splits label from value on four of its seven controls: Diameter 3 of 3, Make
 * 45 of 45, Model 9 of 9, Trim 9 of 9, with Width, Ratio and Year not
 * differing and `sw=999` returning 0 options and 0 differing as the control.
 * So the split is live's general model and this gives `fillSelect` a display
 * mapping rather than special-casing the unit.
 *
 * Only the diameter reaches us, because our vehicle values are a hand-written
 * map whose keys are already display strings where live's are slugs.
 */

const PRODUCTS = {
  products: [
    {
      slug: 'sport-02', name: 'ExtremeContact Sport02', category: 'Passenger', season: 'Summer', vehicleTypes: ['Cars'], image: '/p/s.png', sizes: ['235/40ZR18', '235/40ZR19'],
    },
    {
      slug: 'terrain-at', name: 'TerrainContact A/T', category: 'Light Truck/SUV', season: 'All-Season', vehicleTypes: ['SUVs'], image: '/p/t.png', sizes: ['265/70R17'],
    },
  ],
};

const SPEC_SHEET = {
  data: PRODUCTS.products.flatMap((product) => product.sizes.map((size) => ({
    slug: product.slug,
    size: size.replace(/^(\d{3})\/(\d{2})(Z?R)(\d{2})$/, '$1/$2 $3 $4'),
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

const panelOf = (id) => document.querySelector(`#perfect-fit-panel-${id}`);
const sizePanel = () => panelOf('tire-size');

async function openFinder(index = 1) {
  const block = buildBar();
  await decorate(block);
  block.querySelectorAll('.perfect-fit-item')[index].click();
  await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
  return block;
}

function setField(name, value) {
  const field = sizePanel().querySelector(`[name=${name}]`);
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

const width = (el) => Math.round(el.getBoundingClientRect().width);
const optionText = (name) => [...sizePanel().querySelectorAll(`[name=${name}] option`)]
  .filter((o) => o.value).map((o) => o.textContent);
const optionValues = (name) => [...sizePanel().querySelectorAll(`[name=${name}] option`)]
  .map((o) => o.value).filter(Boolean);

/*
 * The geometry is read with getComputedStyle and getBoundingClientRect at a real
 * viewport, never off the declarations: a media query is exactly what a declared
 * value cannot see (guardrail 5).
 */
describe('Perfect fit, live\'s 520 size row inside a form that is not capped', () => {
  let fetchStub;
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all(['/styles/styles.css', '/blocks/perfect-fit/perfect-fit.css']
      .map(async (path) => {
        const sheet = new CSSStyleSheet();
        await sheet.replace(await (await fetch(path)).text());
        return sheet;
      }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  beforeEach(() => {
    fetchStub = stubSheets(CATALOGUE);
  });

  afterEach(() => {
    fetchStub.restore();
    document.body.innerHTML = '';
  });

  const row = () => sizePanel().querySelector('.perfect-fit-fields:not(.perfect-fit-fields-rear)');
  const form = () => sizePanel().querySelector('.perfect-fit-form-tire-size');
  const terms = () => sizePanel().querySelector('.perfect-fit-terms');
  const cta = () => sizePanel().querySelector('.perfect-fit-search');

  it('holds the row at live\'s 520 from 1440 down to 769', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    expect(width(row()), 'at 1440').to.equal(520);
    await setViewport({ width: 900, height: 900 });
    expect(width(row()), 'at 900').to.equal(520);
    await setViewport({ width: 800, height: 900 });
    expect(width(row()), 'at 800, inside the band neither standard width lands in').to.equal(520);
    await setViewport({ width: 769, height: 900 });
    expect(width(row()), 'at 769, live\'s own boundary').to.equal(520);
  });

  it('gaps the row 20px from 769 and 8px below it, as live does', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    expect(getComputedStyle(row()).columnGap, 'at 1440').to.equal('20px');
    await setViewport({ width: 800, height: 900 });
    expect(getComputedStyle(row()).columnGap, 'at 800').to.equal('20px');
    await setViewport({ width: 769, height: 900 });
    expect(getComputedStyle(row()).columnGap, 'at 769').to.equal('20px');
    await setViewport({ width: 768, height: 1024 });
    expect(getComputedStyle(row()).columnGap, 'at 768, where live gaps 8').to.equal('8px');
  });

  it('keeps the row 520 at 768 by widening the columns, which is live\'s 168', async () => {
    await setViewport({ width: 768, height: 1024 });
    await openFinder();
    expect(width(row()), 'the row').to.equal(520);
    const fields = [...row().querySelectorAll('.perfect-fit-field')].map(width);
    expect(fields, 'three columns of 168').to.eql([168, 168, 168]);
  });

  it('leaves 375 exactly where it already matched live', async () => {
    await setViewport({ width: 375, height: 812 });
    await openFinder();
    expect(width(row()), 'the row fills the panel, as live\'s does').to.equal(335);
    expect(getComputedStyle(row()).columnGap, 'the gap').to.equal('8px');
    const fields = [...row().querySelectorAll('.perfect-fit-field')].map(width);
    expect(fields.every((w) => w === 106), `three columns of 106, got ${fields}`).to.be.true;
  });

  it('takes the cap off the form, so the row is an island inside it', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    expect(width(form()) > 520, `the form is wider than the row, got ${width(form())}`).to.be.true;
    expect(width(row()), 'and the row is still 520').to.equal(520);
  });

  it('lets the terms sentence run on one line, which the 496 cap prevented', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    // live's terms is 20px tall at 1440, 900, 800 and 768, and 60 at 375
    expect(Math.round(terms().getBoundingClientRect().height), 'at 1440').to.equal(20);
    await setViewport({ width: 800, height: 900 });
    expect(Math.round(terms().getBoundingClientRect().height), 'at 800').to.equal(20);
  });

  it('stops stretching the call to action at live\'s 769 rather than at 900', async () => {
    await setViewport({ width: 800, height: 900 });
    await openFinder();
    // live's is 182 at 800 against a form of 728, so the test is that it is
    // narrower than the form rather than merely narrower than the row: at 800
    // the old 496 form made those two the same number
    expect(width(cta()) < width(form()), `at 800 it takes its own width, got ${width(cta())} in a form of ${width(form())}`).to.be.true;
    await setViewport({ width: 768, height: 1024 });
    expect(width(cta()), 'at 768 it fills the form, as live\'s does').to.equal(width(form()));
  });

  it('holds the rear control to the row rather than to the form', async () => {
    await setViewport({ width: 768, height: 1024 });
    await openFinder();
    const toggle = sizePanel().querySelector('.perfect-fit-rear-toggle');
    expect(width(toggle), 'at 768 live\'s is the row\'s 520').to.equal(520);
    await setViewport({ width: 1440, height: 900 });
    expect(width(toggle) < 520, `at 1440 it takes its own width, got ${width(toggle)}`).to.be.true;
  });
});

describe('Perfect fit, the diameter carries live\'s unit', () => {
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

  it('reads the diameter as live reads it, while the value stays bare', async () => {
    await openFinder();
    setField('width', '235');
    setField('aspect', '40');
    expect(optionText('rim'), 'the text a reader sees').to.eql(['18 in', '19 in']);
    expect(optionValues('rim'), 'the value the search uses').to.eql(['18', '19']);
  });

  it('leaves the width and the ratio bare, as live leaves them', async () => {
    await openFinder();
    expect(optionText('width')).to.eql(['235', '265']);
    setField('width', '235');
    expect(optionText('aspect')).to.eql(['40']);
  });

  it('carries the unit into the rear row as well, from the one step definition', async () => {
    await openFinder();
    setField('width', '235');
    setField('aspect', '40');
    setField('rim', '18');
    sizePanel().querySelector('.perfect-fit-rear-toggle').click();
    setField('rear-width', '235');
    setField('rear-aspect', '40');
    const rear = [...sizePanel().querySelectorAll('[name=rear-rim] option')]
      .filter((o) => o.value);
    expect(rear.map((o) => o.textContent), 'the rear diameter').to.eql(['18 in', '19 in']);
    expect(rear.map((o) => o.value), 'and its values').to.eql(['18', '19']);
  });

  it('still searches on the bare value the unit is drawn over', async () => {
    await openFinder();
    setField('width', '265');
    setField('aspect', '70');
    setField('rim', '17');
    sizePanel().querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const slugs = [...sizePanel().querySelectorAll('.perfect-fit-result')]
      .map((a) => a.getAttribute('href').replace('/tires/', ''));
    expect(slugs).to.eql(['terrain-at']);
  });

  it('leaves the vehicle and plate controls without a mapping', async () => {
    await openFinder(0);
    const makes = [...panelOf('vehicle').querySelectorAll('[name=make] option')]
      .filter((o) => o.value);
    expect(makes.every((o) => o.textContent === o.value), 'make text equals its value').to.be.true;
    await openFinder(2);
    const states = [...panelOf('plate').querySelectorAll('[name=state] option')]
      .filter((o) => o.value);
    expect(states.every((o) => o.textContent === o.value), 'state text equals its value').to.be.true;
  });
});
