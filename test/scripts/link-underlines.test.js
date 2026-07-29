/* eslint-disable no-unused-expressions */
/* global describe it before after */

import { expect } from '@esm-bundle/chai';

/**
 * Underline a link a reader meets inside a sentence. Do not underline a title
 * that happens to be a link, in a tile, a card or a listing.
 *
 * Live keeps the same policy by a different mechanism, and reading only the
 * line says the opposite. Live declares `text-decoration-line: underline` on
 * its tile titles and paints it `rgba(0, 0, 0, 0)`, so nothing shows. Measured
 * on continentaltire.com at /tires, / and /experience/partners. Ours paint
 * theirs opaque, which is the defect: 27 visible underlines over five surfaces,
 * every one of them a title inside a heading. (#240)
 */
describe('Link underlines', () => {
  let sheets;
  let host;

  before(async () => {
    // the listing draws its own, so the policy has to hold with it in effect
    sheets = await Promise.all(['/styles/styles.css',
      '/blocks/tire-listing/tire-listing.css',
      '/blocks/cards/cards.css'].map(async (href) => {
      const sheet = new CSSStyleSheet();
      await sheet.replace(await (await fetch(href)).text());
      return sheet;
    }));
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...sheets];
    host = document.createElement('main');
    host.innerHTML = `
      <div class="section">
        <div class="default-content-wrapper">
          <p id="prose">Buy from an <a href="/online-retailers">online retailer</a> today.</p>
        </div>
      </div>
      <div class="section">
        <div class="cards category block" data-block-name="cards">
          <ul><li>
            <div class="cards-card-body">
              <h3 id="tile-title"><a href="/tires/passenger">Passenger Tires</a></h3>
              <p id="tile-prose">Read the <a href="/learn/tips">tire tips</a> first.</p>
            </div>
          </li></ul>
        </div>
      </div>
      <div class="section">
        <div class="tire-listing block" data-block-name="tire-listing">
          <h3 class="tire-listing-card-title" id="listing-title">
            <a href="/tires/securecontact-aw">SecureContact AW</a>
          </h3>
          <nav><a class="tire-listing-page" id="pager" href="?page=2">2</a></nav>
        </div>
      </div>`;
    document.body.append(host);
  });

  after(() => {
    host.remove();
    document.adoptedStyleSheets = document.adoptedStyleSheets
      .filter((s) => !sheets.includes(s));
  });

  const link = (id) => host.querySelector(`#${id} a, a#${id}`);
  /** What a reader sees. A transparent underline is not one. */
  const underlined = (el) => {
    const cs = getComputedStyle(el);
    return cs.textDecorationLine === 'underline'
      && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.textDecorationColor);
  };

  it('underlines a link a reader meets inside a sentence', () => {
    expect(underlined(link('prose')), 'default content prose').to.be.true;
    expect(underlined(link('tile-prose')), 'prose inside a card').to.be.true;
  });

  it('leaves a tile title without one', () => {
    expect(underlined(link('tile-title'))).to.be.false;
  });

  it('leaves a listing title without one, where the block drew its own', () => {
    expect(underlined(link('listing-title'))).to.be.false;
  });

  // The pager is not a title, and live's listing has no pager to compare it
  // with, so the policy does not reach it.
  it('leaves the listing pager alone', () => {
    expect(underlined(link('pager'))).to.be.true;
  });
});
