/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import {
  markFinderTriggers,
  markProductFinderLinks,
  repointSearchLinks,
} from '../../scripts/tire-finder.js';
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

  // header.css and footer.css style these lists through their `a` selectors.
  // Swapping the element for a button dropped every one of them: the controls
  // painted as raw UA buttons, #efefef with a 2px outset border.
  it('marks the authored link rather than replacing it', () => {
    const submenu = headerSubmenu();
    markFinderTriggers(submenu);

    const triggers = [...submenu.querySelectorAll('[data-tire-finder]')];
    expect(triggers).to.have.length(3);
    triggers.forEach((trigger) => expect(trigger.tagName).to.equal('A'));
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

  it('turns the product page link into a trigger, on the vehicle tab', () => {
    const main = document.createElement('main');
    main.innerHTML = '<p><a href="/perfect-fit">Find your size</a></p>';
    markProductFinderLinks(main);

    const trigger = main.querySelector('[data-tire-finder]');
    expect(trigger).to.exist;
    expect(trigger.dataset.tireFinder).to.equal('vehicle');
    expect(trigger.textContent.trim()).to.equal('Find your size');
    expect(trigger.tagName).to.equal('A');
  });
});

describe('tire search results link', () => {
  // Live's /tire-search is a results page the POC does not have, so these two
  // navigations 404. They go to /tires, the listing page, which is the closest
  // target we do have.
  it('repoints the footer call to action, keeping its wording', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p><strong><a href="/tire-search">Find Tires</a></strong></p>';
    repointSearchLinks(root);

    const link = root.querySelector('a');
    expect(link.getAttribute('href'), 'href moved to the listing page').to.equal('/tires');
    expect(link.textContent, 'wording untouched').to.equal('Find Tires');
  });

  it('repoints the hero call to action', () => {
    const main = document.createElement('main');
    main.innerHTML = '<p><a href="/tire-search">Find Tires That Fit</a></p>';
    repointSearchLinks(main);

    const link = main.querySelector('a');
    expect(link.getAttribute('href')).to.equal('/tires');
    expect(link.textContent).to.equal('Find Tires That Fit');
  });

  // Two of the footer's three finder triggers carry this same href. They open
  // the modal instead of navigating, so their href is never followed.
  it('leaves a marked finder trigger where it is', () => {
    const group = footerGroup();
    markFinderTriggers(group);
    repointSearchLinks(group);

    const triggers = [...group.querySelectorAll('[data-tire-finder]')];
    expect(triggers.map((t) => t.getAttribute('href')))
      .to.eql(['/tire-search/by-vehicle', '/tire-search', '/tire-search']);
  });

  // The only authored paths are exactly /tire-search; a deeper one is always a
  // finder trigger, so matching loosely would move a link nothing asked for.
  it('leaves a deeper tire-search path alone', () => {
    const root = document.createElement('div');
    root.innerHTML = '<a href="/tire-search/by-vehicle">By Vehicle</a>';
    repointSearchLinks(root);

    expect(root.querySelector('a').getAttribute('href')).to.equal('/tire-search/by-vehicle');
  });

  it('reports the links it moved', () => {
    const root = document.createElement('div');
    root.innerHTML = '<a href="/tire-search">Find Tires</a><a href="/tires">Our Tires</a>';

    expect(repointSearchLinks(root)).to.have.length(1);
  });

  // loadFragment runs decorateMain over the footer fragment before footer.js
  // ever sees it, so decorateMain has to claim the triggers itself. Otherwise
  // the repoint runs first and moves two hrefs it was told to leave alone.
  it('claims the finder triggers before moving anything, on a fragment', () => {
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

    const byText = (t) => [...main.querySelectorAll('a')]
      .find((a) => a.textContent.trim() === t);
    expect(byText('By Tire').getAttribute('href'), 'By Tire opens the modal, so it stays')
      .to.equal('/tire-search');
    expect(byText('By License Plate').getAttribute('href'), 'By License Plate stays')
      .to.equal('/tire-search');
    expect(byText('Find Tires').getAttribute('href'), 'the navigation moves')
      .to.equal('/tires');
  });
});
