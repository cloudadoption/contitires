/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * Live's action bar: an icon, a line of copy and a CTA in a white card with a
 * 10px radius and 20px of padding. It appears twice on /ccpromotion, once on
 * the page and once on the dark apply band, and the copy is set at 18px/26px.
 * Measured on continentaltire.com at 1440, 900 and 375. Issue #84.
 */
describe('Columns, the action bar', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/columns/columns.css')).text());
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

  it('draws the white card live draws', () => {
    expect(value('main .columns.bar', 'background-color')).to.equal('var(--conti-white)');
    expect(value('main .columns.bar', 'border-radius')).to.equal('10px');
    expect(value('main .columns.bar', 'padding')).to.equal('20px');
  });

  it('sets the copy at live\'s size', () => {
    expect(value('main .columns.bar p', 'font-size')).to.equal('18px');
    expect(value('main .columns.bar p', 'line-height')).to.equal('26px');
    // paragraph margins made the bar 109 tall against live's 85
    expect(value('main .columns.bar p', 'margin')).to.equal('0px');
  });

  // the columns block gives every column an equal share, and this bar wants
  // the copy to take what the icon and the CTA leave
  it('lets the copy take the room the icon and the CTA leave', () => {
    const ends = 'main .columns.bar > div > div:first-child, main .columns.bar > div > div:last-child';
    expect(value(ends.split(',')[0].trim(), 'flex', '900px')).to.equal('0 0 auto');
  });

  // `.columns img` runs an image to the full column, which is not what an icon
  // wants: live draws these at the size they were drawn
  it('leaves the icon at its own size', () => {
    expect(value('main .columns.bar .icon img', 'width')).to.equal('auto');
    expect(value('main .columns.bar .icon img', 'height')).to.equal('36px');
  });

  // the bar on the apply band is a white card inside a dark section, and the
  // dark section paints a secondary button white, which would vanish on it
  it('keeps the outlined CTA readable on a card inside a dark band', () => {
    expect(value('main .columns.bar .button.secondary', 'border-color')).to.equal('var(--conti-black)');
    expect(value('main .columns.bar .button.secondary', 'color')).to.equal('var(--conti-black)');
  });
});
