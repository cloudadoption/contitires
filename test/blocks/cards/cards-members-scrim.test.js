/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The `members` tile prints a show's name in white over a photograph, and the
 * only thing making that readable is the scrim the tile draws across its foot.
 * At `rgb(0 0 0 / 60%)` it is not enough on a light picture.
 *
 * Measured from the captured 1440 screenshots on 2026-07-30, sampling the
 * backdrop pixels beside the label text (never the glyphs, which are white and
 * would report 1:1 against themselves) and taking the 10th percentile of the
 * contrast ratio against white:
 *
 *   tile                    live   ours
 *   The Straight Pipes      5.77   5.70
 *   Gears & Gasoline        4.68   4.01   fails 4.5:1
 *   Speed Academy           5.25   5.18
 *   Engineering Explained   5.27   5.13
 *   Dinner With Racers      3.58   3.44   fails 4.5:1, and live fails it too
 *
 * So live does NOT read cleanly here: it fails 4.5:1 on its own Dinner With
 * Racers tile. Ours is a little weaker again on every tile. Accessibility is
 * gated everywhere on this site, and a stronger scrim is a difference in our
 * favour, so this variant clears 4.5:1 on all five where live clears four.
 *
 * Lighthouse cannot score this: its contrast audit skips text over a
 * background image because it cannot resolve the backdrop. The proof is the
 * pixel measurement in `.mossy/parity/251/contrast-backdrop.py`, not a PSI row.
 *
 * This test pins the scrim that produced those ratios. The ratios themselves
 * are proved against the rendered page, not here.
 */
describe('Cards, the members tile scrim', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  /** The declared value of one property in one rule of the sheet. */
  function declared(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => r.selectorText === selector);
    expect(rules, `a rule for ${selector}`).to.have.length.greaterThan(0);
    return rules.map((r) => r.style.getPropertyValue(prop)).filter(Boolean).pop();
  }

  it('shades the foot of the photo hard enough to read white over', () => {
    const bg = declared('.cards.members > ul > li::after', 'background');
    expect(bg, 'the scrim gradient').to.contain('linear-gradient');
    // Chrome serialises `rgb(0 0 0 / 60%)` as `rgba(0, 0, 0, 0.6)`, so read
    // both the percentage and the decimal form.
    const pct = [...bg.matchAll(/rgba?\([^)]*?\/\s*([\d.]+)%\)/g)].map((m) => parseFloat(m[1]));
    const dec = [...bg.matchAll(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/g)]
      .map((m) => parseFloat(m[1]) * 100);
    const alphas = [...pct, ...dec];
    expect(alphas.length, 'at least two colour stops').to.be.greaterThan(1);
    expect(Math.max(...alphas), 'the darkest stop').to.be.at.least(85);
  });

  it('keeps the name white so the scrim is what carries the contrast', () => {
    const color = declared('.cards.members .cards-card-body a:any-link', 'color');
    expect(color).to.contain('--conti-white');
  });
});
