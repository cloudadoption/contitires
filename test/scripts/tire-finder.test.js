/* eslint-disable no-unused-expressions */
/* global describe it beforeEach afterEach */

import { expect } from '@esm-bundle/chai';
import { markFinderTriggers } from '../../scripts/tire-finder.js';
import { decorateMain } from '../../scripts/scripts.js';

/** The header submenu, as nav.html authors it: a label plus three dead links. */
function headerSubmenu() {
  const li = document.createElement('li');
  li.innerHTML = `
    <p><strong>Search For Tire</strong></p>
    <ul>
      <li><a href="#">By Vehicle</a></li>
      <li><a href="#">By Tire Size</a></li>
      <li><a href="#">By Plate</a></li>
    </ul>`;
  return li;
}

/** The footer column, as footer.js groups it: a heading plus four links. */
function footerGroup() {
  const group = document.createElement('div');
  group.className = 'footer-links-group';
  group.innerHTML = `
    <h3 id="search-for-tire">Search for Tire</h3>
    <ul>
      <li><a href="/tire-search/by-vehicle"><span class="icon icon-vehicle"></span>By Vehicle</a></li>
      <li><a href="/tire-search"><span class="icon icon-tire-size"></span>By Tire</a></li>
      <li><a href="/tire-search"><span class="icon icon-license-plate"></span>By License Plate</a></li>
      <li><a href="/search"><span class="icon icon-search"></span>Search Site</a></li>
    </ul>`;
  return group;
}

describe('tire finder triggers', () => {
  it('turns the header submenu into three finder triggers', () => {
    const submenu = headerSubmenu();
    markFinderTriggers(submenu);

    const triggers = [...submenu.querySelectorAll('[data-tire-finder]')];
    expect(triggers.map((t) => t.dataset.tireFinder))
      .to.eql(['vehicle', 'tire-size', 'plate']);
    expect(triggers.map((t) => t.textContent.trim()))
      .to.eql(['By Vehicle', 'By Tire Size', 'By Plate']);
  });

  // live's own controls are buttons: they open the finder in place and go
  // nowhere. header.css and footer.css carry the link-styled button rules that
  // keep them looking like the list they sit in.
  it('replaces the authored link with a button', () => {
    const submenu = headerSubmenu();
    markFinderTriggers(submenu);

    const triggers = [...submenu.querySelectorAll('[data-tire-finder]')];
    expect(triggers).to.have.length(3);
    triggers.forEach((trigger) => {
      expect(trigger.tagName).to.equal('BUTTON');
      expect(trigger.type).to.equal('button');
    });
    expect(submenu.querySelectorAll('a')).to.have.length(0);
  });

  it('keeps the button where the link stood, in the same list item', () => {
    const group = footerGroup();
    markFinderTriggers(group);

    const items = [...group.querySelectorAll('li')];
    expect(items.slice(0, 3).map((li) => li.firstElementChild.tagName))
      .to.eql(['BUTTON', 'BUTTON', 'BUTTON']);
    expect(items[3].firstElementChild.tagName).to.equal('A');
  });

  it('reads the footer wording, which names the same three searches differently', () => {
    const group = footerGroup();
    markFinderTriggers(group);

    const triggers = [...group.querySelectorAll('[data-tire-finder]')];
    expect(triggers.map((t) => t.dataset.tireFinder))
      .to.eql(['vehicle', 'tire-size', 'plate']);
  });

  it('leaves the site search in the same footer list alone', () => {
    const group = footerGroup();
    markFinderTriggers(group);

    const siteSearch = group.querySelector('a[href="/search"]');
    expect(siteSearch).to.exist;
    expect(siteSearch.dataset.tireFinder).to.be.undefined;
  });

  it('keeps the icon the content carries', () => {
    const group = footerGroup();
    markFinderTriggers(group);

    const vehicle = group.querySelector('[data-tire-finder="vehicle"]');
    expect(vehicle.querySelector('.icon-vehicle')).to.exist;
  });

  it('ignores a list that is not a tire search', () => {
    const group = document.createElement('div');
    group.innerHTML = `
      <h3>Our Tires</h3>
      <ul><li><a href="/tires/passenger">By Vehicle</a></li></ul>`;
    markFinderTriggers(group);

    expect(group.querySelectorAll('[data-tire-finder]')).to.have.length(0);
  });
});

/** A product page hero, as all 46 of them author it. */
function productHero() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <div class="columns product-hero">
        <div>
          <div><picture><img src="/t.png" alt="tire"></picture></div>
          <div>
            <h1 id="terraincontact-at">TerrainContact A/T</h1>
            <p>A premium all-season all-terrain tire.</p>
            <p><a href="/perfect-fit">Find your size</a></p>
          </div>
        </div>
      </div>
    </div>`;
  return main;
}

describe('product hero finder card', () => {
  it('builds the finder card in the hero, in place of the authored link', () => {
    const main = productHero();
    decorateMain(main);

    const card = main.querySelector('.perfect-fit.card');
    expect(card).to.exist;
    expect(card.closest('.columns.product-hero')).to.exist;
    expect(!!main.querySelector('a[href="/perfect-fit"]')).to.be.false;
  });

  it('decorates the card, which sits too deep for decorateBlocks to reach', () => {
    const main = productHero();
    decorateMain(main);

    const card = main.querySelector('.perfect-fit.card');
    expect(card.classList.contains('block')).to.be.true;
    expect(card.dataset.blockStatus).to.equal('initialized');
  });

  // perfect-fit.css zeroes the padding of the section that hosts the bar. That
  // rule reads the wrapper, so a card wrapped inside the hero cell leaves the
  // hero section's own padding alone.
  it('wraps the card in the hero cell, not in the section', () => {
    const main = productHero();
    decorateMain(main);

    const wrapper = main.querySelector('.perfect-fit-wrapper');
    expect(wrapper).to.exist;
    expect(wrapper.closest('.columns.product-hero')).to.exist;
    expect(!!main.querySelector('.section > .perfect-fit-wrapper')).to.be.false;
  });

  it('carries the card question live asks into the block', () => {
    const main = productHero();
    decorateMain(main);

    expect(main.querySelector('.perfect-fit.card').textContent)
      .to.contain('Does this tire fit?');
  });

  it('leaves a link outside a product hero alone', () => {
    const main = document.createElement('main');
    main.innerHTML = '<div><p><a href="/perfect-fit">Find your size</a></p></div>';
    decorateMain(main);

    expect(!!main.querySelector('.perfect-fit')).to.be.false;
    expect(main.querySelector('a').getAttribute('href')).to.equal('/perfect-fit');
  });
});

describe('authored hrefs survive decoration', () => {
  // The repoint used to run here, so the authored href stayed /tire-search and
  // a visitor without JavaScript still got a 404 on it. The redirects sheet
  // answers those paths at the edge instead, so decoration moves no href.
  it('leaves the footer call to action where the content puts it', () => {
    const main = document.createElement('main');
    main.innerHTML = '<p><strong><a href="/tire-search">Find Tires</a></strong></p>';
    decorateMain(main);

    const link = main.querySelector('a');
    expect(link.getAttribute('href')).to.equal('/tire-search');
    expect(link.textContent).to.equal('Find Tires');
  });

  it('leaves the hero call to action where the content puts it', () => {
    const main = document.createElement('main');
    main.innerHTML = '<p><a href="/tire-search">Find Tires That Fit</a></p>';
    decorateMain(main);

    expect(main.querySelector('a').getAttribute('href')).to.equal('/tire-search');
  });

  // loadFragment runs decorateMain over the footer before footer.js sees it.
  it('leaves the footer searches alone when decorateMain sees them first', () => {
    const main = document.createElement('main');
    main.innerHTML = `
      <div>
        <p><a href="/tire-search" class="button">Find Tires</a></p>
        <h3>Search for Tire</h3>
        <ul>
          <li><a href="/tire-search/by-vehicle">By Vehicle</a></li>
          <li><a href="/tire-search">By Tire</a></li>
          <li><a href="/tire-search">By License Plate</a></li>
        </ul>
      </div>`;
    decorateMain(main);

    expect([...main.querySelectorAll('a')].map((a) => a.getAttribute('href')))
      .to.eql(['/tire-search', '/tire-search/by-vehicle', '/tire-search', '/tire-search']);
  });
});

/**
 * The tire finder page. Live serves /tire-finder at 200 with the finder on it;
 * we returned 404. The finder here is a modal, so the page offers the three
 * searches and opens it, rather than holding a second finder. The list is the
 * contract the header and the footer already use, and reading it in the page
 * body is what was missing. (#254)
 */
function finderPage() {
  const main = document.createElement('main');
  main.innerHTML = `
    <div>
      <h1 id="how-would-you-like-to-search">How would you like to search?</h1>
    </div>
    <div>
      <h2 id="search-for-tire">Search for Tire</h2>
      <ul>
        <li><a href="/tire-search/by-vehicle">By Vehicle</a></li>
        <li><a href="/tire-search">By Tire Size</a></li>
        <li><a href="/tire-search">By Plate</a></li>
      </ul>
    </div>`;
  return main;
}

describe('the tire finder page', () => {
  // The template is the guard. decorateMain also runs over the footer fragment
  // before footer.js sees it, and the footer's authored hrefs stay authored.
  beforeEach(() => document.body.classList.add('finder'));
  afterEach(() => document.body.classList.remove('finder'));

  it('opens the finder from a Search for Tire list in the page body', () => {
    const main = finderPage();
    decorateMain(main);

    const triggers = [...main.querySelectorAll('[data-tire-finder]')];
    expect(triggers.map((t) => t.dataset.tireFinder))
      .to.eql(['vehicle', 'tire-size', 'plate']);
    expect(triggers.map((t) => t.tagName)).to.eql(['BUTTON', 'BUTTON', 'BUTTON']);
  });

  // No page authors this shape today, so nothing else may grow a trigger.
  it('leaves a list under any other heading alone', () => {
    const main = document.createElement('main');
    main.innerHTML = `
      <div>
        <h2 id="our-tires">Our Tires</h2>
        <ul><li><a href="/tires/passenger">By Vehicle</a></li></ul>
      </div>`;
    decorateMain(main);

    expect(main.querySelectorAll('[data-tire-finder]')).to.have.length(0);
  });
});
