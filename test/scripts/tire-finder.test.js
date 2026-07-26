/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { markFinderTriggers, markProductFinderLinks } from '../../scripts/tire-finder.js';

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

  it('replaces the dead links with buttons, since there is no page to go to', () => {
    const submenu = headerSubmenu();
    markFinderTriggers(submenu);

    expect(submenu.querySelectorAll('a')).to.have.length(0);
    submenu.querySelectorAll('[data-tire-finder]').forEach((trigger) => {
      expect(trigger.tagName).to.equal('BUTTON');
      expect(trigger.type).to.equal('button');
    });
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
    expect(main.querySelector('a[href="/perfect-fit"]')).to.not.exist;
  });
});
