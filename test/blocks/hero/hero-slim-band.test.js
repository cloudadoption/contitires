/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The `/experience` marquee band is 160px taller than live's, and the number
 * this replaces was measured against the wrong element on our side.
 *
 * Measured at 1440 on 2026-07-30, naming the box on each side:
 *
 *   live   <section class="marquee marquee--dark marquee--left
 *          marquee--has-breadcrumbs">   1440x400 at y=109
 *   ours   <div class="hero left stacked slim block">   1440x560 at y=109
 *
 * So ours is TALLER by 160. The earlier reading of "160 against 400" compared
 * our inner `<img>`, which is 1440x160, against live's whole marquee section,
 * and concluded ours was the shorter crop by 240. That was an instrument error:
 * two different boxes read as if they were one. #250's own body was right that
 * ours is "a taller crop".
 *
 * `stacked slim` is authored on `/experience` and nowhere else, checked across
 * all 325 indexed paths, so holding the band at 400 touches that page alone.
 */
describe("Hero, live's 400px slim marquee band", () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText?.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  it("holds the slim band at live's 400 from the desktop breakpoint", () => {
    expect(value('.hero.stacked.slim', 'min-height', '1025px')).to.equal('400px');
  });

  it('leaves the taller stacked band alone for every other page', () => {
    expect(value('.hero.stacked', 'min-height', '1025px')).to.equal('560px');
  });
});

/**
 * The photo inside that band, read off a RENDERED element. The two assertions
 * above pass while `/experience` ships a 160px strip over 240px of black,
 * because `value()` reads declared values out of the CSSOM and never compares
 * across queries: `.hero.stacked.slim .hero-image` declares `height: 160px`
 * outside any query and scores 0-4-0, so it beats the `height: auto` the 1025
 * query gives `.hero.stacked .hero-image` at 0-3-0, at every width. A media
 * query adds no specificity. Same cascade shape as #407's tracking defect.
 *
 * Measured on both hosts on 2026-08-01, naming the box on each side. Live's
 * `div.marquee__background` carries the photo as a background image where ours
 * carries an `img`, so the box that holds the photo is what is compared:
 *
 *   width  live marquee   live photo box        ours (band / .hero-image)
 *   375    375x362        375x160, static       375x430 / 375x160
 *   1024   1024x318       1024x160, static      not read
 *   1025   1025x400       1025x400, absolute    not read
 *   1440   1440x400       1440x400, absolute    1440x400 / 1440x160
 *
 * Live's own step is 1025, bracketed at 1024 and 1025 rather than assumed, and
 * it is the step this stylesheet already uses. So the photo divides at 160
 * below it and fills the band above it, and 1440 is where ours is 240 short.
 */
describe('Hero, the slim marquee photo as it renders', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document.body.innerHTML = `
      <main><div class="section">
        <div class="hero left stacked slim breadcrumb block">
          <div class="hero-image"><picture><img src="./marquee.jpg" alt=""></picture></div>
          <div class="hero-content"><h1>EXPERIENCE</h1></div>
        </div>
      </div></main>`;
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  const band = () => getComputedStyle(document.querySelector('.hero.stacked.slim')).height;
  const photo = () => getComputedStyle(document.querySelector('.hero.stacked.slim .hero-image')).height;

  it("fills live's 400 band with the photo at 1440", async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(band()).to.equal('400px');
    expect(photo()).to.equal('400px');
  });

  it("fills it from live's own 1025 step", async () => {
    await setViewport({ width: 1025, height: 900 });
    expect(photo()).to.equal('400px');
  });

  it("divides at live's 160 strip one pixel below the step", async () => {
    await setViewport({ width: 1024, height: 900 });
    expect(photo()).to.equal('160px');
    expect(parseFloat(band())).to.be.greaterThan(160);
  });

  it('divides at 160 on mobile too', async () => {
    await setViewport({ width: 375, height: 900 });
    expect(photo()).to.equal('160px');
  });
});
