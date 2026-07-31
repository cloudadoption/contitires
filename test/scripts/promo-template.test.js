/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * Live offers the tire finder twice on /promotion: beside the store link in the
 * marquee, and again in the bar above the terms. Both are buttons that open the
 * finder where they stand, and both open it on By Vehicle, measured with a real
 * click, including the one labelled FIND TIRE SIZE.
 *
 * So the control belongs to the promo template rather than to the hero block.
 * Elsewhere /perfect-fit is a page and a link to it stays a link.
 * Issues #83 and #84.
 */
function promoPage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="hero promo">
        <div><div><picture><img src="./promo.jpg" alt=""></picture></div></div>
        <div><div>
          <h1>Get a $110 Rebate</h1>
          <p>Purchase a set of 4 qualifying Continental Tires.</p>
          <p><strong><em><a href="/Store-finder">Find stores</a></em></strong></p>
          <p><strong><em><a href="/perfect-fit">Find tires</a></em></strong></p>
        </div></div>
      </div>
    </div>
    <div>
      <p><strong><a href="/Store-finder">Find store</a></strong></p>
      <p><strong><a href="/perfect-fit">Find tire size</a></strong></p>
      <h2>Terms &amp; Conditions:</h2>
    </div>`;
  return main;
}

describe('The promo template offers the finder', () => {
  afterEach(() => document.body.classList.remove('promo'));

  it('turns every authored finder CTA into a control that opens it', () => {
    document.body.classList.add('promo');
    const main = promoPage();
    decorateMain(main);

    const triggers = [...main.querySelectorAll('[data-tire-finder]')];
    expect(triggers, 'one in the marquee and one above the terms').to.have.length(2);
    triggers.forEach((t) => {
      expect(t.tagName).to.equal('BUTTON');
      expect(t.type).to.equal('button');
    });
  });

  it('opens the tab live opens, which is By Vehicle', () => {
    document.body.classList.add('promo');
    const main = promoPage();
    decorateMain(main);

    main.querySelectorAll('[data-tire-finder]').forEach((t) => {
      expect(t.dataset.tireFinder).to.equal('vehicle');
    });
  });

  it('keeps each label and the pill it is drawn as', () => {
    document.body.classList.add('promo');
    const main = promoPage();
    decorateMain(main);

    const labels = [...main.querySelectorAll('[data-tire-finder]')].map((t) => t.textContent.trim());
    expect(labels).to.eql(['Find tires', 'Find tire size']);
    const marquee = main.querySelector('.hero [data-tire-finder]');
    expect(marquee.classList.contains('button')).to.be.true;
    expect(marquee.classList.contains('accent')).to.be.true;
  });

  it('navigates nowhere, as live\'s own control does', () => {
    document.body.classList.add('promo');
    const main = promoPage();
    decorateMain(main);

    expect(main.querySelectorAll('a[href="/perfect-fit"]')).to.have.length(0);
    main.querySelectorAll('[data-tire-finder]').forEach((t) => {
      expect(t.hasAttribute('href')).to.be.false;
    });
  });

  it('leaves the CTAs that do navigate alone', () => {
    document.body.classList.add('promo');
    const main = promoPage();
    decorateMain(main);

    const store = [...main.querySelectorAll('a[href="/Store-finder"]')];
    expect(store).to.have.length(2);
    store.forEach((a) => expect(a.hasAttribute('data-tire-finder')).to.be.false);
  });

  // the finder page is a page, and every other template links to it
  it('leaves a finder link alone on a page that is not a promo page', () => {
    const main = promoPage();
    decorateMain(main);

    expect(!!main.querySelector('[data-tire-finder]')).to.be.false;
    expect(main.querySelectorAll('a[href="/perfect-fit"]')).to.have.length(2);
  });
});
