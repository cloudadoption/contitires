/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

/**
 * The base hero floor, which is what a page authoring `hero` or `hero left`
 * with no further variant renders at below live's 1025 step.
 *
 * #513 moved this block's query off 900 onto live's own 1025 and left the
 * value alone, so between 900 and 1024 the base rule's floor became the
 * number every bare marquee stands on. Live's is 100px shorter.
 *
 * Read on 2026-08-02 on continentaltire.com against the same paths on
 * main--contitires--cloudadoption.aem.live, naming the box on each side:
 * live is `section.marquee`, ours is `div.hero.block`.
 *
 *   page                                     live  ours
 *   /cruisingthecontinentalus                 220   320
 *   /emilytalkstires                          220   320
 *   /forwhatyoudo                             220   320
 *   /lightscameratraction                     220   320
 *   /customer-support/technical-documents     222   320
 *
 * All five hold that number at 375, 768, 900 and 1024 alike, so live's small
 * band runs the whole range below the step rather than starting at 769, and
 * `.hero.short` already declares live's 220 unbounded for the same reason.
 *
 * Three further pages take this floor and have no live number a min-height
 * reproduces: /smart-choice and /all-new-securecontact-aw open with live's
 * `marquee--has-jumplink` and `marquee--video-aspect`, at 340 and at 251 to
 * 467 across the range, and /promotionended has no live page at all.
 */
describe("Hero, live's 220 band below the desktop step", () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document.body.innerHTML = `
      <main><div class="section">
        <div class="hero block">
          <div class="hero-image"><picture><img src="./marquee.jpg" alt=""></picture></div>
          <div class="hero-content"><h1>CRUISING THE CONTINENTAL US</h1></div>
        </div>
        <div class="hero left block">
          <div class="hero-image"><picture><img src="./marquee.jpg" alt=""></picture></div>
          <div class="hero-content"><h1>SMART CHOICE</h1></div>
        </div>
      </div></main>`;
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  const band = (sel) => getComputedStyle(document.querySelector(sel)).height;

  [375, 768, 900, 1024].forEach((width) => {
    it(`holds the bare marquee at live's 220 at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      expect(band('.hero:not(.left)')).to.equal('220px');
    });

    it(`holds the left marquee at the same 220 at ${width}`, async () => {
      await setViewport({ width, height: 900 });
      expect(band('.hero.left')).to.equal('220px');
    });
  });

  it("leaves both desktop bands where live's step puts them", async () => {
    await setViewport({ width: 1025, height: 900 });
    expect(band('.hero:not(.left)')).to.equal('440px');
    expect(band('.hero.left')).to.equal('560px');
  });
});
