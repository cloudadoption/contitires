/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * A card image is cropped to 4:3, which suits a photo and cuts a wide logo to
 * a fragment. On /media the Continental wordmark is 280 by 105, and five of
 * the ten logo cards read `ntinenta` with the C and the horse cut off at both
 * edges. Live draws each of those tiles at the logo's own shape and shows it
 * whole. The `logos` variant is that shape. (#90)
 */
describe('Cards, the logos variant', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  function value(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText
      && r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  it('leaves the crop on an ordinary card, where a photo wants it', () => {
    expect(value('.cards > ul > li img', 'object-fit')).to.equal('cover');
    expect(value('.cards > ul > li img', 'aspect-ratio')).to.equal('4 / 3');
  });

  // A ratio the browser can use before the image arrives. `auto` reads the
  // ratio off the file, which a lazy image has not delivered yet, so the tile
  // has no height until it does and the grid reflows under it. That measured
  // 0.168 CLS against 0.001, which is a real defect traded for the crop.
  it('gives a logo card the logos\' own shape, reserved up front', () => {
    expect(value('.cards.logos > ul > li img', 'aspect-ratio')).to.equal('280 / 105');
    expect(value('.cards.logos > ul > li img', 'height')).to.equal('auto');
    expect(value('.cards.logos > ul > li img', 'object-fit')).to.equal('contain');
  });
});
