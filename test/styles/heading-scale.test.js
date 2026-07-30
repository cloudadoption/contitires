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
