/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

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
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
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
