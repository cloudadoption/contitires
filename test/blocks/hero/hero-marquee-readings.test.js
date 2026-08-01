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

  // #408. Live centres the marquee title below its own 1025 step and pins it
  // `start` above, measured at 1024 and 1025 on /tires. `left` set that
  // alignment in the base, so ours read `left` at 375, 700 and 900 where live
  // read `center`, on all 13 pages carrying the token without `stacked`.
  // The two sibling variants already have this shape: `.hero.stacked` centres
  // in the base and goes left at 1025, and so does `.hero.title-left`.
  it('leaves the left variant centred below 1025, as the base sets it', () => {
    expect(value('.hero.left .hero-content', 'text-align')).to.equal(null);
    expect(value('.hero-content', 'text-align')).to.equal('center');
  });

  it("pins the left variant at live's own 1025 step", () => {
    expect(value('.hero.left .hero-content', 'text-align', '1025px')).to.equal('left');
  });

  // `stacked` is unaffected and it is source order that does it, not a
  // `:not()`: `.hero.stacked .hero-content` scores the same 0-2-1 and is
  // declared later, so it keeps centring below 1025 and its own 1025 rule
  // keeps pinning it above. /experience and / are the two pages this covers.
  it('leaves the stacked variant where it was, on source order', () => {
    expect(value('.hero.stacked .hero-content', 'text-align')).to.equal('center');
    expect(value('.hero.stacked .hero-content', 'text-align', '1025px')).to.equal('left');
  });
});
