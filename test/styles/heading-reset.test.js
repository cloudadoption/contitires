/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The global heading line box, converted from a ratio to six absolutes.
 *
 * Live resets its headings and then writes an absolute box per level:
 *
 *   h1,h2,h3,h4,h5,h6{font-size:inherit;line-height:inherit;font-weight:inherit;margin:0}
 *   h2,.as-h2,.tire-page__title{font-size:30px;line-height:38px}
 *
 * Ours wrote `line-height: 1.2` on the shared rule, so the box followed
 * whatever size any other rule pinned. #373 took h2 to live's absolute 38 and
 * #388 took h1 to live's 48 above 1025, which left the ratio reaching h3 to h6
 * and the h1 base. This finishes it: no heading level takes a ratio, so no rule
 * that resizes a heading can drag its line box along.
 *
 * TWO OF THE SIX VALUES ARE LIVE'S AND FOUR ARE OURS, and the difference is
 * whether live's counterpart is knowable. Our h1, h2 and h3 sizes ARE live's,
 * so live's box for them is transferable: 36 and 48 on h1, 38 on h2, 32 on h3.
 * #373 recorded the h3 gap at 3.2px tight and left it because that slice was
 * scoped to h2; it closes here, which is the only rendered change this rule
 * makes. Our h4, h5 and h6 sizes are NOT live's, which runs 20, 16 and 14
 * against our 24, 20 and 18, so live's 24, 22 and 20 belong to different type
 * and transferring them would be inventing. Those three are PINNED at the value
 * they render today, the same discipline #373 used, and their delta against
 * live is not knowable while the sizes differ.
 *
 * THE PINS MUST FOLLOW THE SHARED RULE IN SOURCE ORDER, and the h4 and h5 steps
 * must follow their own base rules, because a media query adds no specificity.
 * #388 hit this: an `h1 { line-height: 48px }` written into the 1025 block near
 * the top of the file loses to the shared rule further down and renders 50.4
 * with the declaration present.
 */
describe('The global heading line box, level by level', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
  });

  /** Top-level commas only, so `:is(h1, h2, h3)` survives as one selector. */
  function parts(selector) {
    const out = [];
    let depth = 0;
    let cur = '';
    [...selector].forEach((ch) => {
      if (ch === '(' || ch === '[') depth += 1;
      if (ch === ')' || ch === ']') depth -= 1;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    });
    out.push(cur);
    return out.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /** Whether a media condition holds at a width. Both spellings, both directions. */
  function holds(condition, width) {
    const min = condition.match(/width\s*>=\s*(\d+)px|min-width:\s*(\d+)px/);
    if (min) return width >= +min.slice(1).find(Boolean);
    const lt = condition.match(/width\s*<\s*(\d+)px/);
    if (lt) return width < +lt.slice(1).find(Boolean);
    const max = condition.match(/max-width:\s*(\d+)px/);
    if (max) return width <= +max.slice(1).find(Boolean);
    return false;
  }

  /**
   * Every rule, flattened in DOCUMENT ORDER with its media conditions already
   * evaluated. Order is the point: bare element selectors share a specificity,
   * so the last one that applies is the one that renders.
   */
  function flat(width) {
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText, width))
      : [{ rule: r, applies }]));
    return walk(sheet.cssRules, true).filter(({ applies }) => applies);
  }

  /** The winning declaration of a property on a selector at a width. */
  function winning(selector, prop, width) {
    return flat(width)
      .filter(({ rule }) => rule.selectorText
        && parts(rule.selectorText).includes(selector)
        && rule.style.getPropertyValue(prop))
      .map(({ rule }) => rule.style.getPropertyValue(prop).trim())
      .pop() || null;
  }

  const SHARED = 'h1, h2, h3, h4, h5, h6';

  it('leaves no line-height on the shared rule, where live sets inherit', () => {
    const rule = [...sheet.cssRules]
      .filter((r) => !(r instanceof CSSMediaRule))
      .find((r) => r.selectorText && parts(r.selectorText).join(', ') === SHARED);
    expect(rule, 'the shared heading rule').to.exist;
    expect(rule.style.getPropertyValue('line-height'), 'its line-height').to.equal('');
  });

  // h1 h2 h3 are live's own numbers; h4 h5 h6 are pinned at today's render
  const BOXES = {
    h1: ['36px', '36px', '48px'],
    h2: ['38px', '38px', '38px'],
    h3: ['32px', '32px', '32px'],
    h4: ['28.8px', '31.2px', '31.2px'],
    h5: ['24px', '26.4px', '26.4px'],
    h6: ['21.6px', '21.6px', '21.6px'],
  };

  Object.entries(BOXES).forEach(([level, expected]) => {
    it(`gives ${level} an absolute box at 375, 900 and 1440`, () => {
      [375, 900, 1440].forEach((w, i) => {
        expect(winning(level, 'line-height', w), `${level} at ${w}`).to.equal(expected[i]);
      });
    });
  });

  /**
   * The guard that says the ratio is gone rather than merely overridden. A
   * unitless line-height anywhere in the winning position means some heading
   * still derives its box from its size, which is the whole defect: it is what
   * let `blocks/cards/cards.css` turn a 50px box into 114px on #371.
   */
  it('leaves no unitless line-height winning on any level at any width', () => {
    const loose = [];
    Object.keys(BOXES).forEach((level) => {
      [375, 900, 1024, 1025, 1440].forEach((w) => {
        const v = winning(level, 'line-height', w);
        if (v && !v.endsWith('px')) loose.push(`${level} at ${w} is ${v}`);
      });
    });
    expect(loose, 'levels still on a ratio').to.deep.equal([]);
  });

  it('steps h1 at live\'s 1025 and h4 and h5 at the 900 their sizes step on', () => {
    expect(winning('h1', 'line-height', 1024), 'h1 at 1024').to.equal('36px');
    expect(winning('h1', 'line-height', 1025), 'h1 at 1025').to.equal('48px');
    expect(winning('h4', 'line-height', 899), 'h4 at 899').to.equal('28.8px');
    expect(winning('h4', 'line-height', 900), 'h4 at 900').to.equal('31.2px');
    expect(winning('h5', 'line-height', 899), 'h5 at 899').to.equal('24px');
    expect(winning('h5', 'line-height', 900), 'h5 at 900').to.equal('26.4px');
  });

  /**
   * The pinned boxes follow the sizes they freeze. h4 and h5 are the only two
   * levels whose SIZE steps at 900, so a single unstepped pin would hold a 24px
   * box on a 26px h4 above the breakpoint. This is the shape of the bug
   * `75a2746` had to fix on two block pins: a base pin with no upper bound
   * overrode at every width and four homepage headings read 33.6 at 1440.
   */
  it('keeps each pinned box at 1.2 times the size it freezes', () => {
    const size = (name, w) => parseFloat(flat(w)
      .filter(({ rule }) => rule.selectorText === ':root' && rule.style.getPropertyValue(name))
      .map(({ rule }) => rule.style.getPropertyValue(name).trim())
      .pop());
    [['h4', '--heading-font-size-m'], ['h5', '--heading-font-size-s'],
      ['h6', '--heading-font-size-xs']].forEach(([level, name]) => {
      [375, 900, 1440].forEach((w) => {
        expect(parseFloat(winning(level, 'line-height', w)), `${level} at ${w}`)
          .to.be.closeTo(size(name, w) * 1.2, 0.001);
      });
    });
  });
});

/**
 * The block rules that resize a heading and let the global box reach them.
 *
 * This is the audit gate, and it is the half of the slice that stops the change
 * being a regression. With a ratio on the shared rule, a rule that pins a
 * font-size and no line-height rendered 1.2 times its own size. With an
 * absolute per level it renders THE LEVEL'S box on whatever size it pinned, so
 * an 18px card heading jumps from 21.6 to h3's 32.
 *
 * A STATIC GREP NAMES THESE AND CANNOT CLOSE THE GATE. It misses a line-height
 * arriving from another rule that also matches the element, which is why every
 * one of these was checked against the computed line-heights the before-and-
 * after sweep read on all 327 indexed pages at three widths, and why the h2
 * rules the same grep flags are absent from this list: h2 has carried an
 * absolute 38 since #373, so those rules already render what they will render.
 *
 * Each value below is what the rule renders TODAY, so the page does not move.
 * They are pins and not live's numbers, the same as #373's, and each is 1.2
 * times the size in the rule above it.
 */
describe('The block rules that resize a heading keep their own box', () => {
  const sheets = {};

  // file, selector, the condition it sits under, the box it must declare
  const PINS = [
    ['/blocks/cards/cards.css',
      '.cards .cards-card-body :is(h1, h2, h3, h4, h5, h6)', null, '21.6px'],
    ['/blocks/cards/cards.css',
      '.cards.highlights .cards-card-body :is(h1, h2, h3, h4, h5, h6)', null, '19.2px'],
    ['/blocks/store-locator/store-locator.css',
      '.store-locator-search h3', null, '36px'],
    ['/styles/article.css',
      'body.article main .section .default-content-wrapper h3', null, '24px'],
    ['/styles/article.css',
      'body.article main .section .default-content-wrapper h4', null, '20.4px'],
  ];

  before(async () => {
    await Promise.all([...new Set(PINS.map(([f]) => f))].map(async (f) => {
      const s = new CSSStyleSheet();
      await s.replace(await (await fetch(f)).text());
      sheets[f] = s;
    }));
  });

  function parts(selector) {
    const out = [];
    let depth = 0;
    let cur = '';
    [...selector].forEach((ch) => {
      if (ch === '(' || ch === '[') depth += 1;
      if (ch === ')' || ch === ']') depth -= 1;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    });
    out.push(cur);
    return out.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  function declarations(file, selector, prop) {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const walk = (rules, media) => [...rules].flatMap((r) => {
      if (r instanceof CSSMediaRule) return walk(r.cssRules, r.conditionText);
      if (!r.selectorText || !r.style.getPropertyValue(prop)) return [];
      return parts(r.selectorText).includes(norm(selector))
        ? [{ value: r.style.getPropertyValue(prop).trim(), media }]
        : [];
    });
    return walk(sheets[file].cssRules, null);
  }

  // the label is the whole selector, not its last word: two of these end in
  // `:is(h1, h2, h3, h4, h5, h6)` and a tail-word label named both `h6)`, so
  // one failing read as the other and the pair read as one test
  PINS.forEach(([file, selector, media, expected]) => {
    const where = media ? `under ${media}` : 'unconditionally';
    it(`pins ${selector} in ${file.split('/').pop()} ${where}`, () => {
      const got = declarations(file, selector, 'line-height')
        .find((d) => (media ? (d.media || '').includes(media) : d.media === null));
      expect(got, `a line-height for ${selector} ${where}`).to.exist;
      expect(got.value).to.equal(expected);
    });
  });

  /**
   * The store-locator search heading must NOT take a blanket box. Its rule
   * names all six levels at 30px, and an h2 there renders live's global 38
   * today where the other five render 36. One value for all six moves the h2.
   */
  it('leaves the store-locator h2 on the global 38, which it renders today', () => {
    expect(declarations(
      '/blocks/store-locator/store-locator.css',
      '.store-locator-search h2',
      'line-height',
    ), 'a box on the h2').to.have.lengthOf(0);
  });
});

/**
 * The confidence band, issue #393. Live leaves 8px between the band title and
 * the paragraph under it at 375, 900 and 1440. We leave 14px at 375 and 19px at
 * the other two, measured on /vancontact-as-ultra.
 *
 * THE HEADING'S OWN MARGIN IS NOT WHAT PRODUCES IT, which #393 half states and
 * is worth writing down because it decides the fix. The two margins COLLAPSE,
 * so the gap is the LARGER of them rather than their sum: the title's
 * `margin-bottom: 0.25em` is 7.5px at 30px and 10.5px at 42px, the paragraph's
 * `margin-top: 0.8em` is 14.4px at 18px and 19.2px at 24px, and 14 and 19 are
 * the paragraph's numbers. 7.5 plus 14.4 is 21.9, which is not what renders.
 * So pinning the title's margin alone leaves the gap exactly where it is, and
 * the global `margin-bottom: 0.25em` on row 1 of #395 is not the operative
 * declaration on the one instance row 1 was measured on.
 *
 * Live pins the title itself, `.warranty-hero__title{margin-bottom:var(--space-8)}`,
 * and its paragraph opens no box above. Both halves are needed here.
 *
 * The band is on 47 of the 327 indexed pages, the homepage and the 46 product
 * pages, enumerated in `.mossy/parity/381/sweep-pages.tsv`.
 */
describe('The confidence band gap', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/cards/cards.css')).text());
  });

  const BAND = 'main .section.dark.cards-container:has(.cards.coverage) .default-content-wrapper';

  function value(selector, prop) {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const walk = (rules) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules)
      : [r]));
    return walk(sheet.cssRules)
      .filter((r) => r.selectorText && norm(r.selectorText) === norm(selector)
        && r.style.getPropertyValue(prop))
      .map((r) => r.style.getPropertyValue(prop).trim())
      .pop() || null;
  }

  it('pins live\'s 8px under the band title', () => {
    expect(value(`${BAND} h2`, 'margin-bottom'), 'the title margin').to.equal('8px');
  });

  it('opens no box above the paragraph, so the 8px is what collapses', () => {
    expect(value(`${BAND} h2 + p`, 'margin-top'), 'the paragraph margin').to.equal('0px');
  });
});
