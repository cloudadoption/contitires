/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import styleSheet from '../../helpers/stylesheet.js';

/** The two sheets these measurements stand on, parsed once for the file. */
const HEADER_CSS = '/blocks/header/header.css';
const GLOBAL_CSS = '/styles/styles.css';

/*
 * The desktop logo rendered 150px wide where live's is 186. #132 fixed the
 * mobile case at live's 134 by 24 and left the desktop size, which its own
 * verification recorded under "what is left".
 *
 * Measured on live and on this tree on 2026-08-02, on
 * /tires/vancontact-winter, reading the rendered boxes rather than the
 * declarations:
 *
 *     width   live logo    live bar   ours logo      ours bar
 *      375    134x24.48    45         134x24.48      45
 *     1024    134x24.48    45         134x24.48      45
 *     1025    186x34       88         150x27.41      72
 *     1065    186x34       88         150x27.41      72
 *     1066    186x34       72         150x27.41      72
 *     1440    186x34       72         150x27.41      72
 *
 * THESE ARE COMPUTED VALUES AT A WIDTH, NOT DECLARATIONS. Both numbers are
 * controlled by a media query, and a test that walks cssRules reads what is
 * written rather than what wins, so it cannot see a cascade defect.
 *
 * THE BAR HEIGHT IS A GUARD AND ITS NUMBER IS OURS, WHICH IS 72 AND NOT 88.
 * The issue asks for the bar "unchanged at 88 between 1025 and 1079", and that
 * is live's number in that band, not ours: `--nav-height` is 45 and then 72,
 * and ours has read 72 from 1025 up since #129. Live's 88 comes from its Smart
 * Choice label wrapping to two lines, it ends at 1066 rather than 1080, and
 * #132 recorded it as a divergence left in place. So what is asserted here is
 * the issue's INTENT: a logo 34px tall inside a 72px bar must not push it.
 *
 * The fixture's image carries live's own 186 by 34 ratio, 5.47, which is the
 * ratio the shipped asset has: ours renders 150 by 27.41 and live's 186 by 34.
 * So `height: auto` resolves here the way it resolves on the page.
 */

/** Live's logo box from 1025 up. */
const LIVE_DESKTOP_LOGO = { w: 186, h: 34 };

/** Live's logo box below 1025, which #132 already matched. */
const LIVE_MOBILE_LOGO = { w: 134, h: 24 };

/** Our bar, which this change must not grow. */
const OUR_BAR = { desktop: 72, mobile: 45 };

/* an SVG with live's logo ratio, so width drives height the way it does live */
const LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="186" height="34" viewBox="0 0 186 34">'
  + '<rect width="186" height="34" fill="#ffa500"/></svg>',
)}`;

function buildHeader() {
  document.body.innerHTML = `
    <header>
      <nav id="nav">
        <div class="nav-brand">
          <p class="button-container"><a href="/" title="Continental"><img src="${LOGO_SRC}" alt="Continental"></a></p>
        </div>
        <div class="nav-sections"></div>
        <div class="nav-tools"></div>
      </nav>
    </header>`;
  return document.querySelector('header nav');
}

/** Mount, then wait for the image so `height: auto` has an aspect to use. */
async function mount() {
  const nav = buildHeader();
  const img = nav.querySelector('.nav-brand img');
  if (!img.complete) {
    await new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }
  // refuse to hand back a nav with no box: every assertion below is a width,
  // and an unrendered fixture reads 0 for all of them
  if (nav.getBoundingClientRect().height === 0) {
    throw new Error('the header fixture rendered with no box, so nothing here was measured');
  }
  return nav;
}

const box = (el) => {
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
};

describe('Header, the desktop logo takes live\'s 186 by 34 (#167)', () => {
  let sheets;

  before(async () => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
    sheets = await Promise.all([GLOBAL_CSS, HEADER_CSS].map((path) => styleSheet(path)));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    // styles.css holds `body { display: none }` until `.appear`, and an
    // undisplayed body gives every element a 0 box. A 0 compares as not-equal
    // without announcing that nothing was measured, so this is set once here
    // and asserted per mount below.
    document.body.classList.add('appear');
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    document.body.classList.remove('appear');
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  /*
   * 1025 is the breakpoint itself and 1440 is the wide desktop. 1079 is here
   * because the issue names it, and it is inside live's own 186 band.
   */
  [1025, 1079, 1440].forEach((w) => {
    it(`renders the logo at live's ${LIVE_DESKTOP_LOGO.w} by ${LIVE_DESKTOP_LOGO.h} at ${w}`, async () => {
      await setViewport({ width: w, height: 900 });
      const nav = await mount();
      expect(box(nav.querySelector('.nav-brand img'))).to.deep.equal(LIVE_DESKTOP_LOGO);
    });
  });

  /*
   * The mobile case #132 already matched, guarded so a desktop-side change
   * cannot reach under the breakpoint. It fails if the new width is written
   * without a query, or with the query at the wrong edge.
   */
  [1024, 375].forEach((w) => {
    it(`leaves the logo at live's ${LIVE_MOBILE_LOGO.w} by ${LIVE_MOBILE_LOGO.h} at ${w}`, async () => {
      await setViewport({ width: w, height: w === 375 ? 812 : 900 });
      const nav = await mount();
      expect(box(nav.querySelector('.nav-brand img'))).to.deep.equal(LIVE_MOBILE_LOGO);
    });
  });

  /*
   * THE HALF THAT CAN PASS WITHOUT MEANING ANYTHING. An assertion that the bar
   * is 72 is true whether or not the logo ever changed, so it is given its own
   * break in the red run: the logo is put at 186 with the bar's height rule
   * removed, and this is what catches the bar growing to fit it.
   */
  describe('and the bar does not grow to fit it', () => {
    [1025, 1079, 1440].forEach((w) => {
      it(`holds the bar at ${OUR_BAR.desktop} at ${w}`, async () => {
        await setViewport({ width: w, height: 900 });
        const nav = await mount();
        expect(box(nav).h, 'the bar').to.equal(OUR_BAR.desktop);
        expect(box(nav.querySelector('.nav-brand img')).h, 'the logo inside it')
          .to.be.lessThan(OUR_BAR.desktop);
      });
    });

    it(`holds the mobile bar at ${OUR_BAR.mobile} at 1024`, async () => {
      await setViewport({ width: 1024, height: 900 });
      const nav = await mount();
      expect(box(nav).h, 'the bar').to.equal(OUR_BAR.mobile);
    });
  });
});
