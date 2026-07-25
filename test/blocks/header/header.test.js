/* eslint-disable no-unused-expressions */
/* global describe it before */

import { expect } from '@esm-bundle/chai';
import { buildUtilityNav } from '../../../blocks/header/header.js';

/** Index of the first child carrying `className` in an element's children. */
function childIndex(el, className) {
  return [...el.children].findIndex((c) => c.classList.contains(className));
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
