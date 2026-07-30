/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * Live pins the marquee title to the left on /experience/conti-crew and
 * centres it on /experience/partners, and both pages carry the same breadcrumb
 * marquee. So left is a variant, not the shape of the block.
 *
 * It is also breakpoint-scoped. Read off continentaltire.com on 2026-07-30:
 *
 *   page                      1440      375
 *   /experience/conti-crew    start     center
 *   /experience/partners      center    center
 *
 * So the variant left-aligns from the desktop breakpoint up and leaves the
 * centred base alone below it.
 *
 * It cannot reuse the existing `left` variant, which also caps the copy at
 * 640px and drops its centring margin. That is the homepage overlay's shape:
 * on this marquee it would take the title from 776 wide to 640 where live's is
 * 736. `title-left` carries the alignment and nothing else. Issue #252.
 */
describe("Hero, live's left-pinned marquee title", () => {
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

  it('pins the title left from the desktop breakpoint', () => {
    expect(value('.hero.title-left .hero-content', 'text-align', '1025px')).to.equal('left');
  });

  it('says nothing about alignment below that breakpoint', () => {
    expect(value('.hero.title-left .hero-content', 'text-align')).to.equal(null);
  });

  it('carries the alignment alone, not the left variant\'s 640 cap', () => {
    expect(value('.hero.title-left .hero-content', 'max-width', '1025px')).to.equal(null);
    expect(value('.hero.title-left .hero-content', 'margin', '1025px')).to.equal(null);
  });

  it('leaves the centred base in place for a marquee without the variant', () => {
    expect(value('.hero-content', 'text-align')).to.equal('center');
  });
});
