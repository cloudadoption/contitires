/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The promo template. Live builds /promotion and /ccpromotion from one template
 * of its own and gives it bands no other page uses. Every number here was read
 * off continentaltire.com at 1440, 1025, 1024, 900, 769, 768 and 375.
 * Issues #83 and #84.
 */
describe('The promo template', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/promo.css')).text());
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

  // live pads a band 38 top below 769 and 80 above, where ours padded 56 at
  // every width
  it('pads a band the way live pads it, at both widths', () => {
    expect(value('main .section.dark', 'padding')).to.equal('38px 0px 20px');
    expect(value('main .section.dark', 'padding', '769px')).to.equal('80px 0px 38px');
  });

  it('centres a promo band and gives the heading live\'s two voices', () => {
    expect(value('main .section.promo', 'text-align')).to.equal('center');
    expect(value('main .section.promo h2 strong', 'text-transform')).to.equal('uppercase');
    expect(value('main .section.promo h2 strong', 'letter-spacing')).to.equal('6px');
  });

  // the heading takes the same scale as the marquee title, and the same 1025
  it('takes live\'s heading scale', () => {
    expect(value('main .section.promo h2', 'font-size')).to.equal('30px');
    expect(value('main .section.promo h2', 'font-size', '1025px')).to.equal('42px');
  });

  it('marks the list items as live marks them', () => {
    expect(value('main .section.checklist ul', 'list-style')).to.equal('none');
    expect(value('main .section.checklist li::before', 'background-size')).to.equal('14.4px');
    expect(value('main .section.checklist li', 'font-size')).to.equal('18px');
    expect(value('main .section.checklist li', 'font-size', '769px')).to.equal('24px');
  });

  it('sets the terms as small print with a centred title', () => {
    expect(value('main .section.terms', 'font-size')).to.equal('14px');
    expect(value('main .section.terms h2', 'text-align')).to.equal('center');
    expect(value('main .section.terms h2', 'font-size')).to.equal('14px');
  });
});
