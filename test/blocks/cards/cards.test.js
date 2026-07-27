/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

// The Confidence on the Road band now sits on every product page, not the
// homepage alone. Live lays its six coverage items out as one row of six from
// 769 up, and as icon-left rows below that. Ours used an auto-fit grid, which
// wrapped to five plus an orphan at 900 and to two columns at 375, and it kept
// the desktop badge, heading and copy sizes all the way down.
describe('Confidence band, live\'s responsive layout', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  /** The value a property takes in the rule for `selector`, at `media`. */
  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const rule = [...rules].reverse().find((r) => r.selectorText === selector
      && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const BAND = 'main .section.dark.cards-container .default-content-wrapper';

  it('stacks the coverage items one per row on a narrow screen', () => {
    expect(value('.cards.coverage > ul', 'grid-template-columns')).to.equal('1fr');
  });

  it('lays them out as one row of six from live\'s 769 up', () => {
    expect(value('.cards.coverage > ul', 'grid-template-columns', '769px'))
      .to.equal('repeat(6, 1fr)');
  });

  it('puts the icon beside its label on a narrow screen', () => {
    expect(value('.cards.coverage .cards-card-body', 'flex-direction')).to.equal('row');
    expect(value('.cards.coverage .cards-card-body', 'flex-direction', '769px'))
      .to.equal('column');
  });

  it('shrinks the badge to live\'s 60px on a narrow screen', () => {
    expect(value(`${BAND} .icon`, 'width')).to.equal('60px');
    expect(value(`${BAND} .icon`, 'width', '769px')).to.equal('126px');
  });

  it('holds the heading to live\'s 30px below the 1025 breakpoint', () => {
    expect(value(`${BAND} h2`, 'font-size')).to.equal('30px');
    expect(value(`${BAND} h2`, 'font-size', '1025px')).to.equal('42px');
  });

  it('holds the copy to live\'s 18px on a narrow screen', () => {
    expect(value(`${BAND} p`, 'font-size')).to.equal('18px');
    expect(value(`${BAND} p`, 'font-size', '769px')).to.equal('24px');
  });

  it('gives the button the full row on a narrow screen', () => {
    expect(value(`${BAND} .button`, 'display')).to.equal('block');
  });
});
