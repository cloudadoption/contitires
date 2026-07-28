/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import { decorateMain } from '../../scripts/scripts.js';

/**
 * A page tabs itself with section metadata: `Tab` names the tab a section
 * belongs to, and `Column: Sidebar` stands that section beside the rest of it.
 * The pipeline delivers both as attributes on the section. Issue #100.
 */
function buildPage(html) {
  const main = document.createElement('main');
  main.innerHTML = html;
  document.body.replaceChildren(main);
  decorateMain(main);
  return main;
}

const MEDIA = `
  <div><h1>Brand Assets</h1><p>Download our brand assets.</p></div>
  <div data-tab="Logos">
    <h2>Continental Tire Logos</h2>
    <div class="cards"><div><div><p>a logo</p></div></div></div>
  </div>
  <div data-tab="Logos" data-column="Sidebar">
    <h2>Usage guidelines</h2>
    <p>Our logo consists of the wordmark and the horse symbol.</p>
  </div>
  <div data-tab="Tires">
    <h2>Tire Images</h2>
    <div class="cards"><div><div><p>a tire</p></div></div></div>
  </div>`;

describe('Tabbed sections', () => {
  it('gathers the tabbed sections into one tabs block', () => {
    const main = buildPage(MEDIA);
    const blocks = main.querySelectorAll('.tabs');
    expect(blocks).to.have.length(1);
    expect(blocks[0].closest('.section'), 'it stands in a section of its own').to.exist;
    expect(blocks[0].children, 'one row per tab').to.have.length(2);
  });

  it('names each tab as the section metadata named it', () => {
    const main = buildPage(MEDIA);
    const labels = [...main.querySelector('.tabs').children]
      .map((row) => row.firstElementChild.textContent.trim());
    expect(labels).to.eql(['Logos', 'Tires']);
  });

  it('puts a sidebar section in the row\'s third cell', () => {
    const main = buildPage(MEDIA);
    const [logos, tires] = [...main.querySelector('.tabs').children];
    expect(logos.children, 'name, panel, sidebar').to.have.length(3);
    expect(logos.children[1].textContent).to.contain('Continental Tire Logos');
    expect(logos.children[2].textContent).to.contain('Usage guidelines');
    expect(tires.children, 'name and panel').to.have.length(2);
  });

  it('carries the blocks over decorated', () => {
    const main = buildPage(MEDIA);
    const cards = main.querySelectorAll('.tabs .cards.block');
    expect(cards, 'both card blocks').to.have.length(2);
    expect(cards[0].dataset.blockName).to.equal('cards');
  });

  it('leaves the tabbed sections behind, and the rest alone', () => {
    const main = buildPage(MEDIA);
    expect(main.querySelectorAll('[data-tab]'), 'no tabbed section is left').to.have.length(0);
    expect(main.querySelector('h1').textContent, 'the page opens as it did')
      .to.equal('Brand Assets');
  });

  it('decorates the block it built, so the section loads it', () => {
    const main = buildPage(MEDIA);
    const block = main.querySelector('.tabs');
    expect(block.classList.contains('block')).to.be.true;
    expect(block.dataset.blockName).to.equal('tabs');
    expect(block.parentElement.classList.contains('tabs-wrapper')).to.be.true;
  });

  it('leaves a page with no tabbed section as it is', () => {
    const main = buildPage('<div><h1>Plain</h1><p>Nothing tabbed here.</p></div>');
    expect(main.querySelector('.tabs')).to.not.exist;
    expect(main.querySelectorAll('.section')).to.have.length(1);
  });
});

/**
 * Live's store finder and its online retailers are two pages behind one bar,
 * each opening its own tab. Both land on /online-retailers here, so the page
 * names the bar's shape and says which tab opens. Issue #91.
 */
const RETAILERS = `
  <div><div class="banner"><div><div>Find nearby stores or shop online</div></div></div></div>
  <div data-tab="Store Near You" data-tabs="nav">
    <h2>Stores near you</h2>
  </div>
  <div data-tab="Online Retailers" data-tabs="nav" data-selected="true">
    <div class="retailers"><div><div><p>a shop</p></div></div></div>
  </div>`;

describe('Tabbed sections, the bar\'s shape and which tab opens', () => {
  it('gives the block the variant the sections named', () => {
    const main = buildPage(RETAILERS);
    const block = main.querySelector('.tabs');
    expect(block.classList.contains('nav'), 'the bar is live\'s nav bar').to.be.true;
  });

  it('marks the tab the sections selected', () => {
    const main = buildPage(RETAILERS);
    const block = main.querySelector('.tabs');
    expect(block.dataset.selected).to.equal('1');
  });

  it('marks no tab when no section selects one', () => {
    const main = buildPage(MEDIA);
    expect(main.querySelector('.tabs').dataset.selected).to.equal(undefined);
    expect(main.querySelector('.tabs').classList.contains('nav')).to.be.false;
  });

  it('leaves the banner above the bar where the page put it', () => {
    const main = buildPage(RETAILERS);
    const sections = [...main.children];
    expect(sections[0].querySelector('.banner'), 'the band opens the page').to.exist;
    expect(sections[1].querySelector('.tabs'), 'the bar follows it').to.exist;
  });
});
