/* eslint-disable no-unused-expressions */
/* global describe it before after beforeEach */

import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import decorateTabs from '../../../blocks/category-tabs/category-tabs.js';

/**
 * The gap live leaves under the title band, read off continentaltire.com's own
 * stylesheet on 2026-08-02. It is two numbers, not one:
 *
 *   .legal-page__rich-text .rich-text { padding: var(--space-60) 0 }   -> 60
 *   @media (max-width: 768px) { … { padding: var(--space-38) 0 } }     -> 38
 *   .nav-tabs { padding-top: var(--space-8); min-height: 49px }        -> 8
 *
 * so body copy opens 60 under the band from 769 up and 38 below it, and a tab
 * row opens 8 at every width. `.nav-tabs` carries no width override at all.
 *
 * All 14 pages that carry the band were enumerated off the published site on
 * 2026-08-02 and fall in three groups:
 *
 *   default content   /legal /privacy /accessibility-statement
 *                     /monthly-sweepstakes-rules /online-retailers /tire-finder
 *   category-tabs     /learn/tips /learn/technology /learn/news-and-events
 *                     /learn/product-highlights /experience/sports
 *   cards             /dealers /media /offers
 *
 * The cards three are left alone: `main .section.cards-container` reads
 * `margin: 0` on purpose, so they already sit flush the way live's own black
 * card band does, and a gap rule would break that. Below 769 the body-copy
 * group keeps the site's 40 against live's 38, which is 2px and earns no rule.
 * Issue #215.
 */
describe('Banner block, the gap under the title band', () => {
  before(async () => {
    const sheets = await Promise.all([
      '/styles/styles.css',
      '/blocks/banner/banner.css',
      '/blocks/category-tabs/category-tabs.css',
      '/blocks/cards/cards.css',
    ].map(async (path) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(path)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    document.body.classList.add('appear');
  });

  after(() => { document.body.classList.remove('appear'); });

  beforeEach(() => { document.body.innerHTML = ''; });

  /** The band, then whatever the page opens with under it. */
  const page = (nextClass, nextInner) => {
    document.body.innerHTML = `
      <main>
        <div class="section banner-container">
          <div class="banner-wrapper">
            <div class="banner block">
              <div><div><h1>Terms Of Use Agreement</h1></div></div>
            </div>
          </div>
        </div>
        <div class="section ${nextClass}">${nextInner}</div>
      </main>`;
    return [...document.querySelectorAll('main > .section')];
  };

  const bodyCopy = () => page('', '<div class="default-content-wrapper"><h2>Use of Website</h2><p>This page states the Terms.</p></div>');

  // the row has to be decorated: `.category-tabs-list { margin: 0 }` is what
  // stops the bare `ul { margin-top: 0.8em }` collapsing 14px through the
  // section and swallowing live's 8
  const tabRow = () => {
    const sections = page('category-tabs-container', `
      <div class="category-tabs-wrapper">
        <div class="category-tabs block">
          <div><div><ul><li><a href="/learn/tips">Tire tips</a></li><li><a href="/learn/technology">Technology</a></li></ul></div></div>
        </div>
      </div>`);
    decorateTabs(document.querySelector('.category-tabs.block'));
    return sections;
  };

  /** What a reader sees between the band and the thing under it. */
  const gap = (band, next) => next.getBoundingClientRect().top
    - band.getBoundingClientRect().bottom;

  it('opens body copy 60 under the band from 769 up', async () => {
    const [band, next] = bodyCopy();
    await setViewport({ width: 1440, height: 900 });
    expect(gap(band, next), "live's 60 at 1440").to.be.closeTo(60, 1);
    await setViewport({ width: 900, height: 800 });
    expect(gap(band, next), "live's 60 at 900").to.be.closeTo(60, 1);
    await setViewport({ width: 769, height: 800 });
    expect(gap(band, next), "live's 60 at 769, where live's own query starts").to.be.closeTo(60, 1);
  });

  it('leaves the phone gap at the section rhythm, 2px off live', async () => {
    const [band, next] = bodyCopy();
    await setViewport({ width: 375, height: 700 });
    expect(gap(band, next), "the site's 40 against live's 38").to.be.closeTo(40, 1);
    await setViewport({ width: 768, height: 800 });
    expect(gap(band, next), 'still 40 at 768, the last width live gives 38').to.be.closeTo(40, 1);
  });

  it('opens a tab row 8 under the band, at every width', async () => {
    const [band, next] = tabRow();
    const widths = [375, 768, 769, 900, 1440];
    // eslint-disable-next-line no-restricted-syntax
    for (const width of widths) {
      // eslint-disable-next-line no-await-in-loop
      await setViewport({ width, height: 800 });
      expect(gap(band, next), `live's 8 at ${width}`).to.be.closeTo(8, 1);
    }
  });

  it('leaves a cards row flush, where the band is its own backdrop', async () => {
    const [, next] = page('cards-container', '<div class="cards-wrapper"><div class="cards block"><div><div><p>A card</p></div></div></div></div>');
    await setViewport({ width: 1440, height: 900 });
    // the claim is that the new rule does not outrank cards-container's zero,
    // which is a margin reading rather than a gap: what the cards block puts
    // inside the section is the cards block's business
    expect(getComputedStyle(next).marginTop, 'cards-container keeps its deliberate 0').to.equal('0px');
  });

  it('leaves the band itself flush to the header', async () => {
    const [band] = bodyCopy();
    await setViewport({ width: 1440, height: 900 });
    expect(getComputedStyle(band).marginTop, 'the band opens the page').to.equal('0px');
    expect(getComputedStyle(band).marginBottom, 'the gap belongs to the next section').to.equal('0px');
  });
});
