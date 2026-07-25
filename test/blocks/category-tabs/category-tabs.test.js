/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { markActive } from '../../../blocks/category-tabs/category-tabs.js';

/** A category-tabs list with the learn category links. */
function tabsList() {
  const ul = document.createElement('ul');
  ul.innerHTML = [
    '/learn/tips',
    '/learn/technology',
    '/learn/news-and-events',
    '/learn/product-highlights',
    '/ev-compatible',
  ].map((h) => `<li><a href="${h}">${h}</a></li>`).join('');
  return ul;
}

describe('Category tabs active state', () => {
  it('marks the tab matching the current path as current', () => {
    const list = tabsList();
    markActive(list, '/learn/technology');
    const active = list.querySelectorAll('.category-tab-active');
    expect(active).to.have.length(1);
    expect(active[0].getAttribute('href')).to.equal('/learn/technology');
    expect(active[0].getAttribute('aria-current')).to.equal('page');
  });

  it('marks no tab when the path matches none (e.g. the hub)', () => {
    const list = tabsList();
    markActive(list, '/learn');
    expect(list.querySelectorAll('.category-tab-active')).to.have.length(0);
  });

  it('ignores a trailing slash on the current path', () => {
    const list = tabsList();
    markActive(list, '/learn/tips/');
    const active = list.querySelectorAll('.category-tab-active');
    expect(active).to.have.length(1);
    expect(active[0].getAttribute('href')).to.equal('/learn/tips');
  });
});
