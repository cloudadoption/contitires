/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/*
 * `.perfect-fit-form` capped the By Vehicle and By Plate forms at 400, so the
 * question, the terms sentence and the call to action were 400 wide where
 * live's are the panel. `.perfect-fit-form-tire-size` released that cap in #484
 * and the size tab has matched live since, which left the other two behind.
 *
 * LIVE HAS BOTH BOXES, and reading only the outer one is what made "delete the
 * 400" look like the fix. Measured on live's own elements on 2026-08-02, in the
 * browser, on all three tabs at 1440, 900 and 768:
 *
 *   form.tire-finder__form        1136   828   728    the panel, every tab
 *   p.tire-finder__tos            1136   828   728    the terms sentence
 *   div.tire-finder__form-container 400   400   400   vehicle and plate
 *   div.tire-finder__form-container 520   520   520   tire size
 *   the submit                     182   182   728
 *
 * So 400 IS live's number and it is DECLARED, not a field filling its parent:
 * `max-width: 400px` reads off the element at all three widths while the box
 * around it goes 1136, 828, 728, and it still reads 400 while the tab is hidden
 * and has no box at all. The fix moves the 400 from the form onto the fields
 * row, which is the shape the size tab already has at 520.
 *
 * Only the fields are inside live's island. The terms sentence, the submit
 * wrapper and the clear-data button are all the panel's width, read off live's
 * subtree rather than assumed from the container.
 *
 * THE FIELD WIDTHS ARE ASSERTED ABSOLUTELY, against live's numbers. An
 * assertion that the vehicle form merely EQUALS the size tab's passes under any
 * change that moves both, and both are inside one container #499 just capped.
 * The equal-across-tabs assertion is kept beside them because that relationship
 * is what the issue is about, not instead of them.
 */

const PRODUCTS = {
  products: [
    {
      slug: 'sport-02', name: 'ExtremeContact Sport02', category: 'Passenger', season: 'Summer', vehicleTypes: ['Cars'], image: '/p/s.png', sizes: ['235/40ZR18'],
    },
  ],
};

const SPEC_SHEET = {
  data: PRODUCTS.products.flatMap((p) => p.sizes.map((size) => ({
    slug: p.slug, size: size.replace(/^(\d{3})\/(\d{2})(Z?R)(\d{2})$/, '$1/$2 $3 $4'), 'Load Index': '95',
  }))),
};

const CATALOGUE = { products: PRODUCTS, specs: SPEC_SHEET };

/** Live's panel content width, which every tab's form takes. */
const LIVE_FORM = {
  1440: 1136, 900: 828, 768: 728, 375: 335,
};

/** Live's declared island for the vehicle and plate fields, at every width. */
const LIVE_FIELDS = 400;

/** Live's island for the size fields, which this must not move. */
const LIVE_SIZE_FIELDS = 520;

function stubSheets(sheets) {
  return sinon.stub(window, 'fetch').callsFake((url) => {
    const name = new URL(String(url), 'https://x').searchParams.get('sheet');
    return Promise.resolve(new Response(JSON.stringify(sheets[name] || { data: [] })));
  });
}

function when(check, what = 'the page to come round') {
  return new Promise((resolve, reject) => {
    const hit = check();
    if (hit) { resolve(hit); return; }
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
    stop = () => { observer.disconnect(); clearTimeout(timer); };
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

async function openFinder(index = 0) {
  const block = buildBar();
  await decorate(block);
  block.querySelectorAll('.perfect-fit-item')[index].click();
  await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
  return block;
}

const panelOf = (id) => document.querySelector(`#perfect-fit-panel-${id}`);
const width = (el) => Math.round(el.getBoundingClientRect().width);

/*
 * SWITCH TO THE TAB BEFORE MEASURING IT. A hidden panel has no box and reads 0,
 * which passes an equality against 0 and reads as a measurement. That bug was
 * caught in #499's own red run and it is the reason this is a function rather
 * than a querySelector at the call site.
 */
function on(id, selector) {
  document.querySelector(`#perfect-fit-tab-${id}`).click();
  const el = panelOf(id).querySelector(selector);
  expect(el, `${selector} exists on the ${id} tab`).to.exist;
  expect(width(el), `${selector} on ${id} has a box`).to.be.greaterThan(0);
  return width(el);
}

describe('Perfect fit, the vehicle and plate forms take live\'s panel (#501)', () => {
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

  beforeEach(() => { fetchStub = stubSheets(CATALOGUE); });
  afterEach(() => { fetchStub.restore(); document.body.innerHTML = ''; });

  [1440, 900, 768].forEach((w) => {
    it(`gives the vehicle and plate forms live's ${LIVE_FORM[w]} at ${w}`, async () => {
      await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
      await openFinder();
      expect(on('vehicle', 'form'), 'by vehicle').to.equal(LIVE_FORM[w]);
      expect(on('plate', 'form'), 'by plate').to.equal(LIVE_FORM[w]);
    });

    it(`gives their terms sentence live's ${LIVE_FORM[w]} at ${w}`, async () => {
      await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
      await openFinder();
      expect(on('vehicle', '.perfect-fit-terms'), 'by vehicle').to.equal(LIVE_FORM[w]);
      expect(on('plate', '.perfect-fit-terms'), 'by plate').to.equal(LIVE_FORM[w]);
    });

    /*
     * The number the fix must NOT throw away. Live declares 400 here and keeps
     * it at every width, so a fix that deletes the cap rather than moving it
     * fails this at all three, and one that moves it to the wrong element fails
     * it at 1440 and 900 where the panel is wider.
     */
    it(`keeps their fields on live's ${LIVE_FIELDS} island at ${w}`, async () => {
      await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
      await openFinder();
      expect(on('vehicle', '.perfect-fit-fields'), 'by vehicle').to.equal(LIVE_FIELDS);
      expect(on('plate', '.perfect-fit-fields'), 'by plate').to.equal(LIVE_FIELDS);
    });
  });

  /*
   * Live stretches the call to action below 769 and lets it shrink to fit above,
   * on all three tabs: 728 at 768 and 182 at 1440 and 900. Ours already did that
   * ARITHMETIC, off a form that was 400 wide, so the 768 button was 400.
   */
  it('stretches the call to action to live\'s 728 at 768', async () => {
    await setViewport({ width: 768, height: 1024 });
    await openFinder();
    expect(on('vehicle', '.perfect-fit-search'), 'by vehicle').to.equal(728);
    expect(on('plate', '.perfect-fit-search'), 'by plate').to.equal(728);
  });

  it('leaves the call to action shrink-fitted at 1440', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    const vehicle = on('vehicle', '.perfect-fit-search');
    expect(vehicle, 'well inside the 1136 form, as live\'s 182 is').to.be.lessThan(400);
    expect(on('plate', '.perfect-fit-search'), 'the two tabs agree').to.equal(vehicle);
  });

  /*
   * The relationship the issue is about, kept BESIDE the absolute assertions
   * above rather than instead of them: live's three tabs are identical at every
   * width read, and an equality alone cannot see a change that moves both.
   */
  [1440, 900, 768].forEach((w) => {
    it(`matches the size tab's form on all three tabs at ${w}`, async () => {
      await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
      await openFinder();
      const size = on('tire-size', 'form');
      expect(on('vehicle', 'form'), 'by vehicle against by tire size').to.equal(size);
      expect(on('plate', 'form'), 'by plate against by tire size').to.equal(size);
    });
  });

  /*
   * The size tab is the one that already matched live, so it is guarded rather
   * than assumed: releasing the shared cap must not touch its 520 island, and
   * moving the 400 onto `.perfect-fit-fields` reaches its fields row too unless
   * the new rule is scoped away from it.
   */
  describe('the size tab, which already matched live', () => {
    [1440, 900, 768].forEach((w) => {
      it(`holds its form at ${LIVE_FORM[w]} and its fields at ${LIVE_SIZE_FIELDS} at ${w}`, async () => {
        await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
        await openFinder(1);
        expect(on('tire-size', 'form'), 'the form').to.equal(LIVE_FORM[w]);
        expect(on('tire-size', '.perfect-fit-fields'), 'the fields row').to.equal(LIVE_SIZE_FIELDS);
      });
    });
  });

  /*
   * 375 is the known-present control from the write-up that filed this: the
   * panel is narrower than the 400 cap there, so all three tabs already agreed
   * at 335 and nothing here may move them. The same instrument that separates
   * the tabs above 768 shows them agreeing where they should.
   */
  it('leaves all three tabs at 335 at 375, where they already agreed', async () => {
    await setViewport({ width: 375, height: 812 });
    await openFinder();
    expect(on('vehicle', 'form'), 'by vehicle').to.equal(LIVE_FORM[375]);
    expect(on('plate', 'form'), 'by plate').to.equal(LIVE_FORM[375]);
    expect(on('tire-size', 'form'), 'by tire size').to.equal(LIVE_FORM[375]);
    expect(on('vehicle', '.perfect-fit-fields'), 'the vehicle fields fall back to the panel').to.equal(LIVE_FORM[375]);
  });
});
