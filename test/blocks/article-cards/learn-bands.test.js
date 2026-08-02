/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';

// Live's learn hub is four editorial bands, not four copies of one card grid.
// Tire Tips is black with a square category image on the left; Technology is
// #333 with the image on the right; News is #f3f3f3 with three text columns;
// Product Highlights is black with a 2x2 tile grid. Measured on
// continentaltire.com/learn at 1440 and 375.
describe('Learn hub band treatments', () => {
  const sheets = {};

  before(async () => {
    const load = async (href) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(href)).text());
      return sheet;
    };
    sheets.cards = await load('/blocks/article-cards/article-cards.css');
    sheets.highlights = await load('/blocks/cards/cards.css');
    sheets.global = await load('/styles/styles.css');
  });

  /** Splits a selector list on its top-level commas, so :is(a, b) stays whole. */
  function selectors(text) {
    const out = [];
    let depth = 0;
    let start = 0;
    [...text].forEach((ch, i) => {
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (ch === ',' && depth === 0) {
        out.push(text.slice(start, i).trim());
        start = i + 1;
      }
    });
    out.push(text.slice(start).trim());
    return out;
  }

  /**
   * The value a property takes in the rule for `selector`, at `media`. A rule
   * that groups several selectors counts for each of them.
   */
  function value(sheet, selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => selectors(r.selectorText).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const feature = (sel, prop, media) => value(sheets.cards, sel, prop, media);

  describe('feature band: Tire Tips and Technology', () => {
    it('stacks the image over the teasers on a narrow screen', () => {
      expect(feature('main .article-cards.feature', 'grid-template-columns')).to.equal('1fr');
    });

    it('sets the image beside the teasers from 900', () => {
      expect(feature('main .article-cards.feature', 'grid-template-columns', '900px'))
        .to.equal('460px 1fr');
      expect(feature('main .article-cards.feature', 'column-gap', '900px')).to.equal('100px');
    });

    // `grid-row: 1 / -1` counts lines in the explicit grid. With the rows left
    // implicit it resolves to row 1 alone, and the teasers stack below the
    // image instead of beside it: the band read 908 tall against live's 580.
    it('gives the image column rows to span', () => {
      expect(feature('main .article-cards.feature', 'grid-template-rows', '900px'))
        .to.equal('auto auto 1fr');
    });

    it('mirrors the columns for the image-right variant', () => {
      expect(feature('main .article-cards.feature.image-right .article-cards-media', 'grid-column', '900px'))
        .to.equal('2');
    });

    it('overlays the heading on the image only below the breakpoint', () => {
      // the overlay sits in the image cell, over a half-black scrim
      expect(feature('main .article-cards.feature .article-cards-media', 'grid-area')).to.equal('media');
      expect(feature('main .article-cards.feature .article-cards-intro', 'grid-area')).to.equal('media');
      expect(feature('main .article-cards.feature .article-cards-media::after', 'background-color'))
        .to.equal('rgba(0, 0, 0, 0.5)');
      // at desktop the intro leaves the image cell for the text column
      expect(feature('main .article-cards.feature .article-cards-intro', 'grid-column', '900px'))
        .to.equal('2');
      expect(feature('main .article-cards.feature .article-cards-media::after', 'content', '900px'))
        .to.equal('none');
    });

    // the heading steps at live's 1025 and not at the layout's 900: live holds
    // `.news-list-with-image__title` to 30 under `max-width: 1024px` (#381)
    it("holds the band heading to live's two sizes", () => {
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'font-size')).to.equal('30px');
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'font-size', '900px')).to.equal(null);
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'font-size', '1025px')).to.equal('42px');
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'text-transform')).to.equal('uppercase');
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'letter-spacing')).to.equal('6px');
      expect(feature('main .article-cards.feature .article-cards-intro h2', 'font-weight')).to.equal('300');
    });

    it('rules the teaser list off in gold, and each teaser in grey', () => {
      expect(feature('main .article-cards.feature .article-cards-list', 'border-top'))
        .to.equal('1px solid var(--conti-yellow)');
      expect(feature('main .article-cards .article-teaser', 'border-bottom'))
        .to.equal('1px solid var(--conti-light-grey)');
    });

    it('keeps the category image square', () => {
      expect(feature('main .article-cards.feature .article-cards-media img', 'aspect-ratio')).to.equal('1 / 1');
    });
  });

  describe('columns band: News', () => {
    it('runs one teaser per row on a narrow screen', () => {
      expect(feature('main .article-cards.columns .article-cards-list', 'grid-template-columns'))
        .to.equal('1fr');
    });

    it("runs live's three columns from 900 up", () => {
      expect(feature('main .article-cards.columns .article-cards-list', 'grid-template-columns', '900px'))
        .to.equal('repeat(3, 1fr)');
    });
  });

  describe('highlights band: Product Highlights', () => {
    const cards = (sel, prop, media) => value(sheets.highlights, sel, prop, media);

    it('stacks the tiles on a narrow screen', () => {
      expect(cards('.cards.highlights > ul', 'grid-template-columns')).to.equal('1fr');
    });

    it('lays the tiles out 2x2 like live, rather than one row of four', () => {
      expect(cards('.cards.highlights > ul', 'grid-template-columns', '769px'))
        .to.equal('repeat(2, 1fr)');
      expect(cards('.cards.highlights > ul', 'gap', '769px')).to.equal('20px');
    });

    const BAND = 'main .section.cards-container:has(.cards.highlights)';

    it("gives the band live's own padding rather than the shared 56px", () => {
      expect(cards(BAND, 'padding')).to.equal('38px 0px');
      expect(cards(BAND, 'padding', '769px')).to.equal('80px 0px 38px');
    });

    // live's tile footer is one 54px row from 1025 up: the product name on the
    // left, the Tire details link on the right. Below that it stacks them at 78
    // tall. Ours stacked them at every width, which made each tile taller and
    // the band 76px taller than live's above the step.
    //
    // This asserted 769 until #399. Read on live's own /learn at six widths:
    // `.card__footer` is column and 78 tall at 769, 900, 1000 and 1024, and row
    // and 54 tall at 1025 and 1440. The 54 belongs to the wide half alone, and
    // at 769 the old rule left an 18px name sharing a row it had no width for.
    // `cards()` reads the rule declared at a width rather than the cascade, so
    // the base rule is what applies at 769 and a null there is the assertion
    // that this no longer steps at 769.
    it('puts the tile name and its link on one row from 1025 up', () => {
      expect(cards('.cards.highlights .cards-card-body', 'flex-direction')).to.equal('column');
      expect(cards('.cards.highlights .cards-card-body', 'flex-direction', '769px')).to.equal(null);
      expect(cards('.cards.highlights .cards-card-body', 'flex-direction', '1025px')).to.equal('row');
      expect(cards('.cards.highlights .cards-card-body', 'justify-content', '1025px')).to.equal('space-between');
      expect(cards('.cards.highlights .cards-card-body', 'align-items', '1025px')).to.equal('center');
    });

    // the uppercase rule was written for the Tire details link and caught the
    // product name with it. Live sets the name in mixed case.
    it('leaves the tile name in the case the author wrote', () => {
      expect(cards('.cards.highlights .cards-card-body a', 'text-transform')).to.equal('uppercase');
      expect(cards('.cards.highlights .cards-card-body :is(h1, h2, h3, h4, h5, h6) a', 'text-transform')).to.equal('none');
    });

    it('uppercases the band heading, as live does', () => {
      expect(cards(`${BAND} h2`, 'text-transform')).to.equal('uppercase');
      expect(cards(`${BAND} h2`, 'letter-spacing')).to.equal('6px');
      expect(cards(`${BAND} h2`, 'font-weight')).to.equal('300');
    });

    // the tile is a white card sitting on a black band. The band paints its
    // headings and links white, so the tile read white on white.
    it('keeps the tile text dark on its white card', () => {
      const sel = 'main .section.cards-container .cards.highlights .cards-card-body';
      expect(cards(`${sel} :is(h1, h2, h3, h4, h5, h6)`, 'color')).to.equal('var(--conti-black)');
      expect(cards(`${sel} a:any-link`, 'color')).to.equal('var(--conti-black)');
    });
  });

  describe('buttons on a dark band', () => {
    const global = (sel, prop, media) => value(sheets.global, sel, prop, media);

    // an "All Tire Tips" link authored in italics becomes a secondary button:
    // transparent, with dark text and a dark border. On a black band that is
    // invisible. The dark-section rules skip .button, so nothing inverted it.
    it('inverts a secondary button so it reads on the band', () => {
      expect(global('main .section.dark .button.secondary', 'color')).to.equal('var(--conti-white)');
      expect(global('main .section.black .button.secondary', 'color')).to.equal('var(--conti-white)');
      expect(global('main .section.dark .button.secondary', 'border-color')).to.equal('var(--conti-white)');
    });
  });
});
