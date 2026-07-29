/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * Live's product hero column, top to bottom on
 * continentaltire.com/tires/4x4sportcontact at 1440: the rebate badge, the
 * title, the star rating, the fit checker, the description, a FIND A STORE
 * button, the rebate paragraph, the Total Confidence Plan summary, and Best
 * for. The fit checker stands directly under the title.
 *
 * Ours built the checker from the authored "Find your size" link where that
 * link stood, which is last, so the reader met it after everything else. The
 * position is the template's to decide rather than the author's, because the
 * checker is built rather than authored. (#241)
 */
function productHero(cell) {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div>
            <p><picture><img src="/tire.png" alt="4x4 SportContact"></picture></p>
          </div>
          <div>${cell}</div>
        </div>
      </div>
    </div>`;
  return main;
}

/** The cell as the 45 product pages author it, on one of the 19 with a rebate. */
const authored = `
  <p><em><a href="/promotion">$110 Rebate Offer</a></em></p>
  <h1 id="x4-sportcontact">4x4 SportContact</h1>
  <p>The ideal ultra-high perfomance light truck/SUV tire.</p>
  <p><strong><a href="/store-finder">Find a store</a></strong></p>
  <p>Get a $110 Continental Tire Prepaid Mastercard&reg; by mail when you purchase a set of 4 qualifying Continental Tires through August 31, 2026.</p>
  <p><em><a href="/promotion">Offer details</a></em></p>
  <p><a href="/warranty">Total Confidence Plan</a></p>
  <ul>
    <li>60 Day Trial</li>
    <li>3 Year Roadside Assistance</li>
    <li>12 Month Road Hazard Coverage</li>
  </ul>
  <p><strong>Best for</strong></p>
  <ul>
    <li>Crossover</li>
    <li>Light Truck/SUV</li>
  </ul>
  <p><a href="/perfect-fit">Find your size</a></p>`;

const order = (main) => [...main.querySelector('.columns.product-hero > div > div:last-child').children]
  .map((el) => (el.classList.contains('perfect-fit') ? 'finder' : el.tagName.toLowerCase()));

describe('product hero order', () => {
  it('stands the fit checker directly under the title, where live stands it', () => {
    const main = productHero(authored);
    decorateMain(main);

    const cell = main.querySelector('.columns.product-hero > div > div:last-child');
    const card = cell.querySelector('.perfect-fit.card');
    expect(card, 'the finder card').to.exist;
    expect(card.previousElementSibling.tagName, 'the element above it').to.equal('H1');
  });

  it('leaves the rest of the column in the order it was authored', () => {
    const main = productHero(authored);
    decorateMain(main);

    expect(order(main)).to.deep.equal([
      'p', 'h1', 'finder', 'p', 'p', 'p', 'p', 'p', 'ul', 'p', 'ul',
    ]);
  });

  // the rebate badge is authored above the title, so the card cannot take the
  // first place in the cell and still stand under it
  it('keeps the rebate badge above the title', () => {
    const main = productHero(authored);
    decorateMain(main);

    const cell = main.querySelector('.columns.product-hero > div > div:last-child');
    const badge = cell.querySelector('a[href="/promotion"]');
    expect(badge.textContent.trim()).to.equal('$110 Rebate Offer');
    expect(cell.firstElementChild.contains(badge), 'first in the cell').to.be.true;
    expect(cell.querySelector('.perfect-fit').previousElementSibling.tagName).to.equal('H1');
  });

  it('takes the authored link with it, so the reader meets one checker', () => {
    const main = productHero(authored);
    decorateMain(main);

    const cell = main.querySelector('.columns.product-hero > div > div:last-child');
    expect(cell.querySelectorAll('a[href="/perfect-fit"]').length).to.equal(0);
    expect(cell.querySelectorAll('.perfect-fit').length).to.equal(1);
  });

  // the store CTA is authored as a bolded link, which is the site's own way of
  // asking for a primary button. Live's is 12px/700 uppercase on
  // rgb(255, 165, 0) with a 26px radius, which is what .button.primary already
  // paints; the authored shape is what has to hold.
  it('draws the store CTA as a primary button', () => {
    const main = productHero(authored);
    decorateMain(main);

    const cta = main.querySelector('a[href="/store-finder"]');
    expect(cta, 'the store CTA').to.exist;
    expect(cta.classList.contains('button'), 'a button').to.be.true;
    expect(cta.classList.contains('primary'), 'the primary one').to.be.true;
    expect(cta.textContent.trim()).to.equal('Find a store');
  });

  // a hero with no h1 must not lose the checker
  it('falls back to where the link stood when the cell has no title', () => {
    const main = productHero('<p>Just a description.</p><p><a href="/perfect-fit">Find your size</a></p>');
    decorateMain(main);

    expect(order(main)).to.deep.equal(['p', 'finder']);
  });
});
