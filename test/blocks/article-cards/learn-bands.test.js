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
  });

  /**
   * The value a property takes in the rule for `selector`, at `media`. A rule
   * that groups several selectors counts for each of them.
   */
  function value(sheet, selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  const feature = (sel, prop, media) => value(sheets.cards, sel, prop, media);

  describe('feature band: Tire Tips and Technology', () => {
    it('stacks the image over the teasers on a narrow screen', () => {
      expect(feature('.article-cards.feature', 'grid-template-columns')).to.equal('1fr');
    });

    it("sets the image beside the teasers at live's 769", () => {
      expect(feature('.article-cards.feature', 'grid-template-columns', '769px'))
        .to.equal('460px 1fr');
      expect(feature('.article-cards.feature', 'column-gap', '769px')).to.equal('100px');
    });

    it('mirrors the columns for the image-right variant', () => {
      expect(feature('.article-cards.feature.image-right .article-cards-media', 'grid-column', '769px'))
        .to.equal('2');
    });

    it('overlays the heading on the image only below the breakpoint', () => {
      // the overlay sits in the image cell, over a half-black scrim
      expect(feature('.article-cards.feature .article-cards-media', 'grid-area')).to.equal('media');
      expect(feature('.article-cards.feature .article-cards-intro', 'grid-area')).to.equal('media');
      expect(feature('.article-cards.feature .article-cards-media::after', 'background-color'))
        .to.equal('rgba(0, 0, 0, 0.5)');
      // at desktop the intro leaves the image cell for the text column
      expect(feature('.article-cards.feature .article-cards-intro', 'grid-column', '769px'))
        .to.equal('2');
      expect(feature('.article-cards.feature .article-cards-media::after', 'content', '769px'))
        .to.equal('none');
    });

    it("holds the band heading to live's two sizes", () => {
      expect(feature('.article-cards.feature .article-cards-intro h2', 'font-size')).to.equal('30px');
      expect(feature('.article-cards.feature .article-cards-intro h2', 'font-size', '769px')).to.equal('42px');
      expect(feature('.article-cards.feature .article-cards-intro h2', 'text-transform')).to.equal('uppercase');
      expect(feature('.article-cards.feature .article-cards-intro h2', 'letter-spacing')).to.equal('6px');
      expect(feature('.article-cards.feature .article-cards-intro h2', 'font-weight')).to.equal('300');
    });

    it('rules the teaser list off in gold, and each teaser in grey', () => {
      expect(feature('.article-cards.feature .article-cards-list', 'border-top'))
        .to.equal('1px solid var(--conti-yellow)');
      expect(feature('.article-cards .article-teaser', 'border-bottom'))
        .to.equal('1px solid var(--conti-light-grey)');
    });

    it('keeps the category image square', () => {
      expect(feature('.article-cards.feature .article-cards-media img', 'aspect-ratio')).to.equal('1 / 1');
    });
  });

  describe('columns band: News', () => {
    it('runs one teaser per row on a narrow screen', () => {
      expect(feature('.article-cards.columns .article-cards-list', 'grid-template-columns'))
        .to.equal('1fr');
    });

    it("runs live's three columns from 769 up", () => {
      expect(feature('.article-cards.columns .article-cards-list', 'grid-template-columns', '769px'))
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
  });
});
