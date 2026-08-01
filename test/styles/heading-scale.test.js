/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

/**
 * The global heading scale. Every number here was read off
 * continentaltire.com on a RENDERED page, not parsed out of its stylesheet:
 * the CSSOM on /events at 1440 for the bare-element rules and their media
 * conditions, and computed font sizes at 375, 900 and 1440 on four pages to
 * confirm them.
 *
 * Live's bare-element rules, with the conditions they sit under:
 *
 *   h1  --font-size-42, and --font-size-30 under max-width 1024
 *   h2  --font-size-30, under no media query at all
 *   h3  --font-size-24, under no media query at all
 *
 * So live's heading breakpoint is 1024/1025 and only h1 moves across it. Every
 * 42px h2 on live carries a block prefix (.tire-specs__header,
 * .warranty-hero__header, .sports-thumbnails__header, .tire-reviews), which is
 * the block treatment PR #8 lifted into the global scale when it read live's
 * CSS instead of live's pages. Issue #185.
 */
describe('The heading type scale', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
  });

  /** Reads a custom property off :root, optionally inside a media condition. */
  function token(name, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const rule = [...rules].reverse().find((r) => r.selectorText === ':root'
      && r.style.getPropertyValue(name));
    return rule ? rule.style.getPropertyValue(name).trim() : null;
  }

  // live: 30px at 375 and 900, 42px at 1440, measured on /events,
  // /experience/partners and /learn/how-do-i-check-my-tire-pressure
  it('takes live\'s h1 pair, 30 below 1025 and 42 above', () => {
    expect(token('--heading-font-size-xxl'), 'h1 below 1025').to.equal('30px');
    expect(token('--heading-font-size-xxl', '1025px'), 'h1 at 1025 and up').to.equal('42px');
  });

  // live's only bare h2 rule sets 30px and sits under no media query
  it('holds h2 at live\'s 30px at every width', () => {
    expect(token('--heading-font-size-xl'), 'h2 below 1025').to.equal('30px');
    expect(token('--heading-font-size-xl', '1025px')).to.be.null;
  });

  // live's only bare h3 rule sets 24px and sits under no media query
  it('holds h3 at live\'s 24px at every width', () => {
    expect(token('--heading-font-size-l'), 'h3 below 1025').to.equal('24px');
    expect(token('--heading-font-size-l', '1025px')).to.be.null;
  });

  /**
   * The size a token resolves to at a width. Reads every :root block the sheet
   * carries, base and media alike, and takes the last one whose min-width the
   * viewport has reached, which is what the cascade does. Written this way so it
   * reports the sheet as it stands rather than the sheet this slice expects.
   */
  function resolved(name, width) {
    const base = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const blocks = [{ min: 0, rules: base }].concat(
      [...sheet.cssRules]
        .filter((r) => r instanceof CSSMediaRule)
        .map((r) => ({
          min: +(r.conditionText.match(/width\s*>=\s*(\d+)px|min-width:\s*(\d+)px/) || [])
            .slice(1).find(Boolean),
          rules: [...r.cssRules],
        }))
        .filter((b) => !Number.isNaN(b.min)),
    );
    return blocks
      .filter((b) => b.min <= width)
      .sort((a, c) => a.min - c.min)
      .reduce((found, b) => {
        const rule = [...b.rules].reverse().find((r) => r.selectorText === ':root'
          && r.style.getPropertyValue(name));
        return rule ? rule.style.getPropertyValue(name).trim() : found;
      }, null);
  }

  // The whole scale as numbers, at both of live's widths. The defect #185 names
  // is the top of the 1440 column: the old scale gave h1 and h2 the same 42px,
  // so promoting h3 to h2 jumped 30 to 42 and promoting h2 to h1 changed
  // nothing at all. Live has no step below 1025 either, where h1 and h2 are
  // both 30, so this asserts live's shape rather than an even scale.
  it('resolves to live\'s numbers at both of live\'s widths', () => {
    const at = (w) => [
      resolved('--heading-font-size-xxl', w),
      resolved('--heading-font-size-xl', w),
      resolved('--heading-font-size-l', w),
    ].join(' / ');
    expect(at(375), 'h1 / h2 / h3 at 375').to.equal('30px / 30px / 24px');
    expect(at(900), 'h1 / h2 / h3 at 900').to.equal('30px / 30px / 24px');
    expect(at(1440), 'h1 / h2 / h3 at 1440').to.equal('42px / 30px / 24px');
  });

  // above 1025 the top two levels must differ, which is the promotion #117
  // needs: an h3 that becomes an h2 must not land on the h1 size
  it('separates h1 from h2 above 1025, where the old scale collapsed them', () => {
    expect(resolved('--heading-font-size-xxl', 1440))
      .to.not.equal(resolved('--heading-font-size-xl', 1440));
  });

  // the scale switches where live switches, and where this repo's own blocks
  // already switch: nine rules spell out the 30/42 pair across width >= 1025px
  it('switches at live\'s breakpoint, not at 900', () => {
    expect(token('--heading-font-size-xxl', '900px'), 'no heading token at 900').to.be.null;
  });
});

/**
 * The specs band title, which live sizes on its own class rather than on the
 * scale. Its three rules, read off live's CSSOM on /vancontact-as-ultra at
 * 1440 and confirmed against computed sizes at 375, 800, 900, 1025 and 1440:
 *
 *   .tire-specs__title                 --font-size-42, --line-height-48
 *   under max-width 1024               --font-size-30, --line-height-36
 *   under max-width 768                --font-size-32, --line-height-36
 *
 * The 768 rule follows the 1024 one in live's source, so the narrow band takes
 * 32 and not 30. Live's weight is 300 at every width, which ours already sets.
 *
 * Ours read 28px to 899 and 30px above it, so the band was wrong at four of
 * the five widths and right only between 900 and 1024. Issue #352.
 */
describe('The specs band title', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/tire-specs/tire-specs.css')).text());
  });

  /**
   * What a selector's property resolves to at a width. Walks the base rules and
   * every min-width block the sheet carries, keeps those the viewport has
   * reached, and takes the last declaration, which is what the cascade does.
   */
  function resolved(selector, prop, width) {
    const base = [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const blocks = [{ min: 0, rules: base }].concat(
      [...sheet.cssRules]
        .filter((r) => r instanceof CSSMediaRule)
        .map((r) => ({
          min: +(r.conditionText.match(/width\s*>=\s*(\d+)px|min-width:\s*(\d+)px/) || [])
            .slice(1).find(Boolean),
          rules: [...r.cssRules],
        }))
        .filter((b) => !Number.isNaN(b.min)),
    );
    const matches = (r) => r.selectorText
      && r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    return blocks
      .filter((b) => b.min <= width)
      .sort((a, c) => a.min - c.min)
      .reduce((found, b) => {
        const rule = [...b.rules].reverse().find((r) => matches(r)
          && r.style.getPropertyValue(prop));
        return rule ? rule.style.getPropertyValue(prop).trim() : found;
      }, null);
  }

  const title = '.tire-specs h2';

  it('carries live\'s 32 / 30 / 42 across live\'s two breakpoints', () => {
    const at = (w) => resolved(title, 'font-size', w);
    expect(at(375), 'below 769').to.equal('32px');
    expect(at(800), 'between 769 and 1024').to.equal('30px');
    expect(at(900), 'still between 769 and 1024').to.equal('30px');
    expect(at(1025), 'at live\'s breakpoint').to.equal('42px');
    expect(at(1440), 'above it').to.equal('42px');
  });

  it('takes live\'s line height with the size, 36 then 48', () => {
    const at = (w) => resolved(title, 'line-height', w);
    expect(at(375), 'below 769').to.equal('36px');
    expect(at(900), 'between 769 and 1024').to.equal('36px');
    expect(at(1440), 'above 1025').to.equal('48px');
  });

  it('switches where live switches, not at 900', () => {
    expect(resolved(title, 'font-size', 899), 'at 899')
      .to.equal(resolved(title, 'font-size', 900));
  });
});

/**
 * The product page title, which live keeps off the h1 step. Live renders it as
 * `<h1 class="tire-page__title">` and then sizes it with the h2 rule,
 * `h2, .as-h2, .tire-page__title { font-size: 30px; line-height: 38px }`, under
 * no media query at all. So live's product title is 30px at every width, and it
 * is the one place live deliberately refuses the h1 size for a page title.
 *
 * Ours authored it as a default-content h1, so it took the global h1 token and
 * stepped to 42px from 1025. Measured on /vancontact-as-ultra against live at
 * 375, 800, 900, 1025 and 1440: the two agree at the first three and read 30
 * against 42 at the last two. Issue #351.
 *
 * Line-height comes with it. Ours read 36 at every width, from the global 1.2 on
 * headings, where live reads 38 at every width, so the title matched live at
 * three widths and now matches at five.
 *
 * The selector is measured, not assumed: all 46 product pages carry both
 * `.columns.product-hero` and `.tire-specs` in the delivered markup, each has
 * exactly one h1, and no other page in the 327-page index carries either block.
 */
describe('The product page title', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
  });

  const title = 'main:has(.columns.product-hero, .tire-specs) h1';

  /** Every declaration of a property for a selector, base rules and media alike. */
  function declarations(selector, prop) {
    const walk = (rules) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules).map((d) => ({ ...d, media: r.conditionText }))
      : []).concat(
      r.selectorText === selector && r.style.getPropertyValue(prop)
        ? [{ value: r.style.getPropertyValue(prop).trim(), media: null }]
        : [],
    ));
    return walk(sheet.cssRules);
  }

  it('holds live\'s 30px, the h2 size, on an element that is an h1', () => {
    expect(declarations(title, 'font-size').map((d) => d.value)).to.deep.equal(['30px']);
  });

  it('takes live\'s 38px line height, not the 36 the global 1.2 gives', () => {
    expect(declarations(title, 'line-height').map((d) => d.value)).to.deep.equal(['38px']);
  });

  it('sits under no media query, because live\'s rule does not either', () => {
    const sizes = declarations(title, 'font-size');
    expect(sizes, 'the title size rule').to.have.lengthOf(1);
    expect(sizes[0].media, 'the condition it sits under').to.be.null;
  });
});

/**
 * The article body, which live sizes separately from the global scale.
 *
 *   .news-article__body h2   20px under max-width 768
 *   .article-content h2      20px under max-width 768
 *
 * Above 768 both fall back to live's global h2 at 30px. PR #184 pinned 20px at
 * every width, which is the right number at the wrong scope, and that is the
 * regression #185 records: six subheads on
 * /learn/how-do-i-check-my-tire-pressure read 20px where live reads 30px at
 * 900 and 1440. Measured on both sites at all three widths.
 */
describe('The article body subhead', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/article.css')).text());
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

  const subhead = 'body.article main .section .default-content-wrapper h2';

  it('reads live\'s 20px below 769', () => {
    expect(value(subhead, 'font-size')).to.equal('20px');
  });

  it('returns to live\'s 30px above 769, where live drops its own pin', () => {
    expect(value(subhead, 'font-size', '769px')).to.equal('30px');
  });

  /**
   * Weight, which #185 left alone deliberately because that slice was scoped to
   * the scale. Live has no weight rule for h2 or for `.news-article__body h2`,
   * so `h1..h6 { font-weight: inherit }` over `body { font-weight: normal }`
   * puts it at 400. Live DOES set `.news-article__body h3` to 700 and body h4
   * to 700. Ours had all three at 300. Issue #353.
   *
   * The h2 half is photographed: six subheads on
   * /learn/how-do-i-check-my-tire-pressure, live against ours at 375, 900 and
   * 1440. The h3 and h4 half is NOT, and cannot be, because no article page on
   * this site authors either level: 21 authored h2 across 9 of the 224
   * article-template pages, zero h3, zero h4. Its basis is live's own computed
   * style, which is public observation and is evidence; what it lacks is a
   * picture, not a source.
   */
  function weightOf(selector) {
    const rule = [...sheet.cssRules]
      .filter((r) => !(r instanceof CSSMediaRule))
      .reverse()
      .find((r) => r.selectorText === selector && r.style.getPropertyValue('font-weight'));
    return rule ? rule.style.getPropertyValue('font-weight').trim() : null;
  }

  const scope = 'body.article main .section .default-content-wrapper';

  it('inherits live\'s 400 on h2, where live sets no weight rule at all', () => {
    expect(weightOf(`${scope} h2`)).to.equal('400');
  });

  it('takes live\'s bold on h3 and h4, which live does set', () => {
    expect(weightOf(`${scope} :is(h3, h4)`)).to.equal('700');
  });

  it('leaves no 300 behind on the three levels together', () => {
    expect(weightOf(`${scope} :is(h2, h3, h4)`), 'the shared subhead rule').to.be.null;
  });
});

/**
 * The images-section title, which live drops a step on narrow screens while our
 * global h2 holds one size at every width.
 *
 *   .images-section__title   the global h2, 30px / 38px
 *   under max-width 768      --font-size-24, --line-height-32
 *
 * Measured on live's /media at 375 and 1440: 24/32 then 30/38, on all five of
 * the headings that carry the class. Ours authored the four tire-image bands as
 * h3, which #356 promoted to h2 so the level matches live. That promotion closed
 * the 6px gap at 900 and 1440 and OPENED one at 375, because our global h2 is
 * 30px at every width. This rule is the other half of #356.
 *
 * The selector is measured, not assumed. Two pages in the 327-page index build a
 * tabs block, /media and /online-retailers, and `.tabs .tabs-main h2` reaches
 * seven headings across them. Only five have a live counterpart: the six on
 * /media less `Tire Images`, which live does not have at all. `:has(+ .cards)`
 * is what separates them, because live gives the class to the title of a band of
 * image cards and to nothing else. It reaches those five and no other h2 on the
 * site. `Store search is not part of this site` on /online-retailers is our own
 * copy in place of live's store search, live has no h2 there at any width, and
 * the selector must not reach it.
 *
 * Line-height comes with the size. Our headings take `line-height: 1.2` from the
 * global rule, so a bare 24px would resolve to 28.8px where live reads 32px.
 * Issue #356.
 */
describe('The images-section title', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/tabs/tabs.css')).text());
  });

  /**
   * What a selector's property resolves to at a width. Unlike the min-width
   * helpers above this one reads `width < N` as well, because live switches this
   * title on a max-width condition and the repo spells that `(width < 769px)`.
   */
  function resolved(selector, prop, width) {
    const holds = (condition) => {
      const min = condition.match(/width\s*>=\s*(\d+)px|min-width:\s*(\d+)px/);
      if (min) return width >= +min.slice(1).find(Boolean);
      const max = condition.match(/width\s*<\s*(\d+)px/);
      if (max) return width < +max.slice(1).find(Boolean);
      const inc = condition.match(/max-width:\s*(\d+)px/);
      if (inc) return width <= +inc.slice(1).find(Boolean);
      return false;
    };
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText))
      : [{ rule: r, applies }]));
    return walk(sheet.cssRules, true)
      .filter(({ applies, rule }) => applies && rule.selectorText
        && rule.selectorText.split(',').map((s) => s.trim()).includes(selector)
        && rule.style.getPropertyValue(prop))
      .map(({ rule }) => rule.style.getPropertyValue(prop).trim())
      .pop() || null;
  }

  const title = '.tabs .tabs-main h2:has(+ .cards)';

  it('drops to live\'s 24px below 769, where our global h2 holds 30', () => {
    expect(resolved(title, 'font-size', 375), 'at 375').to.equal('24px');
    expect(resolved(title, 'font-size', 768), 'at 768, live\'s last narrow px').to.equal('24px');
  });

  it('takes live\'s 32px line height, not the 28.8 the global 1.2 gives', () => {
    expect(resolved(title, 'line-height', 375), 'at 375').to.equal('32px');
  });

  it('leaves 769 and up to the global h2, which is live\'s 30px there', () => {
    expect(resolved(title, 'font-size', 769), 'at 769').to.be.null;
    expect(resolved(title, 'font-size', 1440), 'at 1440').to.be.null;
  });

  /**
   * The two headings the selector must not reach: `Tire Images` on /media, which
   * live does not have, and the /online-retailers store-search note, which is our
   * own copy. Both are h2 in `.tabs-main` and neither is followed by a `.cards`
   * block, so an unqualified rule would size them off a number live never gives.
   */
  it('sizes no h2 in tabs-main that heads something other than cards', () => {
    expect(resolved('.tabs .tabs-main h2', 'font-size', 375)).to.be.null;
    expect(resolved('.tabs .tabs-main :is(h1, h2, h3, h4, h5, h6)', 'font-size', 375)).to.be.null;
  });
});

/**
 * The marquee title. Live's marquee heading is its global h1: 30px at 375 and
 * 900, 42px at 1440, measured in .marquee__texts on /events and
 * /experience/partners. Ours pinned it to the h2 token, which read 32px at 375
 * and 42px from 900 up.
 *
 * The pin stays, because the size belongs to the marquee rather than to the
 * level authored inside it, and two pages author a hero heading that is not an
 * h1 (/learn at h3, /all-new-securecontact-aw at h2). It points at the h1
 * token so those two render what live renders, and so #117 can promote them
 * later without resizing the page.
 */
describe('The marquee title', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/hero/hero.css')).text());
  });

  it('follows the h1 token, whatever level the hero authors', () => {
    const rule = [...sheet.cssRules]
      .filter((r) => !(r instanceof CSSMediaRule))
      .find((r) => r.selectorText === '.hero-content :is(h1, h2, h3, h4, h5, h6)');
    expect(rule, 'the hero heading rule').to.exist;
    expect(rule.style.getPropertyValue('font-size').trim())
      .to.equal('var(--heading-font-size-xxl)');
  });
});

/**
 * The global h2 line box.
 *
 * Live writes a CONSTANT where this site writes a ratio, and that is the whole
 * of #373. Live's rule is `h2, .as-h2, .tire-page__title { font-size: 30px;
 * line-height: 38px }` under no media query, and the 38 does not follow the
 * font-size: live's own article subhead renders 20px on a 38px line box at 375,
 * and its category card renders 24px on the same 38, because both are scoped
 * rules that change only the size. Ours derives the line box from
 * `line-height: 1.2` on the shared h1..h6 rule, so a 30px h2 resolves to 36 and
 * every scoped size drags the line box with it.
 *
 * Measured on 22 pages covering all 32 authored block names, at 375 and 1440,
 * reading the WINNING line-height declaration per heading rather than the
 * computed number: 218 headings at 1440 of which 68 take the shared rule, and
 * 216 at 375 of which 67 do. Artifacts in .mossy/parity/373/.
 *
 * The number is on the `h2` rule and not on the shared one because the shared
 * rule sets all six levels together. Live's six line boxes are 48, 38, 32, 24,
 * 22 and 20 against sizes 42, 30, 24, 20, 16 and 14, which is six different
 * ratios, so no single value on the shared rule reproduces them. h1 is 2.4px
 * loose and h3 3.2px tight against live and both are left alone here.
 */
describe('The global h2 line box', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/styles/styles.css')).text());
  });

  const base = () => [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
  const ruleFor = (selector) => base().find((r) => r.selectorText
    && r.selectorText.split(',').map((s) => s.trim()).join(',') === selector);

  it('gives h2 live\'s 38px, where the shared 1.2 gives 36', () => {
    const h2 = ruleFor('h2');
    expect(h2, 'the h2 rule').to.exist;
    expect(h2.style.getPropertyValue('line-height').trim()).to.equal('38px');
  });

  // The shared rule carried `line-height: 1.2` when #373 wrote the 38, so the
  // h2 was the one level lifted off the ratio and the other five rode it. #395
  // took the ratio off this rule entirely and gave all six an absolute, which
  // is live's own shape. So the 38 no longer competes with anything: it is one
  // of six absolutes rather than the exception to a ratio.
  it('leaves no line-height on the shared rule, which the 38 used to override', () => {
    const shared = ruleFor('h1,h2,h3,h4,h5,h6');
    expect(shared, 'the shared heading rule').to.exist;
    expect(shared.style.getPropertyValue('line-height'), 'a ratio on the shared rule').to.equal('');
  });

  // h1 is on this list for its BASE rule, live's 36 below 1025; #388's 48 above
  // it sits in a block further down the file. h3 is live's 32. h4, h5 and h6
  // are pins at what the old ratio rendered, because our sizes at those three
  // levels are not live's and live's boxes do not transfer. Values and widths
  // are asserted in heading-reset.test.js; this is the presence check.
  it('gives h1, h3, h4, h5 and h6 a line box of their own', () => {
    ['h1', 'h3', 'h4', 'h5', 'h6'].forEach((sel) => {
      const rule = ruleFor(sel);
      expect(rule, `the ${sel} rule`).to.exist;
      expect(rule.style.getPropertyValue('line-height'), `${sel} line-height`).to.not.equal('');
    });
  });

  it('sits under no media query, because live\'s h2 rule does not either', () => {
    const inMedia = [...sheet.cssRules]
      .filter((r) => r instanceof CSSMediaRule)
      .flatMap((r) => [...r.cssRules])
      .filter((r) => r.selectorText === 'h2' && r.style.getPropertyValue('line-height'));
    expect(inMedia, 'h2 line-height under a media query').to.have.lengthOf(0);
  });
});

/**
 * The blocks that resize an h2 and let the ratio supply the line box.
 *
 * A flat 38 on the h2 rule reaches any h2 no other rule pins, which includes
 * every block that sets a font-size and no line-height. Live does not have this
 * problem because a live rule that resizes a heading pins both in the same rule
 * and pins both again in the responsive step:
 *
 *   .event-item__name{font-size:20px;line-height:24px}
 *   .warranty-hero__title{font-size:var(--font-size-42);line-height:var(--line-height-48)}
 *
 * These seven do not, and #373 pinned each to THE VALUE IT RENDERS TODAY, so the
 * only headings that moved there are the ones taking the global 30px. The
 * decimals were the point: 50.4 is 42 times 1.2 and is a frozen artifact of the
 * old ratio, not a number read off live.
 *
 * THREE OF THE SEVEN NOW CARRY LIVE'S 48 INSTEAD, which is #381 and is a FIX
 * rather than a pin. The coverage band, the article-cards feature intro and the
 * tire-rating heading are one artifact: a 42px h2 taking the old 1.2 to 50.4
 * where live sets an absolute 48. Live's counterpart is knowable on all three,
 * so the 50.4 is gone from this table. The describe below holds the widths.
 * The remaining pins keep their rendered value and their recorded delta.
 *
 * THE EIGHTH PIN, `.cards.news`, TAKES LIVE'S NUMBER AND NOT TODAY'S, which is
 * the opposite of the seven above and is deliberate. #371 promotes the three
 * news card headings from h3 to h2, so the global 38px reaches them and they
 * must be pinned either way. The 20px is LIVE'S OWN number at 375, 900 and 1440
 * rather than today's rendered 16.8, and the reason for the difference is that
 * live's value is KNOWABLE on this rule and was NOT knowable on the rules #373
 * pinned. 16.8 is 14 times the old 1.2, the same frozen artifact as the 50.4.
 * Measured on live's homepage: all three read 14px on a 20px box at every width.
 *
 * `.events-name` is NOT in this list and needs nothing: it declares 20px/24px
 * and 24px/26px itself, which is 1.2 by coincidence. A ratio-detector called all
 * 30 events cards free-riders on that coincidence; reading the winning
 * declaration instead shows them pinned. `.columns.feature h2` also free-rides
 * and is left alone because no page in the 327-page index builds that variant.
 */
describe('The blocks that resize an h2 keep their own line box', () => {
  const sheets = {};

  before(async () => {
    const files = [
      '/blocks/cards/cards.css',
      '/blocks/article-cards/article-cards.css',
      '/blocks/tire-rating/tire-rating.css',
      '/blocks/promo-bar/promo-bar.css',
      '/blocks/search/search.css',
      '/blocks/tire-listing/tire-listing.css',
      '/styles/article.css',
    ];
    await Promise.all(files.map(async (f) => {
      const s = new CSSStyleSheet();
      await s.replace(await (await fetch(f)).text());
      sheets[f] = s;
    }));
  });

  /**
   * Splits a selector list on its top-level commas only. Four of the seven
   * selectors below end in `:is(h1, h2, h3, h4, h5, h6)`, and a plain
   * `split(',')` tears that into six fragments so the rule never matches.
   */
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

  /** Every declaration of a property for a selector, with the condition it sits under. */
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

  // file, selector, the condition the size sits under, today's rendered line box
  const pins = [
    ['/blocks/cards/cards.css',
      'main .section.dark.cards-container:has(.cards.coverage) .default-content-wrapper h2',
      '1025px', '48px'],
    ['/blocks/cards/cards.css',
      '.cards.category .cards-card-body :is(h1, h2, h3, h4, h5, h6)',
      'width < 900px', '33.6px'],
    ['/blocks/cards/cards.css',
      '.cards.news .cards-card-body :is(h1, h2, h3, h4, h5, h6)',
      null, '20px'],
    ['/blocks/article-cards/article-cards.css',
      'main .article-cards.feature .article-cards-intro h2',
      '1025px', '48px'],
    ['/blocks/tire-rating/tire-rating.css',
      '.tire-rating h2', '1025px', '48px'],
    ['/blocks/promo-bar/promo-bar.css',
      '.promo-bar-panel-content :is(h1, h2, h3, h4, h5, h6)',
      'width < 900px', '33.6px'],
    ['/blocks/search/search.css',
      'main .search .search-no-results h2', '600px', '50.4px'],
    // live steps the count at its own `max-width: 768`, so ours steps one pixel
    // above that cap rather than at the site's 600 or 900 (#421).
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-count', null, '32px'],
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-count', '769px', '38px'],
    // live steps the card title at its own `max-width: 1024`, so ours steps one
    // pixel above that cap rather than at 600, where only the LAYOUT changes.
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-card-title', null, '20px'],
    // THE 1.5 IS LIVE'S OWN AND IS NOT THE #395 SHAPE RETURNING. Live declares
    // `line-height: var(--line-height-24)` on `.tire-teaser__title`, and that
    // token alone in live's scale of fifteen resolves to `var(--ratio)`, which
    // live's `:root` sets to 1.5 (#422).
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-card-title', '1025px', '1.5'],
    ['/blocks/search/search.css',
      'main .search .search-result-title', null, '20px'],
    // live's own ratio again, the same `var(--line-height-24)` as the card
    // title above (#420).
    ['/blocks/search/search.css',
      'main .search .search-result-title', '1025px', '1.5'],
    ['/styles/article.css',
      'body.article main .section:has(.share-wrapper) .related-articles-title', null, '14.4px'],
  ];

  pins.forEach(([file, selector, media, expected]) => {
    const where = media ? `under ${media}` : 'unconditionally';
    it(`pins ${selector.split(' ').pop()} in ${file.split('/').pop()} ${where}`, () => {
      const got = declarations(file, selector, 'line-height')
        .find((d) => (media ? (d.media || '').includes(media) : d.media === null));
      expect(got, `a line-height for ${selector} ${where}`).to.exist;
      expect(got.value).to.equal(expected);
    });
  });

  /**
   * The two pins that step at 900 are BOUNDED BELOW IT. Both rules set 28px at
   * the base and 30px from 900, and 30px is the global size, so above the
   * breakpoint the heading must take the global 38 like everything else. An
   * unbounded pin overrides at every width: the first version of this slice
   * pinned 33.6 on the base rule alone and the after sweep caught four homepage
   * headings reading 33.6 at 1440 where they had been 36 and should be 38.
   */
  /**
   * The assertion is that the 33.6 DIES at the breakpoint, not that nothing is
   * written above it. Those were the same sentence until #395, because the 38
   * above 900 arrived from the global `h2` and needed no declaration. It does
   * now: #395 pins the base `.cards .cards-card-body` box, which is more
   * specific than a bare `h2`, so the category tile has to spell its own 38 out
   * or take the base pin's 21.6. The homepage tiles read 21.6 at 900 and 1440
   * for exactly as long as it took to compare them against live.
   */
  [['/blocks/cards/cards.css', '.cards.category .cards-card-body :is(h1, h2, h3, h4, h5, h6)'],
    ['/blocks/promo-bar/promo-bar.css', '.promo-bar-panel-content :is(h1, h2, h3, h4, h5, h6)'],
  ].forEach(([file, selector]) => {
    it(`kills the 33.6 above 900 in ${file.split('/').pop()}`, () => {
      const above = declarations(file, selector, 'line-height')
        .filter((d) => d.media === null || /width\s*>=|min-width/.test(d.media))
        .map((d) => d.value);
      expect(above, 'the 28px box outliving the 28px').to.not.include('33.6px');
    });
  });

  /**
   * The article subhead is the one 20px h2 that MUST NOT be pinned. Live renders
   * it 20px on a 38px line box at 375, so the flat 38 is what closes #368, and a
   * pin here would reopen it. Ours reads 24 today on six subheads of
   * /learn/how-do-i-check-my-tire-pressure.
   */
  it('leaves the article subhead unpinned, so it takes live\'s 38', () => {
    const subhead = 'body.article main .section .default-content-wrapper h2';
    expect(declarations('/styles/article.css', subhead, 'line-height'))
      .to.have.lengthOf(0);
  });
});

/**
 * Every pin resolved at each of the three widths, which is the assertion the
 * seven rules above cannot make one declaration at a time.
 *
 * It carries both halves of what this slice got wrong once each.
 *
 * THE 36s ARE LIVE'S OWN NUMBER AT THE LOWER BREAKPOINT. Three of the seven
 * rules resize an h2 only at their upper step and leave the base on the global
 * 30px, so the flat 38 reached the base and moved those headings AWAY from
 * live. Live steps its own block titles down to 30/36 under max-width 1024
 * while its global h2 stays 38, measured on the cover set at 375 and 900:
 * `.warranty-hero__title` and `.tire-reviews__title` on /vancontact-as-ultra
 * and /tires/4x4contact, `.news-list-with-image__title` on /learn, all three
 * 30/36 at 375 and 900 and 42/48 at 1440. So the base pin is live's value and
 * not a frozen artifact. #381 puts the upper half on live's number too, so all
 * six values on those three rows are now live's.
 *
 * THE ARTICLE-CARDS ROW READS 36 AT 900 BECAUSE ITS BREAKPOINT MOVED, which is
 * a different repair from the other two. Live steps `.news-list-with-image__title`
 * at `max-width: 1024px` and our rule stepped at 900, so between 900 and 1024 we
 * rendered 42 where live renders 30. A line box written at 900 would have looked
 * fixed at 1440 and stayed wrong at 900.
 *
 * THE NULLS ARE THE BUG THAT ALREADY HAPPENED. `75a2746` had to bound two pins
 * that sat on a base rule with no upper limit: they overrode at every width and
 * four homepage headings read 33.6 at 1440 where they had been 36 and should be
 * the global 38. A pin must die where the size it freezes dies, and only the
 * resolved value at a width above the breakpoint says whether it did.
 */
describe('Each pinned line box, resolved at 375, 900 and 1440', () => {
  const sheets = {};

  before(async () => {
    const files = [
      '/blocks/cards/cards.css',
      '/blocks/article-cards/article-cards.css',
      '/blocks/tire-rating/tire-rating.css',
      '/blocks/promo-bar/promo-bar.css',
      '/blocks/search/search.css',
      '/blocks/tire-listing/tire-listing.css',
      '/styles/article.css',
    ];
    await Promise.all(files.map(async (f) => {
      const s = new CSSStyleSheet();
      await s.replace(await (await fetch(f)).text());
      sheets[f] = s;
    }));
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

  /** The winning line-height for a selector at a width, which is what renders. */
  function resolved(file, selector, width) {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText, width))
      : [{ rule: r, applies }]));
    return walk(sheets[file].cssRules, true)
      .filter(({ applies, rule }) => applies && rule.selectorText
        && parts(rule.selectorText).includes(norm(selector))
        && rule.style.getPropertyValue('line-height'))
      .map(({ rule }) => rule.style.getPropertyValue('line-height').trim())
      .pop() || null;
  }

  // file, selector, then what it must resolve to at 375, 900 and 1440.
  // null means no pin applies there and the heading takes the global 38.
  const pins = [
    ['/blocks/cards/cards.css',
      'main .section.dark.cards-container:has(.cards.coverage) .default-content-wrapper h2',
      ['36px', '36px', '48px']],
    // the 38 above 900 was the global h2's until #395 pinned the base
    // `.cards .cards-card-body` box, which outranks a bare `h2`. Same rendered
    // number, now written where the size it belongs to is written, and it is
    // live's own value on the homepage tile at 900 and 1440.
    ['/blocks/cards/cards.css',
      '.cards.category .cards-card-body :is(h1, h2, h3, h4, h5, h6)',
      ['33.6px', '38px', '38px']],
    ['/blocks/cards/cards.css',
      '.cards.news .cards-card-body :is(h1, h2, h3, h4, h5, h6)',
      ['20px', '20px', '20px']],
    ['/blocks/article-cards/article-cards.css',
      'main .article-cards.feature .article-cards-intro h2',
      ['36px', '36px', '48px']],
    ['/blocks/tire-rating/tire-rating.css',
      '.tire-rating h2', ['36px', '36px', '48px']],
    ['/blocks/promo-bar/promo-bar.css',
      '.promo-bar-panel-content :is(h1, h2, h3, h4, h5, h6)',
      ['33.6px', null, null]],
    ['/blocks/search/search.css',
      'main .search .search-no-results h2', ['1.2', '50.4px', '50.4px']],
    // #414: live writes NO size and NO box on `.tires-filter-form h2`, only a
    // text-align at 768 and below, so this block writes none either and the
    // heading takes the global h2's 38 at every width. Three nulls is the
    // assertion that it wrote none.
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-filters h2', [null, null, null]],
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-count', ['32px', '38px', '38px']],
    ['/blocks/tire-listing/tire-listing.css',
      '.tire-listing .tire-listing-card-title', ['20px', '20px', '1.5']],
    ['/blocks/search/search.css',
      'main .search .search-result-title', ['20px', '20px', '1.5']],
    ['/styles/article.css',
      'body.article main .section:has(.share-wrapper) .related-articles-title',
      ['14.4px', '14.4px', '14.4px']],
  ];

  pins.forEach(([file, selector, expected]) => {
    it(`resolves ${selector.split(' ').pop()} in ${file.split('/').pop()}`, () => {
      [375, 900, 1440].forEach((w, i) => {
        expect(resolved(file, selector, w), `at ${w}`).to.equal(expected[i]);
      });
    });
  });
});

/**
 * The carousel slide title, which #371 promotes from h3 to h2 because live
 * renders it `<h2 class="content-slider__slide-title">`. Live holds it at 30px
 * on a 38px box at 375, 900 and 1440, which is our global h2 exactly, so the
 * promoted heading needs no size rule of its own.
 *
 * What it does need is a margin rule that survives the level change.
 * `.carousel-content h3 { margin-top: 0 }` stops matching the moment the heading
 * becomes an h2, and the global `margin-top: 0.8em` then opens 24px above all
 * seven slide titles at all three widths. Measured on http://localhost:3000 by
 * swapping the elements in the DOM and re-reading the computed style:
 * .mossy/parity/371/promote-before-css-fix.txt.
 *
 * WEIGHT IS #385 AND IT IS ADDRESSED BELOW. Live's slide title is 400 and ours
 * is 300, from the global `font-weight: 300` on all six levels, so the h3 is 300
 * and the promoted h2 would be 300 too. The promotion does not touch it, which
 * is why it is its own issue and not part of #371.
 *
 * The fix is PER-BLOCK, and the reason is that live is not uniformly 400 on this
 * page. Live reads 300 on its marquee h1, on `.warranty-hero__title` and on
 * `.stores-near-block__title`, and we match live on all three today, so moving
 * the global 300 would break three headings to fix seven. Measured on the
 * published host at 375, 900 and 1440: .mossy/parity/385/reproduce-published.txt.
 */
describe('The carousel slide title', () => {
  let sheet;
  let global;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/carousel/carousel.css')).text());
    global = new CSSStyleSheet();
    await global.replace(await (await fetch('/styles/styles.css')).text());
  });

  const base = () => [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));

  it('kills the top margin on whatever level the slide authors', () => {
    const rule = base().find((r) => r.selectorText === '.carousel-content :is(h1, h2, h3, h4, h5, h6)');
    expect(rule, 'the slide heading rule').to.exist;
    expect(rule.style.getPropertyValue('margin-top').trim()).to.equal('0px');
  });

  it('keys on no single level, so the h3 to h2 promotion moves nothing', () => {
    const levelled = base().filter((r) => r.selectorText
      && /^\.carousel-content h[1-6]$/.test(r.selectorText));
    expect(levelled, 'a rule keyed on one heading level').to.have.lengthOf(0);
  });

  it('sets no font-size, because live\'s 30 on a 38px box is our global h2', () => {
    const sized = base().filter((r) => r.selectorText
      && r.selectorText.startsWith('.carousel-content')
      && r.style.getPropertyValue('font-size'));
    expect(sized.map((r) => r.selectorText)).to.deep.equal(['.carousel-content p']);
  });

  it('takes live\'s 400 on whatever level the slide authors', () => {
    const weighted = base().filter((r) => r.selectorText
      && r.selectorText.startsWith('.carousel-content')
      && r.style.getPropertyValue('font-weight'));
    expect(weighted.map((r) => r.selectorText), 'the rule carrying the weight')
      .to.deep.equal(['.carousel-content :is(h1, h2, h3, h4, h5, h6)']);
    expect(weighted[0].style.getPropertyValue('font-weight').trim()).to.equal('400');
  });

  /**
   * The guard, not the fix. It fails if someone closes this by moving the global
   * weight, which would take the marquee h1, `.warranty-hero__title` and
   * `.stores-near-block__title` off live's own 300.
   */
  it('leaves the global 300 alone, which three other headings match live on', () => {
    const rule = [...global.cssRules]
      .filter((r) => !(r instanceof CSSMediaRule))
      .find((r) => r.selectorText === 'h1, h2, h3, h4, h5, h6'
        && r.style.getPropertyValue('font-weight'));
    expect(rule, 'the global heading rule').to.exist;
    expect(rule.style.getPropertyValue('font-weight').trim()).to.equal('300');
  });
});

/**
 * The global h1 line box.
 *
 * Live's h1 is 30px on a 36px box below 1025 and 42px on a 48px box above it.
 * Read off live's rendered pages on the 22-page cover set at 375, 900 and 1440:
 * every h1 taking live's own bare rule reads 30/36 at the two lower widths and
 * 42/48 at 1440, `.mossy/parity/373/live-cover-*.tsv`. Live's two exceptions
 * are already ours, `tire-page__title` at 30/38 through the product-title rule
 * and the 80/80 crew marquee.
 *
 * Ours derives the box from `line-height: 1.2` on the shared h1..h6 rule. Below
 * 1025 that resolves 30px to 36 and already matches live. Above it, 42 times
 * 1.2 is 50.4 against live's 48, so the box is 2.4px loose on 227 of the 327
 * indexed pages. Issue #388.
 *
 * THIS IS A FIX AND NOT A PIN, and the two are identical in a diff. The 48 is
 * LIVE'S value, not the 50.4 we render. #373 froze each pin at its own rendered
 * value because live's counterpart was not knowable on those rules; it is
 * knowable on this one, at every width. Nothing is written below 1025 for the
 * same reason in reverse: ours already renders live's 36 there, so a
 * declaration would freeze a match rather than close a gap.
 *
 * THE DECLARATION MUST FOLLOW THE SHARED RULE IN SOURCE ORDER. A media query
 * adds no specificity, so an `h1 { line-height: 48px }` placed in the existing
 * 1025 block at the top of the file loses to `line-height: 1.2` on the shared
 * h1..h6 rule further down, and renders 50.4 with the declaration present.
 * `box()` below resolves in document order, which is what catches it.
 *
 * The hazard #383 left one level down does not reproduce here. Seven other
 * rules match an h1, pin a font-size and declare no line-height, so each takes
 * the absolute 48 above 1025 instead of 1.2 times its own size. A census of the
 * 327 authored pages finds no h1 inside any of their containers, and neither
 * #371 nor #372 promotes a heading into one. Audit and census in
 * `.mossy/parity/388/`.
 */
describe('The global h1 line box', () => {
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
   * Every rule the sheet carries, flattened in DOCUMENT ORDER with the media
   * conditions each one sits under already evaluated at a width. Order is the
   * point: these rules all have the same specificity, so the last one wins.
   */
  function flat(width) {
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText, width))
      : [{ rule: r, applies }]));
    return walk(sheet.cssRules, true).filter(({ applies }) => applies);
  }

  /** The winning declaration of a property on a bare element selector. */
  function winning(selector, prop, width) {
    return flat(width)
      .filter(({ rule }) => rule.selectorText
        && parts(rule.selectorText).includes(selector)
        && rule.style.getPropertyValue(prop))
      .map(({ rule }) => rule.style.getPropertyValue(prop).trim())
      .pop() || null;
  }

  /** The winning value of a custom property on :root. */
  function token(name, width) {
    return flat(width)
      .filter(({ rule }) => rule.selectorText === ':root'
        && rule.style.getPropertyValue(name))
      .map(({ rule }) => rule.style.getPropertyValue(name).trim())
      .pop() || null;
  }

  /** The line box an h1 renders at a width, ratio resolved against the size. */
  function box(width) {
    const lh = winning('h1', 'line-height', width);
    if (!lh) return null;
    if (lh.endsWith('px')) return lh;
    return `${parseFloat(lh) * parseFloat(token('--heading-font-size-xxl', width))}px`;
  }

  it('takes live\'s 48px above 1025, where 42 times 1.2 renders 50.4', () => {
    expect(box(1440), 'the h1 line box at 1440').to.equal('48px');
  });

  // #388 wrote nothing below 1025, because the shared 1.2 already produced
  // live's 36 there and a declaration would have frozen a match rather than
  // closed a gap. #395 wrote it anyway, and for a different reason: the unit,
  // not the value. The ratio is what reached every rule that resized an h1, so
  // the 36 is now spelled out and the rendered box is the same 36 it was.
  it('spells live\'s 36 out below 1025, where the ratio used to produce it', () => {
    expect(winning('h1', 'line-height', 375), 'the h1 line-height at 375').to.equal('36px');
    expect(winning('h1', 'line-height', 900), 'the h1 line-height at 900').to.equal('36px');
  });

  it('resolves to live\'s 36 / 36 / 48 at 375, 900 and 1440', () => {
    expect([box(375), box(900), box(1440)].join(' / '))
      .to.equal('36px / 36px / 48px');
  });

  it('steps at live\'s breakpoint and not at 900', () => {
    expect(box(1024), 'below live\'s breakpoint').to.equal('36px');
    expect(box(1025), 'at live\'s breakpoint').to.equal('48px');
  });
});

/**
 * The three block h2s #373 froze at 50.4, moved to live's 48. Issue #381.
 *
 * One artifact on three rules: a 42px h2 taking the old 1.2 ratio to 50.4 where
 * live sets an absolute 48. It is the same artifact #373 closed globally on the
 * h2 and #388 closed globally on the h1, so this finishes it rather than opening
 * a block-by-block sweep.
 *
 * THESE ARE FIXES AND NOT PINS, and the two are identical in a diff. The 48 is
 * LIVE'S value. #373 froze each of its pins at that rule's own rendered value
 * because live's counterpart was not knowable then; it is knowable now, read
 * straight off live's own stylesheet rather than off a rendered page:
 *
 *   .warranty-hero__title{font-size:var(--font-size-42);line-height:var(--line-height-48)}
 *   @media screen and (max-width:1024px){.warranty-hero__title{
 *     font-size:var(--font-size-30);line-height:var(--line-height-36)}}
 *
 * `.tire-reviews__title` and `.news-list-with-image__title` carry the same pair
 * of declarations under the same query, and the four tokens resolve once on
 * `:root` with no media override: 42, 48, 30, 36 at a 16px root.
 * Extracted in `.mossy/parity/381/live-rules.txt`.
 *
 * THE ARTICLE-CARDS ROW IS A BREAKPOINT MISMATCH AND NOT A LINE BOX. It was
 * exact at 1440 and wrong at 900, because live steps at 1024 and our rule
 * stepped at 900. At 900 live reads 30/36 and we read 42/50.4, so the fix moves
 * the whole step to 1025 rather than writing a value at 900. Pinning 48 there
 * would have read as fixed at 1440 and stayed wrong at 900.
 *
 * The hazard #383 left one level down does not reproduce. 84 rules match an h2
 * and 16 of them pin a font-size with no line-height, so each would inherit
 * whatever box its h2 ends up with. A census of the 327 published pages finds
 * these three headings carry text and no element children at all, so no rule
 * inherits from them. Audit and census in `.mossy/parity/381/`.
 */
describe("The three block h2 line boxes moved to live's 48", () => {
  const sheets = {};

  // the third flag is whether the rule declares its OWN 30px below the step.
  // `.tire-rating h2` does not and takes the global h2's 30px, which #185 moved
  // there off live; adding a declaration would duplicate a value we already match.
  const RULES = [
    ['/blocks/cards/cards.css',
      'main .section.dark.cards-container:has(.cards.coverage) .default-content-wrapper h2', true],
    ['/blocks/article-cards/article-cards.css',
      'main .article-cards.feature .article-cards-intro h2', true],
    ['/blocks/tire-rating/tire-rating.css', '.tire-rating h2', false],
  ];

  before(async () => {
    await Promise.all([...new Set(RULES.map(([f]) => f))].map(async (f) => {
      const s = new CSSStyleSheet();
      await s.replace(await (await fetch(f)).text());
      sheets[f] = s;
    }));
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
   * The winning declaration at a width, resolved in DOCUMENT ORDER. These rules
   * share a specificity, so the last one that applies is the one that renders,
   * and a media query adds nothing to specificity.
   */
  function winning(file, selector, prop, width) {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    const walk = (rules, applies) => [...rules].flatMap((r) => (r instanceof CSSMediaRule
      ? walk(r.cssRules, applies && holds(r.conditionText, width))
      : [{ rule: r, applies }]));
    return walk(sheets[file].cssRules, true)
      .filter(({ applies, rule }) => applies && rule.selectorText
        && parts(rule.selectorText).includes(norm(selector))
        && rule.style.getPropertyValue(prop))
      .map(({ rule }) => rule.style.getPropertyValue(prop).trim())
      .pop() || null;
  }

  RULES.forEach(([file, selector, ownsBaseSize]) => {
    const name = `${selector.split(' ').pop()} in ${file.split('/').pop()}`;

    it(`takes live's 48px above 1025 on ${name}`, () => {
      expect(winning(file, selector, 'line-height', 1440)).to.equal('48px');
    });

    it(`keeps live's 36px box below 1025 on ${name}`, () => {
      [375, 900, 1024].forEach((w) => {
        expect(winning(file, selector, 'line-height', w), `at ${w}`).to.equal('36px');
      });
    });

    it(`steps its line box at live's 1025 and not at 900 on ${name}`, () => {
      expect(winning(file, selector, 'line-height', 1024), 'at 1024').to.equal('36px');
      expect(winning(file, selector, 'line-height', 1025), 'at 1025').to.equal('48px');
    });

    it(`steps its size at live's 1025 and not at 900 on ${name}`, () => {
      [375, 900, 1024].forEach((w) => {
        expect(winning(file, selector, 'font-size', w), `at ${w}`)
          .to.equal(ownsBaseSize ? '30px' : null);
      });
      expect(winning(file, selector, 'font-size', 1025), 'at 1025').to.equal('42px');
    });

    it(`leaves no 50.4 on ${name}`, () => {
      [375, 900, 1024, 1025, 1440].forEach((w) => {
        expect(winning(file, selector, 'line-height', w), `at ${w}`).to.not.equal('50.4px');
      });
    });
  });
});
