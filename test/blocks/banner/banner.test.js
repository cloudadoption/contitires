/* eslint-disable no-unused-expressions */
/* global describe it before afterEach */

import { expect } from '@esm-bundle/chai';
import decorate, { buildBreadcrumb } from '../../../blocks/banner/banner.js';

/** A banner block with the given cells authored in it. */
function bannerBlock(...cells) {
  document.body.innerHTML = `<div class="banner block">${
    cells.map((c) => `<div><div>${c}</div></div>`).join('')}</div>`;
  return document.querySelector('.banner.block');
}

/**
 * Live gives the title of a standalone page a band of its own, and shows the
 * trail above it on a page that sits under a section. All 13 pages that carry
 * the band were read off continentaltire.com: the five under /learn and
 * /experience show the trail, the eight at the root show none.
 * Issue #82.
 */
describe('Banner block, the trail', () => {
  it('names the section a page sits under', () => {
    const nav = buildBreadcrumb('/learn/tips', 'Tire Tips');
    const items = nav.querySelectorAll('ol > li');
    expect(items.length).to.equal(2);
    const root = items[0].querySelector('a');
    expect(root.getAttribute('href')).to.equal('/learn');
    expect(root.textContent).to.equal('Learn');
    const current = items[1].querySelector('[aria-current="page"]');
    expect(current, 'current crumb marked aria-current').to.exist;
    expect(current.textContent).to.equal('Tire Tips');
    expect([...items].some((li) => /home/i.test(li.textContent)), 'no Home crumb').to.be.false;
  });

  // the trail was hard-coded to Learn, so the one page under /experience
  // that carries the band would have read Learn / Sports
  it('names the section the page is actually under', () => {
    const nav = buildBreadcrumb('/experience/sports', 'Sports');
    const root = nav.querySelector('ol > li a');
    expect(root.getAttribute('href')).to.equal('/experience');
    expect(root.textContent).to.equal('Experience');
  });

  it('reads a hyphenated section as words', () => {
    const nav = buildBreadcrumb('/customer-support/technical-documents', 'Technical documents');
    expect(nav.querySelector('a').textContent).to.equal('Customer support');
  });

  // live shows no trail on a page at the root, and one above every page under
  // a section, which is what splits the 13 pages 8 and 5. An assertion that
  // fails with a DOM node as its actual value hangs the reporter, so the ones
  // that expect nothing compare identity first.
  it('shows no trail for a page at the root', () => {
    expect(buildBreadcrumb('/legal', 'Terms Of Use Agreement') === null, '/legal').to.be.true;
    expect(buildBreadcrumb('/', 'Home') === null, 'the home page').to.be.true;
  });
});

describe('Banner block, the band', () => {
  const path = window.location.pathname;
  afterEach(() => window.history.replaceState({}, '', path));

  it('draws the authored title as the page heading', () => {
    window.history.replaceState({}, '', '/legal');
    const block = bannerBlock('Terms Of Use Agreement');
    decorate(block);

    const h1 = block.querySelector('h1.banner-title');
    expect(h1, 'title element present').to.exist;
    expect(h1.textContent).to.equal('Terms Of Use Agreement');
    expect(block.querySelector('.banner-breadcrumb') === null, 'no trail at the root').to.be.true;
  });

  it('puts the trail above the title, as live does', () => {
    document.title = 'Tire Tips | Continental Tire';
    window.history.replaceState({}, '', '/learn/tips');
    const block = bannerBlock('Performance, mileage and confidence');
    decorate(block);

    expect(block.firstElementChild.classList.contains('banner-breadcrumb')).to.be.true;
    const current = block.querySelector('.banner-breadcrumb [aria-current="page"]');
    expect(current.textContent).to.equal('Tire Tips');
    expect(block.querySelector('.banner-breadcrumb a').getAttribute('href')).to.equal('/learn');
  });

  // /media is the one page of the 13 whose band carries a line under the title
  it('draws a second cell as the line under the title', () => {
    window.history.replaceState({}, '', '/media');
    const block = bannerBlock('Brand Assets', 'Download our brand assets for your materials.');
    decorate(block);

    const text = block.querySelector('.banner-text');
    expect(text, 'the line under the title').to.exist;
    expect(text.textContent).to.equal('Download our brand assets for your materials.');
    expect(block.querySelector('h1').nextElementSibling === text, 'it follows the title').to.be.true;
  });

  it('draws no line when none is authored', () => {
    window.history.replaceState({}, '', '/offers');
    const block = bannerBlock('Continental Tire Offers');
    decorate(block);

    expect(block.querySelector('.banner-text') === null, 'no line').to.be.true;
    expect(block.children.length).to.equal(1);
  });
});

/**
 * The band itself. Live draws it black with a glow behind the title, white
 * 42/48 type at 1025 and 30/36 below, neither tracked nor uppercased. Ours
 * drew a white band with black uppercase tracked type. Every number here was
 * read off continentaltire.com at 1440, 1025, 1024, 900, 769, 768 and 375.
 */
describe('Banner block, live\'s dark band', () => {
  let sheet;

  before(async () => {
    sheet = new CSSStyleSheet();
    await sheet.replace(await (await fetch('/blocks/banner/banner.css')).text());
  });

  function value(selector, prop, media) {
    const rules = media
      ? [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule
        && r.conditionText.includes(media)).flatMap((r) => [...r.cssRules])
      : [...sheet.cssRules].filter((r) => !(r instanceof CSSMediaRule));
    const matches = (r) => r.selectorText.split(',').map((s) => s.trim()).includes(selector);
    const rule = [...rules].reverse().find((r) => matches(r) && r.style.getPropertyValue(prop));
    return rule ? rule.style.getPropertyValue(prop).trim() : null;
  }

  // live runs the band edge to edge, where a section holds its content to 1200
  it('runs the band the full width of the page', () => {
    expect(value('main .section.banner-container > div', 'max-width')).to.equal('none');
    expect(value('main .section.banner-container > div', 'padding')).to.equal('0px');
    expect(value('main .section.banner-container', 'margin')).to.equal('0px');
  });

  it('draws the band dark, with the glow live has behind the title', () => {
    expect(value('.banner.block', 'background-color')).to.equal('rgb(11, 11, 11)');
    expect(value('.banner.block', 'background-image')).to.match(/^radial-gradient\(/);
    expect(value('.banner.block', 'color')).to.equal('var(--conti-white)');
    expect(value('.banner.block', 'text-align')).to.equal('center');
  });

  it('pads the band as live pads it, and holds 210 at 1025', () => {
    expect(value('.banner.block', 'padding')).to.equal('38px 20px');
    expect(value('.banner.block', 'min-height', '1025px')).to.equal('210px');
  });

  it('takes live\'s title scale, neither tracked nor uppercased', () => {
    expect(value('.banner-title', 'font-size')).to.equal('30px');
    expect(value('.banner-title', 'line-height')).to.equal('36px');
    expect(value('.banner-title', 'font-weight')).to.equal('300');
    expect(value('.banner-title', 'color')).to.equal('var(--conti-white)');
    expect(value('.banner-title', 'text-transform'), 'live uppercases nothing here').to.be.null;
    expect(value('.banner-title', 'letter-spacing'), 'live tracks nothing here').to.be.null;
    expect(value('.banner-title', 'font-size', '1025px')).to.equal('42px');
    expect(value('.banner-title', 'line-height', '1025px')).to.equal('48px');
  });

  it('takes live\'s scale for the line under the title', () => {
    expect(value('.banner-text', 'font-size')).to.equal('14px');
    expect(value('.banner-text', 'line-height')).to.equal('20px');
    expect(value('.banner-text', 'margin')).to.equal('8px 0px 0px');
    expect(value('.banner-text', 'font-size', '1025px')).to.equal('24px');
    expect(value('.banner-text', 'line-height', '1025px')).to.equal('32px');
  });

  // live sets the trail small, white and uppercase, and leans the separator
  it('sets the trail the way live sets it', () => {
    expect(value('.banner-breadcrumb', 'display')).to.equal('flex');
    expect(value('.banner-breadcrumb a', 'font-size')).to.equal('12px');
    expect(value('.banner-breadcrumb a', 'font-weight')).to.equal('700');
    expect(value('.banner-breadcrumb a', 'letter-spacing')).to.equal('0.6px');
    expect(value('.banner-breadcrumb a', 'text-transform')).to.equal('uppercase');
    expect(value('.banner-breadcrumb a', 'text-decoration')).to.equal('underline');
    expect(value('.banner-breadcrumb [aria-current="page"]', 'letter-spacing')).to.equal('1.25px');
    expect(value('.banner-breadcrumb li + li::before', 'border-inline-end')).to.equal('2px solid currentcolor');
    expect(value('.banner-breadcrumb li + li::before', 'transform')).to.equal('rotate(15deg)');
  });

  // the trail sits at the top of the band and the title stays centred under
  // it, so a page with a trail and one without put their titles in the same
  // place at 1025
  it('lifts the trail out of the way of the title at 1025', () => {
    expect(value('.banner-breadcrumb', 'position', '1025px')).to.equal('absolute');
    expect(value('.banner-breadcrumb', 'top', '1025px')).to.equal('23px');
    expect(value('.banner.block:has(.banner-breadcrumb)', 'padding-top')).to.equal('15px');
    expect(value('.banner.block:has(.banner-breadcrumb)', 'padding-top', '769px')).to.equal('23px');
  });
});
