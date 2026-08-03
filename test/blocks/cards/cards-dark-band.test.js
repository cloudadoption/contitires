/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * A plain `cards` block on a dark band, which is what `/dealers` is.
 *
 * The selector is `.cards.plain`, a class `cards.js` adds when the block carries
 * none of the ten variant classes. A `:not()` chain over all ten would work and
 * would have to be edited every time an eleventh appears, and
 * `:not([class*=" "])` cannot work at all: the decorated block reads
 * `class="cards block"`, so it always holds a space.
 *
 * Live puts its three dealer cards on a charcoal band and ours sat on white, so
 * the white card bodies dissolved into the page and only the black logo tiles
 * read as cards at all. The band is the section's, not the block's: live's
 * `.card-list` sets `--background-color: var(--black)` with `--black: #333` and
 * pads 80px top and bottom.
 *
 * That is a section `Style` here, so the band itself is authored. What the
 * stylesheet has to do is keep the tile readable once the band goes dark, which
 * is the same problem `.cards.highlights` already solved: the band paints its
 * headings and links white, and a white tile needs its own dark text back.
 *
 * The call to action is the second half. Live wraps it in `.link-button`, which
 * is 12px bold uppercase at 1.25px tracking in an inline-flex box, underlined in
 * `--dark-yellow`, `#c27e00`, with an arrow after the words at 0.5em. Ours was
 * 16px weight 400 in the authored case with a plain underline and no mark. All
 * of those values are read out of live's own stylesheet rather than off a
 * screenshot, `themes/custom/nextcontinental/dist/css/styles.css`.
 *
 * The photograph is the third. The authored file is 752x423, which is 16:9, and
 * the base rule crops every plain card to 4:3, so the Engage 360 logo lost both
 * of its ends. Live's card media is 16:9. The correction is scoped to the dark
 * band rather than applied to the base rule, because what live does on the other
 * pages carrying a plain `cards` block is unmeasured and a base change reaches
 * all of them.
 */
describe('Cards on a dark band', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  /** The value a property takes in the last rule whose selector list holds `selector`. */
  function declared(selector, prop) {
    const rules = [...sheet.cssRules].filter((r) => r.selectorText
      && r.selectorText.split(',').map((s) => s.trim()).includes(selector));
    expect(rules, `a rule for ${selector}`).to.have.length.greaterThan(0);
    return rules.map((r) => r.style.getPropertyValue(prop)).filter(Boolean).pop();
  }

  /** Every rule in the sheet whose selector list holds `selector`, media queries included. */
  function anyRule(selector, prop) {
    const out = [];
    const walk = (rules) => [...rules].forEach((r) => {
      if (r.cssRules) walk(r.cssRules);
      else if (r.selectorText && r.selectorText.split(',').map((s) => s.trim()).includes(selector)) {
        const v = r.style.getPropertyValue(prop);
        if (v) out.push(v);
      }
    });
    walk(sheet.cssRules);
    return out;
  }

  it('keeps the tile body dark on a dark section, the way the highlights tile does', () => {
    ['main .section.dark .cards.plain .cards-card-body',
      'main .section.black .cards.plain .cards-card-body'].forEach((sel) => {
      expect(declared(sel, 'color'), sel).to.contain('--conti-black');
    });
  });

  it('keeps the tile itself white where the band is dark', () => {
    const bg = declared('main .section.dark .cards.plain > ul > li', 'background-color');
    expect(bg).to.contain('--conti-white');
  });

  it("gives the call to action live's link-button treatment", () => {
    const sel = 'main .section.dark .cards.plain .cards-card-body a:any-link';
    expect(declared(sel, 'text-transform'), 'uppercase').to.equal('uppercase');
    expect(declared(sel, 'font-weight'), 'bold').to.equal('700');
    expect(declared(sel, 'font-size'), '12px').to.equal('12px');
    expect(declared(sel, 'letter-spacing'), '1.25px').to.equal('1.25px');
    expect(declared(sel, 'display'), 'inline-flex').to.equal('inline-flex');
  });

  it("underlines it in live's dark yellow rather than in the text colour", () => {
    const sel = 'main .section.dark .cards.plain .cards-card-body a:any-link';
    expect(declared(sel, 'text-decoration-line')).to.equal('underline');
    expect(declared(sel, 'text-decoration-color')).to.contain('#c27e00');
  });

  it('spaces the arrow after the words, at the gap live uses', () => {
    const sel = 'main .section.dark .cards.plain .cards-card-body a:any-link .icon';
    expect(declared(sel, 'margin-inline-start')).to.equal('0.5em');
  });

  it("holds the photograph at live's 16:9 rather than cropping it to 4:3", () => {
    const base = anyRule('.cards > ul > li img', 'aspect-ratio');
    expect(base, 'the base rule still crops to 4/3').to.include('4 / 3');
    const dark = anyRule('main .section.dark .cards.plain > ul > li img', 'aspect-ratio');
    expect(dark, 'the dark band takes 16/9').to.include('16 / 9');
  });
});
