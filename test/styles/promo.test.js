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

  // live's bands touch: each one carries its own padding and no margin, so
  // ours had a white gap between the steps and the black band
  it('lets the bands touch, as live\'s do', () => {
    expect(value('main > .section', 'margin')).to.equal('0px');
  });

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

  // live numbers the three rebate steps with a 20px yellow disc, and the
  // number is not in the content: it counts the columns
  it('numbers the steps the way live numbers them', () => {
    expect(value('main .section.steps .columns > div > div::before', 'content')).to.equal('counter(promo-step)');
    expect(value('main .section.steps .columns > div > div::before', 'background-color')).to.equal('var(--conti-yellow)');
    expect(value('main .section.steps .columns > div > div::before', 'width')).to.equal('20px');
    expect(value('main .section.steps .columns > div > div::before', 'border-radius')).to.equal('50%');
  });

  it('sets a step the way live sets one', () => {
    expect(value('main .section.steps h2', 'text-transform')).to.equal('uppercase');
    expect(value('main .section.steps h2', 'font-size')).to.equal('14px');
    expect(value('main .section.steps p', 'font-size')).to.equal('18px');
    expect(value('main .section.steps', 'text-align')).to.equal('center');
  });

  // live's qualifying tires run in four columns on a dark band
  it('runs the qualifying tires in live\'s four columns', () => {
    expect(value('main .section.tires ul', 'columns', '769px')).to.equal('4');
    expect(value('main .section.tires ul', 'list-style')).to.equal('none');
    expect(value('main .section.tires h2', 'text-transform')).to.equal('uppercase');
  });

  // the card band pairs a 120px card with a line of copy and two pills
  it('holds the banner card to the size live draws it', () => {
    expect(value('main .section.banner .columns-img-col img', 'width')).to.equal('120px');
    expect(value('main .section.banner .columns > div > div:last-child', 'display', '900px')).to.equal('flex');
  });

  // the meta row is a badge beside its copy, twice
  it('lays the meta row out as live lays it', () => {
    expect(value('main .section.meta .columns > div', 'grid-template-columns', '900px')).to.equal('auto 1fr auto 1fr');
    expect(value('main .section.meta .columns-img-col img', 'width')).to.equal('100px');
  });

  it('sets the terms as small print with a centred title', () => {
    expect(value('main .section.terms', 'font-size')).to.equal('14px');
    expect(value('main .section.terms h2', 'text-align')).to.equal('center');
    expect(value('main .section.terms h2', 'font-size')).to.equal('14px');
  });
});
