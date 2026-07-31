/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

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

/** The winning declaration for a selector at a width, resolved in document order. */
function resolver(sheet) {
  return (selector, prop, width) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText, width))
      : [{ rule: r, applies }]));
    return walk(sheet.cssRules, true)
      .filter(({ applies, rule }) => applies && rule.selectorText
        && parts(rule.selectorText).includes(norm(selector))
        && rule.style.getPropertyValue(prop))
      .map(({ rule }) => rule.style.getPropertyValue(prop).trim())
      .pop() || null;
  };
}

/**
 * The carousel slide title, which #371 promotes from h3 to h2.
 *
 * #386 made this rule level-agnostic while the shared heading rule still carried
 * `line-height: 1.2`, and #395 replaced that ratio with an absolute per level.
 * Re-measured under the new shape on http://localhost:3000 at 375, 900 and 1440,
 * promoting each of the seven slide titles in the DOM and reading both states:
 * size 24 to 30, box 32 to 38, weight 400 throughout, margin-top 0 throughout.
 * Live is 30 on a 38px box at weight 400, so the promotion lands on live's own
 * numbers and #386's margin-top survives the reset. That half needs nothing.
 *
 * THE BOTTOM MARGIN IS WHAT THE PROMOTION MOVES THE WRONG WAY. Live leaves 0
 * under every slide title at all three widths. The global heading rule leaves
 * `margin-bottom: 0.25em`, which #395 deliberately kept proportional, so ours is
 * 6px on a 24px h3 today and would be 7.5px on a 30px h2. The promotion widens
 * an existing 6px gap to 7.5 rather than closing it, which is #356's trap in the
 * one property nobody had measured on this block.
 *
 * It sits on the same rule as the top margin and is keyed the same way, so it
 * survives whatever level the slide authors.
 */
describe('The carousel slide title margins', () => {
  let sheet;
  let winning;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/carousel/carousel.css')).text());
    winning = resolver(sheet);
  });

  const TITLE = '.carousel-content :is(h1, h2, h3, h4, h5, h6)';

  it('keeps live\'s 0 above the title on whatever level the slide authors', () => {
    [375, 900, 1440].forEach((w) => {
      expect(winning(TITLE, 'margin-top', w), `at ${w}`).to.equal('0px');
    });
  });

  it('takes live\'s 0 below the title, where the global 0.25em leaves 6 then 7.5', () => {
    [375, 900, 1440].forEach((w) => {
      expect(winning(TITLE, 'margin-bottom', w), `at ${w}`).to.equal('0px');
    });
  });
});

/**
 * The article subheads, which #372 demotes from h2 to h3 or h4.
 *
 * EVERY NUMBER HERE WAS READ OFF LIVE'S RENDERED PAGES, on all eight documents
 * #372 names, at 375, 900 and 1440, keyed by heading TEXT rather than by index
 * because live is a different CMS. The two breakpoints were then bisected on
 * live rather than assumed from ours:
 *
 *   h3   20px at every width; box 30px below 769, 32px from 769
 *   h4   14px on a 20px box below 1025; 20px on a 30px box from 1025
 *
 * Both are weight 700, which `:is(h3, h4)` already sets from #353.
 *
 * THE VALUES THESE REPLACE WERE GUESSES AND #395 SAID SO. It froze h3 at 24px
 * and h4 at 17/20.4, being 1.2 times a size nothing rendered, because no article
 * page authored either level and live's counterpart had not been measured. It is
 * measured now, so the frozen numbers give way to live's.
 *
 * THE RULES REACH NOTHING TODAY, censused rather than assumed: 8 of the 327
 * published paths carry an authored h3 or h4, and on all 8 the selector
 * `body.article main .section .default-content-wrapper :is(h3, h4)` matches zero
 * elements, because not one of those pages is an article. So this moves no page
 * until #372's documents are written.
 */
describe('The article subhead levels #372 writes', () => {
  let sheet;
  let winning;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/article.css')).text());
    winning = resolver(sheet);
  });

  const WRAP = 'body.article main .section .default-content-wrapper';

  it('gives h3 live\'s 20px at every width', () => {
    [375, 900, 1440].forEach((w) => {
      expect(winning(`${WRAP} h3`, 'font-size', w), `at ${w}`).to.equal('20px');
    });
  });

  it('gives h3 live\'s box, 30 below 769 and 32 above', () => {
    expect(winning(`${WRAP} h3`, 'line-height', 375), 'at 375').to.equal('30px');
    expect(winning(`${WRAP} h3`, 'line-height', 768), 'at 768').to.equal('30px');
    expect(winning(`${WRAP} h3`, 'line-height', 769), 'at 769').to.equal('32px');
    expect(winning(`${WRAP} h3`, 'line-height', 1440), 'at 1440').to.equal('32px');
  });

  it('gives h4 live\'s 14px below 1025 and 20px above', () => {
    expect(winning(`${WRAP} h4`, 'font-size', 375), 'at 375').to.equal('14px');
    expect(winning(`${WRAP} h4`, 'font-size', 1024), 'at 1024').to.equal('14px');
    expect(winning(`${WRAP} h4`, 'font-size', 1025), 'at 1025').to.equal('20px');
  });

  it('gives h4 live\'s box, 20 below 1025 and 30 above', () => {
    expect(winning(`${WRAP} h4`, 'line-height', 375), 'at 375').to.equal('20px');
    expect(winning(`${WRAP} h4`, 'line-height', 1024), 'at 1024').to.equal('20px');
    expect(winning(`${WRAP} h4`, 'line-height', 1025), 'at 1025').to.equal('30px');
  });

  /**
   * The room above a subhead that follows content. Live leaves 45px, its own
   * `--space-45`, on every one of the 15 across the eight pages, and 0 where the
   * subhead opens its section, which is the same structure `> * + *` already
   * produces here.
   *
   * WITHOUT THIS THE DEMOTION LOSES 14px. `> * + * { margin-top: 1.4em }`
   * resolves against the CHILD's size, so a 30px h2 gets 42 and a 20px h3 gets
   * 28. Ours is 3px under live today and would be 17px under it after the write,
   * at 900 and 1440. Same trap as the slide title's bottom margin, one property
   * over.
   */
  it('leaves live\'s 45px above a subhead that follows content', () => {
    [375, 900, 1440].forEach((w) => {
      expect(winning(`${WRAP} > * + :is(h3, h4)`, 'margin-top', w), `at ${w}`).to.equal('45px');
    });
  });
});
