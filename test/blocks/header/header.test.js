/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import { buildUtilityNav, isMegaMenu } from '../../../blocks/header/header.js';

/** Index of the first child carrying `className` in an element's children. */
function childIndex(el, className) {
  return [...el.children].findIndex((c) => c.classList.contains(className));
}

/** Builds a top-level nav <li> from an inner-HTML string. */
function navItem(html) {
  const ul = document.createElement('ul');
  ul.innerHTML = `<li>${html}</li>`;
  return ul.firstElementChild;
}

describe('Header utility nav', () => {
  before(() => {
    window.hlx = window.hlx || {};
    if (!window.hlx.codeBasePath) window.hlx.codeBasePath = '';
  });

  it('renders the pill label before its icon, so the icon sits after the label', () => {
    const wrapper = buildUtilityNav();
    const pill = wrapper.querySelector('a.nav-tools-utility-item-pill');
    expect(pill, 'a pill utility item exists').to.exist;
    const labelIdx = childIndex(pill, 'nav-tools-utility-label');
    const iconIdx = childIndex(pill, 'icon');
    expect(labelIdx, 'label present').to.be.greaterThan(-1);
    expect(iconIdx, 'icon present').to.be.greaterThan(-1);
    expect(labelIdx, 'label comes before the icon').to.be.lessThan(iconIdx);
  });

  it('renders non-pill items with the icon before the label', () => {
    const wrapper = buildUtilityNav();
    const nonPill = [...wrapper.querySelectorAll('a.nav-tools-utility-item')]
      .find((a) => !a.classList.contains('nav-tools-utility-item-pill'));
    expect(nonPill, 'a non-pill utility item exists').to.exist;
    const labelIdx = childIndex(nonPill, 'nav-tools-utility-label');
    const iconIdx = childIndex(nonPill, 'icon');
    expect(iconIdx, 'icon comes before the label').to.be.lessThan(labelIdx);
  });
});

describe('Header mega-menu detection', () => {
  // a multi-column drop with sub-lists, like Tires/Experience
  const tires = navItem(`<p><a href="/tires">Tires</a></p>
    <ul>
      <li><p><a href="/tires/category">By Category</a></p><ul><li><a href="/tires/all-season">All Season</a></li></ul></li>
      <li><p><a href="/tires/vehicle">By Vehicle</a></p><ul><li><a href="/tires/passenger">Passenger</a></li></ul></li>
    </ul>`);

  // Learn reshaped into heading-only columns (each column is a paragraph link)
  const learnReshaped = navItem(`<p><a href="/learn">Learn</a></p>
    <ul>
      <li><p><a href="/learn/tips">Tire Tips</a></p></li>
      <li><p><a href="/learn/technology">Technology</a></p></li>
      <li><p><a href="/learn/news-and-events">News</a></p></li>
    </ul>`);

  // Stores: a single heading column with a sub-list
  const stores = navItem(`<p><a href="/Store-finder">Stores</a></p>
    <ul>
      <li><p><strong>Stores near</strong></p><ul><li><a href="/Store-finder">See more locations</a></li></ul></li>
    </ul>`);

  // Learn as authored today: a flat bullet list of bare links, no paragraphs
  const learnFlat = navItem(`<p><a href="/learn">Learn</a></p>
    <ul>
      <li><a href="/learn/tips">Tire Tips</a></li>
      <li><a href="/learn/technology">Technology</a></li>
    </ul>`);

  const plainLink = navItem('<a href="/offers">Offers</a>');

  it('tags a single-column dropdown with a heading (Stores) as a mega-menu', () => {
    expect(isMegaMenu(stores)).to.be.true;
  });

  it('tags multi-column dropdowns (Tires, reshaped Learn) as mega-menus', () => {
    expect(isMegaMenu(tires)).to.be.true;
    expect(isMegaMenu(learnReshaped)).to.be.true;
  });

  it('does not tag a flat link list or a plain link', () => {
    expect(isMegaMenu(learnFlat)).to.be.false;
    expect(isMegaMenu(plainLink)).to.be.false;
  });
});
