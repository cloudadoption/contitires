/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The three readings taken off live's marquee on 2026-08-01, across the 13
 * pages whose hero carries the `left` token without `stacked`.
 *
 * Live's own steps were bracketed rather than assumed, on /tires: the title
 * computes `center` at 1024 and `start` at 1025, and its tracking reads 5px at
 * 1024 and 6px at 1025. Both issues turn on the same pixel.
 */
describe('Hero marquee, the readings off live', () => {
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

  // #456. Live's text column measures 335 at 375 and ours measured 327, because
  // this rule pads 24px a side where live reaches 335 from an ancestor with no
  // padding of its own. The 8px decides two wraps once the titles are tracked:
  // at 327 `/tires` runs to three lines against live's two and
  // `/tires/all-terrain` to two against live's one, and at 335 both match.
  it("pads the hero copy at live's 20px so the column measures 335 at 375", () => {
    expect(value('.hero-content', 'padding')).to.equal('56px 20px');
  });
});
