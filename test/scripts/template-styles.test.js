/* eslint-disable no-unused-expressions */
/* global describe it afterEach */

import { expect } from '@esm-bundle/chai';
import { loadTemplateStyles, revealPage } from '../../scripts/scripts.js';

// styles/article.css sets the whole article layout: the reading column, the
// title scale, and now the sidebar grid. loadEager fired it off without
// awaiting it, so an article revealed at the default page width and then
// reflowed once the stylesheet landed. Issue #110.
describe('Template styles', () => {
  const LINK = 'link[href$="/styles/article.css"]';

  afterEach(() => {
    document.body.classList.remove('article');
    document.head.querySelectorAll(LINK).forEach((link) => link.remove());
  });

  it('loads nothing for a page that is not an article', async () => {
    await loadTemplateStyles();
    expect(document.head.querySelector(LINK)).to.not.exist;
  });

  it('loads the article stylesheet for an article', async () => {
    document.body.classList.add('article');
    await loadTemplateStyles();
    expect(document.head.querySelector(LINK)).to.exist;
  });

  // live builds /promotion and /ccpromotion from one template of its own, and
  // the band treatments belong to it rather than to every page. Issues #83, #84
  it('loads the promo stylesheet for a promo page', async () => {
    const PROMO = 'link[href$="/styles/promo.css"]';
    document.body.classList.add('promo');
    await loadTemplateStyles();
    expect(document.head.querySelector(PROMO)).to.exist;
    document.body.classList.remove('promo');
    document.head.querySelectorAll(PROMO).forEach((link) => link.remove());
  });

  // live builds the five Conti Crew member pages from a template of its own,
  // and the bands under the marquee belong to it. Issue #104
  it('loads the crew stylesheet for a crew page', async () => {
    const CREW = 'link[href$="/styles/crew.css"]';
    document.body.classList.add('crew');
    await loadTemplateStyles();
    expect(document.head.querySelector(CREW)).to.exist;
    document.body.classList.remove('crew');
    document.head.querySelectorAll(CREW).forEach((link) => link.remove());
  });

  // the reveal awaits this promise, so it has to stay pending until the
  // stylesheet is in effect. A promise that resolves early gates nothing.
  it('stays pending until the stylesheet is in effect', async () => {
    document.body.classList.add('article');
    let settled = false;
    const styles = loadTemplateStyles().then(() => { settled = true; });

    await Promise.resolve();
    expect(settled, 'settled before the stylesheet loaded').to.be.false;

    await styles;
    expect(settled).to.be.true;
    expect(document.head.querySelector(LINK)).to.exist;
  });
});

// `body { display: none }` until `appear`, so `appear` is the reveal. It went
// on without waiting for the template's stylesheet, which is the whole of
// issue #110: the article paints at the default page width, then reflows.
describe('Page reveal', () => {
  const LINK = 'link[href$="/styles/article.css"]';

  afterEach(() => {
    document.body.classList.remove('article', 'appear');
    document.head.querySelectorAll(LINK).forEach((link) => link.remove());
  });

  it('holds an article back until its stylesheet is in effect', async () => {
    document.body.classList.add('article');
    const revealing = revealPage(loadTemplateStyles());

    await Promise.resolve();
    expect(document.body.classList.contains('appear'), 'revealed before the stylesheet loaded').to.be.false;

    await revealing;
    expect(document.body.classList.contains('appear')).to.be.true;
  });

  it('reveals a page that needs no template stylesheet right away', async () => {
    const revealing = revealPage(loadTemplateStyles());
    await revealing;
    expect(document.body.classList.contains('appear')).to.be.true;
    expect(document.head.querySelector(LINK)).to.not.exist;
  });
});
