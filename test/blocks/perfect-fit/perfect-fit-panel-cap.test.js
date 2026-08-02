/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import sinon from 'sinon';
import decorate from '../../../blocks/perfect-fit/perfect-fit.js';

/*
 * The finder panel had no content cap, so above 768 its box was the viewport
 * less 40 where live's is capped. Measured on live on 2026-08-02, and the rule
 * was read rather than inferred from the box: live's `.container` carries
 * `max-width: 1168px` with side padding that steps, 16px from 769 and 20px
 * below, inside an outer 20px inset that exists only from 769. So live's
 * content width is `min(1168, viewport - 40) - 32` above the step and
 * `viewport - 40` at or below it.
 *
 *     width   live content   ours before
 *      1440   1136           1400
 *       900    828            860
 *       769    697            729
 *       768    728            728      already equal
 *       375    335            335      already equal
 *
 * Live NARROWS by 31px between 768 and 769, which is its own step and not a
 * rounding: 728 becomes 697. That was measured on both sides of the boundary
 * rather than derived from the widths either side of it.
 *
 * THE CAP IS ON A SHARED CONTAINER. `perfect-fit.js` builds one panels wrapper
 * and appends all three panels into it, so this reaches By Vehicle and By Plate
 * as well. Live's three tabs are identical at every width read, 1440, 900, 769
 * and 768, so one cap is what live has. It cannot bind on the other two here
 * because their forms are capped at 400 by `.perfect-fit-form`, and that they
 * do not move is asserted below rather than assumed.
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

/** Live's content width for the finder panel, read on live at each width. */
const LIVE_CONTENT = {
  1440: 1136, 900: 828, 769: 697, 768: 728, 375: 335,
};

/** What the two other tabs render at, which this cap must not move. */
const OTHER_TAB_FORM = {
  1440: 400, 900: 400, 769: 400, 768: 400, 375: 335,
};

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

async function openFinder(index = 1) {
  const block = buildBar();
  await decorate(block);
  block.querySelectorAll('.perfect-fit-item')[index].click();
  await when(() => document.querySelector('.perfect-fit-overlay:not([hidden])'), 'the modal to open');
  return block;
}

const panels = () => document.querySelector('.perfect-fit-panels');
const panelOf = (id) => document.querySelector(`#perfect-fit-panel-${id}`);
const width = (el) => Math.round(el.getBoundingClientRect().width);

/** The panel's CONTENT width, which is the box the forms inside it get. */
function contentWidth() {
  const el = panels();
  const cs = getComputedStyle(el);
  return Math.round(
    el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
  );
}

describe('Perfect fit, the panel takes live\'s content cap (#499)', () => {
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

  /*
   * Absolute on the panel's own side at every width, so the pair with the terms
   * assertion below is not two readings of the same render. Guardrail 7.
   */
  [1440, 900, 769].forEach((w) => {
    it(`caps the panel at live's ${LIVE_CONTENT[w]} at ${w}`, async () => {
      await setViewport({ width: w, height: 900 });
      await openFinder();
      expect(contentWidth()).to.equal(LIVE_CONTENT[w]);
    });
  });

  [768, 375].forEach((w) => {
    it(`leaves ${w} where it already matched live, at ${LIVE_CONTENT[w]}`, async () => {
      await setViewport({ width: w, height: w === 375 ? 812 : 1024 });
      await openFinder();
      expect(contentWidth()).to.equal(LIVE_CONTENT[w]);
    });
  });

  it('narrows across live\'s own step rather than widening', async () => {
    await setViewport({ width: 768, height: 1024 });
    await openFinder();
    const below = contentWidth();
    await setViewport({ width: 769, height: 1024 });
    const above = contentWidth();
    expect(below, 'at 768').to.equal(728);
    expect(above, 'at 769').to.equal(697);
    expect(above < below, `live narrows here, ${below} to ${above}`).to.be.true;
  });

  it('gives the terms sentence the panel\'s box on the size tab', async () => {
    await setViewport({ width: 1440, height: 900 });
    await openFinder();
    const terms = panelOf('tire-size').querySelector('.perfect-fit-terms');
    expect(width(terms), 'the sentence fills the capped panel').to.equal(LIVE_CONTENT[1440]);
  });

  /*
   * The cap is on a container all three panels share, so the two tabs #499 does
   * not name are asserted not to move. Their forms are capped at 400 by
   * `.perfect-fit-form`, well inside the cap, so it cannot bind on them.
   */
  describe('the two tabs the shared container also reaches', () => {
    /*
     * Each tab is switched to before it is measured: a hidden panel has no box
     * and reads 0, which would pass an "unchanged" assertion for the wrong
     * reason on any width where the expectation happened to be 0.
     */
    const formWidthOn = (id) => {
      document.querySelector(`#perfect-fit-tab-${id}`).click();
      return width(panelOf(id).querySelector('form'));
    };

    [1440, 900, 768].forEach((w) => {
      it(`leaves the vehicle and plate forms at ${OTHER_TAB_FORM[w]} at ${w}`, async () => {
        await setViewport({ width: w, height: w === 768 ? 1024 : 900 });
        await openFinder(0);
        expect(formWidthOn('vehicle'), 'by vehicle').to.equal(OTHER_TAB_FORM[w]);
        expect(formWidthOn('plate'), 'by plate').to.equal(OTHER_TAB_FORM[w]);
      });
    });
  });
});
