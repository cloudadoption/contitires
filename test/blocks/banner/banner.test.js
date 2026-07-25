/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import decorate, { buildBreadcrumb } from '../../../blocks/banner/banner.js';

/** A banner block with the given title authored in its cell. */
function bannerBlock(title) {
  document.body.innerHTML = `<div class="banner block"><div><div>${title}</div></div></div>`;
  return document.querySelector('.banner.block');
}

describe('Banner block', () => {
  it('builds a two-step Learn breadcrumb ending in the current label', () => {
    const nav = buildBreadcrumb('Technology');
    const items = nav.querySelectorAll('ol > li');
    expect(items).to.have.length(2);
    const root = items[0].querySelector('a');
    expect(root.getAttribute('href')).to.equal('/learn');
    expect(root.textContent).to.equal('Learn');
    const current = items[1].querySelector('[aria-current="page"]');
    expect(current, 'current crumb marked aria-current').to.exist;
    expect(current.textContent).to.equal('Technology');
    expect(nav.querySelector('a[href="/learn"]'), 'no Home link').to.exist;
    expect([...items].some((li) => /home/i.test(li.textContent)), 'no Home crumb').to.be.false;
  });

  it('renders the title band and the breadcrumb from the document title', () => {
    document.title = 'Technology | Continental Tire';
    const block = bannerBlock('Engineering and technology');
    decorate(block);
    const h1 = block.querySelector('.banner-title');
    expect(h1, 'title element present').to.exist;
    expect(h1.textContent).to.equal('Engineering and technology');
    const crumb = block.querySelector('.banner-breadcrumb [aria-current="page"]');
    expect(crumb, 'breadcrumb current present').to.exist;
    expect(crumb.textContent).to.equal('Technology');
    // breadcrumb comes before the title, like live
    expect(block.firstElementChild.classList.contains('banner-breadcrumb')).to.be.true;
  });
});
