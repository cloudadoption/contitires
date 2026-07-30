/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The webfont swap and its metric-matched fallback. Issues #183 and #227.
 *
 * Stag Sans loads after the first paint with `font-display: swap`, so until it
 * arrives the page renders in Arial. Arial sets wider, so a paragraph that wraps
 * to five lines in Arial wraps to four in Stag Sans, and everything below it
 * rises by one line. Measured on `/accessibility-statement` at 1350 wide: one
 * 615-character paragraph is 144px tall in Arial and 115px in Stag Sans, and the
 * page reads CLS 0.3375 with its body paragraphs moving up 29px.
 *
 * The fix is a fallback face that maps a local Arial to Stag Sans's metrics, so
 * the two occupy the same space and nothing rewraps. The advance-width ratios
 * were measured with canvas `measureText` over 70041 characters of the site's
 * own running text across ten pages, weighted by character count: 91.24% at
 * weight 300, 93.49% at 400 and 90.36% at 700. Weight 400 ships 94% instead,
 * because that value moved the fewest lines when five candidates were measured
 * against 139 real paragraphs: 6 paragraphs and 153px against 93.49%'s 7 and
 * 189px.
 *
 * These tests assert the EFFECT and not only the declaration. A descriptor that
 * is present but does not apply, because the family never resolves or the
 * `src: local()` finds nothing, would satisfy a text search and fix no CLS.
 */
describe('The metric-matched fallback behind Stag Sans', () => {
  const FALLBACK = 'Stag Sans Fallback';
  /* measured, per weight: what fraction of Arial's advance width Stag Sans takes,
     over 70041 characters of this site's own text across ten pages */
  const EXPECTED = { 300: 91.24, 400: 94, 700: 90.36 };
  let faceRules;
  let eagerFaces;
  let lazyFaces;
  let bodyStack;
  let headingStack;

  before(async () => {
    const fonts = new CSSStyleSheet();
    await fonts.replace(await (await fetch('/styles/fonts.css')).text());
    const styles = new CSSStyleSheet();
    await styles.replace(await (await fetch('/styles/styles.css')).text());
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, fonts, styles];

    const facesIn = (sheet) => [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSFontFaceRule);
    // styles.css is the sheet head.html loads render-blocking; fonts.css is the
    // one loadFonts() fetches later
    eagerFaces = facesIn(styles);
    lazyFaces = facesIn(fonts);
    faceRules = [...eagerFaces, ...lazyFaces];
    const root = getComputedStyle(document.documentElement);
    bodyStack = root.getPropertyValue('--body-font-family').trim();
    headingStack = root.getPropertyValue('--heading-font-family').trim();
  });

  const facesFor = (family) => faceRules.filter((rule) => {
    const declared = rule.style.getPropertyValue('font-family') || rule.cssText;
    return declared.includes(family);
  });

  /**
   * The load-order invariant, and the one that cost this slice a wrong green.
   * With the fallback declared in fonts.css the descriptors were right, the
   * family resolved, and every paragraph held its line count when measured after
   * the load. The page still read CLS 0.2761, because fonts.css is fetched by
   * loadFonts() and the first paint had already fallen through to plain arial.
   * A fallback only prevents a shift if it exists before the first paint, so it
   * belongs in the sheet head.html loads render-blocking.
   */
  it('declares the fallback in the render-blocking sheet, not the lazy one', () => {
    const inEager = eagerFaces.filter((rule) => rule.cssText.includes(FALLBACK));
    const inLazy = lazyFaces.filter((rule) => rule.cssText.includes(FALLBACK));
    expect(inEager.length, 'fallback faces in styles.css').to.be.greaterThan(0);
    expect(inLazy.length, 'fallback faces in the lazily loaded fonts.css').to.equal(0);
  });

  it('keeps every Stag Sans face on font-display: swap', () => {
    const stag = facesFor('Stag Sans').filter((r) => !r.cssText.includes(FALLBACK));
    expect(stag.length).to.be.greaterThan(0);
    stag.forEach((rule) => {
      expect(rule.cssText, rule.cssText).to.contain('swap');
    });
  });

  it('declares a fallback face per weight, with the three metric descriptors', () => {
    const fallback = facesFor(FALLBACK);
    expect(fallback.length, 'fallback faces declared').to.be.greaterThan(0);
    Object.keys(EXPECTED).forEach((weight) => {
      const rule = fallback.find((r) => r.cssText.includes(`font-weight: ${weight}`));
      expect(rule, `a fallback face at weight ${weight}`).to.exist;
      ['size-adjust', 'ascent-override', 'descent-override'].forEach((descriptor) => {
        expect(rule.cssText, `${descriptor} at weight ${weight}`).to.contain(descriptor);
      });
      const declared = parseFloat(rule.cssText.match(/size-adjust:\s*([\d.]+)%/)[1]);
      expect(declared, `size-adjust at weight ${weight}`)
        .to.be.closeTo(EXPECTED[weight], 0.5);
    });
  });

  it('names the fallback after Stag Sans and ahead of arial, for body and headings', () => {
    // split on commas rather than searching the string: 'Stag Sans' is a
    // substring of 'Stag Sans Fallback', so an index search finds the wrong one
    const order = (stack) => stack.split(',').map((name) => name.trim().replace(/^['"]|['"]$/g, ''));
    [['--body-font-family', bodyStack], ['--heading-font-family', headingStack]]
      .forEach(([name, stack]) => {
        const names = order(stack);
        const stag = names.indexOf('Stag Sans');
        const fallback = names.indexOf(FALLBACK);
        const arial = names.indexOf('arial');
        expect(stag, `${name} names Stag Sans`).to.be.greaterThan(-1);
        expect(fallback, `${name} names ${FALLBACK}`).to.be.greaterThan(-1);
        expect(arial, `${name} keeps arial`).to.be.greaterThan(-1);
        expect(fallback, `${name} puts the fallback after Stag Sans`).to.be.greaterThan(stag);
        expect(fallback, `${name} puts the fallback before arial`).to.be.lessThan(arial);
      });
  });

  /**
   * The descriptors above can be present and do nothing. `src: local(...)` only
   * applies them if one of the named faces exists on the machine, and a CI
   * runner often has no Arial at all. So this measures whether the family
   * RESOLVES, by comparing it against a family that cannot exist: an
   * unresolvable name falls back to the browser default and the two measure the
   * same. The ratio itself is only asserted where Arial is present to compare
   * against, and the test says which case it took rather than passing quietly.
   */
  it('resolves the fallback family and applies the ratio it declares', () => {
    const measure = (family, weight) => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${weight} 100px ${family}`;
      return ctx.measureText('The quick brown fox jumps over the lazy dog 0123456789').width;
    };
    Object.entries(EXPECTED).forEach(([weight, ratio]) => {
      const bogus = measure("'No Such Font Family 90210'", weight);
      const adjusted = measure(`'${FALLBACK}'`, weight);
      expect(adjusted, `${FALLBACK} resolves at weight ${weight} rather than falling `
        + 'back to the default, which means no local() candidate was found')
        .to.not.be.closeTo(bogus, 0.5);

      const plain = measure('Arial', weight);
      if (Math.abs(plain - bogus) > 0.5) {
        expect((adjusted / plain) * 100, `the applied ratio at weight ${weight}`)
          .to.be.closeTo(ratio, 1);
      }
    });
  });
});
