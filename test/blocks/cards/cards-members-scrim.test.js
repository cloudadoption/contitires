/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The `members` tile prints a show's name in white over a photograph, and the
 * only thing making that readable is the scrim the tile draws across its foot.
 * At `rgb(0 0 0 / 60%)` it is not enough on a light picture.
 *
 * Measured out of the composited 1440 screenshots on 2026-07-30, reading the
 * text core against the backdrop it sits on, both from the same pixels:
 *
 *   tile                    live    before   after
 *   The Straight Pipes      6.78    2.01     11.31
 *   Gears & Gasoline       12.71    2.70     13.69
 *   Speed Academy          15.55    4.81     17.96
 *   Engineering Explained  16.52    5.09     18.21
 *   Dinner With Racers     16.51    5.15     17.83
 *
 * Live reads cleanly on all five, worst 6.78. Ours failed 4.5:1 on two tiles and
 * bottomed at 2.01, because the scrim was painting OVER the name as well as
 * being too weak. The fix clears live on every tile.
 *
 * A first pass measured only the BACKDROP beside the glyphs and reported the gap
 * as small, with live apparently failing its own Dinner With Racers at 3.58.
 * That instrument cannot see a scrim painted over the text, which was the actual
 * defect, so a 2.01 read as 3.44 and live looked worse than it is. Measure the
 * text against its backdrop, never the backdrop alone.
 *
 * Lighthouse cannot score this: its contrast audit skips text over a
 * background image because it cannot resolve the backdrop. The proof is the
 * pixel measurement in `.mossy/parity/251/contrast-glyph.py`, not a PSI row.
 *
 * This test pins the scrim and the layering that produced those ratios. The
 * ratios themselves are proved against the rendered page, not here.
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

  /**
   * The scrim has to paint UNDER the name, and it was painting over it.
   * Both the `::after` and the card body sat at `z-index: 1`, and a pseudo
   * element counts as its originating element's last child, so at equal z-index
   * the scrim wins on DOM order and washes the white text grey. `pointer-events:
   * none` on the scrim hid it: the link still worked, it just looked faded.
   * Darkening the scrim made this worse, not better, so the two go together.
   */
  it('paints the scrim under the name, not over it', () => {
    const scrim = Number(declared('.cards.members > ul > li::after', 'z-index'));
    const body = Number(declared('.cards.members .cards-card-body', 'z-index'));
    expect(scrim, 'the scrim is layered').to.be.a('number').and.not.NaN;
    expect(body, 'the name sits above the scrim').to.be.greaterThan(scrim);
  });
});
