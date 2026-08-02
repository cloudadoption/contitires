/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import styleSheet from '../../helpers/stylesheet.js';

const HEADER_CSS = '/blocks/header/header.css';
const GLOBAL_CSS = '/styles/styles.css';

/*
 * The header row is capped at 1264px and centred, so above 1264 the logo drifts
 * inward from the left edge and the utility cluster drifts in from the right.
 * Live's row is not capped: `.header__row` is a bare flex box at viewport width,
 * and the inset is padding on its parts. From live's own sheet:
 *
 *   .header--dark .header__logo   { padding-left: var(--space-20) }
 *   .header--dark .header__right  { padding-right: var(--space-20) }
 *   .main-nav__top                { margin-left: var(--space-20) }
 *
 * and under `screen and (max-width: 1024px)` the first drops to 12, the second
 * to 0 and the third to 0.
 *
 * Read on live and on the published host at /tires/vancontact-winter,
 * 2026-08-03, as rendered boxes:
 *
 *     width  what                 live      published
 *      1440  row x / width        0 / 1440  88 / 1264
 *      1440  logo left            20        120
 *      1440  first nav item left  226       330
 *      1440  utility right edge   1420      1320
 *      1200  logo left            20        32
 *      1200  first nav item left  226       242
 *
 * THESE ARE RENDERED POSITIONS, NOT DECLARATIONS. The drift is a cap plus
 * `margin: auto`, so it appears in no single declaration: a test that walks
 * cssRules sees `max-width: 1264px` and cannot tell whether it binds.
 *
 * 1025 to 1199 already reads live's numbers, because that band was tuned to
 * 20px padding with a 20px gap for the wider logo. It is asserted here too, so
 * a desktop-side change cannot take it back out.
 */

/** Live's insets from 1025 up: the logo's, the nav list's, and the cluster's. */
const LIVE_INSET = 20;

/** Live's first nav item, which is the logo's right edge plus that inset. */
const LIVE_FIRST_ITEM = 226;

/* live's own logo box from 1025 up, so the fixture's ratio is the page's */
const LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="186" height="34" viewBox="0 0 186 34">'
  + '<rect width="186" height="34" fill="#ffa500"/></svg>',
)}`;

function buildHeader() {
  document.body.innerHTML = `
    <header>
      <div class="nav-wrapper">
        <nav id="nav" aria-expanded="true">
          <div class="nav-brand">
            <p class="button-container"><a href="/" title="Continental"><img src="${LOGO_SRC}" alt="Continental"></a></p>
          </div>
          <div class="nav-sections">
            <div class="default-content-wrapper">
              <ul>
                <li class="nav-drop nav-mega">
                  <p><a href="/tires" aria-expanded="false">Tires</a></p>
                  <ul>
                    <li>
                      <p><strong>Search for tire</strong></p>
                      <ul><li><button type="button" data-tire-finder="vehicle"><span class="icon icon-vehicle"></span>By vehicle</button></li></ul>
                    </li>
                    <li>
                      <p><a href="/tires/touring">Touring</a></p>
                      <ul><li><a href="/tires/truecontact">TrueContact</a></li></ul>
                    </li>
                    <li><p><a href="/fleet">Fleet</a></p></li>
                  </ul>
                </li>
                <li><a href="/experience">Experience</a></li>
              </ul>
            </div>
          </div>
          <div class="nav-tools">
            <div class="nav-tools-utility">
              <ul>
                <li><a class="nav-tools-utility-item nav-tools-utility-item-pill" href="/chat"><span class="nav-tools-utility-label">Chat now</span><span class="icon"></span></a></li>
                <li><a class="nav-tools-utility-item" href="/support"><span class="icon"></span><span class="nav-tools-utility-label">Customer support</span></a></li>
              </ul>
            </div>
            <button class="nav-search-toggle" aria-label="Site search" aria-expanded="false"><span class="icon"></span></button>
          </div>
        </nav>
      </div>
    </header>`;
  return document.querySelector('header nav');
}

/** Mount, then wait for the logo so `height: auto` has an aspect to use. */
async function mount() {
  const nav = buildHeader();
  const img = nav.querySelector('.nav-brand img');
  if (!img.complete) {
    await new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }
  // refuse to hand back a nav with no box: every assertion below is a position,
  // and an unrendered fixture reads 0 for all of them
  if (nav.getBoundingClientRect().height === 0) {
    throw new Error('the header fixture rendered with no box, so nothing here was measured');
  }
  return nav;
}

const left = (el) => Math.round(el.getBoundingClientRect().left * 10) / 10;
const right = (el) => Math.round(el.getBoundingClientRect().right * 10) / 10;

/** The viewport's own width, so a scrollbar cannot make a right edge flaky. */
const viewport = () => document.documentElement.clientWidth;

describe('Header row, live\'s edge-to-edge inset', () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all([GLOBAL_CSS, HEADER_CSS].map((path) => styleSheet(path)));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    // styles.css holds `body { display: none }` until `.appear`, and an
    // undisplayed element reads 0 for every box
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  /*
   * 1440 is the wide desktop the drift shows at, 1200 is where our own padding
   * used to step to 32, and 1025 is the breakpoint that already matched.
   */
  [1440, 1200, 1025].forEach((w) => {
    describe(`at ${w}`, () => {
      it(`puts the logo ${LIVE_INSET}px from the left edge`, async () => {
        const nav = await mount();
        expect(left(nav.querySelector('.nav-brand img'))).to.equal(LIVE_INSET);
      });

      it(`starts the nav at live's ${LIVE_FIRST_ITEM}`, async () => {
        const nav = await mount();
        const item = nav.querySelector('.nav-sections .default-content-wrapper > ul > li');
        expect(left(item), 'the first top-level item').to.equal(LIVE_FIRST_ITEM);
        expect(left(item) - right(nav.querySelector('.nav-brand img')), 'past the logo')
          .to.equal(LIVE_INSET);
      });

      it(`ends the utility cluster ${LIVE_INSET}px from the right edge`, async () => {
        const nav = await mount();
        expect(viewport() - right(nav.querySelector('.nav-tools'))).to.equal(LIVE_INSET);
      });

      before(async () => {
        await setViewport({ width: w, height: 900 });
      });
    });
  });

  /*
   * THE HALF THAT PASSES WITHOUT MEANING ANYTHING. Uncapping the row moves the
   * logo and the cluster, and the mega panel opens off the same row, so it is
   * the thing a fix here can break without any assertion above noticing.
   *
   * The panel is absolutely positioned against `.nav-wrapper`, which is already
   * the full viewport, so its columns are measured from the viewport and not
   * from the row. 88 is OUR number, `max(32px, (100% - 1264px) / 2)` at 1440,
   * and it is NOT live's: live's panel pads 42px at 1440 and puts its first
   * column at 42, its second at 313.2. That gap is the panel's own and is left
   * where it is here; what this asserts is that the row's inset does not reach
   * into it.
   */
  describe('and the open mega panel does not move with it', () => {
    const OUR_PANEL_PAD = 88;

    it(`holds the panel's first column at ${OUR_PANEL_PAD} at 1440`, async () => {
      await setViewport({ width: 1440, height: 900 });
      const nav = await mount();
      nav.querySelector('.nav-mega > p > a').setAttribute('aria-expanded', 'true');
      const panel = nav.querySelector('.nav-mega > ul');
      expect(getComputedStyle(panel).display, 'the panel is open').to.equal('flex');
      expect(left(panel), 'the panel spans the viewport').to.equal(0);
      expect(right(panel)).to.equal(viewport());
      expect(left(panel.querySelector(':scope > li')), 'its first column')
        .to.equal(OUR_PANEL_PAD);
    });

    it('holds the panel at its 32px floor at 1025', async () => {
      await setViewport({ width: 1025, height: 900 });
      const nav = await mount();
      nav.querySelector('.nav-mega > p > a').setAttribute('aria-expanded', 'true');
      const panel = nav.querySelector('.nav-mega > ul');
      expect(left(panel), 'the panel spans the viewport').to.equal(0);
      expect(left(panel.querySelector(':scope > li')), 'its first column').to.equal(32);
    });
  });
});
