/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/*
 * Live's By Tire Size tab searches a staggered fitment: a front size and a
 * different rear size in one search. Ours searches one. Issue #313.
 *
 * Read off continentaltire.com on 2026-08-01 at 1440, 900 and 375, driving the
 * modal from the homepage bar. Under the three size fields live carries a
 * control reading "Add a different rear tire size", disabled until the front
 * size is complete. Clicking it appends a second row of three fields named
 * `rear-sw`, `rear-ar` and `rear-rd` under the same Width, Ratio and Diameter
 * labels, and the control becomes "Remove the rear tire size". The submit stays
 * "See tires that fit".
 *
 * The control at all three widths: 12px, weight 700, letter-spacing 1.25px,
 * uppercase, underlined, white while it can be used and rgb(148, 148, 148)
 * while it cannot, with a 12 by 12 glyph 7.5px to the left of the words. The
 * glyph is live's `#plus-outline` sprite symbol, and `#minus-outline` once the
 * row is open.
 *
 * WHERE THE PRE-FILLED ROW COMES FROM. Live's row opens carrying a suggested
 * rear size: 235/40/18 front gives 265/35/18, and 205/55/16 gives 225/50/16.
 * That suggestion is a call to `/api/tire-search/guess-rear-size`, a service on
 * a host this site does not have. Live's own bundle answers what to do without
 * it: `preFillRearSize()` takes the guess when the endpoint returns options and
 * falls back to `this.rearValues = {...this.frontValues}` when it returns none.
 * So the row opens on the front size here, which is live's own no-options
 * branch rather than a shape we invented.
 */

const PRODUCTS = {
  products: [
    {
      slug: 'sport-02', name: 'ExtremeContact Sport02', category: 'Passenger', season: 'Summer', vehicleTypes: ['Cars'], image: '/p/sport.png', sizes: ['225/45ZR17', '245/40ZR18'],
    },
    {
      slug: 'terrain-at', name: 'TerrainContact A/T', category: 'Light Truck/SUV', season: 'All-Season', vehicleTypes: ['SUVs'], image: '/p/terrain.png', sizes: ['265/70R17', '245/40ZR18'],
    },
    {
      slug: 'purecontact', name: 'PureContact LS', category: 'Passenger', season: 'All-Season', vehicleTypes: ['Cars'], image: '/p/pure.png', sizes: ['225/45R17'],
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

/** A fetch stub answering each sheet request with that sheet, fresh every call. */
function stubSheets(sheets) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const name = new URL(String(url), 'https://x').searchParams.get('sheet');
    return Promise.resolve(new Response(JSON.stringify(sheets[name] || { data: [] })));
  });
}

/** Waits for what a click brings about; the modal is built on the first one. */
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
        <div>${['By Vehicle', 'By Tire Size', 'By Plate'].map((item) => `<div><span>${item}</span></div>`).join('')}</div>
      </div>
    </div></div></main>`;
  return document.querySelector('.perfect-fit.block');
}

const panelOf = (id) => document.querySelector(`#perfect-fit-panel-${id}`);
const sizePanel = () => panelOf('tire-size');
const toggle = () => sizePanel().querySelector('.perfect-fit-rear-toggle');
const rearRow = () => sizePanel().querySelector('.perfect-fit-fields-rear');

/** Opens the modal on the By Tire Size tab. */
async function openFinder() {
  const block = buildBar();
  await decorate(block);
  block.querySelectorAll('.perfect-fit-item')[1].click();
  await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
  return block;
}

/** Answers one field the way a reader does, cascade and form state included. */
function setField(name, value) {
  const field = sizePanel().querySelector(`[name="${name}"]`);
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

/** The complete front size the control waits for. */
function setFrontSize(width = '245', aspect = '40', rim = '18') {
  setField('width', width);
  setField('aspect', aspect);
  setField('rim', rim);
}

const namesIn = (row) => [...row.querySelectorAll('select')].map((select) => select.name);
const labelsIn = (row) => [...row.querySelectorAll('label')].map((label) => label.textContent);
const valuesIn = (row) => [...row.querySelectorAll('select')].map((select) => select.value);
const resultSlugs = () => [...sizePanel().querySelectorAll('.perfect-fit-result')]
  .map((card) => card.getAttribute('href').replace('/tires/', ''));

function submit() {
  sizePanel().querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Perfect fit, live\'s rear tire size', () => {
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

  it('offers the control on the size tab, in live\'s words, with live\'s glyph', async () => {
    await openFinder();
    expect(toggle(), 'the size tab carries the control').to.exist;
    expect(toggle().textContent).to.equal('Add a different rear tire size');
    expect(toggle().querySelector('.icon-plus-outline'), 'live\'s plus glyph').to.exist;
  });

  it('offers it on no other tab', async () => {
    await openFinder();
    expect(!!panelOf('vehicle').querySelector('.perfect-fit-rear-toggle'), 'on the vehicle tab').to.be.false;
    expect(!!panelOf('plate').querySelector('.perfect-fit-rear-toggle'), 'on the plate tab').to.be.false;
  });

  it('keeps the control shut until the front size is complete', async () => {
    await openFinder();
    expect(toggle().disabled, 'at rest').to.be.true;
    setField('width', '245');
    expect(toggle().disabled, 'with a width alone').to.be.true;
    setField('aspect', '40');
    expect(toggle().disabled, 'with no diameter').to.be.true;
    setField('rim', '18');
    expect(toggle().disabled, 'with the whole size').to.be.false;
  });

  it('holds the second row back until the control opens it', async () => {
    await openFinder();
    expect(rearRow(), 'the row is built with the form').to.exist;
    expect(rearRow().hidden, 'and starts closed').to.be.true;
  });

  it('opens a second row of three fields under live\'s labels', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    expect(rearRow().hidden).to.be.false;
    expect(namesIn(rearRow())).to.eql(['rear-width', 'rear-aspect', 'rear-rim']);
    expect(labelsIn(rearRow())).to.eql(['Width', 'Ratio', 'Diameter']);
  });

  it('turns the control into live\'s remove wording and glyph', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    expect(toggle().textContent).to.equal('Remove the rear tire size');
    expect(toggle().querySelector('.icon-minus-outline'), 'live\'s minus glyph').to.exist;
    expect(!!toggle().querySelector('.icon-plus-outline'), 'and not the plus').to.be.false;
  });

  it('opens the row on the front size, which is live\'s own fallback', async () => {
    await openFinder();
    setFrontSize('245', '40', '18');
    toggle().click();
    expect(valuesIn(rearRow())).to.eql(['245', '40', '18']);
  });

  it('closes the row again and gives the control its first words back', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    toggle().click();
    expect(rearRow().hidden).to.be.true;
    expect(toggle().textContent).to.equal('Add a different rear tire size');
    expect(toggle().querySelector('.icon-plus-outline')).to.exist;
  });

  it('gates the second row\'s own cascade behind the field before it', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    setField('rear-width', '225');
    const [width, aspect, rim] = [...rearRow().querySelectorAll('select')];
    expect(width.disabled, 'the head of the cascade').to.be.false;
    expect(aspect.disabled, 'the ratio the width opened').to.be.false;
    expect(rim.disabled, 'the diameter, waiting on the ratio').to.be.true;
    expect([...aspect.options].map((o) => o.value).filter(Boolean)).to.eql(['45']);
  });

  it('returns the tires that come in both sizes', async () => {
    await openFinder();
    setFrontSize('245', '40', '18');
    toggle().click();
    setField('rear-width', '265');
    setField('rear-aspect', '70');
    setField('rear-rim', '17');
    submit();
    // 245/40 R 18 is on sport-02 and terrain-at, 265/70 R 17 on terrain-at
    expect(resultSlugs()).to.eql(['terrain-at']);
  });

  it('searches the front size alone while the row is closed', async () => {
    await openFinder();
    setFrontSize('245', '40', '18');
    toggle().click();
    setField('rear-width', '265');
    setField('rear-aspect', '70');
    setField('rear-rim', '17');
    toggle().click();
    submit();
    expect(resultSlugs()).to.eql(['sport-02', 'terrain-at']);
  });

  it('keeps the call to action waiting for the second size', async () => {
    await openFinder();
    const cta = () => sizePanel().querySelector('.perfect-fit-search');
    setFrontSize();
    expect(cta().disabled, 'with the front size alone').to.be.false;
    toggle().click();
    setField('rear-width', '225');
    expect(cta().disabled, 'with half a rear size').to.be.true;
    setField('rear-aspect', '45');
    setField('rear-rim', '17');
    expect(cta().disabled, 'with both sizes').to.be.false;
  });

  it('is not held back by a row the reader closed', async () => {
    await openFinder();
    const cta = () => sizePanel().querySelector('.perfect-fit-search');
    setFrontSize();
    toggle().click();
    setField('rear-width', '225');
    expect(cta().disabled, 'while the half-answered row is open').to.be.true;
    toggle().click();
    expect(cta().disabled, 'once it is closed again').to.be.false;
  });

  it('leaves the call to action reading what live reads', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    expect(sizePanel().querySelector('.perfect-fit-search').textContent)
      .to.equal('See tires that fit');
  });
});

/*
 * The measurements, taken with getComputedStyle at a real viewport rather than
 * off the declarations, because a declared value cannot see a rule beaten by a
 * later one or by specificity (guardrail 5). Live reads the same at 1440, 900
 * and 375, so the widths below are read for the closed row taking no space,
 * which is the one thing a `display: grid` row can get wrong.
 */
describe('Perfect fit, the rear control against live\'s measurements', () => {
  let fetchStub;
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    await setViewport({ width: 1440, height: 900 });
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
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((sheet) => !sheets.includes(sheet));
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

  it('sets the words the way live sets them', async () => {
    await openFinder();
    const style = getComputedStyle(toggle());
    expect(style.fontSize, 'font-size').to.equal('12px');
    expect(style.fontWeight, 'weight').to.equal('700');
    expect(style.letterSpacing, 'tracking').to.equal('1.25px');
    // live's 1.4 on 12px, and the 0.2 it differs from 17 moves the glyph a
    // whole pixel down the line box
    expect(style.lineHeight, 'line box').to.equal('16.8px');
    expect(style.textTransform, 'case').to.equal('uppercase');
    expect(style.textDecorationLine, 'underline').to.equal('underline');
  });

  it('greys the control it cannot be used and whitens it when it can', async () => {
    await openFinder();
    expect(getComputedStyle(toggle()).color, 'shut').to.equal('rgb(148, 148, 148)');
    setFrontSize();
    expect(getComputedStyle(toggle()).color, 'open to a click').to.equal('rgb(255, 255, 255)');
  });

  it('draws the glyph in live\'s 12 by 12 box, 7.5px from the words', async () => {
    await openFinder();
    const icon = toggle().querySelector('.icon');
    const box = icon.getBoundingClientRect();
    expect(`${Math.round(box.width)}x${Math.round(box.height)}`).to.equal('12x12');
    expect(getComputedStyle(icon).marginRight).to.equal('7.5px');
  });

  it('takes the glyph from the icon file rather than colouring a drawing in', async () => {
    await openFinder();
    expect(getComputedStyle(toggle().querySelector('.icon')).maskImage, 'the plus is masked in')
      .to.match(/plus-outline\.svg/);
    setFrontSize();
    toggle().click();
    expect(getComputedStyle(toggle().querySelector('.icon')).maskImage, 'and the minus after it')
      .to.match(/minus-outline\.svg/);
  });

  /*
   * Live greys the glyph with the words while the control is shut and then
   * draws it in the site's orange, where the words go white: rgb(148, 148, 148)
   * and rgb(255, 165, 0) against rgb(255, 255, 255). Read on live at 1440 in
   * all three states, shut, ready and open.
   */
  it('greys the glyph with the words and then draws it in live\'s orange', async () => {
    await openFinder();
    const glyph = () => getComputedStyle(toggle().querySelector('.icon')).backgroundColor;
    expect(glyph(), 'shut, with the words').to.equal('rgb(148, 148, 148)');
    setFrontSize();
    expect(glyph(), 'ready, where the words are white').to.equal('rgb(255, 165, 0)');
    toggle().click();
    expect(glyph(), 'open').to.equal('rgb(255, 165, 0)');
  });

  it('gives the closed row no room at all', async () => {
    await openFinder();
    expect(getComputedStyle(rearRow()).display, 'closed').to.equal('none');
    expect(rearRow().getBoundingClientRect().height, 'and no height').to.equal(0);
    setFrontSize();
    toggle().click();
    expect(getComputedStyle(rearRow()).display, 'open').to.equal('grid');
  });

  /*
   * Live stretches the control across the row below 769 and lets it take its
   * own width above, the same 38px under the fields either way: 520 wide at
   * 600 and 768, 237 at 769 and up, and 335 at 375 where the row is 335.
   *
   * The band below is the block's own 900 rather than live's 769, because the
   * call to action beside it already stretches to 900 and a control that
   * changed shape at 769 beside one that changed at 900 would disagree with
   * itself between the two. Live's 769 for the whole size form is filed.
   */
  it('fills the row on a narrow screen and takes its own width on a wide one', async () => {
    await setViewport({ width: 375, height: 812 });
    await openFinder();
    const row = () => sizePanel().querySelector('.perfect-fit-fields:not(.perfect-fit-fields-rear)');
    const widthOf = (el) => Math.round(el.getBoundingClientRect().width);
    expect(widthOf(toggle()), 'at 375 it fills the row').to.equal(widthOf(row()));
    await setViewport({ width: 1440, height: 900 });
    // the 237 live measures is a number the page's own font gives, so the
    // width against the row is what a runner without that font can assert
    expect(widthOf(toggle()) < widthOf(row()), 'at 1440 it takes its own width').to.be.true;
  });

  it('lays the second row out the way the first one is laid out', async () => {
    await openFinder();
    setFrontSize();
    toggle().click();
    const front = sizePanel().querySelector('.perfect-fit-fields:not(.perfect-fit-fields-rear)');
    expect(getComputedStyle(rearRow()).gridTemplateColumns)
      .to.equal(getComputedStyle(front).gridTemplateColumns);
    expect(Math.round(rearRow().getBoundingClientRect().width))
      .to.equal(Math.round(front.getBoundingClientRect().width));
  });
});
