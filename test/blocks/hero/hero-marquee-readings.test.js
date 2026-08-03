/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';

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
    const matches = (r) => r.selectorText?.split(',').map((s) => s.trim()).includes(selector);
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

  // #407. Live tracks the marquee title on 12 of these 13 pages, and the
  // tracking is on a `span.text-uppercase` rather than on the h1: live's own h1
  // computes `normal` everywhere. Our titles carry no span at all, so the rule
  // goes on the h1. 5px below live's 1025 step and 6px above, bracketed at 1024
  // and 1025 on /tires, which is the same pixel #408 turns on.
  // `:not(.stacked)` is needed here where #408 did not need it: live tracks
  // nothing on /experience, so reaching the stacked variant would open a
  // divergence rather than close one.
  it("tracks the left marquee title at live's 5px below 1025", () => {
    expect(value('.hero.left:not(.stacked) .hero-content h1', 'letter-spacing')).to.equal('5px');
  });

  it("takes it to live's 6px above the step", () => {
    expect(value('.hero.left:not(.stacked) .hero-content h1', 'letter-spacing', '1025px')).to.equal('6px');
  });

  // #407, the one exception. Live tracks 12 of the 13 and leaves
  // /tires/all-weather alone, because live's own markup omits the
  // `span.text-uppercase` there that its twelve siblings carry: live's
  // stylesheet reaches the page and live's content does not. Our side is
  // uniform, so nothing in the markup distinguishes it except the id the
  // pipeline slugs from the title, which is what this keys on.
  // Tracking it anyway costs a line: at 375 it renders 2 where live renders 1.
  // One id beats a class inside a media query, so the base rule covers 6px too.
  it('leaves /tires/all-weather untracked, as live leaves it', () => {
    expect(value('.hero.left:not(.stacked) .hero-content h1#all-weather-tires', 'letter-spacing')).to.equal('normal');
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

/**
 * The same two tracking steps read off a RENDERED element rather than out of the
 * CSSOM. The `value()` helper above cannot see this: given a media argument it
 * filters to rules inside that query and without one to rules outside any query,
 * and it never compares across the two, so a declaration that is present and then
 * beaten by source order reads as correct. That is exactly what happened here,
 * and the line counts could not see it either because 5px against 6px changes no
 * wrap. This assertion is the one that can go red on it. (#407)
 */
describe('Hero marquee tracking, as it renders', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    document.body.innerHTML = `
      <main><div class="section">
        <div class="hero left short block">
          <div><div><h1 id="our-engineeringyour-confidence">OUR ENGINEERING.</h1></div></div>
        </div>
      </div></main>`;
    // the block ships its copy cell as `.hero-content`; the decorator is not
    // under test here, so the class is set directly
    document.querySelector('.hero.left > div > div').className = 'hero-content';
  });

  after(async () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    document.body.innerHTML = '';
    await setViewport({ width: 1440, height: 900 });
  });

  const tracking = () => getComputedStyle(document.querySelector('.hero.left .hero-content h1')).letterSpacing;

  it("renders live's 5px below the step", async () => {
    await setViewport({ width: 1024, height: 900 });
    expect(tracking()).to.equal('5px');
  });

  it("renders live's 6px above the step", async () => {
    await setViewport({ width: 1025, height: 900 });
    expect(tracking()).to.equal('6px');
  });

  it('still renders 6px at the width the parity pairs were taken at', async () => {
    await setViewport({ width: 1440, height: 900 });
    expect(tracking()).to.equal('6px');
  });
});
