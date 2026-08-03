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

/**
 * Stag Sans on the FIRST paint, which is what closes the shift the fallback
 * above only shrinks. Issue #197.
 *
 * The fallback removed 47 of the 55 article titles that changed line count when
 * the webfont replaced Arial. Eight are left at 412 and 19 at 375, each moving
 * the body by one h1 line, 36px, and the ratio cannot take them: swept from 90%
 * to 95% in 0.1 steps over 220 real titles at four widths, the best value leaves
 * 31 line-count changes against the shipped value's 33. Two typefaces do not
 * wrap alike and no advance-width ratio makes them.
 *
 * So the swap has to stop landing after the paint, and BOTH of these are needed
 * for that. Measured cold on /learn/how-do-smokey-burnout at 412:
 *
 *   nothing                     CLS 0.0552, the body moving 36px at 5336ms
 *   the three preloads alone    CLS 0.0515, the font in hand at 149ms and unused
 *   fonts.css eager alone       CLS 0.0552, the woff requested at 2485ms
 *   both                        CLS 0
 *
 * A preload alone fails because loadFonts() fetches fonts.css in the LAZY phase
 * below 769, so the faces are not registered when the page paints and the bytes
 * sit in the cache with nothing asking for them. fonts.css eager alone fails
 * because a woff is requested when layout first needs it, which is the paint.
 *
 * The preloads name their URLs a second time, so the pairing is asserted rather
 * than trusted: a src edited in fonts.css and not here would fetch 82KB of woff
 * that nothing uses and leave the swap where it was.
 */
describe('Stag Sans on the first paint (#197)', () => {
  let head;
  let faceUrls;

  before(async () => {
    head = await (await fetch('/head.html')).text();
    const sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/fonts.css')).text());
    faceUrls = [...sheet.cssRules]
      .filter((rule) => rule instanceof CSSFontFaceRule)
      .map((rule) => ({
        style: rule.style.getPropertyValue('font-style') || 'normal',
        url: (rule.cssText.match(/url\(["']?([^"')]+)["']?\)/) || [])[1],
      }))
      .filter((face) => face.url);
  });

  /** Every font preload head.html declares. */
  const preloads = () => [...head.matchAll(/<link[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /rel="preload"/.test(tag) && /as="font"/.test(tag))
    .map((tag) => ({ tag, href: (tag.match(/href="([^"]+)"/) || [])[1] }));

  it('loads fonts.css render-blocking, so the faces exist when the page paints', () => {
    expect(head, 'a stylesheet link for fonts.css in head.html')
      .to.match(/<link[^>]+rel="stylesheet"[^>]+href="\/styles\/fonts\.css"/);
  });

  it('preloads a woff per upright face, with as=font and crossorigin', () => {
    // italic is left out deliberately: it is one face of the five, and a preload
    // costs its bytes on every page while the italic copy that would use it is
    // on none of the pages this issue measured
    const upright = [...new Set(faceUrls.filter((f) => f.style === 'normal').map((f) => f.url))];
    expect(upright, 'upright faces in fonts.css').to.have.length.greaterThan(0);
    const declared = preloads().map((p) => p.href);
    upright.forEach((url) => {
      expect(declared, `a preload for ${url.split('/').pop()}`).to.contain(url);
    });
    preloads().forEach(({ tag }) => {
      expect(tag, tag).to.contain('as="font"');
      expect(tag, tag).to.contain('crossorigin');
    });
  });

  it('preloads nothing fonts.css does not ask for', () => {
    const known = new Set(faceUrls.map((f) => f.url));
    preloads().forEach(({ href }) => {
      expect(known.has(href), `${href} is a src in fonts.css`).to.be.true;
    });
  });
});
