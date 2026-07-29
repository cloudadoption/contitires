/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * A card image is cropped to fill its tile, which suits a photograph and cuts
 * a drawn mark to a fragment. The `Best for` grid on /vancontact-as-ultra
 * holds six pictograms in 16:9 tiles, and all six were cut: the van lost both
 * bumpers, the EV frame lost its top and bottom edges. Live draws each of them
 * whole. The `marks` variant is that, and nothing else: it stops the crop and
 * leaves the tile the shape its own variant gives it. (#90)
 */
describe('Cards, the marks variant', () => {
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

  it('draws a mark whole instead of filling the tile with part of it', () => {
    expect(value('.cards.marks > ul > li img', 'object-fit')).to.equal('contain');
  });

  // The tile shape belongs to the variant the grid already carries. Setting a
  // ratio here would take it over, and the six marks on /vancontact-as-ultra
  // have six different shapes, so there is no one ratio to set.
  it('leaves the tile the shape its own variant gives it', () => {
    expect(value('.cards.marks > ul > li img', 'aspect-ratio')).to.be.null;
    expect(value('.cards.highlights > ul > li img', 'aspect-ratio')).to.equal('16 / 9');
  });

  it('leaves the crop on an ordinary card, where a photo wants it', () => {
    expect(value('.cards > ul > li img', 'object-fit')).to.equal('cover');
  });
});
